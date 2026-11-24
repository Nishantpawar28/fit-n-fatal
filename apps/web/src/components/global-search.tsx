'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getFoods, getTemplates, searchWorkoutsByName } from '@fit-n-fatal/db';
import { filterExercises } from '@fit-n-fatal/utils';
import { useDebouncedValue, useExerciseLibrary } from '@/lib/hooks';
import { useCurrentUserId } from '@/lib/use-current-user';

export function GlobalSearch() {
  const router = useRouter();
  const { userId } = useCurrentUserId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Wait until typing pauses before searching (was: 4 requests per keystroke).
  const q = useDebouncedValue(query.trim(), 300);
  const active = q.length > 1;

  const { data: library } = useExerciseLibrary();
  const exercises = useMemo(() => (active ? filterExercises(library ?? [], q).slice(0, 5) : []), [library, q, active]);

  const { data: foods } = useQuery({
    queryKey: ['search-foods', userId, q],
    queryFn: () => getFoods(userId!, q),
    enabled: active && !!userId,
  });

  const { data: templates } = useQuery({
    queryKey: ['templates', userId],
    queryFn: () => getTemplates(userId!),
    enabled: active && !!userId,
  });

  // Name search runs in the database and returns at most 5 rows.
  const { data: workouts } = useQuery({
    queryKey: ['search-workouts', userId, q],
    queryFn: () => searchWorkoutsByName(userId!, q, 5),
    enabled: active && !!userId,
  });

  const matchedTemplates = (templates ?? []).filter((t) => t.name.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
  const matchedWorkouts = workouts ?? [];

  const goTo = (path: string) => {
    router.push(path);
    setOpen(false);
    setQuery('');
  };

  const hasResults =
    active && ((exercises?.length ?? 0) > 0 || (foods?.length ?? 0) > 0 || matchedTemplates.length > 0 || matchedWorkouts.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fnf-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search exercises, foods, workouts…"
          className="w-full bg-fnf-bg/60 border border-purple-500/15 rounded-lg pl-9 pr-8 py-2 text-fnf-text text-sm placeholder:text-fnf-muted focus:outline-none focus:border-fnf-violet/50"
        />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fnf-muted hover:text-fnf-text">
            <X size={14} />
          </button>
        )}
      </div>

      {open && query.trim().length > 1 && (
        <div className="fnf-animate-in absolute mt-2 w-full max-h-96 overflow-y-auto bg-fnf-surface border border-purple-500/15 rounded-xl shadow-xl z-50 p-2">
          {!hasResults && <p className="text-fnf-muted text-xs p-3">{q !== query.trim() ? 'Searching…' : <>No matches for &ldquo;{query}&rdquo;</>}</p>}

          {(exercises?.length ?? 0) > 0 && (
            <div className="mb-2">
              <p className="text-fnf-muted text-[10px] uppercase tracking-wider px-2 mb-1">Exercises</p>
              {exercises!.slice(0, 5).map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => goTo(`/dashboard/exercises?q=${encodeURIComponent(ex.name)}`)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary"
                >
                  {ex.name} <span className="text-fnf-muted text-xs">· {ex.muscle_group}</span>
                </button>
              ))}
            </div>
          )}

          {(foods?.length ?? 0) > 0 && (
            <div className="mb-2">
              <p className="text-fnf-muted text-[10px] uppercase tracking-wider px-2 mb-1">Foods</p>
              {foods!.slice(0, 5).map((f) => (
                <button
                  key={f.id}
                  onClick={() => goTo(`/dashboard/nutrition?q=${encodeURIComponent(f.name)}`)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary"
                >
                  {f.name} <span className="text-fnf-muted text-xs">· {f.calories} kcal</span>
                </button>
              ))}
            </div>
          )}

          {matchedTemplates.length > 0 && (
            <div className="mb-2">
              <p className="text-fnf-muted text-[10px] uppercase tracking-wider px-2 mb-1">Templates</p>
              {matchedTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => goTo(`/dashboard/templates`)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}

          {matchedWorkouts.length > 0 && (
            <div>
              <p className="text-fnf-muted text-[10px] uppercase tracking-wider px-2 mb-1">Workouts</p>
              {matchedWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => goTo(`/dashboard/history?q=${encodeURIComponent(w.name ?? '')}`)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-purple-500/10 text-sm text-fnf-secondary"
                >
                  {w.name || 'Workout'} <span className="text-fnf-muted text-xs">· {w.workout_date}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
