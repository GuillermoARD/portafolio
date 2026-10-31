// Copia tus proyectos y habilidades de la BD local (SQLite) a la de producción (Neon/Postgres)
// y sube a Cloudinary las imágenes que están en server/uploads.
//
// Uso (desde la carpeta portafolio):
//   1. Crea server/.env.deploy con DATABASE_URL, DB_SSL=true y CLOUDINARY_URL de producción.
//   2. npm run db:copy -w server            → muestra lo que va a copiar, sin tocar nada
//   3. npm run db:copy -w server -- --yes   → copia de verdad (REEMPLAZA lo que haya en producción)

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { QueryTypes, Sequelize } from 'sequelize';
import type { Skill } from '../src/brandIcons.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(serverDir);

try {
  // Se quita el BOM que añaden algunos editores de Windows antes de leer las variables.
  const content = (await readFile('.env.deploy', 'utf8')).replace(/^﻿/, '');
  Object.assign(process.env, parseEnv(content));
} catch {
  console.error('Falta server/.env.deploy con DATABASE_URL y CLOUDINARY_URL de producción.');
  process.exit(1);
}

const targetUrl = process.env.DATABASE_URL ?? '';
if (!/^(postgres|postgresql|mysql):\/\//.test(targetUrl)) {
  console.error('DATABASE_URL en server/.env.deploy tiene que ser la URL de producción (postgres://...).');
  process.exit(1);
}

// Se importan después de cargar .env.deploy para que la app se conecte a producción.
const { sequelize, initDatabase, Project, SkillGroup } = await import('../src/db.js');
const { config } = await import('../src/config.js');
const { parseCloudinaryUrl, uploadToCloudinary } = await import('../src/cloudinary.js');

const confirmed = process.argv.includes('--yes');
const cloudinary = config.cloudinaryUrl ? parseCloudinaryUrl(config.cloudinaryUrl) : null;

const source = new Sequelize({ dialect: 'sqlite', storage: path.resolve(config.db.sqliteFile), logging: false });
type Row = Record<string, unknown>;
const parseJson = <T>(value: unknown): T => (typeof value === 'string' ? JSON.parse(value) : value) as T;

const projects = await source.query<Row>('SELECT * FROM projects ORDER BY sortOrder, id', { type: QueryTypes.SELECT });
const groups = await source.query<Row>('SELECT * FROM skill_groups ORDER BY sortOrder, id', { type: QueryTypes.SELECT });

// Sube cada imagen local una sola vez y devuelve su nueva URL.
const migrated = new Map<string, string>();
const mimeByExt: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

async function migrateImage(url: unknown): Promise<string | null> {
  if (typeof url !== 'string' || !url) return null;
  if (!url.startsWith('/uploads/')) return url;
  if (!confirmed) return `${url} → Cloudinary`;
  if (!cloudinary) throw new Error('Hay imágenes locales pero falta CLOUDINARY_URL en server/.env.deploy.');
  const cached = migrated.get(url);
  if (cached) return cached;
  const filename = path.basename(url);
  const buffer = await readFile(path.join('uploads', filename));
  const mimetype = mimeByExt[path.extname(filename).toLowerCase()] ?? 'image/png';
  const remote = await uploadToCloudinary(cloudinary, { buffer, mimetype, filename });
  migrated.set(url, remote);
  console.log(`  ↑ ${filename} → ${remote}`);
  return remote;
}


console.log(`\nDestino: ${new URL(targetUrl).host} (${confirmed ? 'COPIA REAL' : 'simulación, añade --yes para copiar'})\n`);

const newProjects: {
  title: string;
  description: string;
  tags: string[];
  imageUrl: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  sortOrder: number;
}[] = [];
for (const p of projects) {
  newProjects.push({
    title: String(p.title),
    description: String(p.description),
    tags: parseJson<string[]>(p.tags),
    imageUrl: await migrateImage(p.imageUrl),
    repoUrl: (p.repoUrl as string | null) ?? null,
    demoUrl: (p.demoUrl as string | null) ?? null,
    sortOrder: Number(p.sortOrder),
  });
  console.log(`Proyecto: ${p.title}`);
}

const newGroups: { title: string; icon: string; skills: Skill[]; sortOrder: number }[] = [];
for (const g of groups) {
  const skills = parseJson<Skill[]>(g.skills);
  for (const skill of skills) {
    if (skill.logo?.type === 'image') skill.logo.url = (await migrateImage(skill.logo.url)) ?? skill.logo.url;
  }
  newGroups.push({
    title: String(g.title),
    icon: (await migrateImage(g.icon)) ?? 'code',
    skills,
    sortOrder: Number(g.sortOrder),
  });
  console.log(`Habilidades: ${g.title} (${skills.map((s) => s.name).join(', ')})`);
}

if (!confirmed) {
  console.log('\nNo se ha copiado nada. Revisa la lista y vuelve a ejecutar con --yes.');
  await source.close();
  process.exit(0);
}

await initDatabase();
await sequelize.transaction(async (transaction) => {
  await Project.destroy({ where: {}, transaction });
  await SkillGroup.destroy({ where: {}, transaction });
  await Project.bulkCreate(newProjects, { transaction });
  // Los logos ya vienen resueltos de la BD local; se guardan tal cual.
  await SkillGroup.bulkCreate(newGroups, { transaction });
});

console.log(`\nListo: ${newProjects.length} proyectos y ${newGroups.length} grupos copiados a producción.`);
await source.close();
await sequelize.close();
