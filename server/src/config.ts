import { randomBytes } from 'node:crypto';

// Carga server/.env si existe (Node 22 lo trae de serie, sin dotenv).
try {
  process.loadEnvFile();
} catch {
  // Sin .env: se usan las variables del entorno o los valores por defecto.
}

export type MailProvider = 'test' | 'resend' | 'smtp';

const env = process.env;
const isProduction = env.NODE_ENV === 'production';

function resolveProvider(): MailProvider {
  const wanted = (env.MAIL_PROVIDER ?? 'test').toLowerCase();
  if (wanted === 'resend' && env.RESEND_API_KEY) return 'resend';
  if (wanted === 'smtp' && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) return 'smtp';
  if (wanted !== 'test') {
    console.warn(`[mail] MAIL_PROVIDER=${wanted} pero faltan credenciales: se usa el modo de prueba.`);
  }
  return 'test';
}

function resolveSessionSecret(): string {
  if (env.SESSION_SECRET && env.SESSION_SECRET.length >= 32) return env.SESSION_SECRET;
  if (isProduction) {
    throw new Error('SESSION_SECRET es obligatorio en producción (mínimo 32 caracteres).');
  }
  console.warn('[auth] Sin SESSION_SECRET: se genera uno temporal (las sesiones se cierran al reiniciar).');
  return randomBytes(32).toString('hex');
}

export const config = {
  port: Number(env.PORT ?? 3001),
  corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  trustProxy: Number(env.TRUST_PROXY ?? 0),
  isProduction,
  db: {
    url: env.DATABASE_URL ?? '',
    ssl: (env.DB_SSL ?? 'false') === 'true',
    sqliteFile: env.SQLITE_FILE ?? 'data/portafolio.sqlite',
  },
  admin: {
    user: env.ADMIN_USER ?? 'admin',
    password: env.ADMIN_PASSWORD ?? '',
    sessionSecret: resolveSessionSecret(),
    sessionHours: Number(env.SESSION_HOURS ?? 8),
  },
  mail: {
    provider: resolveProvider(),
    to: env.CONTACT_TO ?? 'tu-correo@ejemplo.com',
    from: env.CONTACT_FROM ?? 'Portafolio <onboarding@resend.dev>',
    resendApiKey: env.RESEND_API_KEY ?? '',
    smtp: {
      host: env.SMTP_HOST ?? '',
      port: Number(env.SMTP_PORT ?? 465),
      secure: (env.SMTP_SECURE ?? 'true') === 'true',
      user: env.SMTP_USER ?? '',
      pass: env.SMTP_PASS ?? '',
    },
  },
};
