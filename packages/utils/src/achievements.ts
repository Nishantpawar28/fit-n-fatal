export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementStats {
  totalWorkouts: number;
  workoutStreak: number;
  hydrationStreak: number;
  totalPRs: number;
  goalsCompleted: number;
}

export const ACHIEVEMENT_DEFS: (AchievementDef & { threshold: (s: AchievementStats) => boolean })[] = [
  { key: 'first_workout', title: 'First Workout', description: 'Completed your first workout', icon: '🏆', threshold: (s) => s.totalWorkouts >= 1 },
  { key: 'streak_7', title: '7-Day Workout Streak', description: 'Trained 7 days in a row', icon: '🔥', threshold: (s) => s.workoutStreak >= 7 },
  { key: 'streak_30', title: '30-Day Workout Streak', description: 'Trained 30 days in a row', icon: '🔥', threshold: (s) => s.workoutStreak >= 30 },
  { key: 'pr_10', title: '10 PRs', description: 'Hit 10 personal records', icon: '💪', threshold: (s) => s.totalPRs >= 10 },
  { key: 'hydration_7', title: '7-Day Hydration Streak', description: 'Hit your water goal 7 days straight', icon: '💧', threshold: (s) => s.hydrationStreak >= 7 },
  { key: 'workouts_10', title: '10 Workouts Completed', description: 'Completed 10 workout sessions', icon: '🏋️', threshold: (s) => s.totalWorkouts >= 10 },
  { key: 'workouts_50', title: '50 Workouts Completed', description: 'Completed 50 workout sessions', icon: '🏋️', threshold: (s) => s.totalWorkouts >= 50 },
  { key: 'workouts_100', title: '100 Workouts Completed', description: 'Completed 100 workout sessions', icon: '🏋️', threshold: (s) => s.totalWorkouts >= 100 },
  { key: 'goals_1', title: 'Goal Crusher', description: 'Completed your first goal', icon: '🎯', threshold: (s) => s.goalsCompleted >= 1 },
  { key: 'goals_5', title: '5 Goals Completed', description: 'Completed 5 goals', icon: '🎯', threshold: (s) => s.goalsCompleted >= 5 },
];

export function computeAchievements(stats: AchievementStats): (AchievementDef & { unlocked: boolean })[] {
  return ACHIEVEMENT_DEFS.map(({ threshold, ...def }) => ({ ...def, unlocked: threshold(stats) }));
}
