import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import { deleteFromCloudinary, parseCloudinaryUrl, uploadToCloudinary } from './cloudinary.js';
import { config } from './config.js';

export const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');
mkdirSync(uploadsDir, { recursive: true });

// Con CLOUDINARY_URL las imágenes van a Cloudinary; sin ella, al disco (server/uploads).
const cloudinary = config.cloudinaryUrl ? parseCloudinaryUrl(config.cloudinaryUrl) : null;
if (config.cloudinaryUrl && !cloudinary) {
  console.warn('[uploads] CLOUDINARY_URL no tiene el formato cloudinary://key:secret@cloud: se usa el disco local.');
}
export const uploadsTarget = cloudinary ? 'cloudinary' : 'disco local';

// SVG no se permite: puede llevar scripts.
const allowed: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (allowed[file.mimetype]) cb(null, true);
    else cb(new UploadError('Formato no admitido. Usa JPG, PNG, WebP o GIF.'));
  },
});

export class UploadError extends Error {}

// Guarda la imagen y devuelve la URL que se almacena en la BD.
export async function saveImage(file: { buffer: Buffer; mimetype: string }): Promise<string> {
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${allowed[file.mimetype]}`;
  if (cloudinary) return uploadToCloudinary(cloudinary, { ...file, filename });
  await writeFile(path.join(uploadsDir, filename), file.buffer);
  return `/uploads/${filename}`;
}

// Borra una imagen subida cuando ya no se usa (los enlaces externos se ignoran).
export async function removeUploadedImage(url: string | null | undefined) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    await unlink(path.join(uploadsDir, path.basename(url))).catch(() => undefined);
  } else if (cloudinary) {
    await deleteFromCloudinary(cloudinary, url);
  }
}
