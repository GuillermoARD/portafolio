import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from './config.js';

// Token firmado con HMAC (formato propio, sin dependencias): base64url(payload).firma
interface TokenPayload {
  sub: string;
  exp: number;
}

function sign(data: string): string {
  return createHmac('sha256', config.admin.sessionSecret).update(data).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  // Se comparan los hashes para que la longitud no filtre información.
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export const adminEnabled = () => config.admin.password.length > 0;

export function checkCredentials(username: string, password: string): boolean {
  if (!adminEnabled()) return false;
  const userOk = safeEqual(username, config.admin.user);
  const passOk = safeEqual(password, config.admin.password);
  return userOk && passOk;
}

export function createToken(username: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + config.admin.sessionHours * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ sub: username, exp: expiresAt } satisfies TokenPayload)).toString(
    'base64url',
  );
  return { token: `${payload}.${sign(payload)}`, expiresAt };
}

function verifyToken(token: string): TokenPayload | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TokenPayload;
    return data.exp > Date.now() ? data : null;
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = token ? verifyToken(token) : null;
  if (!session) {
    res.status(401).json({ ok: false, error: 'Sesión no válida o caducada. Vuelve a iniciar sesión.' });
    return;
  }
  res.locals.admin = session.sub;
  next();
}
