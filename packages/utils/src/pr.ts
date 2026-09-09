import { calculateOneRepMax } from './weight';

export interface PRCheckResult {
  isPR: boolean;
  kind?: 'weight' | '1rm' | 'reps';
  message?: string;
}

export function detectNewPR(
  exerciseName: string,
  previous: { max_weight: number; estimated_1rm: number; best_reps_at_weight: { weight: number; reps: number } } | undefined,
  weight: number,
  reps: number
): PRCheckResult {
  const oneRm = calculateOneRepMax(weight, reps);

  if (!previous) {
    return { isPR: true, kind: 'weight', message: `You just hit ${weight} kg × ${reps} on ${exerciseName}.` };
  }

  if (weight > previous.max_weight) {
    return { isPR: true, kind: 'weight', message: `You just hit ${weight} kg × ${reps} on ${exerciseName}.` };
  }

  if (oneRm > previous.estimated_1rm) {
    return { isPR: true, kind: '1rm', message: `New estimated 1RM of ${oneRm} kg on ${exerciseName}.` };
  }

  if (weight === previous.best_reps_at_weight.weight && reps > previous.best_reps_at_weight.reps) {
    return { isPR: true, kind: 'reps', message: `New rep record: ${weight} kg × ${reps} on ${exerciseName}.` };
  }

  return { isPR: false };
}
