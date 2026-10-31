import { type ChangeEvent, type FormEvent, useState } from 'react';
import { assetUrl, formatMonth } from '../lib/api';
import type { Certificate } from '../types';
import type { AdminClient } from './adminApi';
import { NoticeBar, TextField } from './Field';
import { useCollection } from './useCollection';

interface Draft {
  title: string;
  issuer: string;
  issuedAt: string;
  imageUrl: string;
  credentialUrl: string;
  sortOrder: string;
}

const emptyDraft: Draft = { title: '', issuer: '', issuedAt: '', imageUrl: '', credentialUrl: '', sortOrder: '0' };

const toDraft = (c: Certificate): Draft => ({
  title: c.title,
  issuer: c.issuer,
  issuedAt: c.issuedAt ?? '',
  imageUrl: c.imageUrl,
  credentialUrl: c.credentialUrl ?? '',
  sortOrder: String(c.sortOrder),
});

export function CertificatesManager({ client }: { client: AdminClient }) {
  const c = useCollection<Certificate>(client, 'certificates');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const open = (cert: Certificate | null) => {
    setDraft(cert ? toDraft(cert) : emptyDraft);
    setEditingId(cert ? cert.id : 'new');
    c.setFieldErrors({});
    c.setNotice(null);
  };

  const close = () => setEditingId(null);

  const set = (field: keyof Draft) => (e: ChangeEvent<HTMLInputElement>) =>
    setDraft((d) => ({ ...d, [field]: e.target.value }));

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      c.setFieldErrors({ imageUrl: 'La imagen no puede pasar de 3 MB.' });
      return;
    }
    setUploading(true);
    const result = await client.upload(file);
    setUploading(false);
    if (result.ok) {
      setDraft((d) => ({ ...d, imageUrl: result.url }));
      c.setFieldErrors({});
    } else {
      c.setFieldErrors({ imageUrl: result.error });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await c.save(editingId === 'new' ? null : editingId, {
      title: draft.title,
      issuer: draft.issuer,
      issuedAt: draft.issuedAt,
      imageUrl: draft.imageUrl,
      credentialUrl: draft.credentialUrl,
      sortOrder: Number(draft.sortOrder) || 0,
    });
    if (ok) close();
  };

  const onDelete = async (cert: Certificate) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${cert.title}"? No se puede deshacer.`)) {
      await c.remove(cert.id);
      if (editingId === cert.id) close();
    }
  };

  const err = c.fieldErrors;
  const preview = assetUrl(draft.imageUrl || null);

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <div>
          <h1>Diplomas</h1>
          <p className="admin-muted">Tus diplomas y certificaciones. La gente puede abrirlos en grande desde la web.</p>
        </div>
        {editingId === null && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => open(null)}>
            + Nuevo diploma
          </button>
        )}
      </div>

      <NoticeBar notice={c.notice} onClose={() => c.setNotice(null)} />

      {editingId !== null && (
        <form className="card admin-form" onSubmit={onSubmit} noValidate>
          <h2>{editingId === 'new' ? 'Nuevo diploma' : 'Editar diploma'}</h2>
          <TextField
            id="c-title"
            label="Nombre del diploma"
            value={draft.title}
            onChange={set('title')}
            maxLength={120}
            placeholder="Ej. Desarrollo Web Full Stack"
            error={err.title}
            required
          />
          <div className="admin-form__row">
            <TextField
              id="c-issuer"
              label="Institución"
              value={draft.issuer}
              onChange={set('issuer')}
              maxLength={100}
              placeholder="Ej. Udemy, ITLA, Platzi"
              error={err.issuer}
              required
            />
            <TextField
              id="c-date"
              label="Fecha (mes y año)"
              type="month"
              value={draft.issuedAt}
              onChange={set('issuedAt')}
              error={err.issuedAt}
            />
          </div>

          <div className="field">
            <span className="field__label">Imagen del diploma</span>
            <div className="admin-image">
              {preview ? (
                <img src={preview} alt="Vista previa del diploma" className="admin-image--doc" />
              ) : (
                <div className="admin-image__empty admin-image--doc">Sin imagen</div>
              )}
              <div className="admin-image__controls">
                <label className="btn btn--ghost btn--sm admin-upload">
                  {uploading ? 'Subiendo…' : draft.imageUrl ? 'Cambiar imagen' : 'Subir diploma'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onUpload} disabled={uploading} />
                </label>
              </div>
            </div>
            <p className="field__hint">
              JPG, PNG o WebP de hasta 3 MB. Si tu diploma es un PDF, haz una captura de pantalla o expórtalo como imagen.
            </p>
            {err.imageUrl && <p className="field__error">{err.imageUrl}</p>}
          </div>

          <TextField
            id="c-credential"
            label="Enlace para verificarlo (opcional)"
            type="url"
            value={draft.credentialUrl}
            onChange={set('credentialUrl')}
            placeholder="https://..."
            error={err.credentialUrl}
            hint="Si la institución tiene una página de verificación, pon aquí el enlace."
          />
          <TextField
            id="c-order"
            label="Orden"
            type="number"
            min={0}
            max={9999}
            value={draft.sortOrder}
            onChange={set('sortOrder')}
            error={err.sortOrder}
          />

          <div className="admin-form__actions">
            <button type="submit" className="btn btn--primary btn--sm" disabled={c.saving || uploading}>
              {c.saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={close}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {c.loading ? (
        <p className="admin-muted">Cargando…</p>
      ) : c.items.length === 0 ? (
        <p className="admin-muted">Todavía no hay diplomas. Sube el primero.</p>
      ) : (
        <ul className="admin-list">
          {c.items.map((cert) => (
            <li key={cert.id} className="card admin-list__item">
              <img src={assetUrl(cert.imageUrl) ?? ''} alt="" className="admin-list__thumb" />
              <div className="admin-list__body">
                <h3>{cert.title}</h3>
                <p className="admin-muted">
                  {cert.issuer}
                  {cert.issuedAt && ` · ${formatMonth(cert.issuedAt)}`}
                </p>
              </div>
              <span className="admin-list__order" title="Orden">
                #{cert.sortOrder}
              </span>
              <div className="admin-list__actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => open(cert)}>
                  Editar<span className="sr-only"> {cert.title}</span>
                </button>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(cert)}>
                  Eliminar<span className="sr-only"> {cert.title}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
