"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, Star, SkipForward, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { formatDuration, cn } from "@/lib/utils";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  execution_style: "reps" | "timed" | "failure" | "max_hold";
  target_reps: number | null;
  target_duration: number | null;
  easier_variant_id: string | null;
  harder_variant_id: string | null;
  demo_media_ref: string | null;
  difficulty_level: number;
  equipment_required: string[];
}

interface ExerciseRecommendation {
  exercise: Exercise;
  prescribedReps: number | null;
  prescribedDuration: number | null;
  source: "program" | "dynamic";
}

interface CompletedExercise {
  id: string;
  name: string;
  repsAchieved?: number;
  durationAchieved?: number;
  rating?: number;
}

type SessionPhase = "pre" | "active" | "rest" | "injury-picker" | "post-set" | "done";

const BODY_SECTIONS = [
  { id: "chest", label: "Chest" }, { id: "upper_back", label: "Upper Back" },
  { id: "lower_back", label: "Lower Back" }, { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" },
  { id: "core", label: "Core" }, { id: "glutes", label: "Glutes" },
  { id: "quads", label: "Quads" }, { id: "hamstrings", label: "Hamstrings" },
  { id: "calves", label: "Calves" }, { id: "forearms", label: "Forearms" },
];

export default function SessionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>("pre");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ExerciseRecommendation | null>(null);
  const [nextExercise, setNextExercise] = useState<ExerciseRecommendation | null>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [restTime, setRestTime] = useState(60);
  const [restTotal, setRestTotal] = useState(60);
  const [repsAchieved, setRepsAchieved] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedElapsed, setTimedElapsed] = useState(0);
  const [timedRunning, setTimedRunning] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [injuryStates, setInjuryStates] = useState<Array<{ bodySectionId: string; severity: number }>>([]);
  const [userProfile, setUserProfile] = useState<{ duration_preference: number; goal: string | null; intensity_preference: number; equipment: string[] } | null>(null);
  const prefetchedRef = useRef(false);

  // Fetch user profile on mount
  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("duration_preference,goal,intensity_preference,equipment").eq("id", user.id).single();
      if (profile) setUserProfile(profile);
      // Fetch injury states
      const { data: injuries } = await supabase.from("user_injury_states").select("body_section_id,severity").eq("user_id", user.id).eq("active", true);
      if (injuries) setInjuryStates(injuries.map(i => ({ bodySectionId: i.body_section_id, severity: i.severity })));
    }
    fetchProfile();
  }, []);

  // Rest timer
  useEffect(() => {
    if (phase !== "rest") return;
    if (restTime <= 0) {
      setPhase("active");
      if (nextExercise) {
        setCurrentExercise(nextExercise);
        setNextExercise(null);
        setTimedElapsed(0);
        setTimedRunning(false);
      }
      return;
    }
    const t = setTimeout(() => setRestTime((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, restTime, nextExercise]);

  // Timed exercise
  useEffect(() => {
    if (!timedRunning) return;
    const t = setTimeout(() => setTimedElapsed((e) => e + 1), 1000);
    return () => clearTimeout(t);
  }, [timedRunning, timedElapsed]);

  async function startSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/session/generate", { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate session");
      const data = await res.json();
      setSessionId(data.sessionId);
      setCurrentExercise(data.firstExercise);
      setSessionStart(Date.now());
      setPhase("active");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNextExercise(excludeId?: string) {
    if (!sessionId) return null;
    const doneIds = completedExercises.map(e => e.id);
    if (excludeId) doneIds.push(excludeId);

    const res = await fetch("/api/session/next-exercise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        exercisesDone: doneIds,
        injuryStates,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.exercise as ExerciseRecommendation | null;
  }

  async function handleDoneWithSet() {
    if (!currentExercise || !sessionId) return;
    const ex = currentExercise.exercise;

    // Log performance
    const achieved = repsAchieved ? parseFloat(repsAchieved) : (currentExercise.prescribedReps ?? currentExercise.prescribedDuration ?? timedElapsed);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check personal best
    const { data: pb } = await supabase.from("performance_logs")
      .select("result_value")
      .eq("user_id", user.id)
      .eq("exercise_id", ex.id)
      .order("result_value", { ascending: false })
      .limit(1)
      .maybeSingle();

    const isPB = achieved > (pb?.result_value ?? 0);

    await supabase.from("performance_logs").insert({
      user_id: user.id,
      exercise_id: ex.id,
      session_id: sessionId,
      result_value: achieved,
      is_personal_best: isPB,
    });

    // Update history
    await supabase.from("user_exercise_history").upsert({
      user_id: user.id,
      exercise_id: ex.id,
      last_performed_at: new Date().toISOString(),
      times_performed: 1,
    }, { onConflict: "user_id,exercise_id", ignoreDuplicates: false });

    const completed: CompletedExercise = {
      id: ex.id,
      name: ex.name,
      repsAchieved: ex.execution_style === "reps" ? achieved : undefined,
      durationAchieved: (ex.execution_style === "timed" || ex.execution_style === "max_hold") ? achieved : undefined,
    };
    setCompletedExercises((prev) => [...prev, completed]);
    setRepsAchieved("");
    setTimedElapsed(0);
    setTimedRunning(false);

    // Start rest, prefetch next
    setRestTime(60);
    setRestTotal(60);
    setPhase("rest");
    prefetchedRef.current = false;

    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      fetchNextExercise(ex.id).then((next) => {
        if (next) setNextExercise(next);
      });
    }
  }

  async function handleTooEasy() {
    if (!currentExercise?.exercise.harder_variant_id) return;
    const supabase = createClient();
    const { data: harder } = await supabase.from("exercises").select("*").eq("id", currentExercise.exercise.harder_variant_id).single();
    if (harder) {
      setCurrentExercise({
        ...currentExercise,
        exercise: harder,
        prescribedReps: currentExercise.prescribedReps,
        prescribedDuration: currentExercise.prescribedDuration,
      });
    }
  }

  async function handleTooHard() {
    if (!currentExercise?.exercise.easier_variant_id) return;
    const supabase = createClient();
    const { data: easier } = await supabase.from("exercises").select("*").eq("id", currentExercise.exercise.easier_variant_id).single();
    if (easier) {
      setCurrentExercise({
        ...currentExercise,
        exercise: easier,
        prescribedReps: currentExercise.prescribedReps,
        prescribedDuration: currentExercise.prescribedDuration,
      });
    }
  }

  async function handleHurts(bodySectionId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: bs } = await supabase.from("body_sections").select("id").eq("name", bodySectionId).single();
    if (!bs) return;

    await supabase.from("user_injury_states").insert({
      user_id: user.id,
      body_section_id: bs.id,
      severity: 2,
      active: true,
    });

    setInjuryStates((prev) => [...prev, { bodySectionId: bs.id, severity: 2 }]);
    setPhase("active");

    // Get a different exercise
    const next = await fetchNextExercise(currentExercise?.exercise.id);
    if (next) setCurrentExercise(next);
  }

  async function handleFinishSession() {
    if (!sessionId || !sessionStart) return;
    setLoading(true);

    const actualDuration = Math.round((Date.now() - sessionStart) / 60000);

    // Save ratings
    const supabase = createClient();
    for (const [exId, rating] of Object.entries(ratings)) {
      await supabase.from("user_exercise_history").upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id ?? "",
        exercise_id: exId,
        user_rating: rating,
        times_performed: 1,
      }, { onConflict: "user_id,exercise_id" });
    }

    await fetch("/api/session/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        actualDuration,
        exercisesCompleted: completedExercises,
      }),
    });

    router.push("/dashboard");
  }

  // ─── PRE-SESSION ───────────────────────────────────────────────────────────
  if (phase === "pre") {
    return (
      <div className="min-h-screen flex flex-col px-4 pt-8 pb-6 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>New Session</h1>
          <button onClick={() => router.back()} style={{ color: "var(--text-muted)" }}>
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <div className="rounded-3xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                Session Plan
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }} className="text-sm">Duration</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{userProfile?.duration_preference ?? 45} min</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }} className="text-sm">Mode</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>AI Dynamic</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-muted)" }} className="text-sm">Goal</span>
                <span className="font-semibold" style={{ color: "var(--text)" }}>{userProfile?.goal?.replace("_", " ") ?? "General"}</span>
              </div>
              {injuryStates.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <AlertTriangle size={14} style={{ color: "var(--accent2)" }} />
                  <span className="text-sm" style={{ color: "var(--accent2)" }}>
                    {injuryStates.length} area(s) will be avoided
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "rgba(192,52,29,0.08)", border: "1px solid rgba(192,52,29,0.2)" }}>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              FORGE will pick every exercise based on your history and goal. Hit <strong style={{ color: "var(--text)" }}>Too Easy</strong> or <strong style={{ color: "var(--text)" }}>Too Hard</strong> during the session to adapt instantly.
            </p>
          </div>
        </div>

        {error && <p className="text-sm py-2 px-3 rounded-lg mb-3" style={{ background: "rgba(192,52,29,0.1)", color: "var(--danger)" }}>{error}</p>}

        <Button size="xl" fullWidth onClick={startSession} disabled={loading}>
          {loading ? "Building your session…" : "Begin Session"}
        </Button>
      </div>
    );
  }

  // ─── DONE ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const rateThese = completedExercises.slice(-3);
    const duration = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : 0;

    return (
      <div className="min-h-screen flex flex-col px-4 pt-8 pb-6 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <CheckCircle size={56} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
          <h1 className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>Session Complete</h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            {completedExercises.length} exercises · {duration} min
          </p>
        </div>

        <div className="rounded-2xl p-4 mb-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
            Rate these exercises
          </h3>
          <div className="space-y-4">
            {rateThese.map((ex) => (
              <div key={ex.id} className="space-y-2">
                <p className="font-semibold text-sm" style={{ color: "var(--text)" }}>{ex.name}</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRatings((r) => ({ ...r, [ex.id]: star }))}
                      className="transition-all"
                    >
                      <Star
                        size={28}
                        fill={(ratings[ex.id] ?? 0) >= star ? "var(--accent2)" : "none"}
                        color={(ratings[ex.id] ?? 0) >= star ? "var(--accent2)" : "var(--border)"}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button size="lg" fullWidth onClick={handleFinishSession} disabled={loading}>
          {loading ? "Saving…" : "Finish & Return Home"}
        </Button>
      </div>
    );
  }

  // ─── INJURY PICKER ────────────────────────────────────────────────────────
  if (phase === "injury-picker") {
    return (
      <div className="min-h-screen flex flex-col px-4 pt-8 pb-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Where does it hurt?</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>FORGE will avoid these areas for the rest of this session.</p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {BODY_SECTIONS.map((bs) => (
            <button
              key={bs.id}
              onClick={() => handleHurts(bs.id)}
              className="py-3 px-2 rounded-xl text-sm font-semibold border transition-all"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {bs.label}
            </button>
          ))}
        </div>
        <Button variant="ghost" fullWidth onClick={() => setPhase("active")}>
          Cancel — nothing hurts
        </Button>
      </div>
    );
  }

  // ─── REST PHASE ───────────────────────────────────────────────────────────
  if (phase === "rest") {
    const progress = (restTime / restTotal) * 100;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-6 max-w-lg mx-auto gap-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>Rest</p>
          <div className="relative w-40 h-40 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface2)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke="var(--accent)" strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-black" style={{ color: "var(--text)" }}>{restTime}</span>
            </div>
          </div>
        </div>

        {nextExercise && (
          <div className="w-full rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Up next</p>
            <div className="flex items-center justify-between">
              <p className="font-bold" style={{ color: "var(--text)" }}>{nextExercise.exercise.name}</p>
              <span className="text-sm font-semibold" style={{ color: "var(--accent2)" }}>
                {nextExercise.prescribedReps ? `${nextExercise.prescribedReps} reps` : nextExercise.prescribedDuration ? `${nextExercise.prescribedDuration}s` : "Max"}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              setRestTime(0);
            }}
          >
            <SkipForward size={16} />
            Skip Rest
          </Button>
          <Button
            variant="ghost"
            onClick={() => { setPhase("done"); }}
          >
            End Session
          </Button>
        </div>
      </div>
    );
  }

  // ─── ACTIVE PHASE ────────────────────────────────────────────────────────
  const ex = currentExercise?.exercise;
  if (!ex) return null;

  const elapsed = sessionStart ? Math.floor((Date.now() - sessionStart) / 60000) : 0;
  const totalDuration = userProfile?.duration_preference ?? 45;

  const isTimed = ex.execution_style === "timed" || ex.execution_style === "max_hold";
  const isFailure = ex.execution_style === "failure";
  const targetTime = currentExercise?.prescribedDuration ?? ex.target_duration ?? 30;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Session header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.min(100, (elapsed / totalDuration) * 100)}%`, background: "var(--accent)" }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums" style={{ color: "var(--text-muted)" }}>
              {elapsed}m / {totalDuration}m
            </span>
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {completedExercises.length} done this session
          </p>
        </div>
        <button onClick={() => setPhase("done")} style={{ color: "var(--text-muted)" }}>
          <X size={22} />
        </button>
      </div>

      {/* Exercise content */}
      <div className="flex-1 px-4 py-6 space-y-5">
        {/* Exercise image placeholder */}
        <div className="w-full h-44 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "var(--surface)" }}>
          {ex.demo_media_ref ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ex.demo_media_ref}
              alt={ex.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="text-6xl">💪</div>
          )}
        </div>

        {/* Exercise name & prescription */}
        <div>
          <h2 className="text-3xl font-black" style={{ color: "var(--text)" }}>{ex.name}</h2>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
              {currentExercise?.prescribedReps
                ? `${currentExercise.prescribedReps} reps`
                : currentExercise?.prescribedDuration
                ? `${currentExercise.prescribedDuration}s`
                : isFailure
                ? "To failure"
                : "Max effort"}
            </span>
            <span className="text-xs px-2 py-1 rounded-lg uppercase tracking-wide font-semibold" style={{ background: "var(--surface2)", color: "var(--text-muted)" }}>
              Difficulty {ex.difficulty_level}/10
            </span>
          </div>
        </div>

        {ex.description && (
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>{ex.description}</p>
        )}

        {/* Timed exercise controls */}
        {isTimed && (
          <div className="rounded-2xl p-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="text-center mb-3">
              <span className="text-5xl font-black tabular-nums" style={{ color: "var(--text)" }}>
                {formatDuration(timedElapsed)}
              </span>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                Target: {formatDuration(targetTime)}
              </p>
            </div>
            <Button
              variant={timedRunning ? "secondary" : "primary"}
              fullWidth
              onClick={() => setTimedRunning((r) => !r)}
            >
              {timedRunning ? "Pause" : timedElapsed > 0 ? "Resume" : "Start Timer"}
            </Button>
          </div>
        )}

        {/* Reps input */}
        {!isTimed && !isFailure && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
              Reps achieved (optional)
            </label>
            <input
              type="number"
              value={repsAchieved}
              onChange={(e) => setRepsAchieved(e.target.value)}
              placeholder={String(currentExercise?.prescribedReps ?? "0")}
              className="w-full px-4 py-3 rounded-xl text-lg font-bold text-center outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
            />
          </div>
        )}
      </div>

      {/* Adaptation buttons */}
      <div className="px-4 pb-6 space-y-3">
        <Button
          size="xl"
          fullWidth
          onClick={handleDoneWithSet}
          className="text-white"
        >
          <CheckCircle size={20} />
          Done with set
        </Button>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleTooEasy}
            disabled={!ex.harder_variant_id}
            className={cn(
              "py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
              ex.harder_variant_id
                ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-40"
            )}
          >
            Too Easy ↑
          </button>
          <button
            onClick={() => setPhase("injury-picker")}
            className="py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border border-[var(--accent2)]/40 bg-[var(--accent2)]/10 text-[var(--accent2)] transition-all"
          >
            Hurts
          </button>
          <button
            onClick={handleTooHard}
            disabled={!ex.easier_variant_id}
            className={cn(
              "py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
              ex.easier_variant_id
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-40"
            )}
          >
            Too Hard ↓
          </button>
        </div>
      </div>
    </div>
  );
}
