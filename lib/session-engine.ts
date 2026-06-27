import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { isExerciseSafe } from "@/lib/injury-filter";

type DBClient = SupabaseClient<Database>;

export interface SessionState {
  userId: string;
  timeRemainingMinutes: number;
  exercisesDoneThisSession: string[]; // exercise IDs
  activeProgramEnrollments: Array<{ programId: string; currentStep: number }>;
  userGoal: string;
  userEquipment: string[];
  injuryStates: Array<{ bodySectionId: string; severity: number }>;
  intensityPreference: number; // 0.5–1.0
}

export interface ExerciseRecommendation {
  exercise: Database["public"]["Tables"]["exercises"]["Row"];
  prescribedReps: number | null;
  prescribedDuration: number | null;
  source: "program" | "dynamic";
  programStep?: number;
}

export async function getNextExercise(
  state: SessionState,
  supabase: DBClient
): Promise<ExerciseRecommendation | null> {
  // 1. Check program enrollments first
  for (const enrollment of state.activeProgramEnrollments) {
    const { data: programEx } = await supabase
      .from("program_exercises")
      .select("exercise_id")
      .eq("program_id", enrollment.programId)
      .eq("sequence_order", enrollment.currentStep + 1)
      .single();

    if (programEx?.exercise_id) {
      const { data: ex } = await supabase
        .from("exercises")
        .select("*")
        .eq("id", programEx.exercise_id)
        .single();

      if (!ex) continue;

      const { data: engagements } = await supabase
        .from("exercise_muscle_engagement")
        .select("body_section_id, engagement_level")
        .eq("exercise_id", ex.id);

      if (isExerciseSafe(engagements ?? [], state.injuryStates)) {
        const { prescribed, prescribedDuration } = scalePrescription(ex, state.intensityPreference, null);
        return {
          exercise: ex,
          prescribedReps: prescribed,
          prescribedDuration: prescribedDuration,
          source: "program",
          programStep: enrollment.currentStep + 1,
        };
      }
    }
  }

  // 2. Dynamic selection: fetch all exercises
  const { data: allExercises } = await supabase
    .from("exercises")
    .select("*");

  if (!allExercises || allExercises.length === 0) return null;

  // Filter by equipment
  const equipmentFiltered = allExercises.filter((ex) => {
    if (ex.equipment_required.length === 0) return true;
    return ex.equipment_required.every((eq) => state.userEquipment.includes(eq));
  });

  // Filter by goal
  const goalFiltered = equipmentFiltered.filter((ex) => {
    if (ex.goal_tags.length === 0) return true;
    return ex.goal_tags.includes(state.userGoal);
  });

  // Filter out already done this session (allow repeats if < 3 done)
  const notDone = state.exercisesDoneThisSession.length < 3
    ? goalFiltered
    : goalFiltered.filter((ex) => !state.exercisesDoneThisSession.includes(ex.id));

  // Fetch all muscle engagements for candidates in one query
  const candidateIds = notDone.map((ex) => ex.id);
  const { data: allEngagements } = await supabase
    .from("exercise_muscle_engagement")
    .select("exercise_id, body_section_id, engagement_level")
    .in("exercise_id", candidateIds);

  const engagementMap = new Map<string, Array<{ body_section_id: string; engagement_level: number }>>();
  for (const eng of allEngagements ?? []) {
    const list = engagementMap.get(eng.exercise_id) ?? [];
    list.push({ body_section_id: eng.body_section_id, engagement_level: eng.engagement_level });
    engagementMap.set(eng.exercise_id, list);
  }

  // Injury filter
  const safeExercises = notDone.filter((ex) => {
    const engagements = engagementMap.get(ex.id) ?? [];
    return isExerciseSafe(engagements, state.injuryStates);
  });

  if (safeExercises.length === 0) return null;

  // Fetch user history for scoring
  const { data: history } = await supabase
    .from("user_exercise_history")
    .select("*")
    .eq("user_id", state.userId)
    .in("exercise_id", safeExercises.map((ex) => ex.id));

  const historyMap = new Map(history?.map((h) => [h.exercise_id, h]) ?? []);

  // Score each exercise
  const now = Date.now();
  const scored = safeExercises
    .filter((ex) => {
      const h = historyMap.get(ex.id);
      if (h?.is_excluded) return false;
      if (h?.user_rating !== null && h?.user_rating !== undefined && h.user_rating < 2) return false;
      return true;
    })
    .map((ex) => {
      const h = historyMap.get(ex.id);
      let score = 50; // base score

      // Cold start boost
      if (!h || h.times_performed === 0) {
        score += 20;
      } else {
        // Recency penalty (higher time since last = higher score)
        if (h.last_performed_at) {
          const daysSinceLast = (now - new Date(h.last_performed_at).getTime()) / (1000 * 60 * 60 * 24);
          score += Math.min(daysSinceLast * 2, 30);
        }

        // Familiarity penalty (more performed = slightly deprioritize to vary)
        score -= Math.min(h.times_performed * 0.5, 10);

        // Low rating deprioritize
        if (h.user_rating !== null && h.user_rating < 3) {
          score -= 15;
        }
      }

      // Difficulty scoring: prefer exercises near user's current level
      // intensity_preference maps to difficulty roughly
      const targetDifficulty = state.intensityPreference * 8;
      const difficultyDelta = Math.abs(ex.difficulty_level - targetDifficulty);
      score -= difficultyDelta * 3;

      return { exercise: ex, score, history: h ?? null };
    });

  if (scored.length === 0) return null;

  // Sort by score descending, pick top
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  // Fetch personal best for scaling
  const { data: pb } = await supabase
    .from("performance_logs")
    .select("result_value")
    .eq("user_id", state.userId)
    .eq("exercise_id", best.exercise.id)
    .eq("is_personal_best", true)
    .order("result_value", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { prescribed, prescribedDuration } = scalePrescription(
    best.exercise,
    state.intensityPreference,
    pb?.result_value ?? null
  );

  return {
    exercise: best.exercise,
    prescribedReps: prescribed,
    prescribedDuration: prescribedDuration,
    source: "dynamic",
  };
}

function scalePrescription(
  exercise: Database["public"]["Tables"]["exercises"]["Row"],
  intensityPreference: number,
  personalBest: number | null
): { prescribed: number | null; prescribedDuration: number | null } {
  if (exercise.execution_style === "reps" && exercise.target_reps) {
    const personalBestFactor = personalBest ? Math.min((personalBest / exercise.target_reps - 1) * 0.2, 0.3) : 0;
    const prescribed = Math.max(3, Math.round(exercise.target_reps * intensityPreference * (1 + personalBestFactor)));
    return { prescribed, prescribedDuration: null };
  }

  if ((exercise.execution_style === "timed" || exercise.execution_style === "max_hold") && exercise.target_duration) {
    const personalBestFactor = personalBest ? Math.min((personalBest / exercise.target_duration - 1) * 0.2, 0.3) : 0;
    const prescribedDuration = Math.max(10, Math.round(exercise.target_duration * intensityPreference * (1 + personalBestFactor)));
    return { prescribed: null, prescribedDuration };
  }

  if (exercise.execution_style === "failure") {
    return { prescribed: null, prescribedDuration: null };
  }

  return { prescribed: exercise.target_reps, prescribedDuration: exercise.target_duration };
}

export async function generateSession(
  userId: string,
  supabase: DBClient
): Promise<{ sessionId: string; firstExercise: ExerciseRecommendation | null }> {
  // Fetch user profile
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (!user) throw new Error("User not found");

  // Fetch active injury states
  const { data: injuries } = await supabase
    .from("user_injury_states")
    .select("body_section_id, severity")
    .eq("user_id", userId)
    .eq("active", true);

  // Fetch active program enrollments
  const { data: enrollments } = await supabase
    .from("user_program_enrollments")
    .select("program_id, current_step")
    .eq("user_id", userId)
    .eq("active", true);

  // Create session record
  const { data: session, error } = await supabase
    .from("workout_sessions")
    .insert({
      user_id: userId,
      planned_duration: user.duration_preference,
      mode_used: user.mode_preference,
    })
    .select()
    .single();

  if (error || !session) throw new Error("Failed to create session");

  const state: SessionState = {
    userId,
    timeRemainingMinutes: user.duration_preference,
    exercisesDoneThisSession: [],
    activeProgramEnrollments: (enrollments ?? []).map((e) => ({
      programId: e.program_id,
      currentStep: e.current_step,
    })),
    userGoal: user.goal ?? "weight_loss",
    userEquipment: user.equipment ?? [],
    injuryStates: (injuries ?? []).map((i) => ({
      bodySectionId: i.body_section_id,
      severity: i.severity,
    })),
    intensityPreference: user.intensity_preference,
  };

  const firstExercise = await getNextExercise(state, supabase);

  return { sessionId: session.id, firstExercise };
}
