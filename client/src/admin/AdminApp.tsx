import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { Icon } from '../components/Icon';
import { clearToken, createAdminClient, loadToken } from './adminApi';
import { LoginForm } from './LoginForm';
import { ProjectsManager } from './ProjectsManager';
import { SkillsManager } from './SkillsManager';
import './admin.css';

type Tab = 'projects' | 'skills';

export default function AdminApp() {
  const [token, setToken] = useState<string | null>(loadToken);
  const [user, setUser] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('projects');
  const { theme, toggle } = useTheme();

  useEffect(() => {
    document.title = 'Panel · Portafolio';
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setToken(null);
    setUser(null);
  }, []);

  const client = useMemo(() => (token ? createAdminClient(token, logout) : null), [token, logout]);

  useEffect(() => {
    if (!client) return;
    client.me().then((r) => r.ok && setUser(r.user));
  }, [client]);

  if (!client) return <LoginForm onLogin={setToken} />;

  return (
    <div className="admin">
      <header className="admin__header">
        <div className="admin__header-inner">
          <a href="/" className="brand">
            <span className="brand__mark" aria-hidden="true">GD</span>
            <span className="brand__text">Panel</span>
          </a>
          <div className="admin__header-actions">
            {user && <span className="admin__user">{user}</span>}
            <a className="btn btn--ghost btn--sm" href="/" target="_blank" rel="noopener noreferrer">
              Ver sitio <Icon name="external" size={16} />
            </a>
            <button
              type="button"
              className="icon-btn"
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="admin__main">
        <div className="admin__tabs" role="tablist" aria-label="Contenido">
          {(
            [
              ['projects', 'Proyectos'],
              ['skills', 'Habilidades'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`tab-${id}`}
              aria-selected={tab === id}
              aria-controls={`panel-${id}`}
              className={`admin__tab${tab === id ? ' is-active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'projects' ? <ProjectsManager client={client} /> : <SkillsManager client={client} />}
        </section>
      </main>
    </div>
  );
}
