import { useCallback, useEffect, useState } from 'react';
import type { FieldErrors } from '../types';
import type { AdminClient } from './adminApi';

export type Notice = { kind: 'success' | 'error'; text: string } | null;

// Estado y operaciones CRUD de una colección del panel (proyectos, habilidades...).
export function useCollection<T extends { id: number }>(client: AdminClient, resource: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const reload = useCallback(async () => {
    setLoading(true);
    const result = await client.list<T>(resource);
    setLoading(false);
    if (result.ok) setItems(result.items);
    else setNotice({ kind: 'error', text: result.error });
  }, [client, resource]);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(
    async (id: number | null, body: unknown): Promise<boolean> => {
      setSaving(true);
      setFieldErrors({});
      const result = id === null ? await client.create<T>(resource, body) : await client.update<T>(resource, id, body);
      setSaving(false);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setNotice({ kind: 'error', text: result.error });
        return false;
      }
      setNotice({ kind: 'success', text: id === null ? 'Creado correctamente.' : 'Cambios guardados.' });
      await reload();
      return true;
    },
    [client, resource, reload],
  );

  const remove = useCallback(
    async (id: number) => {
      const result = await client.remove(resource, id);
      if (result.ok) {
        setNotice({ kind: 'success', text: 'Eliminado.' });
        await reload();
      } else {
        setNotice({ kind: 'error', text: result.error });
      }
    },
    [client, resource, reload],
  );

  return { items, loading, saving, notice, setNotice, fieldErrors, setFieldErrors, save, remove };
}
