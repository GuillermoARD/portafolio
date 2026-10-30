import { z } from 'zod';
import { toSkill } from './brandIcons.js';

// Mismos límites que client/src/lib/validateContact.ts: si cambias uno, cambia el otro.
export const contactSchema = z.object({
  name: z
    .string({ error: 'El nombre es obligatorio.' })
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'El nombre no puede pasar de 80 caracteres.'),
  email: z
    .string({ error: 'El correo es obligatorio.' })
    .trim()
    .max(120, 'El correo es demasiado largo.')
    .email('Escribe un correo válido.'),
  subject: z
    .string()
    .trim()
    .max(120, 'El asunto no puede pasar de 120 caracteres.')
    .optional()
    .default(''),
  message: z
    .string({ error: 'El mensaje es obligatorio.' })
    .trim()
    .min(10, 'El mensaje debe tener al menos 10 caracteres.')
    .max(2000, 'El mensaje no puede pasar de 2000 caracteres.'),
  // Honeypot: campo oculto que una persona nunca rellena.
  website: z.string().optional().default(''),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Escribe tu usuario.').max(100),
  password: z.string().min(1, 'Escribe tu contraseña.').max(200),
});

// Enlace opcional: vacío → null; si hay algo, tiene que ser http(s).
const optionalUrl = z
  .string()
  .trim()
  .max(500, 'El enlace es demasiado largo.')
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https?:\/\/\S+$/i.test(v), 'Debe ser un enlace que empiece por http:// o https://');

// Imagen: enlace externo o un archivo subido al propio servidor (/uploads/...).
const optionalImage = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .transform((v) => (v ? v : null))
  .refine(
    (v) => v === null || /^https?:\/\/\S+$/i.test(v) || /^\/uploads\/[\w.-]+$/.test(v),
    'La imagen debe ser un enlace http(s) o un archivo subido.',
  );

const tagList = (label: string, max: number) =>
  z
    .array(z.string().trim().min(1).max(30, `Cada ${label} puede tener como mucho 30 caracteres.`))
    .max(max, `Como máximo ${max} ${label}s.`)
    .transform((list) => [...new Set(list)]);

export const projectSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio.' })
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres.')
    .max(100, 'El título no puede pasar de 100 caracteres.'),
  description: z
    .string({ error: 'La descripción es obligatoria.' })
    .trim()
    .min(10, 'La descripción debe tener al menos 10 caracteres.')
    .max(600, 'La descripción no puede pasar de 600 caracteres.'),
  tags: tagList('tecnología', 15).default([]),
  imageUrl: optionalImage,
  repoUrl: optionalUrl,
  demoUrl: optionalUrl,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

// Mismas claves que client/src/components/SkillIcon.tsx: si añades un icono, añádelo en los dos.
export const SKILL_ICON_KEYS = [
  'code',
  'server',
  'database',
  'test',
  'tools',
  'terminal',
  'layout',
  'mobile',
  'cloud',
  'shield',
  'git',
  'cpu',
] as const;

const skillIcon = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => v || 'code')
  .refine(
    (v) =>
      (SKILL_ICON_KEYS as readonly string[]).includes(v) || /^https?:\/\/\S+$/i.test(v) || /^\/uploads\/[\w.-]+$/.test(v),
    'Elige uno de los iconos o sube tu propio logo.',
  );

export const skillGroupSchema = z.object({
  title: z
    .string({ error: 'El título es obligatorio.' })
    .trim()
    .min(2, 'El título debe tener al menos 2 caracteres.')
    .max(60, 'El título no puede pasar de 60 caracteres.'),
  icon: skillIcon,
  // Cada habilidad: texto ("Node.js") o { name, imageUrl } si lleva un logo propio.
  // El logo de marca no se acepta del cliente: lo resuelve siempre el servidor (toSkill).
  skills: z
    .array(
      z.union([
        z.string().trim().min(1).max(30, 'Cada habilidad puede tener como mucho 30 caracteres.'),
        z.object({
          name: z.string().trim().min(1).max(30, 'Cada habilidad puede tener como mucho 30 caracteres.'),
          imageUrl: optionalImage,
        }),
      ]),
    )
    .min(1, 'Añade al menos una habilidad.')
    .max(30, 'Como máximo 30 habilidades por grupo.')
    .transform((list) => {
      const seen = new Set<string>();
      return list
        .map(toSkill)
        .filter((skill) => !seen.has(skill.name.toLowerCase()) && seen.add(skill.name.toLowerCase()));
    }),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const idParamSchema = z.coerce.number().int().positive();

// Convierte los errores de Zod en { campo: mensaje } para el front.
export function toFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form');
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}
