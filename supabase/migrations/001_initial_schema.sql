-- Fit N Fatal - Initial Schema with Row-Level Security

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercise library (system + user custom)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  equipment TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises within a workout session
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual sets
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  reps INTEGER NOT NULL CHECK (reps > 0),
  weight DECIMAL(8,2) NOT NULL CHECK (weight >= 0),
  rpe DECIMAL(3,1) CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
  is_warmup BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exercises_user ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises(name);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_started ON workout_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session ON workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(workout_exercise_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

GRANT USAGE ON SCHEMA public TO postgres, supabase_auth_admin;
GRANT INSERT, SELECT, UPDATE ON public.profiles TO postgres, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Row-Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Exercises: system exercises (user_id IS NULL) visible to all, custom only to owner
CREATE POLICY "Anyone can view system exercises" ON exercises FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert custom exercises" ON exercises FOR INSERT
  WITH CHECK (auth.uid() = user_id AND is_custom = TRUE);
CREATE POLICY "Users can update own custom exercises" ON exercises FOR UPDATE
  USING (auth.uid() = user_id AND is_custom = TRUE);
CREATE POLICY "Users can delete own custom exercises" ON exercises FOR DELETE
  USING (auth.uid() = user_id AND is_custom = TRUE);

-- Workout sessions policies
CREATE POLICY "Users can view own sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Workout exercises policies (via session ownership)
CREATE POLICY "Users can view own workout exercises" ON workout_exercises FOR SELECT
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can insert own workout exercises" ON workout_exercises FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can update own workout exercises" ON workout_exercises FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));
CREATE POLICY "Users can delete own workout exercises" ON workout_exercises FOR DELETE
  USING (EXISTS (SELECT 1 FROM workout_sessions ws WHERE ws.id = session_id AND ws.user_id = auth.uid()));

-- Workout sets policies (via exercise -> session ownership)
CREATE POLICY "Users can view own sets" ON workout_sets FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can insert own sets" ON workout_sets FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can update own sets" ON workout_sets FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
  ));
CREATE POLICY "Users can delete own sets" ON workout_sets FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
  ));
