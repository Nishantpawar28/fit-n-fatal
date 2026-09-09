'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateProfile, uploadAvatar, exportUserData } from '@fit-n-fatal/db';
import type { ActivityLevel, FitnessGoal, Gender, ThemePreference as DbThemePreference } from '@fit-n-fatal/db';
import { Card, Button, Input, Select, Toggle, ConfirmDialog } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { ACTIVITY_LEVEL_LABELS, FITNESS_GOAL_LABELS, GENDER_LABELS, toLocalDateStr } from '@fit-n-fatal/utils';
import { applyTheme, type ThemePreference } from '@/lib/theme';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/toast-provider';

export default function SettingsPage() {
  const { userId, profile, invalidate } = useProfile();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<Gender>('prefer_not_to_say');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [goal, setGoal] = useState<FitnessGoal>('general_health');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [water, setWater] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft_in'>('cm');
  const [waterUnit, setWaterUnit] = useState<'ml' | 'oz'>('ml');
  const [theme, setTheme] = useState<ThemePreference>('dark');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepTime, setSleepTime] = useState('23:00');
  const [reminderFreq, setReminderFreq] = useState('60');
  const [notifWater, setNotifWater] = useState(true);
  const [notifWorkout, setNotifWorkout] = useState(true);
  const [notifAchievement, setNotifAchievement] = useState(true);
  const [notifNutrition, setNotifNutrition] = useState(true);
  const [waterReminderEnabled, setWaterReminderEnabled] = useState(true);

  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setName(profile.display_name ?? '');
    setAge(profile.age?.toString() ?? '');
    setGender(profile.gender ?? 'prefer_not_to_say');
    setHeightCm(profile.height_cm?.toString() ?? '');
    setWeightKg(profile.weight_kg?.toString() ?? '');
    setGoal(profile.fitness_goal ?? 'general_health');
    setActivity(profile.activity_level ?? 'moderate');
    setCalories(profile.daily_calorie_goal?.toString() ?? '2200');
    setProtein(profile.daily_protein_goal?.toString() ?? '150');
    setCarbs(profile.daily_carb_goal?.toString() ?? '220');
    setFat(profile.daily_fat_goal?.toString() ?? '70');
    setWater(profile.daily_water_goal_ml?.toString() ?? '3000');
    setWeightUnit(profile.weight_unit ?? 'kg');
    setHeightUnit(profile.height_unit ?? 'cm');
    setWaterUnit(profile.water_unit ?? 'ml');
    setTheme(profile.theme_preference ?? 'dark');
    setWakeTime(profile.wake_time?.slice(0, 5) ?? '07:00');
    setSleepTime(profile.sleep_time?.slice(0, 5) ?? '23:00');
    setReminderFreq(profile.water_reminder_frequency_minutes?.toString() ?? '60');
    setNotifWater(profile.notif_water ?? true);
    setNotifWorkout(profile.notif_workout ?? true);
    setNotifAchievement(profile.notif_achievement ?? true);
    setNotifNutrition(profile.notif_nutrition ?? true);
    setWaterReminderEnabled(profile.water_reminder_enabled ?? true);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateProfile(userId!, patch as any),
    onSuccess: () => {
      invalidate();
      showToast({ icon: '✅', title: 'Saved', variant: 'info' });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const url = await uploadAvatar(userId!, file);
      return updateProfile(userId!, { avatar_url: url } as any);
    },
    onSuccess: invalidate,
  });

  const handleThemeChange = (t: ThemePreference) => {
    setTheme(t);
    applyTheme(t);
    saveMutation.mutate({ theme_preference: t as DbThemePreference });
  };

  const handlePasswordChange = async () => {
    setPasswordMsg('');
    if (newPassword.length < 6) {
      setPasswordMsg('Password must be at least 6 characters.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMsg(error ? error.message : 'Password updated.');
    if (!error) setNewPassword('');
  };

  const handleExport = async () => {
    if (!userId) return;
    const data = await exportUserData(userId);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitnfatal-export-${toLocalDateStr()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    if (!userId) return;
    await updateProfile(userId, { deletion_requested_at: new Date().toISOString() } as any);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="max-w-2xl">
      <h2 className="font-heading text-2xl font-bold text-fnf-text mb-6">Settings</h2>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Profile</p>
        <div className="flex items-center gap-3 mb-4">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="h-14 w-14 rounded-full bg-purple-500/20 flex items-center justify-center text-fnf-violet font-heading font-bold text-lg">
              {(profile?.display_name || 'U')[0].toUpperCase()}
            </div>
          )}
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])} className="text-fnf-secondary text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-500/20 file:text-fnf-violet" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="text-fnf-secondary text-xs mb-1.5 block">Name</label><Input value={name} onChange={setName} /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Age</label><Input value={age} onChange={setAge} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Gender</label><Select value={gender} onChange={(v) => setGender(v as Gender)} options={Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label }))} /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Height (cm)</label><Input value={heightCm} onChange={setHeightCm} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Weight (kg)</label><Input value={weightKg} onChange={setWeightKg} type="number" /></div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveMutation.mutate({ display_name: name, age: age ? parseInt(age, 10) : null, gender, height_cm: heightCm ? parseFloat(heightCm) : null, weight_kg: weightKg ? parseFloat(weightKg) : null })}
        >
          Save Profile
        </Button>
      </Card>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Goals & Daily Targets</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Select value={goal} onChange={(v) => setGoal(v as FitnessGoal)} options={Object.entries(FITNESS_GOAL_LABELS).map(([value, label]) => ({ value, label }))} />
          <Select value={activity} onChange={(v) => setActivity(v as ActivityLevel)} options={Object.entries(ACTIVITY_LEVEL_LABELS).map(([value, label]) => ({ value, label }))} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Calories</label><Input value={calories} onChange={setCalories} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Protein (g)</label><Input value={protein} onChange={setProtein} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Carbs (g)</label><Input value={carbs} onChange={setCarbs} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Fat (g)</label><Input value={fat} onChange={setFat} type="number" /></div>
          <div><label className="text-fnf-secondary text-xs mb-1.5 block">Water (ml)</label><Input value={water} onChange={setWater} type="number" /></div>
        </div>
        <Button
          className="mt-4"
          onClick={() => saveMutation.mutate({
            fitness_goal: goal, activity_level: activity,
            daily_calorie_goal: parseInt(calories, 10) || 2200,
            daily_protein_goal: parseInt(protein, 10) || 150,
            daily_carb_goal: parseInt(carbs, 10) || 220,
            daily_fat_goal: parseInt(fat, 10) || 70,
            daily_water_goal_ml: parseInt(water, 10) || 3000,
          })}
        >
          Save Targets
        </Button>
      </Card>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Units</p>
        <div className="grid grid-cols-3 gap-3">
          <Select value={weightUnit} onChange={(v) => setWeightUnit(v as 'kg' | 'lbs')} options={[{ value: 'kg', label: 'kg' }, { value: 'lbs', label: 'lbs' }]} />
          <Select value={heightUnit} onChange={(v) => setHeightUnit(v as 'cm' | 'ft_in')} options={[{ value: 'cm', label: 'cm' }, { value: 'ft_in', label: 'ft / in' }]} />
          <Select value={waterUnit} onChange={(v) => setWaterUnit(v as 'ml' | 'oz')} options={[{ value: 'ml', label: 'ml / L' }, { value: 'oz', label: 'oz' }]} />
        </div>
        <Button className="mt-4" onClick={() => saveMutation.mutate({ weight_unit: weightUnit, height_unit: heightUnit, water_unit: waterUnit })}>Save Units</Button>
      </Card>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Notifications</p>
        <div className="space-y-3 mb-4">
          <Toggle checked={waterReminderEnabled} onChange={setWaterReminderEnabled} label="Water reminders" />
          <Toggle checked={notifWorkout} onChange={setNotifWorkout} label="Workout reminders" />
          <Toggle checked={notifAchievement} onChange={setNotifAchievement} label="Achievement notifications" />
          <Toggle checked={notifNutrition} onChange={setNotifNutrition} label="Nutrition reminders" />
        </div>
        {waterReminderEnabled && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div><label className="text-fnf-secondary text-xs mb-1.5 block">Wake time</label><input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-3 py-2.5 text-sm text-fnf-text" /></div>
            <div><label className="text-fnf-secondary text-xs mb-1.5 block">Sleep time</label><input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="w-full bg-fnf-surface border border-purple-500/15 rounded-lg px-3 py-2.5 text-sm text-fnf-text" /></div>
            <div><label className="text-fnf-secondary text-xs mb-1.5 block">Every (min)</label><Input value={reminderFreq} onChange={setReminderFreq} type="number" /></div>
          </div>
        )}
        <p className="text-fnf-muted text-xs mb-3">Browser notifications require permission and only fire while FitNFatal is open in a tab.</p>
        <Button
          onClick={() => saveMutation.mutate({
            water_reminder_enabled: waterReminderEnabled,
            notif_water: notifWater, notif_workout: notifWorkout, notif_achievement: notifAchievement, notif_nutrition: notifNutrition,
            wake_time: wakeTime, sleep_time: sleepTime, water_reminder_frequency_minutes: parseInt(reminderFreq, 10) || 60,
          })}
        >
          Save Notification Settings
        </Button>
      </Card>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Appearance</p>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as ThemePreference[]).map((t) => (
            <button key={t} onClick={() => handleThemeChange(t)} className={`px-4 py-2 rounded-lg text-sm capitalize border ${theme === t ? 'border-fnf-violet text-fnf-violet bg-purple-500/10' : 'border-purple-500/15 text-fnf-muted'}`}>
              {t}
            </button>
          ))}
        </div>
      </Card>

      <Card className="mb-4">
        <p className="font-medium text-fnf-text mb-3">Account</p>
        <div className="mb-4">
          <label className="text-fnf-secondary text-xs mb-1.5 block">Change password</label>
          <div className="flex gap-2">
            <Input value={newPassword} onChange={setNewPassword} type="password" placeholder="New password" />
            <Button variant="secondary" onClick={handlePasswordChange}>Update</Button>
          </div>
          {passwordMsg && <p className="text-fnf-muted text-xs mt-1.5">{passwordMsg}</p>}
        </div>
        <div className="flex gap-3 flex-wrap">
          <Button variant="secondary" onClick={handleExport}>Export My Data</Button>
          <Button variant="secondary" className="!text-red-400 !border-red-500/30" onClick={() => setConfirmDelete(true)}>Delete Account</Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        message="This flags your account for deletion and signs you out immediately. Contact support if you change your mind before it's processed."
        confirmLabel="Delete Account"
      />
    </div>
  );
}
