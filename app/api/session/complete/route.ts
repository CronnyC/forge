import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    sessionId: string;
    actualDuration: number;
    exercisesCompleted: Array<{ id: string; name: string; repsAchieved?: number; durationAchieved?: number }>;
  };

  const { error } = await supabase
    .from("workout_sessions")
    .update({
      actual_duration: body.actualDuration,
      exercises_completed: body.exercisesCompleted,
      completed_at: new Date().toISOString(),
    })
    .eq("id", body.sessionId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
