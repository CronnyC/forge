export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Calendar, Clock, Zap, Trophy } from "lucide-react";

interface CompletedExercise {
  id: string;
  name: string;
  repsAchieved?: number;
  durationAchieved?: number;
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("date", { ascending: false })
    .limit(50);

  const { data: pbsRaw } = await supabase
    .from("performance_logs")
    .select("id, date, result_value, exercise_id")
    .eq("user_id", user.id)
    .eq("is_personal_best", true)
    .order("date", { ascending: false })
    .limit(10);

  // Fetch exercise names separately to avoid FK join inference issues
  const pbExerciseIds = [...new Set((pbsRaw ?? []).map((p) => p.exercise_id))];
  const { data: pbExercises } = pbExerciseIds.length > 0
    ? await supabase.from("exercises").select("id, name").in("id", pbExerciseIds)
    : { data: [] };
  const pbExMap = new Map((pbExercises ?? []).map((e) => [e.id, e.name]));
  const pbs = (pbsRaw ?? []).map((p) => ({ ...p, exerciseName: pbExMap.get(p.exercise_id) ?? null }));

  const totalSessions = sessions?.length ?? 0;
  const totalMinutes = (sessions ?? []).reduce((sum: number, s) => sum + (s.actual_duration ?? 0), 0);

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>History</h1>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard value={totalSessions} label="Sessions" />
        <StatCard value={totalMinutes} label="Minutes" />
        <StatCard value={pbs?.length ?? 0} label="PRs Set" />
      </div>

      {/* Personal bests */}
      {pbs && pbs.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Personal Bests
          </h2>
          <div className="space-y-2">
            {pbs.map((pb) => (
              <div key={pb.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <Trophy size={16} style={{ color: "var(--accent2)" }} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                    {pb.exerciseName ?? "Exercise"}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(pb.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                <span className="font-bold text-sm tabular-nums" style={{ color: "var(--accent2)" }}>
                  {pb.result_value}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sessions list */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          All Sessions
        </h2>
        {!sessions || sessions.length === 0 ? (
          <div className="py-12 text-center rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <Zap size={32} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-semibold" style={{ color: "var(--text-muted)" }}>No sessions yet</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Complete your first session to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const exercises = (session.exercises_completed as unknown as CompletedExercise[]) ?? [];
              const date = new Date(session.date);
              const dateStr = date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
              const timeStr = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

              return (
                <div
                  key={session.id}
                  className="rounded-2xl p-4 border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-bold" style={{ color: "var(--text)" }}>{dateStr}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          <Calendar size={11} />
                          {timeStr}
                        </span>
                        {session.actual_duration && (
                          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            <Clock size={11} />
                            {session.actual_duration} min
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded-lg capitalize"
                      style={{ background: "var(--surface2)", color: "var(--text-muted)" }}
                    >
                      {session.mode_used}
                    </span>
                  </div>

                  {exercises.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {exercises.map((ex, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: "var(--surface2)", color: "var(--text-muted)" }}
                        >
                          {ex.name}
                          {ex.repsAchieved ? ` ×${ex.repsAchieved}` : ""}
                          {ex.durationAchieved ? ` ${ex.durationAchieved}s` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-2xl font-black" style={{ color: "var(--text)" }}>{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}
