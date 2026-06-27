export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Flame, Zap, ChevronRight, Trophy, Clock } from "lucide-react";
import { getStreakFromSessions } from "@/lib/utils";
import BodyHeatmap from "@/components/BodyHeatmap";

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

  // Recent sessions (last 10 for streak, show 3)
  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("date", { ascending: false })
    .limit(10);

  const streak = getStreakFromSessions(sessions ?? []);
  const recentSessions = (sessions ?? []).slice(0, 3);

  // Enrolled programs (fetch separately to avoid FK inference issues)
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
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter" style={{ color: "var(--text)" }}>
            Ready to <span style={{ color: "var(--accent)" }}>FORGE</span>?
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Today&apos;s session: {goalLabel}
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 px-4 py-3 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <Flame size={20} style={{ color: "var(--accent2)" }} />
          <span className="text-2xl font-black" style={{ color: "var(--text)" }}>{streak}</span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>streak</span>
        </div>
      </div>

      {/* Main CTA */}
      <Link href="/dashboard/session">
        <div
          className="relative overflow-hidden rounded-3xl p-6 cursor-pointer"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, #8B2010 100%)" }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={18} className="text-white/80" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/80">
                {profile.duration_preference} min · {goalLabel}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Start Session</h2>
            <p className="text-sm text-white/70">
              FORGE will build your workout in real-time
            </p>
          </div>
          <div className="absolute right-4 bottom-4 opacity-10">
            <Zap size={80} />
          </div>
        </div>
      </Link>

      {/* Body Heatmap */}
      <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Recent Activity
        </h3>
        <BodyHeatmap />
      </div>

      {/* Enrolled Programs */}
      {enrollments && enrollments.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Active Programs
          </h3>
          <div className="space-y-2">
            {enrollments.map((e) => {
              const prog = e.programs;
              return (
                <Link key={e.id} href="/dashboard/programs">
                  <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <Trophy size={16} style={{ color: "var(--accent2)" }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>{prog?.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>Step {e.current_step} in progress</div>
                    </div>
                    <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Recent Sessions
          </h3>
          <Link href="/dashboard/history" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            See all
          </Link>
        </div>
        {recentSessions.length === 0 ? (
          <div className="py-8 text-center rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No sessions yet. Start your first one!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s) => {
              const exs = (s.exercises_completed as unknown as Array<{ name: string }>) ?? [];
              const dateStr = new Date(s.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              return (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <Clock size={16} style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{dateStr}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {exs.length > 0 ? exs.map(e => e.name).join(", ") : "Completed"}
                    </div>
                  </div>
                  {s.actual_duration && (
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{s.actual_duration}m</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
