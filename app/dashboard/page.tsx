export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Flame, Zap, ChevronRight, Trophy, Clock } from "lucide-react";
import { getStreakFromSessions } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

const GOAL_LABELS: Record<string, string> = {
  weight_loss: "Fat Burn",
  muscle_gain: "Muscle Builder",
  strength: "Strength",
  sport_specific: "Sport Prep",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarded_at) redirect("/onboarding");

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("date", { ascending: false })
    .limit(10);

  const streak = getStreakFromSessions(sessions ?? []);
  const recentSessions = (sessions ?? []).slice(0, 3);

  const { data: enrollmentsRaw } = await supabase
    .from("user_program_enrollments")
    .select("id, program_id, current_step")
    .eq("user_id", user.id)
    .eq("active", true)
    .limit(2);

  const enrolledProgramIds = (enrollmentsRaw ?? []).map((e) => e.program_id);
  const { data: enrolledPrograms } = enrolledProgramIds.length > 0
    ? await supabase.from("programs").select("id, name, description, target_skill").in("id", enrolledProgramIds)
    : { data: [] };
  const progMap = new Map((enrolledPrograms ?? []).map((p) => [p.id, p]));
  const enrollments = (enrollmentsRaw ?? []).map((e) => ({
    ...e,
    programs: progMap.get(e.program_id) ?? null,
  }));

  const goal = profile.goal ?? "weight_loss";
  const goalLabel = GOAL_LABELS[goal] ?? "Dynamic";

  return (
    <DashboardClient
      streak={streak}
      recentSessions={recentSessions.map((s) => ({
        id: s.id,
        date: s.date,
        actual_duration: s.actual_duration,
        exercises_completed: s.exercises_completed as unknown as Array<{ name: string }>,
      }))}
      enrollments={enrollments}
      goalLabel={goalLabel}
      durationPreference={profile.duration_preference}
    />
  );
}
