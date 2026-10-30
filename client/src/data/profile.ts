// ─────────────────────────────────────────────────────────────
// Textos fijos del portafolio (presentación y redes). Cambia los
// datos marcados con "TODO" por los tuyos.
// ─────────────────────────────────────────────────────────────

export type SocialKind = 'github' | 'linkedin' | 'email' | 'x';

export interface Social {
  kind: SocialKind;
  label: string;
  url: string;
}

export const profile = {
  name: 'Guillermo Doñe',
  brand: 'Guillermo Doñe',
  role: 'Desarrollador FullStack',
  tagline: 'Construyo APIs robustas, seguras y bien probadas con Node.js y TypeScript.',
  location: 'TODO: tu ciudad, país',
  available: true,
  about: [
    'Soy Guillermo Doñe, desarrollador backend centrado en el ecosistema de JavaScript y TypeScript. Me gusta diseñar APIs claras, con datos validados de punta a punta y código fácil de mantener.',
    'Trabajo con Node.js y Express, modelo bases de datos relacionales con Sequelize y cuido la calidad con pruebas en Jest. Postman y TablePlus son parte de mi día a día para probar endpoints y revisar datos.',
  ],
  highlights: [
    { value: 'TypeScript', label: 'tipado de punta a punta' },
    { value: 'REST', label: 'APIs documentadas y probadas' },
    { value: 'SQL', label: 'modelado de datos con Sequelize' },
  ],
};

// Los proyectos y las habilidades NO van aquí: se guardan en la base de datos
// y se gestionan desde el panel /admin.

// TODO: pon tus enlaces reales.
export const socials: Social[] = [
  { kind: 'github', label: 'GitHub', url: 'https://github.com/GuillermoARD?tab=repositories' },
  { kind: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/guillermo-do%C3%B1e-63a59933b/' },
  { kind: 'email', label: 'Correo', url: 'mailto:guillermoadr29@gmail.com' },
];
