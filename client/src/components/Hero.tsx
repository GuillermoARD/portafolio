import { profile, socials } from '../data/profile';
import { Icon } from './Icon';

export function Hero() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <div className="hero__glow" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__content">
          {profile.available && (
            <p className="badge" data-reveal>
              <span className="badge__dot" aria-hidden="true" /> Disponible para nuevos proyectos
            </p>
          )}
          <h1 id="hero-title" className="hero__title" data-reveal>
            Hola, soy <span className="accent">{profile.name}</span>.
            <br />
            {profile.role}.
          </h1>
          <p className="hero__lead" data-reveal>
            {profile.tagline}
          </p>
          <div className="hero__cta" data-reveal>
            <a className="btn btn--primary" href="#proyectos">
              Ver proyectos <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn--ghost" href="#contacto">
              Hablemos
            </a>
          </div>
          <ul className="socials" aria-label="Redes" data-reveal>
            {socials.map((s) => (
              <li key={s.kind}>
                <a
                  href={s.url}
                  className="icon-btn"
                  aria-label={s.label}
                  {...(s.kind !== 'email' && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  <Icon name={s.kind} />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="terminal" data-reveal aria-hidden="true">
          <div className="terminal__bar">
            <span /> <span /> <span />
            <p>api/server.ts</p>
          </div>
          <pre className="terminal__code">
            <code>
              <span className="tk-k">import</span> express <span className="tk-k">from</span>{' '}
              <span className="tk-s">'express'</span>;{'\n'}
              <span className="tk-k">import</span> {'{ z }'} <span className="tk-k">from</span>{' '}
              <span className="tk-s">'zod'</span>;{'\n\n'}
              <span className="tk-k">const</span> app = <span className="tk-f">express</span>();{'\n\n'}
              app.<span className="tk-f">get</span>(<span className="tk-s">'/api/dev'</span>, (req, res) =&gt; {'{'}
              {'\n  '}res.<span className="tk-f">json</span>({'{'}
              {'\n    '}name: <span className="tk-s">'{profile.name}'</span>,{'\n    '}stack: [
              <span className="tk-s">'Node'</span>, <span className="tk-s">'TS'</span>,{' '}
              <span className="tk-s">'SQL'</span>],{'\n    '}tested: <span className="tk-k">true</span>,{'\n  '}
              {'}'});{'\n'}
              {'}'});
              <span className="terminal__cursor" />
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
