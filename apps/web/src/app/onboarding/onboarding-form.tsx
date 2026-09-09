'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile, uploadAvatar } from '@fit-n-fatal/db';
import type { ActivityLevel, FitnessGoal, Gender } from '@fit-n-fatal/db';
import { calculateSuggestedTargets, ACTIVITY_LEVEL_LABELS, FITNESS_GOAL_LABELS, GENDER_LABELS } from '@fit-n-fatal/utils';
import { Button, Card, Input, Select } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

const GOAL_ICONS: Record<FitnessGoal, string> = {
  lose_weight: '⚖️',
  build_muscle: '💪',
  maintain_weight: '🎯',
  improve_fitness: '⚡',
  general_health: '❤️',
};

export function OnboardingForm({ userId, defaultName }: { userId: string; defaultName: string }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [heightCm, setHeightCm] = useState('175');
  const [weightKg, setWeightKg] = useState('75');
  const [goal, setGoal] = useState<FitnessGoal>('build_muscle');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [calories, setCalories] = useState('2400');
  const [protein, setProtein] = useState('150');
  const [water, setWater] = useState('3000');
  const [autofilled, setAutofilled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const applySuggested = () => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    const a = parseInt(age, 10);
    if (!h || !w || !a) return;
    const targets = calculateSuggestedTargets({ weightKg: w, heightCm: h, age: a, gender, activityLevel: activity, fitnessGoal: goal });
    setCalories(String(targets.calories));
    setProtein(String(targets.protein));
    setWater(String(targets.water_ml));
    setAutofilled(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      createClient();
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await uploadAvatar(userId, avatarFile);
      }
      await updateProfile(userId, {
        display_name: name || null,
        avatar_url: avatarUrl,
        age: age ? parseInt(age, 10) : null,
        gender,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        fitness_goal: goal,
        activity_level: activity,
        daily_calorie_goal: parseInt(calories, 10) || 2200,
        daily_protein_goal: parseInt(protein, 10) || 150,
        daily_water_goal_ml: parseInt(water, 10) || 3000,
        onboarding_completed: true,
      } as any);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-fnf-text mb-1">
          Welcome to Fit N <span className="text-fnf-violet">Fatal</span>
        </h1>
        <p className="text-fnf-muted text-sm mb-6">Set up your fitness profile — this powers your dashboard, goals, and daily targets.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <p className="font-medium text-fnf-text mb-3">Basic Info</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-fnf-secondary text-xs mb-1.5 block">Name</label>
                <Input value={name} onChange={setName} placeholder="Your name" />
              </div>
              <div className="col-span-2">
                <label className="text-fnf-secondary text-xs mb-1.5 block">Profile photo (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="text-fnf-secondary text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-500/20 file:text-fnf-violet"
                />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Age</label>
                <Input value={age} onChange={setAge} type="number" placeholder="28" />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Gender</label>
                <Select value={gender} onChange={(v) => setGender(v as Gender)} options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))} />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Height (cm)</label>
                <Input value={heightCm} onChange={setHeightCm} type="number" placeholder="175" />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Weight (kg)</label>
                <Input value={weightKg} onChange={setWeightKg} type="number" placeholder="75" />
              </div>
            </div>
          </Card>

          <Card>
            <p className="font-medium text-fnf-text mb-3">Fitness Goal</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {(Object.keys(FITNESS_GOAL_LABELS) as FitnessGoal[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGoal(g)}
                  className={`rounded-xl p-3 text-left border transition-colors ${
                    goal === g ? 'border-fnf-violet bg-purple-500/15' : 'border-purple-500/10 hover:bg-white/5'
                  }`}
                >
                  <div className="text-lg">{GOAL_ICONS[g]}</div>
                  <div className="text-fnf-text text-xs font-medium mt-1">{FITNESS_GOAL_LABELS[g]}</div>
                </button>
              ))}
            </div>
            <label className="text-fnf-secondary text-xs mb-1.5 block">Activity Level</label>
            <Select value={activity} onChange={(v) => setActivity(v as ActivityLevel)} options={Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => ({ value, label }))} />
          </Card>

          <Card>
            <div className="flex justify-between items-center mb-3">
              <p className="font-medium text-fnf-text">Daily Targets</p>
              <button type="button" onClick={applySuggested} className="text-fnf-violet text-xs hover:underline">
                Suggest for me
              </button>
            </div>
            {autofilled && <p className="text-fnf-green text-xs mb-3">Suggested targets applied — adjust anytime in Settings.</p>}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Calories</label>
                <Input value={calories} onChange={setCalories} type="number" />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Protein (g)</label>
                <Input value={protein} onChange={setProtein} type="number" />
              </div>
              <div>
                <label className="text-fnf-secondary text-xs mb-1.5 block">Water (ml)</label>
                <Input value={water} onChange={setWater} type="number" />
              </div>
            </div>
          </Card>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Start Training'}
          </Button>
        </form>
      </div>
    </div>
  );
}
