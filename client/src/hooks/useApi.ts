import { useEffect, useState } from 'react';
import type { ApiResult } from '../types';

type State<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; data: T };

// Carga datos públicos una vez al montar el componente.
export function useApi<T, R>(load: () => Promise<ApiResult<R>>, pick: (result: R) => T) {
  const [state, setState] = useState<State<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    load().then((result) => {
      if (!active) return;
      setState(result.ok ? { status: 'ready', data: pick(result) } : { status: 'error', error: result.error });
    });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
