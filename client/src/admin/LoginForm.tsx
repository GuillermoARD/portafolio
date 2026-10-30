import { type FormEvent, useState } from 'react';
import { login, saveToken } from './adminApi';
import './admin.css';

export function LoginForm({ onLogin }: { onLogin: (token: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Escribe tu usuario y tu contraseña.');
      return;
    }
    setSending(true);
    setError('');
    const result = await login(username.trim(), password);
    setSending(false);
    if (result.ok) {
      saveToken(result.token, result.expiresAt);
      onLogin(result.token);
    } else {
      setError(result.error);
      setPassword('');
    }
  };

  return (
    <main className="admin-login">
      <form className="card admin-login__card" onSubmit={onSubmit} noValidate>
        <span className="brand__mark" aria-hidden="true">GD</span>
        <h1>Panel del portafolio</h1>
        <p className="admin-muted">Inicia sesión para gestionar tus proyectos y habilidades.</p>

        <div className="field">
          <label htmlFor="login-user">Usuario</label>
          <input
            id="login-user"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="login-pass">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn--primary" disabled={sending}>
          {sending ? (
            <>
              <span className="spinner" aria-hidden="true" /> Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </button>
        <p className="form__status form__status--error" role="alert">
          {error}
        </p>
        <a href="/" className="admin-muted">
          ← Volver al sitio
        </a>
      </form>
    </main>
  );
}
