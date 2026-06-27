"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Star, SkipForward, AlertTriangle, CheckCircle, Zap, Play, Pause } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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

type SessionPhase = "pre" | "active" | "rest" | "injury-picker" | "done";

const BODY_SECTIONS = [
  { id: "chest", label: "Chest" }, { id: "upper_back", label: "Upper Back" },
  { id: "lower_back", label: "Lower Back" }, { id: "shoulders", label: "Shoulders" },
  { id: "biceps", label: "Biceps" }, { id: "triceps", label: "Triceps" },
  { id: "core", label: "Core" }, { id: "glutes", label: "Glutes" },
  { id: "quads", label: "Quads" }, { id: "hamstrings", label: "Hamstrings" },
  { id: "calves", label: "Calves" }, { id: "forearms", label: "Forearms" },
];

const CIRCUMFERENCE = 2 * Math.PI * 45; // r=45

export default function SessionPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<SessionPhase>("pre");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [currentExercise, setCurrentExercise] = useState<ExerciseRecommendation | null>(null);
  const [nextExercise, setNextExercise] = useState<ExerciseRecommendation | null>(null);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [restTime, setRestTime] = useState(60);
  const [restTotal] = useState(60);
  const [repsAchieved, setRepsAchieved] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedElapsed, setTimedElapsed] = useState(0);
  const [timedRunning, setTimedRunning] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [injuryStates, setInjuryStates] = useState<Array<{ bodySectionId: string; severity: number }>>([]);
  const [userProfile, setUserProfile] = useState<{ duration_preference: number; goal: string | null; intensity_preference: number; equipment: string[] } | null>(null);
  const [exerciseKey, setExerciseKey] = useState(0); // for animation trigger
  const prefetchedRef = useRef(false);
  const [elapsed, setElapsed] = useState(0); // minutes elapsed

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("users").select("duration_preference,goal,intensity_preference,equipment").eq("id", user.id).single();
      if (profile) setUserProfile(profile);
      const { data: injuries } = await supabase.from("user_injury_states").select("body_section_id,severity").eq("user_id", user.id).eq("active", true);
      if (injuries) setInjuryStates(injuries.map(i => ({ bodySectionId: i.body_section_id, severity: i.severity })));
    }
    fetchProfile();
  }, []);

  // Session clock
  useEffect(() => {
    if (!sessionStart || phase === "pre" || phase === "done") return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 60000));
    }, 10000);
    return () => clearInterval(t);
  }, [sessionStart, phase]);

  // Rest timer
  useEffect(() => {
    if (phase !== "rest") return;
    if (restTime <= 0) {
      setPhase("active");
      if (nextExercise) {
        setCurrentExercise(nextExercise);
        setNextExercise(null);
        setExerciseKey((k) => k + 1);
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
      setExerciseKey(1);
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
      body: JSON.stringify({ sessionId, exercisesDone: doneIds, injuryStates }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.exercise as ExerciseRecommendation | null;
  }

  async function handleDoneWithSet() {
    if (!currentExercise || !sessionId) return;
    const ex = currentExercise.exercise;
    const achieved = repsAchieved
      ? parseFloat(repsAchieved)
      : (currentExercise.prescribedReps ?? currentExercise.prescribedDuration ?? timedElapsed ?? 1);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: pb } = await supabase.from("performance_logs")
      .select("result_value").eq("user_id", user.id).eq("exercise_id", ex.id)
      .order("result_value", { ascending: false }).limit(1).maybeSingle();

    const isPB = achieved > (pb?.result_value ?? 0);

    await supabase.from("performance_logs").insert({
      user_id: user.id, exercise_id: ex.id, session_id: sessionId,
      result_value: achieved, is_personal_best: isPB,
    });

    await supabase.from("user_exercise_history").upsert({
      user_id: user.id, exercise_id: ex.id,
      last_performed_at: new Date().toISOString(), times_performed: 1,
    }, { onConflict: "user_id,exercise_id" });

    const completed: CompletedExercise = {
      id: ex.id, name: ex.name,
      repsAchieved: ex.execution_style === "reps" ? achieved : undefined,
      durationAchieved: (ex.execution_style === "timed" || ex.execution_style === "max_hold") ? timedElapsed || achieved : undefined,
    };
    setCompletedExercises((prev) => [...prev, completed]);
    setRepsAchieved("");
    setTimedElapsed(0);
    setTimedRunning(false);
    setRestTime(60);
    setPhase("rest");
    prefetchedRef.current = false;

    if (!prefetchedRef.current) {
      prefetchedRef.current = true;
      fetchNextExercise(ex.id).then((next) => { if (next) setNextExercise(next); });
    }
  }

  async function handleTooEasy() {
    if (!currentExercise?.exercise.harder_variant_id) return;
    const supabase = createClient();
    const { data: harder } = await supabase.from("exercises").select("*").eq("id", currentExercise.exercise.harder_variant_id).single();
    if (harder) { setCurrentExercise({ ...currentExercise, exercise: harder }); setExerciseKey((k) => k + 1); }
  }

  async function handleTooHard() {
    if (!currentExercise?.exercise.easier_variant_id) return;
    const supabase = createClient();
    const { data: easier } = await supabase.from("exercises").select("*").eq("id", currentExercise.exercise.easier_variant_id).single();
    if (easier) { setCurrentExercise({ ...currentExercise, exercise: easier }); setExerciseKey((k) => k + 1); }
  }

  async function handleHurts(bodySectionId: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: bs } = await supabase.from("body_sections").select("id").eq("name", bodySectionId).single();
    if (!bs) return;
    await supabase.from("user_injury_states").insert({ user_id: user.id, body_section_id: bs.id, severity: 2, active: true });
    setInjuryStates((prev) => [...prev, { bodySectionId: bs.id, severity: 2 }]);
    setPhase("active");
    const next = await fetchNextExercise(currentExercise?.exercise.id);
    if (next) { setCurrentExercise(next); setExerciseKey((k) => k + 1); }
  }

  async function handleFinishSession() {
    if (!sessionId || !sessionStart) return;
    setLoading(true);
    const actualDuration = Math.round((Date.now() - sessionStart) / 60000);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      for (const [exId, rating] of Object.entries(ratings)) {
        await supabase.from("user_exercise_history").upsert({
          user_id: user.id, exercise_id: exId, user_rating: rating, times_performed: 1,
        }, { onConflict: "user_id,exercise_id" });
      }
    }
    await fetch("/api/session/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, actualDuration, exercisesCompleted: completedExercises }),
    });
    router.push("/dashboard");
  }

  const totalDuration = userProfile?.duration_preference ?? 45;
  const progressPct = Math.min(100, (elapsed / totalDuration) * 100);
  const ringOffset = CIRCUMFERENCE - (progressPct / 100) * CIRCUMFERENCE;

  // ── PRE-SESSION ──────────────────────────────────────────────────────────
  if (phase === "pre") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col px-4 pt-8 pb-6 max-w-lg mx-auto"
      >
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>New Session</h1>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => router.back()} style={{ color: "var(--text-muted)" }}>
            <X size={24} />
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col gap-5">
          <div
            className="rounded-3xl p-6 border"
            style={{ background: "var(--glass-bg)", backdropFilter: "blur(18px)", WebkitBackdropFilter: "blur(18px)", borderColor: "var(--glass-border)" }}
          >
            <div className="flex items-center gap-2 mb-5">
              <Zap size={16} style={{ color: "var(--accent)" }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Session Plan</span>
            </div>
            <div className="space-y-3">
              {[
                ["Duration", `${totalDuration} min`],
                ["Mode", "AI Dynamic"],
                ["Goal", userProfile?.goal?.replace("_", " ") ?? "General"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center py-2 border-b" style={{ borderColor: "var(--border)" }}>
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>{label}</span>
                  <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
              {injuryStates.length > 0 && (
                <div className="flex items-center gap-2 pt-1">
                  <AlertTriangle size={13} style={{ color: "var(--accent2)" }} />
                  <span className="text-sm" style={{ color: "var(--accent2)" }}>
                    {injuryStates.length} area{injuryStates.length !== 1 ? "s" : ""} avoided
                  </span>
                </div>
              )}
            </div>
          </div>

          <div
            className="rounded-2xl p-4 text-sm leading-relaxed"
            style={{ background: "rgba(46,143,166,0.07)", border: "1px solid rgba(46,143,166,0.15)", color: "var(--text-muted)" }}
          >
            FORMA scores every exercise against your history and adapts on the fly. Hit{" "}
            <strong style={{ color: "var(--text)" }}>Too Easy</strong>,{" "}
            <strong style={{ color: "var(--text)" }}>Too Hard</strong>, or{" "}
            <strong style={{ color: "var(--text)" }}>Hurts</strong> to recalibrate instantly.
          </div>
        </div>

        {error && (
          <p className="text-sm py-2 px-3 rounded-lg mb-3" style={{ background: "rgba(192,69,58,0.1)", color: "var(--danger)" }}>{error}</p>
        )}

        <motion.div whileTap={{ scale: 0.98 }}>
          <Button size="xl" fullWidth onClick={startSession} disabled={loading} className="btn-glow">
            {loading ? "Building session…" : "Begin Session"}
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const rateThese = completedExercises.slice(-3);
    const duration = sessionStart ? Math.round((Date.now() - sessionStart) / 60000) : 0;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col px-4 pt-10 pb-6 max-w-lg mx-auto"
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: "rgba(76,175,125,0.15)", border: "2px solid var(--success)" }}>
            <CheckCircle size={40} style={{ color: "var(--success)" }} />
          </div>
          <h1 className="text-3xl font-black mb-1" style={{ color: "var(--text)" }}>Session Complete</h1>
          <p style={{ color: "var(--text-muted)" }} className="text-sm">
            {completedExercises.length} sets · {duration} min · done
          </p>
        </motion.div>

        <div className="rounded-2xl p-5 mb-6 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: "var(--text-muted)" }}>
            Rate these exercises
          </h3>
          <div className="space-y-5">
            {rateThese.map((ex, i) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <p className="font-semibold text-sm mb-2" style={{ color: "var(--text)" }}>{ex.name}</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => setRatings((r) => ({ ...r, [ex.id]: star }))}
                    >
                      <Star
                        size={30}
                        fill={(ratings[ex.id] ?? 0) >= star ? "var(--accent2)" : "none"}
                        color={(ratings[ex.id] ?? 0) >= star ? "var(--accent2)" : "var(--border)"}
                        style={{ transition: "fill 0.15s, color 0.15s" }}
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <Button size="lg" fullWidth onClick={handleFinishSession} disabled={loading}>
          {loading ? "Saving…" : "Finish & Return Home"}
        </Button>
      </motion.div>
    );
  }

  // ── INJURY PICKER ────────────────────────────────────────────────────────
  if (phase === "injury-picker") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen flex flex-col px-4 pt-8 pb-6 max-w-lg mx-auto"
      >
        <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Where does it hurt?</h2>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          FORMA will avoid these areas for the rest of this session.
        </p>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {BODY_SECTIONS.map((bs) => (
            <motion.button
              key={bs.id}
              whileTap={{ scale: 0.93 }}
              onClick={() => handleHurts(bs.id)}
              className="py-3 px-2 rounded-xl text-sm font-semibold border transition-all hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              {bs.label}
            </motion.button>
          ))}
        </div>
        <Button variant="ghost" fullWidth onClick={() => setPhase("active")}>
          Cancel — nothing hurts
        </Button>
      </motion.div>
    );
  }

  // ── REST PHASE ───────────────────────────────────────────────────────────
  if (phase === "rest") {
    const restProgress = restTime / restTotal;
    const restOffset = CIRCUMFERENCE - restProgress * CIRCUMFERENCE;
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-4 pb-6 max-w-lg mx-auto gap-8"
      >
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: "var(--text-muted)" }}>Rest</p>

          {/* Animated circular countdown */}
          <div className="relative w-44 h-44 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="var(--surface2)" strokeWidth="6" />
              <motion.circle
                cx="50" cy="50" r="45" fill="none"
                stroke="var(--accent)" strokeWidth="6"
                strokeDasharray={CIRCUMFERENCE}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 0 }}
                animate={{ strokeDashoffset: restOffset }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black tabular-nums" style={{ color: "var(--text)" }}>{restTime}</span>
              <span className="text-xs uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>sec</span>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {nextExercise && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full rounded-2xl p-4 border"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Up next</p>
              <div className="flex items-center justify-between">
                <p className="font-bold" style={{ color: "var(--text)" }}>{nextExercise.exercise.name}</p>
                <span className="text-sm font-semibold" style={{ color: "var(--accent2)" }}>
                  {nextExercise.prescribedReps
                    ? `${nextExercise.prescribedReps} reps`
                    : nextExercise.prescribedDuration
                    ? `${nextExercise.prescribedDuration}s`
                    : "Max"}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 w-full">
          <Button variant="secondary" fullWidth onClick={() => setRestTime(0)}>
            <SkipForward size={15} />
            Skip Rest
          </Button>
          <Button variant="ghost" onClick={() => setPhase("done")}>
            End
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── ACTIVE PHASE ─────────────────────────────────────────────────────────
  const ex = currentExercise?.exercise;
  if (!ex) return null;

  const isTimed = ex.execution_style === "timed" || ex.execution_style === "max_hold";
  const isFailure = ex.execution_style === "failure";
  const targetTime = currentExercise?.prescribedDuration ?? ex.target_duration ?? 30;
  const timedProgress = isTimed ? Math.min(1, timedElapsed / targetTime) : 0;
  const timedOffset = CIRCUMFERENCE - timedProgress * CIRCUMFERENCE;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto">
      {/* Session header with progress ring */}
      <div className="px-4 pt-6 pb-3 flex items-center gap-4 border-b" style={{ borderColor: "var(--border)" }}>
        {/* Mini progress ring */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" fill="none" stroke="var(--surface2)" strokeWidth="3" />
            <motion.circle
              cx="20" cy="20" r="16" fill="none"
              stroke="var(--accent)" strokeWidth="3"
              strokeDasharray={2 * Math.PI * 16}
              strokeLinecap="round"
              animate={{ strokeDashoffset: 2 * Math.PI * 16 * (1 - progressPct / 100) }}
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black tabular-nums" style={{ color: "var(--text)" }}>{elapsed}m</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {completedExercises.length} done · {totalDuration - elapsed}m left
            </span>
          </div>
        </div>

        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPhase("done")} style={{ color: "var(--text-muted)" }}>
          <X size={22} />
        </motion.button>
      </div>

      {/* Exercise slide-in card */}
      <div className="flex-1 px-4 py-5 space-y-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={exerciseKey}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Demo image with parallax hint */}
            <motion.div
              className="w-full h-48 rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "var(--surface2)" }}
              whileHover={{ scale: 1.015 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
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
                <div className="flex flex-col items-center gap-2">
                  <span className="text-5xl">💪</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>No image</span>
                </div>
              )}
            </motion.div>

            {/* Name & prescription */}
            <div className="mt-4">
              <h2 className="text-3xl font-black tracking-tight" style={{ color: "var(--text)" }}>{ex.name}</h2>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                  {currentExercise?.prescribedReps
                    ? `${currentExercise.prescribedReps} reps`
                    : currentExercise?.prescribedDuration
                    ? `${currentExercise.prescribedDuration}s`
                    : isFailure
                    ? "To failure"
                    : "Max effort"}
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-lg uppercase tracking-wide font-bold"
                  style={{ background: "var(--surface2)", color: "var(--text-muted)" }}
                >
                  Difficulty {ex.difficulty_level}/10
                </span>
                {currentExercise?.source === "program" && (
                  <span
                    className="text-xs px-2 py-1 rounded-lg uppercase tracking-wide font-bold"
                    style={{ background: "rgba(196,178,138,0.12)", color: "var(--accent2)" }}
                  >
                    Program
                  </span>
                )}
              </div>

              {ex.description && (
                <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {ex.description}
                </p>
              )}
            </div>

            {/* Timed controls */}
            {isTimed && (
              <div className="mt-4 p-4 rounded-2xl flex items-center gap-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {/* Mini circular timer */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface2)" strokeWidth="5" />
                    <motion.circle
                      cx="40" cy="40" r="34" fill="none"
                      stroke="var(--accent2)" strokeWidth="5"
                      strokeDasharray={2 * Math.PI * 34}
                      strokeLinecap="round"
                      animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - timedProgress) }}
                      transition={{ duration: 1, ease: "linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black tabular-nums" style={{ color: "var(--text)" }}>
                      {formatDuration(timedElapsed)}
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
                    Target: {formatDuration(targetTime)}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTimedRunning((r) => !r)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
                    style={{
                      background: timedRunning ? "var(--surface2)" : "var(--accent)",
                      color: "white",
                    }}
                  >
                    {timedRunning ? <Pause size={14} /> : <Play size={14} />}
                    {timedRunning ? "Pause" : timedElapsed > 0 ? "Resume" : "Start"}
                  </motion.button>
                </div>
              </div>
            )}

            {/* Reps input */}
            {!isTimed && !isFailure && (
              <div className="mt-4">
                <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
                  Reps achieved
                </label>
                <input
                  type="number"
                  value={repsAchieved}
                  onChange={(e) => setRepsAchieved(e.target.value)}
                  placeholder={String(currentExercise?.prescribedReps ?? "0")}
                  className="w-full px-4 py-3 rounded-xl text-xl font-black text-center outline-none focus:ring-2 focus:ring-[var(--accent)] tabular-nums"
                  style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
                  inputMode="numeric"
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Adaptation buttons */}
      <div className="px-4 pb-6 space-y-3">
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button size="xl" fullWidth onClick={handleDoneWithSet} className="btn-glow">
            <CheckCircle size={20} />
            Done with set
          </Button>
        </motion.div>

        <div className="grid grid-cols-3 gap-2">
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleTooEasy}
            disabled={!ex.harder_variant_id}
            className={cn(
              "py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
              ex.harder_variant_id
                ? "border-[var(--success)]/40 bg-[var(--success)]/10 text-[var(--success)] hover:bg-[var(--success)]/18"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-35"
            )}
          >
            Too Easy ↑
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={() => setPhase("injury-picker")}
            className="py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border border-[var(--accent2)]/40 bg-[var(--accent2)]/10 text-[var(--accent2)] hover:bg-[var(--accent2)]/18 transition-all"
          >
            Hurts
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={handleTooHard}
            disabled={!ex.easier_variant_id}
            className={cn(
              "py-3 px-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all",
              ex.easier_variant_id
                ? "border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)]/18"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-35"
            )}
          >
            Too Hard ↓
          </motion.button>
        </div>
      </div>
    </div>
  );
}
