// Mismos límites que server/src/schema.ts: si cambias uno, cambia el otro.
export interface ContactValues {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // honeypot
}

export type ContactErrors = Partial<Record<keyof ContactValues, string>>;

export const LIMITS = {
  name: { min: 2, max: 80 },
  email: { max: 120 },
  subject: { max: 120 },
  message: { min: 10, max: 2000 },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  const name = values.name.trim();
  const email = values.email.trim();
  const subject = values.subject.trim();
  const message = values.message.trim();

  if (!name) errors.name = 'El nombre es obligatorio.';
  else if (name.length < LIMITS.name.min) errors.name = `El nombre debe tener al menos ${LIMITS.name.min} caracteres.`;
  else if (name.length > LIMITS.name.max) errors.name = `El nombre no puede pasar de ${LIMITS.name.max} caracteres.`;

  if (!email) errors.email = 'El correo es obligatorio.';
  else if (email.length > LIMITS.email.max) errors.email = 'El correo es demasiado largo.';
  else if (!EMAIL_RE.test(email)) errors.email = 'Escribe un correo válido.';

  if (subject.length > LIMITS.subject.max) errors.subject = `El asunto no puede pasar de ${LIMITS.subject.max} caracteres.`;

  if (!message) errors.message = 'El mensaje es obligatorio.';
  else if (message.length < LIMITS.message.min)
    errors.message = `El mensaje debe tener al menos ${LIMITS.message.min} caracteres.`;
  else if (message.length > LIMITS.message.max)
    errors.message = `El mensaje no puede pasar de ${LIMITS.message.max} caracteres.`;

  return errors;
}
