export type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain_weight' | 'improve_fitness' | 'general_health';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type ThemePreference = 'light' | 'dark' | 'system';
export type HeightUnit = 'cm' | 'ft_in';
export type WaterUnit = 'ml' | 'oz';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  weight_unit: 'kg' | 'lbs';
  age: number | null;
  gender: Gender | null;
  height_cm: number | null;
  weight_kg: number | null;
  fitness_goal: FitnessGoal | null;
  activity_level: ActivityLevel | null;
  daily_calorie_goal: number;
  daily_protein_goal: number;
  daily_carb_goal: number;
  daily_fat_goal: number;
  daily_water_goal_ml: number;
  height_unit: HeightUnit;
  water_unit: WaterUnit;
  theme_preference: ThemePreference;
  onboarding_completed: boolean;
  wake_time: string;
  sleep_time: string;
  water_reminder_enabled: boolean;
  water_reminder_frequency_minutes: number;
  notif_water: boolean;
  notif_workout: boolean;
  notif_achievement: boolean;
  notif_nutrition: boolean;
  deletion_requested_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExerciseType = 'strength' | 'cardio' | 'mobility' | 'sport' | 'other';

export interface Exercise {
  id: string;
  user_id: string | null;
  name: string;
  muscle_group: string;
  secondary_muscle_group: string | null;
  equipment: string | null;
  exercise_type: ExerciseType;
  description: string | null;
  personal_notes: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
}

export type WorkoutType = 'gym' | 'running' | 'walking' | 'cycling' | 'swimming' | 'sports' | 'home_workout' | 'other';

export interface WorkoutSession {
  id: string;
  user_id: string;
  workout_date: string;
  workout_type: WorkoutType;
  name: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  template_id: string | null;
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
  rest_seconds: number | null;
  notes: string | null;
  is_warmup: boolean;
  completed: boolean;
  created_at: string;
}

export interface WorkoutSessionWithDetails extends WorkoutSession {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: WorkoutSet[];
  })[];
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  workout_type: WorkoutType;
  notes: string | null;
  created_at: string;
  exercises?: (WorkoutTemplateExercise & { exercise: Exercise })[];
}

export interface WorkoutTemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number | null;
  target_reps: number | null;
  notes: string | null;
}

export interface PersonalRecord {
  exercise_id: string;
  exercise_name: string;
  max_weight: number;
  reps_at_max: number;
  estimated_1rm: number;
  max_volume_session: number;
  best_reps_at_weight: { weight: number; reps: number };
  achieved_at: string;
}

export interface StrengthDataPoint {
  date: string;
  max_weight: number;
  total_volume: number;
  estimated_1rm: number;
  reps_at_max: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Food {
  id: string;
  user_id: string | null;
  name: string;
  serving_size: string | null;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  is_favorite: boolean;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  food_id: string | null;
  name: string;
  meal_type: MealType;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  notes: string | null;
  entry_date: string;
  logged_at: string;
  created_at: string;
}

export interface WaterEntry {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measured_date: string;
  weight_kg: number | null;
  body_fat_pct: number | null;
  waist_cm: number | null;
  chest_cm: number | null;
  arms_cm: number | null;
  thighs_cm: number | null;
  custom: Record<string, number> | null;
  notes: string | null;
  created_at: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_path: string;
  taken_date: string;
  notes: string | null;
  created_at: string;
  url?: string;
}

export type GoalType = 'weight' | 'lift' | 'distance' | 'workout_count' | 'water' | 'protein' | 'custom';
export type GoalStatus = 'active' | 'completed' | 'abandoned';

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType;
  title: string;
  target_value: number;
  current_value: number;
  unit: string;
  exercise_id: string | null;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
  completed_at: string | null;
}

export interface DailyNutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WorkoutStats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
  totalSessions: number;
  totalDurationMinutes: number;
  totalSets: number;
}
