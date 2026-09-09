export const MUSCLE_GROUPS = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Full Body', 'Cardio', 'Other'] as const;

export const EQUIPMENT_OPTIONS = [
  'Barbell',
  'Dumbbell',
  'Machine',
  'Cable',
  'Kettlebell',
  'Bodyweight',
  'Bands',
  'Other',
] as const;

export const EXERCISE_TYPE_LABELS: Record<string, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
  sport: 'Sport',
  other: 'Other',
};

export const WORKOUT_TYPE_LABELS: Record<string, string> = {
  gym: 'Gym',
  running: 'Running',
  walking: 'Walking',
  cycling: 'Cycling',
  swimming: 'Swimming',
  sports: 'Sports',
  home_workout: 'Home Workout',
  other: 'Other',
};

export const WORKOUT_TYPES = Object.keys(WORKOUT_TYPE_LABELS);

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_TYPES = Object.keys(MEAL_TYPE_LABELS);

export const FITNESS_GOAL_LABELS: Record<string, string> = {
  lose_weight: 'Lose Weight',
  build_muscle: 'Build Muscle',
  maintain_weight: 'Maintain Weight',
  improve_fitness: 'Improve Fitness',
  general_health: 'General Health',
};

export const ACTIVITY_LEVEL_LABELS: Record<string, string> = {
  sedentary: 'Sedentary (little to no exercise)',
  light: 'Light (1-3 days/week)',
  moderate: 'Moderate (3-5 days/week)',
  active: 'Active (6-7 days/week)',
  very_active: 'Very Active (athlete / physical job)',
};

export const GOAL_TYPE_LABELS: Record<string, string> = {
  weight: 'Body Weight',
  lift: 'Lift a Weight',
  distance: 'Distance',
  workout_count: 'Workout Count',
  water: 'Daily Water',
  protein: 'Daily Protein',
  custom: 'Custom',
};

export const GENDER_LABELS: Record<string, string> = {
  male: 'Male',
  female: 'Female',
  other: 'Other',
  prefer_not_to_say: 'Prefer not to say',
};
