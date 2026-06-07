export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  weight_unit: 'kg' | 'lbs';
  created_at: string;
  updated_at: string;
}

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  equipment: string | null;
  is_custom: boolean;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface WorkoutExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  order_index: number;
  created_at: string;
  exercise?: Exercise;
  sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  workout_exercise_id: string;
  set_number: number;
  reps: number;
  weight: number;
  rpe: number | null;
  is_warmup: boolean;
  created_at: string;
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: WorkoutSet[];
  })[];
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  reps_at_max: number;
  estimated_1rm: number;
  achieved_at: string;
}

export interface StrengthDataPoint {
  date: string;
  max_weight: number;
  total_volume: number;
  estimated_1rm: number;
}
