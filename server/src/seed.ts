// Datos con los que se rellena la base de datos la primera vez que arranca.
// Después todo se gestiona desde el panel /admin.

export const seedSkillGroups = [
  { title: 'Lenguajes', icon: 'code', skills: ['JavaScript', 'TypeScript'], sortOrder: 1 },
  { title: 'Backend', icon: 'server', skills: ['Node.js', 'Express', 'Zod', 'Axios'], sortOrder: 2 },
  { title: 'Bases de datos', icon: 'database', skills: ['SQL', 'Sequelize', 'TablePlus'], sortOrder: 3 },
  { title: 'Testing y herramientas', icon: 'test', skills: ['Jest', 'Postman'], sortOrder: 4 },
];

export const seedProjects = [
  {
    title: 'API de gestión de tareas (EJEMPLO)',
    description:
      'API REST con autenticación, validación de datos con Zod y persistencia en una base de datos relacional mediante Sequelize.',
    tags: ['Node.js', 'Express', 'TypeScript', 'Sequelize', 'Zod'],
    imageUrl: null,
    repoUrl: 'https://github.com/tu-usuario/api-tareas',
    demoUrl: null,
    sortOrder: 1,
  },
  {
    title: 'Servicio de integraciones (EJEMPLO)',
    description:
      'Microservicio que consume APIs externas con Axios, normaliza las respuestas y expone un endpoint unificado con caché.',
    tags: ['Node.js', 'Axios', 'Express', 'Jest'],
    imageUrl: null,
    repoUrl: 'https://github.com/tu-usuario/integraciones',
    demoUrl: null,
    sortOrder: 2,
  },
  {
    title: 'Suite de pruebas para una API (EJEMPLO)',
    description:
      'Pruebas unitarias y de integración con Jest y colecciones de Postman para validar contratos y casos de error.',
    tags: ['Jest', 'Postman', 'TypeScript'],
    imageUrl: null,
    repoUrl: 'https://github.com/tu-usuario/api-tests',
    demoUrl: null,
    sortOrder: 3,
  },
];
