import { createHash } from 'node:crypto';

// Subida y borrado de imágenes en Cloudinary con su API REST (sin SDK).
// Se usa en producción, donde el disco de Render se borra en cada despliegue.

interface Credentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

const FOLDER = 'portafolio';

export function parseCloudinaryUrl(url: string): Credentials | null {
  const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
  if (!match) return null;
  const [, apiKey, apiSecret, cloudName] = match;
  return { apiKey, apiSecret: decodeURIComponent(apiSecret), cloudName };
}

// Firma de Cloudinary: sha1 de los parámetros ordenados + el secreto.
function sign(params: Record<string, string>, secret: string): string {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return createHash('sha1').update(toSign + secret).digest('hex');
}

export async function uploadToCloudinary(
  creds: Credentials,
  file: { buffer: Buffer; mimetype: string; filename: string },
): Promise<string> {
  const params = { folder: FOLDER, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.filename);
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', creds.apiKey);
  form.append('signature', sign(params, creds.apiSecret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`, { method: 'POST', body: form });
  const data = (await res.json().catch(() => null)) as { secure_url?: string; error?: { message: string } } | null;
  if (!res.ok || !data?.secure_url) {
    throw new Error(`Cloudinary respondió ${res.status}: ${data?.error?.message ?? 'sin detalles'}`);
  }
  return data.secure_url;
}

// https://res.cloudinary.com/<cloud>/image/upload/v123/portafolio/abc.png → "portafolio/abc"
function publicIdFromUrl(creds: Credentials, url: string): string | null {
  const prefix = `https://res.cloudinary.com/${creds.cloudName}/image/upload/`;
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).replace(/^v\d+\//, '');
  if (!rest.startsWith(`${FOLDER}/`)) return null;
  return rest.replace(/\.[a-z0-9]+$/i, '');
}

export async function deleteFromCloudinary(creds: Credentials, url: string): Promise<void> {
  const publicId = publicIdFromUrl(creds, url);
  if (!publicId) return;
  const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  for (const [key, value] of Object.entries(params)) form.append(key, value);
  form.append('api_key', creds.apiKey);
  form.append('signature', sign(params, creds.apiSecret));
  await fetch(`https://api.cloudinary.com/v1_1/${creds.cloudName}/image/destroy`, { method: 'POST', body: form }).catch(
    () => undefined,
  );
}
