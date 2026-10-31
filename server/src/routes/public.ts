import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';
import { Certificate, Project, SkillGroup, listOrder } from '../db.js';
import { sendContactMessage } from '../mailer.js';
import { contactSchema, toFieldErrors } from '../schema.js';

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true, mailMode: config.mail.provider });
});

publicRouter.get('/projects', async (_req, res) => {
  const projects = await Project.findAll({ order: listOrder });
  res.json({ ok: true, projects });
});

publicRouter.get('/skills', async (_req, res) => {
  const skillGroups = await SkillGroup.findAll({ order: listOrder });
  res.json({ ok: true, skillGroups });
});

publicRouter.get('/certificates', async (_req, res) => {
  const certificates = await Certificate.findAll({ order: listOrder });
  res.json({ ok: true, certificates });
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'Demasiados mensajes seguidos. Prueba de nuevo en unos minutos.' },
});

publicRouter.post('/contact', contactLimiter, async (req, res) => {
  const parsed = contactSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ ok: false, error: 'Revisa los campos marcados.', fieldErrors: toFieldErrors(parsed.error) });
    return;
  }

  const { website, ...message } = parsed.data;

  // Honeypot relleno: es un bot. Respondemos como si todo fuera bien para no darle pistas.
  if (website) {
    console.warn(`[contact] Honeypot activado desde ${req.ip}, mensaje descartado.`);
    res.json({ ok: true, mode: config.mail.provider });
    return;
  }

  try {
    await sendContactMessage(message);
    res.json({ ok: true, mode: config.mail.provider });
  } catch (error) {
    console.error('[contact] Error enviando el mensaje:', error);
    res.status(502).json({ ok: false, error: 'No se pudo enviar el mensaje. Inténtalo más tarde.' });
  }
});
