import { profile, socials } from '../data/profile';
import { Icon } from './Icon';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {new Date().getFullYear()} {profile.name} · <span className="accent">{profile.brand}</span>
        </p>
        <ul className="socials" aria-label="Redes">
          {socials.map((s) => (
            <li key={s.kind}>
              <a
                href={s.url}
                className="icon-btn"
                aria-label={s.label}
                {...(s.kind !== 'email' && { target: '_blank', rel: 'noopener noreferrer' })}
              >
                <Icon name={s.kind} size={18} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
