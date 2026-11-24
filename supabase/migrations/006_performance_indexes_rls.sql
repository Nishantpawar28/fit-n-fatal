-- =========================================================================
-- 006 — Performance: indexes + cheaper RLS checks
-- =========================================================================
-- SAFE FOR EXISTING DATA: this migration only adds indexes and re-creates
-- row-level-security policies with identical meaning. No table, column or
-- row is altered or deleted. Your workout history is untouched.
--
-- Why:
--  * History/stats queries filter by (user_id, workout_date / ended_at) and
--    order by date; the old single-column indexes made Postgres sort a
--    user's whole history on every request.
--  * "Last time you did X" looks up workout_exercises by exercise_id, which
--    had no index at all.
--  * RLS policies called auth.uid() once PER ROW. Wrapping it as
--    (select auth.uid()) lets Postgres evaluate it once per query
--    (Supabase's documented RLS performance fix). For workout_sets the old
--    policy ran a 2-table join per set row.
--
-- ROLLBACK: see the block at the bottom of this file.
-- =========================================================================

-- ---------- Indexes ------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_ws_user_date
  ON workout_sessions (user_id, workout_date DESC, started_at DESC);

-- Fast "active session" lookup (ended_at IS NULL is always a tiny set)
CREATE INDEX IF NOT EXISTS idx_ws_user_active
  ON workout_sessions (user_id, started_at DESC) WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_we_exercise
  ON workout_exercises (exercise_id, session_id);

CREATE INDEX IF NOT EXISTS idx_wte_template
  ON workout_template_exercises (template_id);

CREATE INDEX IF NOT EXISTS idx_workout_templates_user
  ON workout_templates (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user
  ON exercise_favorites (user_id);

-- ---------- RLS: workout_sessions ----------------------------------------
DROP POLICY IF EXISTS "Users can view own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON workout_sessions;

CREATE POLICY "Users can view own sessions" ON workout_sessions FOR SELECT
  USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own sessions" ON workout_sessions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own sessions" ON workout_sessions FOR UPDATE
  USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own sessions" ON workout_sessions FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ---------- RLS: workout_exercises ---------------------------------------
DROP POLICY IF EXISTS "Users can view own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can insert own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can update own workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users can delete own workout exercises" ON workout_exercises;

CREATE POLICY "Users can view own workout exercises" ON workout_exercises FOR SELECT
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can insert own workout exercises" ON workout_exercises FOR INSERT
  WITH CHECK (session_id IN (SELECT id FROM workout_sessions WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can update own workout exercises" ON workout_exercises FOR UPDATE
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = (select auth.uid())));
CREATE POLICY "Users can delete own workout exercises" ON workout_exercises FOR DELETE
  USING (session_id IN (SELECT id FROM workout_sessions WHERE user_id = (select auth.uid())));

-- ---------- RLS: workout_sets --------------------------------------------
DROP POLICY IF EXISTS "Users can view own sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can insert own sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can update own sets" ON workout_sets;
DROP POLICY IF EXISTS "Users can delete own sets" ON workout_sets;

CREATE POLICY "Users can view own sets" ON workout_sets FOR SELECT
  USING (workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE ws.user_id = (select auth.uid())
  ));
CREATE POLICY "Users can insert own sets" ON workout_sets FOR INSERT
  WITH CHECK (workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE ws.user_id = (select auth.uid())
  ));
CREATE POLICY "Users can update own sets" ON workout_sets FOR UPDATE
  USING (workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE ws.user_id = (select auth.uid())
  ));
CREATE POLICY "Users can delete own sets" ON workout_sets FOR DELETE
  USING (workout_exercise_id IN (
    SELECT we.id FROM workout_exercises we
    JOIN workout_sessions ws ON ws.id = we.session_id
    WHERE ws.user_id = (select auth.uid())
  ));

-- ---------- RLS: exercises -----------------------------------------------
DROP POLICY IF EXISTS "Anyone can view system exercises" ON exercises;
CREATE POLICY "Anyone can view system exercises" ON exercises FOR SELECT
  USING (user_id IS NULL OR (select auth.uid()) = user_id);

-- =========================================================================
-- ROLLBACK (run manually if ever needed — also data-safe):
--
-- DROP INDEX IF EXISTS idx_ws_user_date, idx_ws_user_active, idx_we_exercise,
--   idx_wte_template, idx_workout_templates_user, idx_exercise_favorites_user;
--
-- Then re-run the CREATE POLICY statements for workout_sessions,
-- workout_exercises, workout_sets and exercises exactly as written in
-- 001_initial_schema.sql (after DROP POLICY IF EXISTS for each name above).
-- =========================================================================
