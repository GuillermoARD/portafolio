import { type ChangeEvent, type FormEvent, useState } from 'react';
import { SkillIcon, isPresetIcon, skillIcons } from '../components/SkillIcon';
import { SkillLogo } from '../components/SkillLogo';
import type { SkillGroup } from '../types';
import type { AdminClient } from './adminApi';
import { NoticeBar, TextField } from './Field';
import { type DraftSkill, SkillListEditor } from './SkillListEditor';
import { useCollection } from './useCollection';

interface Draft {
  title: string;
  icon: string;
  skills: DraftSkill[];
  sortOrder: string;
}

const emptyDraft: Draft = { title: '', icon: 'code', skills: [], sortOrder: '0' };

const toDraftSkills = (group: SkillGroup): DraftSkill[] =>
  group.skills.map((s) => ({
    name: s.name,
    imageUrl: s.logo?.type === 'image' ? s.logo.url : null,
    brand: s.logo?.type === 'brand' ? s.logo : null,
  }));

export function SkillsManager({ client }: { client: AdminClient }) {
  const c = useCollection<SkillGroup>(client, 'skills');
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [uploading, setUploading] = useState(false);

  const open = (group: SkillGroup | null) => {
    setDraft(
      group
        ? { title: group.title, icon: group.icon, skills: toDraftSkills(group), sortOrder: String(group.sortOrder) }
        : emptyDraft,
    );
    setEditingId(group ? group.id : 'new');
    c.setFieldErrors({});
    c.setNotice(null);
  };

  const close = () => setEditingId(null);

  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      c.setFieldErrors({ icon: 'El logo no puede pasar de 3 MB.' });
      return;
    }
    setUploading(true);
    const result = await client.upload(file);
    setUploading(false);
    if (result.ok) {
      setDraft((d) => ({ ...d, icon: result.url }));
      c.setFieldErrors({});
    } else {
      c.setFieldErrors({ icon: result.error });
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await c.save(editingId === 'new' ? null : editingId, {
      title: draft.title,
      icon: draft.icon,
      skills: draft.skills.map(({ name, imageUrl }) => ({ name, imageUrl })),
      sortOrder: Number(draft.sortOrder) || 0,
    });
    if (ok) close();
  };

  const onDelete = async (group: SkillGroup) => {
    if (window.confirm(`¿Eliminar el grupo "${group.title}"?`)) {
      await c.remove(group.id);
      if (editingId === group.id) close();
    }
  };

  const err = c.fieldErrors;
  const customIcon = !isPresetIcon(draft.icon);

  return (
    <div className="admin-section">
      <div className="admin-section__head">
        <div>
          <h1>Habilidades</h1>
          <p className="admin-muted">Agrupa tus tecnologías por categoría, cada una con su logo.</p>
        </div>
        {editingId === null && (
          <button type="button" className="btn btn--primary btn--sm" onClick={() => open(null)}>
            + Nuevo grupo
          </button>
        )}
      </div>

      <NoticeBar notice={c.notice} onClose={() => c.setNotice(null)} />

      {editingId !== null && (
        <form className="card admin-form" onSubmit={onSubmit} noValidate>
          <h2>{editingId === 'new' ? 'Nuevo grupo' : 'Editar grupo'}</h2>
          <TextField
            id="s-title"
            label="Categoría"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            maxLength={60}
            error={err.title}
            required
          />

          <fieldset className="icon-picker" aria-describedby={err.icon ? 's-icon-error' : undefined}>
            <legend className="field__label">Logo</legend>
            <div className="icon-picker__grid">
              {Object.entries(skillIcons).map(([key, { label }]) => (
                <label key={key} className={`icon-picker__option${draft.icon === key ? ' is-selected' : ''}`} title={label}>
                  <input
                    type="radio"
                    name="skill-icon"
                    value={key}
                    checked={draft.icon === key}
                    onChange={() => setDraft((d) => ({ ...d, icon: key }))}
                  />
                  <SkillIcon icon={key} size={24} />
                  <span className="sr-only">{label}</span>
                </label>
              ))}
              {customIcon && (
                <label className="icon-picker__option is-selected" title="Logo propio">
                  <input type="radio" name="skill-icon" value={draft.icon} checked readOnly />
                  <SkillIcon icon={draft.icon} size={28} />
                  <span className="sr-only">Logo propio</span>
                </label>
              )}
            </div>
            <div className="admin-image__controls">
              <label className="btn btn--ghost btn--sm admin-upload">
                {uploading ? 'Subiendo…' : 'Subir logo propio'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onUpload} disabled={uploading} />
              </label>
              {customIcon && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setDraft((d) => ({ ...d, icon: 'code' }))}>
                  Usar un icono incluido
                </button>
              )}
            </div>
            <p className="field__hint">Elige un icono o sube tu logo (PNG, WebP, JPG o GIF; mejor cuadrado y con fondo transparente).</p>
            {err.icon && (
              <p id="s-icon-error" className="field__error">
                {err.icon}
              </p>
            )}
          </fieldset>

          <SkillListEditor
            client={client}
            skills={draft.skills}
            onChange={(skills) => setDraft((d) => ({ ...d, skills }))}
            error={err.skills}
            onBusyChange={setUploading}
          />
          <TextField
            id="s-order"
            label="Orden"
            type="number"
            min={0}
            max={9999}
            value={draft.sortOrder}
            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: e.target.value }))}
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
        <p className="admin-muted">Todavía no hay habilidades.</p>
      ) : (
        <ul className="admin-list">
          {c.items.map((group) => (
            <li key={group.id} className="card admin-list__item">
              <span className="skill-icon">
                <SkillIcon icon={group.icon} />
              </span>
              <div className="admin-list__body">
                <h3>{group.title}</h3>
                <ul className="chips chips--small">
                  {group.skills.map((s) => (
                    <li key={s.name} className="chip chip--logo">
                      <SkillLogo name={s.name} logo={s.logo} size={14} />
                      {s.name}
                    </li>
                  ))}
                </ul>
              </div>
              <span className="admin-list__order" title="Orden">#{group.sortOrder}</span>
              <div className="admin-list__actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => open(group)}>
                  Editar<span className="sr-only"> {group.title}</span>
                </button>
                <button type="button" className="btn btn--danger btn--sm" onClick={() => onDelete(group)}>
                  Eliminar<span className="sr-only"> {group.title}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
