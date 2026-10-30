import * as simpleIcons from 'simple-icons';

// Logos de tecnologías de Simple Icons (CC0). Se resuelven aquí, en el servidor,
// y se guardan en la BD: así la web pública no tiene que cargar la librería entera.

export interface BrandLogo {
  type: 'brand';
  slug: string;
  title: string;
  hex: string;
  path: string;
}

export interface ImageLogo {
  type: 'image';
  url: string;
}

export type SkillLogo = BrandLogo | ImageLogo;

export interface Skill {
  name: string;
  logo: SkillLogo | null;
}

interface SimpleIcon {
  title: string;
  slug: string;
  hex: string;
  path: string;
}

// "Node.js" → "nodejs", "C++" → "cplusplus"
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\+/g, 'plus')
    .replace(/#/g, 'sharp')
    .replace(/[^a-z0-9]/g, '');

// Nombres habituales que no coinciden con el título oficial del logo.
const aliases: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  node: 'nodedotjs',
  nodejs: 'nodedotjs',
  express: 'express',
  expressjs: 'express',
  postgres: 'postgresql',
  react: 'react',
  reactjs: 'react',
  vue: 'vuedotjs',
  vuejs: 'vuedotjs',
  nextjs: 'nextdotjs',
  mongo: 'mongodb',
  html: 'html5',
  css: 'css',
  css3: 'css',
  tailwind: 'tailwindcss',
  aws: 'amazonwebservices',
  githubactions: 'githubactions',
};

const bySlug = new Map<string, SimpleIcon>();
const byTitle = new Map<string, SimpleIcon>();

for (const value of Object.values(simpleIcons) as unknown[]) {
  const icon = value as Partial<SimpleIcon> | null;
  if (!icon || typeof icon !== 'object' || !icon.path || !icon.slug || !icon.title || !icon.hex) continue;
  const full = icon as SimpleIcon;
  bySlug.set(full.slug, full);
  if (!byTitle.has(normalize(full.title))) byTitle.set(normalize(full.title), full);
}

export function findBrandLogo(name: string): BrandLogo | null {
  const key = normalize(name);
  if (!key) return null;
  const icon = bySlug.get(aliases[key] ?? '') ?? byTitle.get(key) ?? bySlug.get(key);
  return icon ? { type: 'brand', slug: icon.slug, title: icon.title, hex: icon.hex, path: icon.path } : null;
}

// Convierte lo que llega del panel (o los datos antiguos, que eran solo texto) en { name, logo }.
export function toSkill(input: string | { name: string; imageUrl?: string | null }): Skill {
  if (typeof input === 'string') return { name: input, logo: findBrandLogo(input) };
  if (input.imageUrl) return { name: input.name, logo: { type: 'image', url: input.imageUrl } };
  return { name: input.name, logo: findBrandLogo(input.name) };
}

export function uploadedLogos(skills: unknown): string[] {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (s && typeof s === 'object' && (s as Skill).logo?.type === 'image' ? ((s as Skill).logo as ImageLogo).url : null))
    .filter((url): url is string => Boolean(url?.startsWith('/uploads/')));
}
