import type { CSSProperties } from 'react';
import { assetUrl } from '../lib/api';
import type { SkillLogoData } from '../types';

// Luminancia relativa de un color hex (0 = negro, 1 = blanco).
function luminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Logo de una tecnología con su color original. Los logos casi negros (Express, Next.js...)
// o casi blancos se adaptan al tema para que no desaparezcan sobre el fondo.
export function SkillLogo({ name, logo, size = 18 }: { name: string; logo: SkillLogoData | null; size?: number }) {
  if (logo?.type === 'brand') {
    const lum = luminance(logo.hex);
    const tone = lum < 0.04 ? ' skill-logo--dark' : lum > 0.85 ? ' skill-logo--light' : '';
    return (
      <svg
        className={`skill-logo${tone}`}
        style={{ '--brand': `#${logo.hex}` } as CSSProperties}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <path d={logo.path} />
      </svg>
    );
  }

  if (logo?.type === 'image') {
    const src = assetUrl(logo.url);
    if (src) return <img className="skill-logo skill-logo--img" src={src} alt="" width={size} height={size} loading="lazy" />;
  }

  // Sin logo: inicial dentro de un círculo.
  return (
    <span className="skill-logo skill-logo--initial" style={{ width: size, height: size }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase()}
    </span>
  );
}
