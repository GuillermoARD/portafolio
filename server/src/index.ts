import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import multer from 'multer';
import { adminEnabled } from './auth.js';
import { config } from './config.js';
import { initDatabase } from './db.js';
import { adminRouter } from './routes/admin.js';
import { publicRouter } from './routes/public.js';
import { UploadError, uploadsDir } from './uploads.js';

const app = express();

app.set('trust proxy', config.trustProxy);
app.disable('x-powered-by');
app.use(
  helmet({
    // Las imágenes de proyectos pueden venir de enlaces externos o de /uploads servido a otro dominio.
    contentSecurityPolicy: { directives: { 'img-src': ["'self'", 'data:', 'https:'] } },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: config.corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json({ limit: '50kb' }));

app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', fallthrough: false }));
app.use('/api', publicRouter);
app.use('/api/admin', adminRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ ok: false, error: 'Ruta no encontrada.' });
});

// En producción, si existe client/dist, el mismo servidor sirve el front (despliegue en un solo servicio).
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'client', 'dist');
if (config.isProduction && existsSync(clientDist)) {
  app.use(express.static(clientDist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api|\/uploads).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

app.use((err: Error & { status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof UploadError) {
    res.status(400).json({ ok: false, error: err.message });
    return;
  }
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'La imagen no puede pasar de 3 MB.' : 'No se pudo subir la imagen.';
    res.status(400).json({ ok: false, error: msg });
    return;
  }
  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    res.status(400).json({ ok: false, error: 'Petición no válida.' });
    return;
  }
  if (err.status === 404) {
    res.status(404).json({ ok: false, error: 'No encontrado.' });
    return;
  }
  console.error('[server] Error inesperado:', err);
  res.status(500).json({ ok: false, error: 'Error interno del servidor.' });
});

try {
  await initDatabase();
} catch (error) {
  console.error('[db] No se pudo conectar con la base de datos:', error);
  process.exit(1);
}

app.listen(config.port, () => {
  console.log(`API escuchando en http://localhost:${config.port}`);
  console.log(
    config.mail.provider === 'test'
      ? '[mail] MODO DE PRUEBA: los mensajes se muestran aquí y se guardan en server/outbox/, no se envía ningún correo.'
      : `[mail] Enviando con ${config.mail.provider} a ${config.mail.to}`,
  );
  console.log(
    adminEnabled()
      ? `[admin] Panel activo para el usuario "${config.admin.user}" en /admin`
      : '[admin] Panel DESACTIVADO: define ADMIN_PASSWORD en server/.env para activarlo.',
  );
});
