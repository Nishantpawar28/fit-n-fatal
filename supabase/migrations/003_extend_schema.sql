-- Fit N Fatal — Full feature schema extension
-- Adds: extended profiles, exercise metadata + favorites, workout typing/templates,
-- nutrition (foods/food_entries), hydration (water_entries), body measurements,
-- progress photos, goals. All new tables are RLS-protected (owner-only).

-- =========================================================================
-- PROFILES — fitness profile, goals, preferences
-- =========================================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS age INTEGER CHECK (age IS NULL OR (age > 0 AND age < 120)),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  ADD COLUMN IF NOT EXISTS height_cm NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS fitness_goal TEXT CHECK (fitness_goal IS NULL OR fitness_goal IN ('lose_weight', 'build_muscle', 'maintain_weight', 'improve_fitness', 'general_health')),
  ADD COLUMN IF NOT EXISTS activity_level TEXT CHECK (activity_level IS NULL OR activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  ADD COLUMN IF NOT EXISTS daily_calorie_goal INTEGER DEFAULT 2200,
  ADD COLUMN IF NOT EXISTS daily_protein_goal INTEGER DEFAULT 150,
  ADD COLUMN IF NOT EXISTS daily_carb_goal INTEGER DEFAULT 220,
  ADD COLUMN IF NOT EXISTS daily_fat_goal INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS daily_water_goal_ml INTEGER DEFAULT 3000,
  ADD COLUMN IF NOT EXISTS height_unit TEXT DEFAULT 'cm' CHECK (height_unit IN ('cm', 'ft_in')),
  ADD COLUMN IF NOT EXISTS water_unit TEXT DEFAULT 'ml' CHECK (water_unit IN ('ml', 'oz')),
  ADD COLUMN IF NOT EXISTS theme_preference TEXT DEFAULT 'dark' CHECK (theme_preference IN ('light', 'dark', 'system')),
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wake_time TIME DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS sleep_time TIME DEFAULT '23:00',
  ADD COLUMN IF NOT EXISTS water_reminder_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS water_reminder_frequency_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS notif_water BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_workout BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_achievement BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notif_nutrition BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ;

-- =========================================================================
-- EXERCISES — richer metadata + per-user favorites
-- =========================================================================
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS secondary_muscle_group TEXT,
  ADD COLUMN IF NOT EXISTS exercise_type TEXT DEFAULT 'strength' CHECK (exercise_type IN ('strength', 'cardio', 'mobility', 'sport', 'other')),
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS personal_notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS exercise_favorites (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, exercise_id)
);

ALTER TABLE exercise_favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own favorites" ON exercise_favorites;
CREATE POLICY "Users manage own favorites" ON exercise_favorites FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow owners to edit/delete their own custom exercises (update policy already exists for custom;
-- add explicit metadata-only update coverage is unnecessary — existing policy already covers all columns).

-- =========================================================================
-- WORKOUT TEMPLATES
-- =========================================================================
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  workout_type TEXT NOT NULL DEFAULT 'gym',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL DEFAULT 0,
  target_sets INTEGER,
  target_reps INTEGER,
  notes TEXT
);

ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own templates" ON workout_templates;
CREATE POLICY "Users manage own templates" ON workout_templates FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own template exercises" ON workout_template_exercises;
CREATE POLICY "Users manage own template exercises" ON workout_template_exercises FOR ALL
  USING (EXISTS (SELECT 1 FROM workout_templates wt WHERE wt.id = template_id AND wt.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM workout_templates wt WHERE wt.id = template_id AND wt.user_id = auth.uid()));

