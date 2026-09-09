type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type FitnessGoal = 'lose_weight' | 'build_muscle' | 'maintain_weight' | 'improve_fitness' | 'general_health';
type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_CALORIE_ADJUSTMENT: Record<FitnessGoal, number> = {
  lose_weight: -500,
  build_muscle: 300,
  maintain_weight: 0,
  improve_fitness: 0,
  general_health: 0,
};

const GOAL_PROTEIN_PER_KG: Record<FitnessGoal, number> = {
  lose_weight: 2.0,
  build_muscle: 2.0,
  maintain_weight: 1.6,
  improve_fitness: 1.8,
  general_health: 1.4,
};

export interface SuggestedTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  water_ml: number;
}

export function calculateSuggestedTargets(input: {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender | null;
  activityLevel: ActivityLevel;
  fitnessGoal: FitnessGoal;
}): SuggestedTargets {
  const { weightKg, heightCm, age, gender, activityLevel, fitnessGoal } = input;

  // Mifflin-St Jeor BMR
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = gender === 'female' ? base - 161 : base + 5;
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const calories = Math.round((tdee + GOAL_CALORIE_ADJUSTMENT[fitnessGoal]) / 10) * 10;

  const protein = Math.round(weightKg * GOAL_PROTEIN_PER_KG[fitnessGoal]);
  const fat = Math.round((calories * 0.27) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const water_ml = Math.round((weightKg * 35) / 50) * 50;

  return { calories: Math.max(1200, calories), protein, carbs, fat, water_ml };
}
