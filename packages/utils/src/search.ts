export interface SearchableExercise {
  name: string;
  muscle_group: string;
  secondary_muscle_group?: string | null;
  equipment?: string | null;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * Local exercise search. Every word you type must appear somewhere in the
 * name / muscle / equipment ("pull wide" finds "Wide-Grip Pull-Up").
 * Name-prefix matches rank first, then name matches, then the rest.
 */
export function filterExercises<T extends SearchableExercise>(list: T[], query: string, muscleGroup?: string): T[] {
  const pool = muscleGroup ? list.filter((e) => e.muscle_group === muscleGroup) : list;
  const q = normalize(query ?? '');
  if (!q) return pool;
  const words = q.split(' ');

  const scored: { item: T; score: number }[] = [];
  for (const item of pool) {
    const name = normalize(item.name);
    const hay = `${name} ${normalize(item.muscle_group)} ${normalize(item.secondary_muscle_group ?? '')} ${normalize(item.equipment ?? '')}`;
    if (!words.every((w) => hay.includes(w))) continue;
    const score = name.startsWith(q) ? 0 : words.every((w) => name.includes(w)) ? 1 : 2;
    scored.push({ item, score });
  }
  // Array.prototype.sort is stable, so the incoming (alphabetical) order is kept within a score.
  return scored.sort((a, b) => a.score - b.score).map((s) => s.item);
}
