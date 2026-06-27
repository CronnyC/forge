"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Progress from "@/components/ui/Progress";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = 6;

type Goal = "weight_loss" | "muscle_gain" | "strength" | "sport_specific";
type Mode = "dynamic" | "fixed_split" | "template";

const EQUIPMENT_OPTIONS = [
  { id: "pull-up bar", label: "Pull-Up Bar" },
  { id: "dip bars", label: "Dip Bars" },
  { id: "resistance bands", label: "Resistance Bands" },
  { id: "rings", label: "Gymnastics Rings" },
  { id: "dumbbells", label: "Dumbbells" },
];

const GOALS: Array<{ id: Goal; emoji: string; title: string; desc: string }> = [
  { id: "weight_loss", emoji: "🔥", title: "Weight Loss", desc: "Burn fat, move more, feel lighter" },
  { id: "muscle_gain", emoji: "💪", title: "Muscle Gain", desc: "Build visible muscle with bodyweight" },
  { id: "strength", emoji: "⚡", title: "Strength", desc: "Get stronger, unlock advanced moves" },
  { id: "sport_specific", emoji: "🥊", title: "Sport Specific", desc: "MMA, athletics, explosive power" },
];

const INTENSITY_LABELS = ["Easy", "Moderate", "Hard", "Beast"];
const DURATION_OPTIONS = [20, 30, 45, 60];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Stats
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Step 2: Goal
  const [goal, setGoal] = useState<Goal | null>(null);

  // Step 3: Equipment
  const [equipment, setEquipment] = useState<string[]>([]);

  // Step 4: Benchmark
  const [maxPushups, setMaxPushups] = useState("");
  const [plankSeconds, setPlankSeconds] = useState("");
  const [maxPullups, setMaxPullups] = useState("");

  // Step 5: Preferences
  const [frequency, setFrequency] = useState(3);
  const [intensityIdx, setIntensityIdx] = useState(1);
  const [duration, setDuration] = useState(45);

  // Step 6: Mode
  const [mode, setMode] = useState<Mode>("dynamic");

  function toggleEquipment(id: string) {
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  function canProceed() {
    switch (step) {
      case 1: return true;
      case 2: return goal !== null;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      case 6: return true;
      default: return false;
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const intensityMap = [0.5, 0.65, 0.8, 1.0];

    const { error: updateError } = await supabase
      .from("users")
      .update({
        height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        goal: goal!,
        equipment,
        frequency_preference: frequency,
        intensity_preference: intensityMap[intensityIdx],
        duration_preference: duration,
        mode_preference: mode,
        onboarded_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) { setError(updateError.message); setLoading(false); return; }

    // Seed benchmark performance logs
    const benchmarks = [
      { name: "Push-Up", val: parseFloat(maxPushups) || 0 },
      { name: "Plank", val: parseFloat(plankSeconds) || 0 },
      { name: "Pull-Up", val: parseFloat(maxPullups) || 0 },
    ];

    // Create a dummy session for benchmarks
    const { data: session } = await supabase
      .from("workout_sessions")
      .insert({ user_id: user.id, mode_used: "benchmark", planned_duration: 5 })
      .select()
      .single();

    if (session) {
      for (const bm of benchmarks) {
        if (bm.val > 0) {
          const { data: ex } = await supabase
            .from("exercises")
            .select("id")
            .ilike("name", `%${bm.name}%`)
            .limit(1)
            .maybeSingle();

          if (ex) {
            await supabase.from("performance_logs").insert({
              user_id: user.id,
              exercise_id: ex.id,
              session_id: session.id,
              result_value: bm.val,
              is_personal_best: true,
            });
          }
        }
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  function handleNext() {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else handleFinish();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-lg font-black" style={{ color: "var(--accent)" }}>FORGE</span>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>Setup</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <Progress value={(step / TOTAL_STEPS) * 100} className="flex-1" />
          <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
            {step}/{TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pb-6 max-w-lg mx-auto w-full">
        {step === 1 && (
          <StepStats
            heightCm={heightCm} setHeightCm={setHeightCm}
            weightKg={weightKg} setWeightKg={setWeightKg}
            age={age} setAge={setAge}
            gender={gender} setGender={setGender}
          />
        )}
        {step === 2 && (
          <StepGoal goal={goal} setGoal={setGoal} />
        )}
        {step === 3 && (
          <StepEquipment equipment={equipment} toggle={toggleEquipment} />
        )}
        {step === 4 && (
          <StepBenchmark
            maxPushups={maxPushups} setMaxPushups={setMaxPushups}
            plankSeconds={plankSeconds} setPlankSeconds={setPlankSeconds}
            maxPullups={maxPullups} setMaxPullups={setMaxPullups}
          />
        )}
        {step === 5 && (
          <StepPreferences
            frequency={frequency} setFrequency={setFrequency}
            intensityIdx={intensityIdx} setIntensityIdx={setIntensityIdx}
            duration={duration} setDuration={setDuration}
          />
        )}
        {step === 6 && (
          <StepMode mode={mode} setMode={setMode} />
        )}

        {error && (
          <p className="mt-4 text-sm px-3 py-2 rounded-lg" style={{ background: "rgba(192,52,29,0.1)", color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-8 max-w-lg mx-auto w-full">
        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} disabled={loading}>
              Back
            </Button>
          )}
          <Button
            size="lg"
            fullWidth
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? "Saving…" : step === TOTAL_STEPS ? "Start Training" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---- Step sub-components ----

function StepStats({ heightCm, setHeightCm, weightKg, setWeightKg, age, setAge, gender, setGender }: {
  heightCm: string; setHeightCm: (v: string) => void;
  weightKg: string; setWeightKg: (v: string) => void;
  age: string; setAge: (v: string) => void;
  gender: string; setGender: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>About you</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>All fields optional — helps us personalize workouts.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Height (cm)" type="number" value={heightCm} onChange={setHeightCm} placeholder="175" />
        <FormField label="Weight (kg)" type="number" value={weightKg} onChange={setWeightKg} placeholder="75" />
        <FormField label="Age" type="number" value={age} onChange={setAge} placeholder="28" />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>Gender</label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-3 rounded-xl text-sm outline-none"
            style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function StepGoal({ goal, setGoal }: { goal: Goal | null; setGoal: (g: Goal) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Your primary goal</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>FORGE will optimize every session around this.</p>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {GOALS.map((g) => (
          <button
            key={g.id}
            onClick={() => setGoal(g.id)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
              goal === g.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--surface)]"
            )}
          >
            <span className="text-3xl">{g.emoji}</span>
            <div>
              <div className="font-bold" style={{ color: "var(--text)" }}>{g.title}</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>{g.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepEquipment({ equipment, toggle }: { equipment: string[]; toggle: (id: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Available equipment</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>FORGE defaults to pure bodyweight. Select what you have.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {EQUIPMENT_OPTIONS.map((eq) => (
          <button
            key={eq.id}
            onClick={() => toggle(eq.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold border transition-all",
              equipment.includes(eq.id)
                ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
            )}
          >
            {eq.label}
          </button>
        ))}
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        Nothing selected = pure bodyweight. You can always update this later.
      </p>
    </div>
  );
}

function StepBenchmark({ maxPushups, setMaxPushups, plankSeconds, setPlankSeconds, maxPullups, setMaxPullups }: {
  maxPushups: string; setMaxPushups: (v: string) => void;
  plankSeconds: string; setPlankSeconds: (v: string) => void;
  maxPullups: string; setMaxPullups: (v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Starting point</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          FORGE uses these to calibrate your first session. No pressure — just your honest best.
        </p>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">💪</span>
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>Max Push-Ups</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Standard form, no stopping</div>
            </div>
          </div>
          <FormField label="Reps" type="number" value={maxPushups} onChange={setMaxPushups} placeholder="0 if none" />
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">⏱</span>
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>Plank Hold</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Forearm plank, hold as long as possible</div>
            </div>
          </div>
          <FormField label="Seconds" type="number" value={plankSeconds} onChange={setPlankSeconds} placeholder="0 if unsure" />
        </div>

        <div className="p-4 rounded-2xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">🏋️</span>
            <div>
              <div className="font-semibold" style={{ color: "var(--text)" }}>Max Pull-Ups</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Skip if no bar (enter 0)</div>
            </div>
          </div>
          <FormField label="Reps" type="number" value={maxPullups} onChange={setMaxPullups} placeholder="0 if none/no bar" />
        </div>
      </div>
    </div>
  );
}

function StepPreferences({ frequency, setFrequency, intensityIdx, setIntensityIdx, duration, setDuration }: {
  frequency: number; setFrequency: (v: number) => void;
  intensityIdx: number; setIntensityIdx: (v: number) => void;
  duration: number; setDuration: (v: number) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Your preferences</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>These shape every session FORGE builds for you.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Weekly frequency — {frequency}x/week
        </label>
        <input
          type="range" min={2} max={6} value={frequency}
          onChange={(e) => setFrequency(Number(e.target.value))}
          className="w-full accent-[var(--accent)]"
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          <span>2x</span><span>4x</span><span>6x</span>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Intensity — {INTENSITY_LABELS[intensityIdx]}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {INTENSITY_LABELS.map((label, idx) => (
            <button
              key={label}
              onClick={() => setIntensityIdx(idx)}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold border transition-all",
                intensityIdx === idx
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          Session duration — {duration} min
        </label>
        <div className="grid grid-cols-4 gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={cn(
                "py-2 rounded-xl text-sm font-semibold border transition-all",
                duration === d
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              )}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepMode({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  const modes: Array<{ id: Mode; title: string; desc: string; badge?: string }> = [
    { id: "dynamic", title: "Dynamic (AI)", desc: "FORGE picks every exercise based on your goal, history, and feedback. Zero decisions.", badge: "Recommended" },
    { id: "fixed_split", title: "Fixed Split", desc: "Push/Pull/Legs structure. FORGE picks exercises within each day's muscle group." },
    { id: "template", title: "Template", desc: "Follow a curated program. Great for skill progressions like handstands or pull-ups." },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>How should FORGE decide?</h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>You can change this any time in your profile.</p>
      </div>
      <div className="space-y-3">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all",
              mode === m.id
                ? "border-[var(--accent)] bg-[var(--accent)]/10"
                : "border-[var(--border)] bg-[var(--surface)]"
            )}
          >
            <div className={cn("w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center", mode === m.id ? "border-[var(--accent)]" : "border-[var(--border)]")}>
              {mode === m.id && <div className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent)" }} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold" style={{ color: "var(--text)" }}>{m.title}</span>
                {m.badge && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: "var(--accent2)/20", color: "var(--accent2)" }}>
                    {m.badge}
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function FormField({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
        style={{ background: "var(--surface2)", color: "var(--text)", border: "1px solid var(--border)" }}
        placeholder={placeholder}
      />
    </div>
  );
}
