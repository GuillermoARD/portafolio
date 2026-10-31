import { type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { ModelStatic, Model } from 'sequelize';
import type { z } from 'zod';
import { adminEnabled, checkCredentials, createToken, requireAdmin } from '../auth.js';
import { findBrandLogo, uploadedLogos } from '../brandIcons.js';
import { Project, SkillGroup, listOrder } from '../db.js';
import { idParamSchema, loginSchema, projectSchema, skillGroupSchema, toFieldErrors } from '../schema.js';
import { imageUpload, removeUploadedImage, saveImage } from '../uploads.js';

export const adminRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados intentos. Espera unos minutos.' },
});

adminRouter.post('/login', loginLimiter, (req, res) => {
  if (!adminEnabled()) {
    res.status(503).json({ ok: false, error: 'El panel está desactivado: define ADMIN_PASSWORD en server/.env.' });
    return;
  }
  const parsed = loginSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Faltan datos.', fieldErrors: toFieldErrors(parsed.error) });
    return;
  }
  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    console.warn(`[admin] Login fallido desde ${req.ip}`);
    res.status(401).json({ ok: false, error: 'Usuario o contraseña incorrectos.' });
    return;
  }
  res.json({ ok: true, ...createToken(username) });
});

// Todo lo que sigue requiere sesión.
adminRouter.use(requireAdmin);

adminRouter.get('/me', (_req, res) => {
  res.json({ ok: true, user: res.locals.admin });
});

function parseId(raw: string, res: Response): number | null {
  const id = idParamSchema.safeParse(raw);
  if (!id.success) {
    res.status(400).json({ ok: false, error: 'Identificador no válido.' });
    return null;
  }
  return id.data;
}

function invalid(res: Response, error: z.ZodError) {
  res.status(400).json({ ok: false, error: 'Revisa los campos marcados.', fieldErrors: toFieldErrors(error) });
}

// CRUD genérico para un modelo con su esquema de Zod.
function crud<M extends Model>(
  basePath: string,
  model: ModelStatic<M>,
  // El esquema ya garantiza la forma de los datos; Sequelize no puede inferirla en un CRUD genérico.
  schema: z.ZodType<Record<string, any>>,
  hooks: { onReplace?: (before: M, after: Record<string, unknown>) => Promise<void>; onDelete?: (item: M) => Promise<void> } = {},
) {
  adminRouter.get(basePath, async (_req, res) => {
    res.json({ ok: true, items: await model.findAll({ order: listOrder }) });
  });

  adminRouter.post(basePath, async (req, res) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return invalid(res, parsed.error);
    const item = await model.create(parsed.data as M['_creationAttributes']);
    res.status(201).json({ ok: true, item });
  });

  adminRouter.put(`${basePath}/:id`, async (req, res) => {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    const item = await model.findByPk(id);
    if (!item) {
      res.status(404).json({ ok: false, error: 'No existe.' });
      return;
    }
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) return invalid(res, parsed.error);
    await hooks.onReplace?.(item, parsed.data);
    await item.update(parsed.data);
    res.json({ ok: true, item });
  });

  adminRouter.delete(`${basePath}/:id`, async (req, res) => {
    const id = parseId(req.params.id, res);
    if (id === null) return;
    const item = await model.findByPk(id);
    if (!item) {
      res.status(404).json({ ok: false, error: 'No existe.' });
      return;
    }
    await item.destroy();
    await hooks.onDelete?.(item);
    res.json({ ok: true });
  });
}

crud('/projects', Project, projectSchema, {
  onReplace: async (before, after) => {
    if (before.get('imageUrl') !== after.imageUrl) await removeUploadedImage(before.get('imageUrl') as string | null);
  },
  onDelete: (item) => removeUploadedImage(item.get('imageUrl') as string | null),
});

// Imágenes subidas de un grupo: su icono de categoría y los logos propios de sus habilidades.
const groupUploads = (data: { icon?: unknown; skills?: unknown }) => [
  ...(typeof data.icon === 'string' ? [data.icon] : []),
  ...uploadedLogos(data.skills),
];

crud('/skills', SkillGroup, skillGroupSchema, {
  onReplace: async (before, after) => {
    const kept = new Set(groupUploads(after));
    const old = groupUploads({ icon: before.get('icon'), skills: before.get('skills') });
    await Promise.all(old.filter((url) => !kept.has(url)).map(removeUploadedImage));
  },
  onDelete: async (item) => {
    await Promise.all(groupUploads({ icon: item.get('icon'), skills: item.get('skills') }).map(removeUploadedImage));
  },
});

adminRouter.get('/brand-logo', (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name.slice(0, 30) : '';
  res.json({ ok: true, logo: findBrandLogo(name) });
});

adminRouter.post('/upload', imageUpload.single('image'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ ok: false, error: 'No se recibió ninguna imagen.' });
    return;
  }
  try {
    res.status(201).json({ ok: true, url: await saveImage(req.file) });
  } catch (error) {
    console.error('[uploads] Error guardando la imagen:', error);
    res.status(502).json({ ok: false, error: 'No se pudo guardar la imagen. Inténtalo de nuevo.' });
  }
});
