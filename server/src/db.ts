import { mkdirSync } from 'node:fs';
import path from 'node:path';
import {
  type CreationOptional,
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  Model,
  Sequelize,
} from 'sequelize';
import { type Skill, toSkill } from './brandIcons.js';
import { config } from './config.js';
import { seedProjects, seedSkillGroups } from './seed.js';

function createSequelize() {
  if (config.db.url) {
    // Postgres o MySQL en producción: DATABASE_URL=postgres://... o mysql://...
    return new Sequelize(config.db.url, {
      logging: false,
      dialectOptions: config.db.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {},
    });
  }
  const file = path.resolve(config.db.sqliteFile);
  mkdirSync(path.dirname(file), { recursive: true });
  return new Sequelize({ dialect: 'sqlite', storage: file, logging: false });
}

export const sequelize = createSequelize();

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare description: string;
  declare tags: string[];
  declare imageUrl: string | null;
  declare repoUrl: string | null;
  declare demoUrl: string | null;
  declare sortOrder: CreationOptional<number>;
}

Project.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(100), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    tags: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    imageUrl: { type: DataTypes.STRING(500), allowNull: true },
    repoUrl: { type: DataTypes.STRING(500), allowNull: true },
    demoUrl: { type: DataTypes.STRING(500), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'projects' },
);

export class SkillGroup extends Model<InferAttributes<SkillGroup>, InferCreationAttributes<SkillGroup>> {
  declare id: CreationOptional<number>;
  declare title: string;
  // Clave de un icono incluido (ej. "database") o una imagen subida/enlazada.
  declare icon: CreationOptional<string>;
  declare skills: Skill[];
  declare sortOrder: CreationOptional<number>;
}

SkillGroup.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(60), allowNull: false },
    icon: { type: DataTypes.STRING(500), allowNull: false, defaultValue: 'code' },
    skills: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'skill_groups' },
);

export class Certificate extends Model<InferAttributes<Certificate>, InferCreationAttributes<Certificate>> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare issuer: string;
  // Mes de obtención en formato "AAAA-MM", opcional.
  declare issuedAt: string | null;
  declare imageUrl: string;
  // Enlace para verificar el diploma en la web de la institución, opcional.
  declare credentialUrl: string | null;
  declare sortOrder: CreationOptional<number>;
}

Certificate.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(120), allowNull: false },
    issuer: { type: DataTypes.STRING(100), allowNull: false },
    issuedAt: { type: DataTypes.STRING(7), allowNull: true },
    imageUrl: { type: DataTypes.STRING(500), allowNull: false },
    credentialUrl: { type: DataTypes.STRING(500), allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  },
  { sequelize, tableName: 'certificates' },
);

export const listOrder: [string, string][] = [
  ['sortOrder', 'ASC'],
  ['id', 'ASC'],
];

// sync() crea tablas nuevas pero no añade columnas a las que ya existen.
// Aquí van esas pequeñas migraciones para bases de datos creadas con versiones anteriores.
async function migrate() {
  const qi = sequelize.getQueryInterface();
  const skillColumns = await qi.describeTable('skill_groups');
  if (!skillColumns.icon) {
    await qi.addColumn('skill_groups', 'icon', { type: DataTypes.STRING(500), allowNull: false, defaultValue: 'code' });
    for (const group of await SkillGroup.findAll()) {
      await group.update({ icon: guessIcon(group.title) });
    }
    console.log('[db] Columna "icon" añadida a las habilidades.');
  }

  // Antes cada habilidad era solo texto; ahora es { name, logo }.
  let converted = 0;
  for (const group of await SkillGroup.findAll()) {
    const skills = group.skills as unknown[];
    if (skills.some((s) => typeof s === 'string')) {
      await group.update({ skills: skills.map((s) => (typeof s === 'string' ? toSkill(s) : (s as Skill))) });
      converted++;
    }
  }
  if (converted) console.log(`[db] Logos añadidos a las habilidades de ${converted} grupo(s).`);
}

// Elige un icono razonable a partir del nombre de la categoría.
function guessIcon(title: string): string {
  const t = title.toLowerCase();
  if (/dato|database|sql/.test(t)) return 'database';
  if (/back|server|api/.test(t)) return 'server';
  if (/test|prueba|herramienta|tool/.test(t)) return 'test';
  if (/front|ui|diseñ/.test(t)) return 'layout';
  if (/devops|cloud|nube|deploy/.test(t)) return 'cloud';
  if (/segur|security/.test(t)) return 'shield';
  return 'code';
}

export async function initDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await migrate();

  // Primera vez: rellena con datos de ejemplo para que la web no salga vacía.
  if ((await SkillGroup.count()) === 0) {
    await SkillGroup.bulkCreate(seedSkillGroups.map((g) => ({ ...g, skills: g.skills.map(toSkill) })));
    console.log('[db] Habilidades iniciales creadas.');
  }
  if ((await Project.count()) === 0) {
    await Project.bulkCreate(seedProjects);
    console.log('[db] Proyectos de ejemplo creados (edítalos desde /admin).');
  }

  const where = config.db.url ? config.db.url.split(':')[0] : `sqlite (${config.db.sqliteFile})`;
  console.log(`[db] Conectado a ${where}`);
}
