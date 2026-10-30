import { type ChangeEvent, type KeyboardEvent, useState } from 'react';
import { SkillLogo } from '../components/SkillLogo';
import type { SkillLogoData } from '../types';
import type { AdminClient } from './adminApi';

export interface DraftSkill {
  name: string;
  // Logo propio subido o enlazado; null = logo automático (o inicial si no hay).
  imageUrl: string | null;
  // Logo automático para la vista previa (lo calcula el servidor).
  brand: SkillLogoData | null;
}

interface Props {
  client: AdminClient;
  skills: DraftSkill[];
  onChange: (skills: DraftSkill[]) => void;
  error?: string;
  onBusyChange: (busy: boolean) => void;
}

const MAX_SKILLS = 30;

export function SkillListEditor({ client, skills, onChange, error, onBusyChange }: Props) {
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const add = async () => {
    const value = name.trim();
    if (!value) return;
    if (value.length > 30) return setLocalError('Cada habilidad puede tener como mucho 30 caracteres.');
    if (skills.some((s) => s.name.toLowerCase() === value.toLowerCase())) return setLocalError('Esa habilidad ya está.');
    if (skills.length >= MAX_SKILLS) return setLocalError(`Como máximo ${MAX_SKILLS} habilidades por grupo.`);
    setLocalError('');
    setName('');
    const result = await client.brandLogo(value);
    onChange([...skills, { name: value, imageUrl: null, brand: result.ok ? result.logo : null }]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  };

  const update = (index: number, patch: Partial<DraftSkill>) =>
    onChange(skills.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= skills.length) return;
    const next = [...skills];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const upload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) return setLocalError('El logo no puede pasar de 3 MB.');
    setUploadingIndex(index);
    onBusyChange(true);
    const result = await client.upload(file);
    setUploadingIndex(null);
    onBusyChange(false);
    if (result.ok) {
      setLocalError('');
      update(index, { imageUrl: result.url });
    } else {
      setLocalError(result.error);
    }
  };

  const shownError = localError || error;

  return (
    <div className="field">
      <label htmlFor="s-skill-new">Habilidades</label>
      <div className="skill-editor__add">
        <input
          id="s-skill-new"
          value={name}
          maxLength={30}
          placeholder="Ej. Node.js"
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          aria-describedby="s-skill-hint"
          aria-invalid={Boolean(shownError) || undefined}
        />
        <button type="button" className="btn btn--ghost btn--sm" onClick={add}>
          Añadir
        </button>
      </div>
      <p id="s-skill-hint" className="field__hint">
        Escribe el nombre y pulsa Enter. El logo oficial aparece solo; si no existe, puedes subir el tuyo.
      </p>
      {shownError && <p className="field__error">{shownError}</p>}

      {skills.length > 0 && (
        <ul className="skill-editor__list">
          {skills.map((skill, index) => {
            const logo: SkillLogoData | null = skill.imageUrl ? { type: 'image', url: skill.imageUrl } : skill.brand;
            return (
              <li key={skill.name} className="skill-editor__row">
                <SkillLogo name={skill.name} logo={logo} size={22} />
                <span className="skill-editor__name">{skill.name}</span>
                <span className="skill-editor__source">
                  {skill.imageUrl ? 'Logo propio' : skill.brand ? 'Logo oficial' : 'Sin logo'}
                </span>
                <div className="skill-editor__actions">
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label={`Subir ${skill.name}`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm"
                    onClick={() => move(index, 1)}
                    disabled={index === skills.length - 1}
                    aria-label={`Bajar ${skill.name}`}
                  >
                    ↓
                  </button>
                  {skill.imageUrl ? (
                    <button type="button" className="btn btn--ghost btn--xs" onClick={() => update(index, { imageUrl: null })}>
                      Quitar logo
                    </button>
                  ) : (
                    <label className="btn btn--ghost btn--xs admin-upload">
                      {uploadingIndex === index ? 'Subiendo…' : 'Subir logo'}
                      <span className="sr-only"> para {skill.name}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => upload(index, e)}
                        disabled={uploadingIndex !== null}
                      />
                    </label>
                  )}
                  <button
                    type="button"
                    className="icon-btn icon-btn--sm icon-btn--danger"
                    onClick={() => onChange(skills.filter((_, i) => i !== index))}
                    aria-label={`Quitar ${skill.name}`}
                  >
                    ×
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
