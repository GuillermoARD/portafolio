import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';

export const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

// SVG no se permite: puede llevar scripts.
const allowed: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const imageUpload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${randomBytes(6).toString('hex')}${allowed[file.mimetype]}`),
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (allowed[file.mimetype]) cb(null, true);
    else cb(new UploadError('Formato no admitido. Usa JPG, PNG, WebP o GIF.'));
  },
});

export class UploadError extends Error {}

// Borra una imagen subida al servidor cuando ya no se usa (los enlaces externos se ignoran).
export async function removeUploadedImage(url: string | null | undefined) {
  if (!url?.startsWith('/uploads/')) return;
  const file = path.join(uploadsDir, path.basename(url));
  await unlink(file).catch(() => undefined);
}
