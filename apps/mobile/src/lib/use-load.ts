import { useCallback, useEffect, useState } from 'react';

interface LoadState<T> {
  load: (() => Promise<T>) | null;
  attempt: number;
  data: T | undefined;
  error: unknown;
}

// Pass a memoized load function. Results from an earlier load are ignored, and
// previous data stays available while the next load runs.
export function useLoad<T>(load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState<T>>({
    load: null,
    attempt: 0,
    data: undefined,
    error: undefined,
  });

  useEffect(() => {
    let active = true;
    load().then(
      (data) => {
        if (active) {
          setState({ load, attempt, data, error: undefined });
        }
      },
      (error: unknown) => {
        if (active) {
          setState({ load, attempt, data: undefined, error });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [load, attempt]);

  const settled = state.load === load && state.attempt === attempt;

  return {
    data: state.data,
    error: settled ? state.error : undefined,
    loading: !settled,
    retry: useCallback(() => setAttempt((current) => current + 1), []),
    setData: useCallback((data: T) => setState((current) => ({ ...current, data })), []),
  };
}
