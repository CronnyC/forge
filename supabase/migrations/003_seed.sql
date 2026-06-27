-- Seed body_sections
insert into body_sections (name, display_name) values
('chest','Chest'),('upper_back','Upper Back'),('lower_back','Lower Back'),
('shoulders','Shoulders'),('biceps','Biceps'),('triceps','Triceps'),
('core','Core'),('glutes','Glutes'),('quads','Quads'),
('hamstrings','Hamstrings'),('calves','Calves'),('forearms','Forearms');

-- Seed exercises using a CTE approach for variant linking
-- We insert exercises first without variant links, then update them

do $$
declare
  -- Body section IDs
  bs_chest uuid; bs_upper_back uuid; bs_lower_back uuid;
  bs_shoulders uuid; bs_biceps uuid; bs_triceps uuid;
  bs_core uuid; bs_glutes uuid; bs_quads uuid;
  bs_hamstrings uuid; bs_calves uuid; bs_forearms uuid;

  -- Exercise IDs
  ex_pushup uuid; ex_diamond_pushup uuid; ex_pike_pushup uuid;
  ex_decline_pushup uuid; ex_archer_pushup uuid; ex_onearm_pushup_neg uuid;
  ex_pullup uuid; ex_chinup uuid; ex_aus_row uuid;
  ex_squat uuid; ex_jump_squat uuid; ex_pistol_neg uuid;
  ex_pistol uuid; ex_lunge uuid; ex_bulgarian uuid;
  ex_plank uuid; ex_side_plank uuid; ex_hollow_body uuid;
  ex_lsit uuid; ex_dragon_flag_neg uuid;
  ex_dip_chair uuid; ex_tricep_pushup uuid; ex_pike_hold uuid;
  ex_handstand_wall uuid; ex_burpee uuid; ex_mountain_climber uuid;
  ex_superman uuid; ex_glute_bridge uuid; ex_single_glute_bridge uuid;
  ex_calf_raise uuid; ex_incline_pushup uuid; ex_knee_pushup uuid;
  ex_negative_pullup uuid; ex_knee_tuck uuid;

