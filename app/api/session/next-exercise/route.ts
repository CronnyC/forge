import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextExercise, type SessionState } from "@/lib/session-engine";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    sessionId: string;
    exercisesDone: string[];
    injuryStates: Array<{ bodySectionId: string; severity: number }>;
  };

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const { data: enrollments } = await supabase
    .from("user_program_enrollments")
    .select("program_id, current_step")
    .eq("user_id", user.id)
    .eq("active", true);

  const state: SessionState = {
    userId: user.id,
    timeRemainingMinutes: profile.duration_preference - 10,
    exercisesDoneThisSession: body.exercisesDone,
    activeProgramEnrollments: (enrollments ?? []).map((e) => ({
      programId: e.program_id,
      currentStep: e.current_step,
    })),
    userGoal: profile.goal ?? "weight_loss",
    userEquipment: profile.equipment ?? [],
    injuryStates: body.injuryStates,
    intensityPreference: profile.intensity_preference,
  };

  const exercise = await getNextExercise(state, supabase);
  return NextResponse.json({ exercise });
}
