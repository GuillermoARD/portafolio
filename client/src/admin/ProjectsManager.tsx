import { type ChangeEvent, type FormEvent, useState } from 'react';
import { assetUrl } from '../lib/api';
import type { Project } from '../types';
import { type AdminClient, splitList } from './adminApi';
import { NoticeBar, TextArea, TextField } from './Field';
import { useCollection } from './useCollection';

interface Draft {
  title: string;
  description: string;
  tags: string;
  imageUrl: string;
  repoUrl: string;
  demoUrl: string;
  sortOrder: string;
}

const emptyDraft: Draft = { title: '', description: '', tags: '', imageUrl: '', repoUrl: '', demoUrl: '', sortOrder: '0' };

const toDraft = (p: Project): Draft => ({
  title: p.title,
  description: p.description,
  tags: p.tags.join(', '),
  imageUrl: p.imageUrl ?? '',
  repoUrl: p.repoUrl ?? '',
  demoUrl: p.demoUrl ?? '',
  sortOrder: String(p.sortOrder),
});

export function ProjectsManager({ client }: { client: AdminClient }) {
  const c = useCollection<Project>(client, 'projects');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const open = (project: Project | null) => {
    setDraft(project ? toDraft(project) : emptyDraft);
    setEditingId(project ? project.id : 'new');
    c.setFieldErrors({});
    c.setNotice(null);
  };

  const close = () => setEditingId(null);

  const set = (field: keyof Draft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
    const body = {
      title: draft.title,
      description: draft.description,
      tags: splitList(draft.tags),
      imageUrl: draft.imageUrl,
      repoUrl: draft.repoUrl,
      demoUrl: draft.demoUrl,
      sortOrder: Number(draft.sortOrder) || 0,
    };
    const ok = await c.save(editingId === 'new' ? null : editingId, body);
    if (ok) close();
  };

  const onDelete = async (project: Project) => {
    if (window.confirm(`¿Seguro que quieres eliminar "${project.title}"? No se puede deshacer.`)) {
      await c.remove(project.id);
      if (editingId === project.id) close();
    }
  };

  const err = c.fieldErrors;
  const preview = assetUrl(draft.imageUrl || null);

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <div>
          <h1>Proyectos</h1>
          <p className="admin-muted">Se muestran en la web en el orden indicado (de menor a mayor).</p>
        </div>
        {editingId === null && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => open(null)}>
            + Nuevo proyecto
          </button>
        )}
      </div>

      <NoticeBar notice={c.notice} onClose={() => c.setNotice(null)} />

      {editingId !== null && (
        <form className="card admin-form" onSubmit={onSubmit} noValidate>
          <h2>{editingId === 'new' ? 'Nuevo proyecto' : 'Editar proyecto'}</h2>
          <TextField id="p-title" label="Título" value={draft.title} onChange={set('title')} maxLength={100} error={err.title} required />
          <TextArea
            id="p-description"
            label="Descripción"
            rows={4}
            value={draft.description}
            onChange={set('description')}
            maxLength={600}
            error={err.description}
            hint={`${draft.description.length}/600`}
            required
          />
          <TextField
            id="p-tags"
            label="Tecnologías"
            value={draft.tags}
            onChange={set('tags')}
            error={err.tags}
            hint="Separadas por comas: Node.js, Express, Sequelize"
          />

          <div className="field">
            <span className="field__label" id="p-image-label">
              Imagen <span className="field__optional">(opcional)</span>
            </span>
            <div className="admin-image">
              {preview ? (
                <img src={preview} alt="Vista previa de la imagen del proyecto" />
              ) : (
                <div className="admin-image__empty">Sin imagen</div>
              )}
              <div className="admin-image__controls">
                <label className="btn btn--ghost btn--sm admin-upload">
                  {uploading ? 'Subiendo…' : 'Subir imagen'}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUpload} disabled={uploading} />
                </label>
                {draft.imageUrl && (
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft((d) => ({ ...d, imageUrl: '' }))}>
                    Quitar
                  </button>
                )}
              </div>
            </div>
            <TextField
              id="p-image"
              label="…o pega un enlace a la imagen"
              value={draft.imageUrl}
              onChange={set('imageUrl')}
              placeholder="https://..."
              error={err.imageUrl}
              hint="JPG, PNG, WebP o GIF de hasta 3 MB. Proporción recomendada 16:9."
            />
          </div>

          <div className="admin-form__row">
            <TextField id="p-repo" label="Enlace al repositorio" type="url" value={draft.repoUrl} onChange={set('repoUrl')} placeholder="https://github.com/..." error={err.repoUrl} />
            <TextField id="p-demo" label="Enlace a la demo" type="url" value={draft.demoUrl} onChange={set('demoUrl')} placeholder="https://..." error={err.demoUrl} />
          </div>
          <TextField id="p-order" label="Orden" type="number" min={0} max={9999} value={draft.sortOrder} onChange={set('sortOrder')} error={err.sortOrder} />

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
        <p className="admin-muted">Todavía no hay proyectos. Crea el primero.</p>
      ) : (
        <ul className="admin-list">
          {c.items.map((project) => {
            const thumb = assetUrl(project.imageUrl);
            return (
              <li key={project.id} className="card admin-list__item">
                {thumb ? <img src={thumb} alt="" className="admin-list__thumb" /> : <div className="admin-list__thumb admin-image__empty" aria-hidden="true" />}
                <div className="admin-list__body">
                  <h3>{project.title}</h3>
                  <p className="admin-muted">{project.tags.join(' · ') || 'Sin tecnologías'}</p>
                </div>
                <span className="admin-list__order" title="Orden">#{project.sortOrder}</span>
                <div className="admin-list__actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => open(project)}>
                    Editar<span className="sr-only"> {project.title}</span>
                  </button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(project)}>
                    Eliminar<span className="sr-only"> {project.title}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
