import { assetUrl } from '../lib/api';

// Iconos de línea para las categorías de habilidades.
// Mismas claves que SKILL_ICON_KEYS en server/src/schema.ts: si añades uno, añádelo en los dos.
export const skillIcons = {
  code: { label: 'Código', paths: ['M16 18l6-6-6-6', 'M8 6l-6 6 6 6'] },
  server: {
    label: 'Servidor',
    paths: [
      'M4 3h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z',
      'M4 13h16a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1z',
      'M7 7h.01',
      'M7 17h.01',
    ],
  },
  database: {
    label: 'Base de datos',
    paths: [
      'M4 5c0-1.66 3.58-3 8-3s8 1.34 8 3-3.58 3-8 3-8-1.34-8-3z',
      'M4 5v14c0 1.66 3.58 3 8 3s8-1.34 8-3V5',
      'M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3',
    ],
  },
  test: {
    label: 'Testing',
    paths: ['M9 3h6', 'M10 3v6l-5.6 9.5A2 2 0 0 0 6.1 21.5h11.8a2 2 0 0 0 1.7-3L14 9V3', 'M7.5 15h9'],
  },
  tools: {
    label: 'Herramientas',
    paths: ['M14.7 6.3a4 4 0 0 0-5.3 5.3L3 18l3 3 6.4-6.4a4 4 0 0 0 5.3-5.3l-2.6 2.6-2.4-.6-.6-2.4z'],
  },
  terminal: { label: 'Terminal', paths: ['M4 17l6-6-6-6', 'M12 19h8'] },
  layout: { label: 'Frontend', paths: ['M4 4h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z', 'M3 9h18', 'M9 9v11'] },
  mobile: { label: 'Móvil', paths: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2'] },
  cloud: { label: 'Nube / DevOps', paths: ['M17.5 19H8a5 5 0 1 1 .9-9.9A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8z'] },
  shield: { label: 'Seguridad', paths: ['M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z', 'M9 12l2 2 4-4'] },
  git: {
    label: 'Git',
    paths: [
      'M6 3v12',
      'M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
      'M18 9a9 9 0 0 1-9 9',
    ],
  },
  cpu: {
    label: 'Hardware / Sistemas',
    paths: ['M6 6h12v12H6z', 'M10 10h4v4h-4z', 'M9 2v4', 'M15 2v4', 'M9 18v4', 'M15 18v4', 'M2 9h4', 'M2 15h4', 'M18 9h4', 'M18 15h4'],
  },
} as const;

export type SkillIconKey = keyof typeof skillIcons;

export const isPresetIcon = (icon: string): icon is SkillIconKey => icon in skillIcons;

// Muestra un icono incluido o, si es un enlace o un archivo subido, la imagen.
export function SkillIcon({ icon, size = 22 }: { icon: string; size?: number }) {
  if (isPresetIcon(icon)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
      >
        {skillIcons[icon].paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  }
  const src = assetUrl(icon);
  return src ? <img src={src} alt="" width={size} height={size} className="skill-icon__img" /> : null;
}