-- =========================================================================
-- WORKOUT SESSIONS — typing, naming, date, template link
-- =========================================================================
ALTER TABLE workout_sessions
  ADD COLUMN IF NOT EXISTS workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS workout_type TEXT NOT NULL DEFAULT 'gym'
    CHECK (workout_type IN ('gym', 'running', 'walking', 'cycling', 'swimming', 'sports', 'home_workout', 'other')),
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES workout_templates(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(workout_date DESC);

-- =========================================================================
-- WORKOUT SETS — rest, notes, completion state
-- =========================================================================
ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS rest_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS completed BOOLEAN NOT NULL DEFAULT TRUE;

-- =========================================================================
-- NUTRITION — foods (library) + food entries (log)
-- =========================================================================
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  serving_size TEXT,
  calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_foods_user ON foods(user_id);
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods(name);

CREATE TABLE IF NOT EXISTS food_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL DEFAULT 'snack' CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  quantity NUMERIC(6,2) NOT NULL DEFAULT 1,
  calories NUMERIC(7,1) NOT NULL DEFAULT 0,
  protein NUMERIC(6,1) NOT NULL DEFAULT 0,
  carbs NUMERIC(6,1) NOT NULL DEFAULT 0,
  fat NUMERIC(6,1) NOT NULL DEFAULT 0,
  notes TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_entries_user_date ON food_entries(user_id, entry_date DESC);

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view system foods" ON foods;
CREATE POLICY "Anyone can view system foods" ON foods FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
DROP POLICY IF EXISTS "Users insert own foods" ON foods;
CREATE POLICY "Users insert own foods" ON foods FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users update own foods" ON foods;
CREATE POLICY "Users update own foods" ON foods FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users delete own foods" ON foods;
CREATE POLICY "Users delete own foods" ON foods FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own food entries" ON food_entries;
CREATE POLICY "Users manage own food entries" ON food_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- HYDRATION — water entries
-- =========================================================================
CREATE TABLE IF NOT EXISTS water_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_water_entries_user_logged ON water_entries(user_id, logged_at DESC);

ALTER TABLE water_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own water entries" ON water_entries;
CREATE POLICY "Users manage own water entries" ON water_entries FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- BODY MEASUREMENTS + PROGRESS PHOTOS
-- =========================================================================
CREATE TABLE IF NOT EXISTS body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weight_kg NUMERIC(6,2),
  body_fat_pct NUMERIC(4,1),
  waist_cm NUMERIC(5,1),
  chest_cm NUMERIC(5,1),
  arms_cm NUMERIC(5,1),
  thighs_cm NUMERIC(5,1),
  custom JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, measured_date)
);

CREATE INDEX IF NOT EXISTS idx_body_measurements_user_date ON body_measurements(user_id, measured_date DESC);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own measurements" ON body_measurements;
CREATE POLICY "Users manage own measurements" ON body_measurements FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_path TEXT NOT NULL,
  taken_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_photos_user_date ON progress_photos(user_id, taken_date DESC);

ALTER TABLE progress_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own progress photos" ON progress_photos;
CREATE POLICY "Users manage own progress photos" ON progress_photos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Private storage bucket for progress photos (path prefix = user id)
INSERT INTO storage.buckets (id, name, public)
VALUES ('progress-photos', 'progress-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users manage own progress photo files" ON storage.objects;
CREATE POLICY "Users manage own progress photo files" ON storage.objects FOR ALL
  USING (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'progress-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public bucket for profile avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
DROP POLICY IF EXISTS "Users manage own avatar files" ON storage.objects;
CREATE POLICY "Users manage own avatar files" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
DROP POLICY IF EXISTS "Users update own avatar files" ON storage.objects;
CREATE POLICY "Users update own avatar files" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
DROP POLICY IF EXISTS "Users delete own avatar files" ON storage.objects;
CREATE POLICY "Users delete own avatar files" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =========================================================================
-- GOALS
-- =========================================================================
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('weight', 'lift', 'distance', 'workout_count', 'water', 'protein', 'custom')),
  title TEXT NOT NULL,
  target_value NUMERIC(10,2) NOT NULL,
  current_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own goals" ON goals;
CREATE POLICY "Users manage own goals" ON goals FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- Keep handle_new_user in sync (no column changes needed — new profile
-- columns all have defaults / are nullable, so the existing trigger works
-- unchanged).
-- =========================================================================
