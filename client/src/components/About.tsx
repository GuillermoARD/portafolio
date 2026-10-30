import { profile } from '../data/profile';
import { SectionHeading } from './SectionHeading';

export function About() {
  return (
    <section id="sobre-mi" className="section" aria-labelledby="sobre-mi-title">
      <div className="container">
        <SectionHeading id="sobre-mi-title" eyebrow="01" title="Sobre mí" />
        <div className="about">
          <div className="about__text" data-reveal>
            {profile.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <ul className="about__stats" data-reveal>
            {profile.highlights.map((h) => (
              <li key={h.value} className="card stat">
                <strong>{h.value}</strong>
                <span>{h.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