begin
  -- Fetch body section IDs
  select id into bs_chest from body_sections where name = 'chest';
  select id into bs_upper_back from body_sections where name = 'upper_back';
  select id into bs_lower_back from body_sections where name = 'lower_back';
  select id into bs_shoulders from body_sections where name = 'shoulders';
  select id into bs_biceps from body_sections where name = 'biceps';
  select id into bs_triceps from body_sections where name = 'triceps';
  select id into bs_core from body_sections where name = 'core';
  select id into bs_glutes from body_sections where name = 'glutes';
  select id into bs_quads from body_sections where name = 'quads';
  select id into bs_hamstrings from body_sections where name = 'hamstrings';
  select id into bs_calves from body_sections where name = 'calves';
  select id into bs_forearms from body_sections where name = 'forearms';

  -- Insert exercises (no variant links yet)
  insert into exercises (id, name, description, equipment_required, goal_tags, execution_style, target_reps, target_duration, difficulty_level, demo_media_ref, warm_up_required)
  values
  (uuid_generate_v4(), 'Knee Push-Up', 'Modified push-up from knees. Keep body straight from knees to head, lower chest to floor.', '{}', '{"weight_loss","muscle_gain"}', 'reps', 12, null, 1.5, '/api/exercise-image/wger/22', false),
  (uuid_generate_v4(), 'Incline Push-Up', 'Push-up with hands elevated on a surface. Easier than standard push-up.', '{}', '{"weight_loss","muscle_gain"}', 'reps', 15, null, 2, '/api/exercise-image/wger/23', false),
  (uuid_generate_v4(), 'Push-Up', 'Standard push-up. Keep core tight, body straight, lower chest to floor.', '{}', '{"weight_loss","muscle_gain","strength"}', 'reps', 15, null, 3, '/api/exercise-image/wger/22', false),
  (uuid_generate_v4(), 'Diamond Push-Up', 'Hands form a diamond shape under chest. Heavy tricep emphasis.', '{}', '{"muscle_gain","strength"}', 'reps', 10, null, 4, '/api/exercise-image/wger/30', false),
  (uuid_generate_v4(), 'Pike Push-Up', 'Hips high, head moves toward floor between arms. Shoulder-dominant.', '{}', '{"muscle_gain","strength"}', 'reps', 10, null, 4, '/api/exercise-image/wger/24', false),
  (uuid_generate_v4(), 'Decline Push-Up', 'Feet elevated, head low. Increases upper chest and shoulder load.', '{}', '{"muscle_gain","strength"}', 'reps', 10, null, 5, '/api/exercise-image/wger/25', false),
  (uuid_generate_v4(), 'Archer Push-Up', 'Wide stance, shift weight to one arm each rep. Unilateral challenge.', '{}', '{"strength","muscle_gain"}', 'reps', 8, null, 6, '/api/exercise-image/wger/26', false),
  (uuid_generate_v4(), 'One-Arm Push-Up Negative', 'Lower slowly on one arm, reset with two. Builds one-arm strength.', '{}', '{"strength"}', 'reps', 5, null, 7, '/api/exercise-image/wger/27', false),
  (uuid_generate_v4(), 'Negative Pull-Up', 'Jump to top position, lower yourself slowly over 5 seconds.', '{"pull-up bar"}', '{"muscle_gain","strength"}', 'reps', 6, null, 3, '/api/exercise-image/wger/39', false),
  (uuid_generate_v4(), 'Australian Row', 'Horizontal row under a table or low bar. Back and biceps.', '{}', '{"muscle_gain","strength"}', 'reps', 12, null, 3, '/api/exercise-image/wger/47', false),
  (uuid_generate_v4(), 'Chin-Up', 'Underhand grip pull-up. Bicep-dominant, slightly easier than pull-up.', '{"pull-up bar"}', '{"muscle_gain","strength"}', 'reps', 8, null, 4, '/api/exercise-image/wger/38', false),
  (uuid_generate_v4(), 'Pull-Up', 'Overhand grip, pull chin over bar. Upper back and biceps.', '{"pull-up bar"}', '{"muscle_gain","strength"}', 'reps', 6, null, 5, '/api/exercise-image/wger/36', false),
  (uuid_generate_v4(), 'Squat', 'Bodyweight squat. Feet shoulder-width, sit back, chest up.', '{}', '{"weight_loss","muscle_gain","strength"}', 'reps', 20, null, 3, '/api/exercise-image/wger/111', false),
  (uuid_generate_v4(), 'Jump Squat', 'Squat down then explode up off the floor. Plyometric power.', '{}', '{"weight_loss","sport_specific"}', 'reps', 12, null, 4, '/api/exercise-image/wger/112', false),
  (uuid_generate_v4(), 'Lunge', 'Step forward, lower back knee toward floor. Alternating legs.', '{}', '{"weight_loss","muscle_gain"}', 'reps', 16, null, 3, '/api/exercise-image/wger/116', false),
  (uuid_generate_v4(), 'Bulgarian Split Squat', 'Rear foot elevated, single-leg squat. Intense quad and glute focus.', '{}', '{"muscle_gain","strength"}', 'reps', 10, null, 5, '/api/exercise-image/wger/115', false),
  (uuid_generate_v4(), 'Pistol Squat Negative', 'Single-leg squat, use hands to control descent. Building pistol strength.', '{}', '{"strength"}', 'reps', 5, null, 6, '/api/exercise-image/wger/113', false),
  (uuid_generate_v4(), 'Pistol Squat', 'Full single-leg squat to parallel and back up without assistance.', '{}', '{"strength","sport_specific"}', 'reps', 5, null, 7, '/api/exercise-image/wger/113', false),
  (uuid_generate_v4(), 'Glute Bridge', 'Lie on back, feet flat, drive hips up. Hold at top.', '{}', '{"weight_loss","muscle_gain"}', 'reps', 20, null, 2, '/api/exercise-image/wger/175', false),
  (uuid_generate_v4(), 'Single-Leg Glute Bridge', 'Glute bridge on one leg. More glute and hamstring activation.', '{}', '{"muscle_gain","strength"}', 'reps', 12, null, 4, '/api/exercise-image/wger/176', false),
  (uuid_generate_v4(), 'Calf Raise', 'Stand on edge of step, raise and lower heels. Calf isolation.', '{}', '{"muscle_gain","weight_loss"}', 'reps', 25, null, 2, '/api/exercise-image/wger/200', false),
  (uuid_generate_v4(), 'Plank', 'Hold push-up top position. Keep hips level, core braced.', '{}', '{"weight_loss","strength","muscle_gain"}', 'timed', null, 60, 2, '/api/exercise-image/wger/60', false),
  (uuid_generate_v4(), 'Side Plank', 'Lateral plank on one arm. Oblique and core stability.', '{}', '{"weight_loss","strength"}', 'timed', null, 40, 3, '/api/exercise-image/wger/61', false),
  (uuid_generate_v4(), 'Hollow Body Hold', 'Lie on back, arms overhead, press lower back into floor, lift legs and shoulders.', '{}', '{"strength","muscle_gain"}', 'timed', null, 30, 4, '/api/exercise-image/wger/62', false),
  (uuid_generate_v4(), 'L-Sit', 'Support body between two chairs, legs parallel to floor.', '{}', '{"strength"}', 'max_hold', null, 15, 6, '/api/exercise-image/wger/63', false),
  (uuid_generate_v4(), 'Dragon Flag Negative', 'Start at top, slowly lower straight body. Core and full-body tension.', '{}', '{"strength"}', 'reps', 5, null, 7, '/api/exercise-image/wger/64', true),
  (uuid_generate_v4(), 'Dip (Chair)', 'Hands on chair edge, lower and raise body. Tricep-dominant push.', '{}', '{"muscle_gain","strength"}', 'reps', 12, null, 4, '/api/exercise-image/wger/75', false),
  (uuid_generate_v4(), 'Tricep Push-Up', 'Elbows track back close to body. Max tricep activation.', '{}', '{"muscle_gain","strength"}', 'reps', 10, null, 4, '/api/exercise-image/wger/76', false),
  (uuid_generate_v4(), 'Pike Hold', 'Hold top of pike push-up position. Shoulder endurance.', '{}', '{"strength","muscle_gain"}', 'max_hold', null, 20, 5, '/api/exercise-image/wger/80', false),
  (uuid_generate_v4(), 'Handstand Against Wall', 'Kick up to wall, hold inverted position. Shoulder strength and balance.', '{}', '{"strength","sport_specific"}', 'max_hold', null, 30, 5, '/api/exercise-image/wger/81', true),
  (uuid_generate_v4(), 'Burpee', 'Squat thrust to push-up, jump up with arms overhead. Full body.', '{}', '{"weight_loss","sport_specific"}', 'reps', 10, null, 5, '/api/exercise-image/wger/90', false),
  (uuid_generate_v4(), 'Mountain Climber', 'Plank position, alternate driving knees to chest rapidly.', '{}', '{"weight_loss","sport_specific","muscle_gain"}', 'timed', null, 45, 4, '/api/exercise-image/wger/91', false),
  (uuid_generate_v4(), 'Superman Hold', 'Lie face down, lift arms and legs simultaneously. Lower back.', '{}', '{"strength","muscle_gain"}', 'timed', null, 30, 2, '/api/exercise-image/wger/95', false),
  (uuid_generate_v4(), 'Knee Tuck Hold', 'Seated, lift feet off floor, draw knees toward chest. Core compression.', '{}', '{"strength","weight_loss"}', 'timed', null, 20, 2, '/api/exercise-image/wger/65', false);

  -- Fetch IDs for variant linking
  select id into ex_knee_pushup from exercises where name = 'Knee Push-Up';
  select id into ex_incline_pushup from exercises where name = 'Incline Push-Up';
  select id into ex_pushup from exercises where name = 'Push-Up';
  select id into ex_diamond_pushup from exercises where name = 'Diamond Push-Up';
  select id into ex_pike_pushup from exercises where name = 'Pike Push-Up';
  select id into ex_decline_pushup from exercises where name = 'Decline Push-Up';
  select id into ex_archer_pushup from exercises where name = 'Archer Push-Up';
  select id into ex_onearm_pushup_neg from exercises where name = 'One-Arm Push-Up Negative';
  select id into ex_negative_pullup from exercises where name = 'Negative Pull-Up';
  select id into ex_aus_row from exercises where name = 'Australian Row';
  select id into ex_chinup from exercises where name = 'Chin-Up';
  select id into ex_pullup from exercises where name = 'Pull-Up';
  select id into ex_squat from exercises where name = 'Squat';
  select id into ex_jump_squat from exercises where name = 'Jump Squat';
  select id into ex_lunge from exercises where name = 'Lunge';
  select id into ex_bulgarian from exercises where name = 'Bulgarian Split Squat';
  select id into ex_pistol_neg from exercises where name = 'Pistol Squat Negative';
  select id into ex_pistol from exercises where name = 'Pistol Squat';
  select id into ex_glute_bridge from exercises where name = 'Glute Bridge';
  select id into ex_single_glute_bridge from exercises where name = 'Single-Leg Glute Bridge';
  select id into ex_calf_raise from exercises where name = 'Calf Raise';
  select id into ex_plank from exercises where name = 'Plank';
  select id into ex_side_plank from exercises where name = 'Side Plank';
  select id into ex_hollow_body from exercises where name = 'Hollow Body Hold';
  select id into ex_lsit from exercises where name = 'L-Sit';
  select id into ex_dragon_flag_neg from exercises where name = 'Dragon Flag Negative';
  select id into ex_dip_chair from exercises where name = 'Dip (Chair)';
  select id into ex_tricep_pushup from exercises where name = 'Tricep Push-Up';
  select id into ex_pike_hold from exercises where name = 'Pike Hold';
  select id into ex_handstand_wall from exercises where name = 'Handstand Against Wall';
  select id into ex_burpee from exercises where name = 'Burpee';
  select id into ex_mountain_climber from exercises where name = 'Mountain Climber';
  select id into ex_superman from exercises where name = 'Superman Hold';
  select id into ex_knee_tuck from exercises where name = 'Knee Tuck Hold';

  -- Link easier/harder variants for push-up progression
  update exercises set easier_variant_id = ex_knee_pushup, harder_variant_id = ex_incline_pushup where id = ex_knee_pushup;
  update exercises set easier_variant_id = ex_knee_pushup, harder_variant_id = ex_pushup where id = ex_incline_pushup;
  update exercises set easier_variant_id = ex_incline_pushup, harder_variant_id = ex_decline_pushup where id = ex_pushup;
  update exercises set easier_variant_id = ex_pushup, harder_variant_id = ex_archer_pushup where id = ex_decline_pushup;
  update exercises set easier_variant_id = ex_decline_pushup, harder_variant_id = ex_onearm_pushup_neg where id = ex_archer_pushup;
  update exercises set easier_variant_id = ex_archer_pushup where id = ex_onearm_pushup_neg;
  -- Diamond pushup chain
  update exercises set easier_variant_id = ex_pushup, harder_variant_id = ex_tricep_pushup where id = ex_diamond_pushup;
  update exercises set easier_variant_id = ex_diamond_pushup where id = ex_tricep_pushup;
  -- Pike pushup chain
  update exercises set easier_variant_id = ex_pushup, harder_variant_id = ex_pike_hold where id = ex_pike_pushup;
  update exercises set easier_variant_id = ex_pike_pushup, harder_variant_id = ex_handstand_wall where id = ex_pike_hold;
  update exercises set easier_variant_id = ex_pike_hold where id = ex_handstand_wall;
  -- Pull chain
  update exercises set easier_variant_id = ex_aus_row, harder_variant_id = ex_chinup where id = ex_negative_pullup;
  update exercises set easier_variant_id = ex_negative_pullup, harder_variant_id = ex_pullup where id = ex_chinup;
  update exercises set easier_variant_id = ex_chinup where id = ex_pullup;
  -- Squat chain
  update exercises set easier_variant_id = ex_squat, harder_variant_id = ex_lunge where id = ex_squat;
  update exercises set easier_variant_id = ex_squat, harder_variant_id = ex_jump_squat where id = ex_lunge;
  update exercises set easier_variant_id = ex_lunge, harder_variant_id = ex_bulgarian where id = ex_bulgarian;
  update exercises set easier_variant_id = ex_bulgarian, harder_variant_id = ex_pistol_neg where id = ex_pistol_neg;
  update exercises set easier_variant_id = ex_pistol_neg, harder_variant_id = ex_pistol where id = ex_pistol;
  -- Glute chain
  update exercises set easier_variant_id = ex_glute_bridge, harder_variant_id = ex_single_glute_bridge where id = ex_glute_bridge;
  update exercises set easier_variant_id = ex_glute_bridge where id = ex_single_glute_bridge;
  -- Core chain
  update exercises set easier_variant_id = ex_plank, harder_variant_id = ex_hollow_body where id = ex_side_plank;
  update exercises set easier_variant_id = ex_side_plank, harder_variant_id = ex_lsit where id = ex_hollow_body;
  update exercises set easier_variant_id = ex_hollow_body, harder_variant_id = ex_dragon_flag_neg where id = ex_lsit;
  update exercises set easier_variant_id = ex_lsit where id = ex_dragon_flag_neg;
  update exercises set easier_variant_id = ex_knee_tuck, harder_variant_id = ex_side_plank where id = ex_plank;
  -- L-sit tie to knee tuck
  update exercises set harder_variant_id = ex_plank where id = ex_knee_tuck;

  -- ===== MUSCLE ENGAGEMENT DATA =====

  -- Knee Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_knee_pushup, bs_chest, 3),(ex_knee_pushup, bs_triceps, 2),(ex_knee_pushup, bs_shoulders, 1);

  -- Incline Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_incline_pushup, bs_chest, 3),(ex_incline_pushup, bs_triceps, 2),(ex_incline_pushup, bs_shoulders, 1);

  -- Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pushup, bs_chest, 3),(ex_pushup, bs_triceps, 2),(ex_pushup, bs_shoulders, 2),(ex_pushup, bs_core, 1);

  -- Diamond Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_diamond_pushup, bs_triceps, 3),(ex_diamond_pushup, bs_chest, 2),(ex_diamond_pushup, bs_shoulders, 1);

  -- Pike Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pike_pushup, bs_shoulders, 3),(ex_pike_pushup, bs_triceps, 2),(ex_pike_pushup, bs_upper_back, 1);

  -- Decline Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_decline_pushup, bs_chest, 3),(ex_decline_pushup, bs_shoulders, 2),(ex_decline_pushup, bs_triceps, 2);

  -- Archer Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_archer_pushup, bs_chest, 3),(ex_archer_pushup, bs_triceps, 2),(ex_archer_pushup, bs_shoulders, 2),(ex_archer_pushup, bs_core, 1);

  -- One-Arm Push-Up Negative
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_onearm_pushup_neg, bs_chest, 3),(ex_onearm_pushup_neg, bs_triceps, 3),(ex_onearm_pushup_neg, bs_core, 2),(ex_onearm_pushup_neg, bs_shoulders, 2);

  -- Negative Pull-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_negative_pullup, bs_upper_back, 3),(ex_negative_pullup, bs_biceps, 2),(ex_negative_pullup, bs_forearms, 1);

  -- Australian Row
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_aus_row, bs_upper_back, 3),(ex_aus_row, bs_biceps, 2),(ex_aus_row, bs_forearms, 1),(ex_aus_row, bs_core, 1);

  -- Chin-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_chinup, bs_biceps, 3),(ex_chinup, bs_upper_back, 2),(ex_chinup, bs_forearms, 2);

  -- Pull-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pullup, bs_upper_back, 3),(ex_pullup, bs_biceps, 2),(ex_pullup, bs_forearms, 2),(ex_pullup, bs_core, 1);

  -- Squat
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_squat, bs_quads, 3),(ex_squat, bs_glutes, 2),(ex_squat, bs_hamstrings, 1),(ex_squat, bs_core, 1);

  -- Jump Squat
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_jump_squat, bs_quads, 3),(ex_jump_squat, bs_glutes, 3),(ex_jump_squat, bs_calves, 2),(ex_jump_squat, bs_hamstrings, 1);

  -- Lunge
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_lunge, bs_quads, 3),(ex_lunge, bs_glutes, 2),(ex_lunge, bs_hamstrings, 2),(ex_lunge, bs_core, 1);

  -- Bulgarian Split Squat
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_bulgarian, bs_quads, 3),(ex_bulgarian, bs_glutes, 3),(ex_bulgarian, bs_hamstrings, 2),(ex_bulgarian, bs_core, 1);

  -- Pistol Squat Negative
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pistol_neg, bs_quads, 3),(ex_pistol_neg, bs_glutes, 2),(ex_pistol_neg, bs_hamstrings, 2),(ex_pistol_neg, bs_core, 2);

  -- Pistol Squat
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pistol, bs_quads, 3),(ex_pistol, bs_glutes, 3),(ex_pistol, bs_hamstrings, 2),(ex_pistol, bs_core, 2);

  -- Glute Bridge
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_glute_bridge, bs_glutes, 3),(ex_glute_bridge, bs_hamstrings, 2),(ex_glute_bridge, bs_lower_back, 1);

  -- Single-Leg Glute Bridge
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_single_glute_bridge, bs_glutes, 3),(ex_single_glute_bridge, bs_hamstrings, 3),(ex_single_glute_bridge, bs_lower_back, 1),(ex_single_glute_bridge, bs_core, 1);

  -- Calf Raise
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_calf_raise, bs_calves, 3);

  -- Plank
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_plank, bs_core, 3),(ex_plank, bs_shoulders, 1),(ex_plank, bs_lower_back, 1);

  -- Side Plank
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_side_plank, bs_core, 3),(ex_side_plank, bs_shoulders, 1);

  -- Hollow Body Hold
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_hollow_body, bs_core, 3),(ex_hollow_body, bs_quads, 1);

  -- L-Sit
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_lsit, bs_core, 3),(ex_lsit, bs_triceps, 2),(ex_lsit, bs_quads, 2),(ex_lsit, bs_forearms, 1);

  -- Dragon Flag Negative
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_dragon_flag_neg, bs_core, 3),(ex_dragon_flag_neg, bs_lower_back, 2),(ex_dragon_flag_neg, bs_quads, 1);

  -- Dip (Chair)
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_dip_chair, bs_triceps, 3),(ex_dip_chair, bs_chest, 2),(ex_dip_chair, bs_shoulders, 1);

  -- Tricep Push-Up
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_tricep_pushup, bs_triceps, 3),(ex_tricep_pushup, bs_chest, 2),(ex_tricep_pushup, bs_shoulders, 1);

  -- Pike Hold
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_pike_hold, bs_shoulders, 3),(ex_pike_hold, bs_upper_back, 1),(ex_pike_hold, bs_core, 1);

  -- Handstand Against Wall
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_handstand_wall, bs_shoulders, 3),(ex_handstand_wall, bs_triceps, 2),(ex_handstand_wall, bs_upper_back, 1),(ex_handstand_wall, bs_core, 1);

  -- Burpee
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_burpee, bs_quads, 2),(ex_burpee, bs_chest, 2),(ex_burpee, bs_core, 2),(ex_burpee, bs_shoulders, 1),(ex_burpee, bs_calves, 1);

  -- Mountain Climber
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_mountain_climber, bs_core, 3),(ex_mountain_climber, bs_quads, 2),(ex_mountain_climber, bs_shoulders, 1);

  -- Superman Hold
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_superman, bs_lower_back, 3),(ex_superman, bs_glutes, 2),(ex_superman, bs_upper_back, 1);

  -- Knee Tuck Hold
  insert into exercise_muscle_engagement (exercise_id, body_section_id, engagement_level) values
  (ex_knee_tuck, bs_core, 3),(ex_knee_tuck, bs_quads, 1);

  -- ===== SEED PROGRAMS =====
  insert into influencers (name, social_link) values
  ('Chris Heria', 'https://www.youtube.com/@chrisheria'),
  ('FitnessFAQs', 'https://www.youtube.com/@FitnessFAQs'),
  ('Antranik', 'https://antranik.org');

  declare
    inf_heria uuid; inf_faqs uuid;
    prog_pushup uuid; prog_pullup uuid; prog_handstand uuid;
  begin
    select id into inf_heria from influencers where name = 'Chris Heria';
    select id into inf_faqs from influencers where name = 'FitnessFAQs';

    -- Push-Up Mastery program
    insert into programs (id, name, description, target_skill, created_by_influencer_id)
    values (uuid_generate_v4(), 'Push-Up Mastery', 'Build from knee push-ups to one-arm push-up negatives through progressive overload.', 'one_arm_pushup', inf_heria)
    returning id into prog_pushup;

    insert into program_exercises (program_id, exercise_id, sequence_order, milestone_criteria) values
    (prog_pushup, ex_knee_pushup, 1, 'Complete 3x15 with good form'),
    (prog_pushup, ex_incline_pushup, 2, 'Complete 3x15 with good form'),
    (prog_pushup, ex_pushup, 3, 'Complete 3x20 with full range of motion'),
    (prog_pushup, ex_decline_pushup, 4, 'Complete 3x15'),
    (prog_pushup, ex_archer_pushup, 5, 'Complete 3x8 each side'),
    (prog_pushup, ex_onearm_pushup_neg, 6, 'Complete 3x5 each arm with 5-second descent');

    -- Pull-Up Progression program
    insert into programs (id, name, description, target_skill, created_by_influencer_id)
    values (uuid_generate_v4(), 'Pull-Up Progression', 'Go from zero to 10 pull-ups with a structured progression.', 'pullup', inf_faqs)
    returning id into prog_pullup;

    insert into program_exercises (program_id, exercise_id, sequence_order, milestone_criteria) values
    (prog_pullup, ex_aus_row, 1, 'Complete 3x15 at low bar angle'),
    (prog_pullup, ex_negative_pullup, 2, 'Complete 3x6 with 5-second negatives'),
    (prog_pullup, ex_chinup, 3, 'Complete 3x8 chin-ups'),
    (prog_pullup, ex_pullup, 4, 'Complete 3x10 strict pull-ups');

    -- Handstand Journey program
    insert into programs (id, name, description, target_skill, created_by_influencer_id)
    values (uuid_generate_v4(), 'Handstand Journey', 'Build shoulder strength and balance for a freestanding handstand.', 'handstand', inf_heria)
    returning id into prog_handstand;

    insert into program_exercises (program_id, exercise_id, sequence_order, milestone_criteria) values
    (prog_handstand, ex_pike_pushup, 1, 'Complete 3x10'),
    (prog_handstand, ex_pike_hold, 2, 'Hold for 30 seconds'),
    (prog_handstand, ex_handstand_wall, 3, 'Hold for 60 seconds at wall');
  end;
end;
$$;
