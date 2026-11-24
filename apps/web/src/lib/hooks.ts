'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExerciseLibrary } from '@fit-n-fatal/db';
import { filterExercises } from '@fit-n-fatal/utils';

/** Returns `value` only after it has stopped changing for `delayMs`. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Calls `onVisible` when the returned ref's element scrolls into view.
 * Used for infinite scroll and for rendering long lists in chunks.
 */
export function useOnVisible<T extends Element>(onVisible: () => void, enabled = true) {
  const ref = useRef<T | null>(null);
  const cb = useRef(onVisible);
  cb.current = onVisible;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) cb.current();
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [enabled]);

  return ref;
}

/** Render a long list `step` items at a time, adding more as you scroll. */
export function useIncrementalList<T>(items: T[], step = 40) {
  const [count, setCount] = useState(step);
  // Start over when the list itself changes (new search / filter).
  useEffect(() => setCount(step), [items, step]);
  const visible = items.slice(0, count);
  const hasMore = count < items.length;
  const sentinelRef = useOnVisible<HTMLDivElement>(() => setCount((c) => c + step), hasMore);
  return { visible, hasMore, sentinelRef };
}

/** Rows the screen shows before the server has confirmed them. */
export const isTempId = (id: string) => id.startsWith('temp-');

export const EXERCISE_LIBRARY_KEY = ['exercises', 'library'] as const;

/**
 * The whole exercise library, cached for an hour. Its key starts with
 * 'exercises', so existing invalidateQueries({ queryKey: ['exercises'] })
 * calls after creating/editing an exercise still refresh it.
 */
export function useExerciseLibrary() {
  return useQuery({
    queryKey: EXERCISE_LIBRARY_KEY,
    queryFn: getExerciseLibrary,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
  });
}

/** Local, debounced search over the cached library. */
export function useExerciseSearch(search: string, muscleGroup?: string) {
  const { data: library, isLoading } = useExerciseLibrary();
  const q = useDebouncedValue(search, 200);
  const results = useMemo(() => filterExercises(library ?? [], q, muscleGroup), [library, q, muscleGroup]);
  return { results, isLoading, library };
}
