-- Fit N Fatal - Calisthenics exercise library
-- Adds bodyweight push, pull, shoulder, core, leg, arm, skill-progression,
-- plyometric and mobility exercises as system exercises.
-- Exercises that already exist (e.g. Push-Ups, Pull-Ups, L-Sit, Dragon Flag)
-- are not repeated. Safe to re-run: existing names are skipped.

INSERT INTO exercises (name, muscle_group, secondary_muscle_group, equipment, exercise_type, is_custom)
SELECT v.name, v.muscle_group, v.secondary_muscle_group, v.equipment, v.exercise_type, false
FROM (VALUES
  -- =======================================================================
  -- Push (chest, shoulders, triceps)
  -- =======================================================================
  ('Wall Push-Ups', 'Chest', NULL, 'Bodyweight', 'strength'),
  ('Knee Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('Explosive Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('Pseudo Planche Push-Ups', 'Chest', 'Shoulders', 'Bodyweight', 'strength'),
  ('Typewriter Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('One-Arm Push-Ups', 'Chest', 'Core', 'Bodyweight', 'strength'),
  ('One-Arm Elevated Push-Ups', 'Chest', 'Core', 'Bodyweight', 'strength'),
  ('Planche Push-Ups', 'Shoulders', 'Chest', 'Bodyweight', 'strength'),
  ('Maltese Push-Ups', 'Shoulders', 'Chest', 'Bodyweight', 'strength'),
  ('Staggered Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('Hindu Push-Ups', 'Chest', 'Shoulders', 'Bodyweight', 'strength'),
  ('Sphinx Push-Ups', 'Triceps', NULL, 'Bodyweight', 'strength'),
  ('Behind-the-Back Clap Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('Superman Push-Ups', 'Chest', 'Core', 'Bodyweight', 'strength'),
  ('Explosive Archer Push-Ups', 'Chest', 'Triceps', 'Bodyweight', 'strength'),
  ('Ring Push-Ups', 'Chest', 'Triceps', 'Other', 'strength'),
  ('Ring Archer Push-Ups', 'Chest', 'Triceps', 'Other', 'strength'),
  ('Ring Flyes', 'Chest', 'Shoulders', 'Other', 'strength'),

  -- =======================================================================
  -- Pull (back, biceps, forearms)
  -- =======================================================================
  ('Active Hang', 'Back', 'Forearms', 'Bodyweight', 'strength'),
  ('Negative Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Close-Grip Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('L-Sit Pull-Ups', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('Commando Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Archer Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Typewriter Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('One-Arm Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('One-Arm Negative Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Assisted One-Arm Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Explosive Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('High Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Chest-to-Bar Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Sternum Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Mixed-Grip Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Behind-the-Neck Pull-Ups', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('Towel Pull-Ups', 'Back', 'Forearms', 'Other', 'strength'),
  ('Weighted Pull-Ups', 'Back', 'Biceps', 'Other', 'strength'),
  ('Weighted Chin-Ups', 'Biceps', 'Back', 'Other', 'strength'),
  ('Ring Pull-Ups', 'Back', 'Biceps', 'Other', 'strength'),
  ('Ring Rows', 'Back', 'Biceps', 'Other', 'strength'),
  ('Reverse Australian Rows', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Feet-Elevated Australian Rows', 'Back', 'Biceps', 'Bodyweight', 'strength'),
  ('Front Lever Pull-Ups', 'Back', 'Core', 'Bodyweight', 'strength'),

  -- Muscle-up progressions
  ('Negative Muscle-Ups', 'Back', 'Triceps', 'Bodyweight', 'strength'),
  ('Band-Assisted Muscle-Ups', 'Back', 'Triceps', 'Bands', 'strength'),
  ('Kipping Muscle-Ups', 'Back', 'Triceps', 'Bodyweight', 'strength'),
  ('Strict Bar Muscle-Ups', 'Back', 'Triceps', 'Bodyweight', 'strength'),
  ('Explosive Muscle-Ups', 'Back', 'Triceps', 'Bodyweight', 'strength'),
  ('Ring Muscle-Ups', 'Back', 'Triceps', 'Other', 'strength'),
  ('Strict Ring Muscle-Ups', 'Back', 'Triceps', 'Other', 'strength'),
  ('Weighted Muscle-Ups', 'Back', 'Triceps', 'Other', 'strength'),

  -- =======================================================================
  -- Shoulders / handstand
  -- =======================================================================
  ('Incline Pike Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Elevated Pike Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Pike Hold', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Wall Plank', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Wall Walks', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Wall Handstand Hold', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Chest-to-Wall Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Back-to-Wall Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Wall Shoulder Taps', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Handstand Shoulder Taps', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Handstand Shrugs', 'Shoulders', NULL, 'Bodyweight', 'strength'),
  ('Freestanding Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Handstand Walking', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Wall-Assisted One-Arm Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('One-Arm Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Partial Handstand Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Handstand Push-Up Negatives', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Deficit Handstand Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Parallette Handstand Push-Ups', 'Shoulders', 'Triceps', 'Other', 'strength'),
  ('Freestanding Handstand Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('90-Degree Push-Ups', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Core
  -- =======================================================================
  ('Knee Raises', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Hollow Body Rocks', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Arch Body Hold', 'Core', 'Back', 'Bodyweight', 'strength'),
  ('Tuck L-Sit', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('One-Leg L-Sit', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('V-Sit', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('L-Sit to V-Sit', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('Hanging Oblique Knee Raises', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Hanging Windshield Wipers', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Dragon Flag Negatives', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Front Lever Raises', 'Core', 'Back', 'Bodyweight', 'strength'),
  ('Compression Holds', 'Core', NULL, 'Bodyweight', 'strength'),
  ('Seated Pike Leg Lifts', 'Core', NULL, 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Legs
  -- =======================================================================
  ('Sumo Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Narrow Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Tempo Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Cossack Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Assisted Pistol Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Elevated Pistol Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Box Pistol Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Shrimp Squat', 'Legs', NULL, 'Bodyweight', 'strength'),
  ('Skater Squat', 'Legs', NULL, 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Triceps
  -- =======================================================================
  ('Incline Close-Grip Push-Ups', 'Triceps', 'Chest', 'Bodyweight', 'strength'),
  ('Knee Diamond Push-Ups', 'Triceps', 'Chest', 'Bodyweight', 'strength'),
  ('Bent-Knee Bench Dips', 'Triceps', NULL, 'Bodyweight', 'strength'),
  ('Ring Triceps Extension', 'Triceps', NULL, 'Other', 'strength'),
  ('Korean Dips', 'Triceps', 'Shoulders', 'Bodyweight', 'strength'),
  ('Straight Bar Dips', 'Triceps', 'Chest', 'Bodyweight', 'strength'),
  ('Deep Ring Dips', 'Triceps', 'Chest', 'Other', 'strength'),
  ('Tiger Bend Push-Ups', 'Triceps', 'Shoulders', 'Bodyweight', 'strength'),
  ('Impossible Dips', 'Triceps', NULL, 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Biceps & forearms
  -- =======================================================================
  ('Assisted Chin-Ups', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('Ring Curls', 'Biceps', NULL, 'Other', 'strength'),
  ('Bodyweight Biceps Curl', 'Biceps', NULL, 'Bodyweight', 'strength'),
  ('Reverse Chin-Ups', 'Biceps', 'Forearms', 'Bodyweight', 'strength'),
  ('Archer Chin-Ups', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('Typewriter Chin-Ups', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('One-Arm Chin-Ups', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('One-Arm Negative Chin-Ups', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('Fingertip Push-Ups', 'Forearms', 'Chest', 'Bodyweight', 'strength'),
  ('Wrist Push-Ups', 'Forearms', NULL, 'Bodyweight', 'strength'),
  ('Reverse Wrist Push-Ups', 'Forearms', NULL, 'Bodyweight', 'strength'),
  ('One-Arm Dead Hang', 'Forearms', 'Back', 'Bodyweight', 'strength'),
  ('False Grip Hang', 'Forearms', 'Back', 'Bodyweight', 'strength'),
  ('Finger-Assisted Pull-Ups', 'Back', 'Forearms', 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Skill progressions
  -- =======================================================================
  -- Planche
  ('Planche Lean', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Frog Stand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Advanced Frog Stand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Tuck Planche', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Advanced Tuck Planche', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('One-Leg Planche', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Straddle Planche', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Full Planche', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Maltese Planche', 'Shoulders', 'Chest', 'Bodyweight', 'strength'),

  -- Front lever
  ('Tuck Front Lever', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('Advanced Tuck Front Lever', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('One-Leg Front Lever', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('Straddle Front Lever', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('Full Front Lever', 'Back', 'Core', 'Bodyweight', 'strength'),
  ('Front Lever Touches', 'Back', 'Core', 'Bodyweight', 'strength'),

  -- Back lever
  ('Skin the Cat', 'Shoulders', 'Back', 'Bodyweight', 'mobility'),
  ('German Hang', 'Shoulders', 'Chest', 'Bodyweight', 'mobility'),
  ('Tuck Back Lever', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('Advanced Tuck Back Lever', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('One-Leg Back Lever', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('Straddle Back Lever', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('Full Back Lever', 'Back', 'Shoulders', 'Bodyweight', 'strength'),
  ('Back Lever Pull-Ups', 'Back', 'Biceps', 'Bodyweight', 'strength'),

  -- Human flag
  ('Vertical Pole Hold', 'Shoulders', 'Forearms', 'Other', 'strength'),
  ('Pole Grip Practice', 'Forearms', 'Shoulders', 'Other', 'strength'),
  ('Tuck Human Flag', 'Core', 'Shoulders', 'Other', 'strength'),
  ('Advanced Tuck Human Flag', 'Core', 'Shoulders', 'Other', 'strength'),
  ('One-Leg Human Flag', 'Core', 'Shoulders', 'Other', 'strength'),
  ('Straddle Human Flag', 'Core', 'Shoulders', 'Other', 'strength'),
  ('Full Human Flag', 'Core', 'Shoulders', 'Other', 'strength'),
  ('Human Flag Raises', 'Core', 'Shoulders', 'Other', 'strength'),
  ('Human Flag Pull-Ups', 'Core', 'Back', 'Other', 'strength'),

  -- Other advanced skills
  ('Elbow Lever', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('Advanced Elbow Lever', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('One-Arm Elbow Lever', 'Core', 'Triceps', 'Bodyweight', 'strength'),
  ('Crow Pose', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Handstand Press', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Straddle Press to Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('Pike Press to Handstand', 'Shoulders', 'Core', 'Bodyweight', 'strength'),
  ('90-Degree Hold', 'Shoulders', 'Triceps', 'Bodyweight', 'strength'),
  ('Victorian Cross', 'Back', 'Shoulders', 'Other', 'strength'),
  ('Iron Cross', 'Shoulders', 'Chest', 'Other', 'strength'),
  ('Maltese Cross', 'Shoulders', 'Chest', 'Other', 'strength'),
  ('Hefesto', 'Biceps', 'Back', 'Bodyweight', 'strength'),
  ('Reverse Planche', 'Shoulders', 'Back', 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Explosive & plyometric
  -- =======================================================================
  ('Jump Lunges', 'Legs', NULL, 'Bodyweight', 'cardio'),
  ('Broad Jumps', 'Legs', NULL, 'Bodyweight', 'cardio'),
  ('Single-Leg Box Jumps', 'Legs', NULL, 'Other', 'cardio'),
  ('Single-Leg Squat Jumps', 'Legs', NULL, 'Bodyweight', 'cardio'),
  ('Depth Jumps', 'Legs', NULL, 'Other', 'cardio'),
  ('Tuck Jumps', 'Legs', 'Core', 'Bodyweight', 'cardio'),
  ('Pogo Jumps', 'Legs', NULL, 'Bodyweight', 'cardio'),
  ('Lateral Bounds', 'Legs', NULL, 'Bodyweight', 'cardio'),
  ('180-Degree Jump Squats', 'Legs', 'Core', 'Bodyweight', 'cardio'),
  ('Burpee Broad Jumps', 'Full Body', 'Legs', 'Bodyweight', 'cardio'),
  ('Plyometric Dips', 'Triceps', 'Chest', 'Bodyweight', 'strength'),

  -- =======================================================================
  -- Mobility, flexibility & conditioning
  -- =======================================================================
  ('Wrist Conditioning', 'Forearms', NULL, 'Bodyweight', 'mobility'),
  ('Wrist Rocks', 'Forearms', NULL, 'Bodyweight', 'mobility'),
  ('Palm Pulses', 'Forearms', NULL, 'Bodyweight', 'mobility'),
  ('Finger Pulses', 'Forearms', NULL, 'Bodyweight', 'mobility'),
  ('Shoulder Circles', 'Shoulders', NULL, 'Bodyweight', 'mobility'),
  ('Wall Slides', 'Shoulders', 'Back', 'Bodyweight', 'mobility'),
  ('Scapular CARs', 'Shoulders', 'Back', 'Bodyweight', 'mobility'),
  ('Hip CARs', 'Legs', NULL, 'Bodyweight', 'mobility'),
  ('Frog Stretch', 'Legs', NULL, 'Bodyweight', 'mobility'),
  ('Standing Forward Fold', 'Legs', 'Back', 'Bodyweight', 'mobility'),
  ('Seated Pike Stretch', 'Legs', 'Back', 'Bodyweight', 'mobility'),
  ('Pancake Stretch', 'Legs', NULL, 'Bodyweight', 'mobility'),
  ('Cobra Stretch', 'Back', 'Core', 'Bodyweight', 'mobility'),
  ('Knee-to-Wall Drill', 'Legs', NULL, 'Bodyweight', 'mobility'),
  ('Ankle Circles', 'Legs', NULL, 'Bodyweight', 'mobility'),
  ('Crab Walks', 'Full Body', 'Triceps', 'Bodyweight', 'cardio'),
  ('Plank Walkouts', 'Full Body', 'Core', 'Bodyweight', 'cardio')
) AS v(name, muscle_group, secondary_muscle_group, equipment, exercise_type)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.user_id IS NULL AND lower(e.name) = lower(v.name)
);
