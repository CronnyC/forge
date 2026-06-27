"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { LogOut, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface BodySection {
  id: string;
  name: string;
  display_name: string;
}

interface InjuryState {
  body_section_id: string;
  severity: number;
  id: string;
}

const SEVERITY_LABELS = ["Fine", "Tender", "Injured"];
const SEVERITY_COLORS = ["var(--success)", "var(--accent2)", "var(--danger)"];

const EQUIPMENT_OPTIONS = [
  { id: "pull-up bar", label: "Pull-Up Bar" },
  { id: "dip bars", label: "Dip Bars" },
  { id: "resistance bands", label: "Resistance Bands" },
  { id: "rings", label: "Gymnastics Rings" },
  { id: "dumbbells", label: "Dumbbells" },
];

const GOAL_OPTIONS = [
  { id: "weight_loss", label: "Weight Loss" },
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "strength", label: "Strength" },
  { id: "sport_specific", label: "Sport Specific" },
];

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient(); // safe: only called client-side due to force-dynamic

  const [bodySections, setBodySections] = useState<BodySection[]>([]);
  const [injuryStates, setInjuryStates] = useState<InjuryState[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [goal, setGoal] = useState<string>("");
  const [intensityPref, setIntensityPref] = useState(0.65);
  const [durationPref, setDurationPref] = useState(45);
  const [frequencyPref, setFrequencyPref] = useState(3);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const [{ data: sections }, { data: injuries }, { data: profile }] = await Promise.all([
        supabase.from("body_sections").select("*").order("display_name"),
        supabase.from("user_injury_states").select("*").eq("user_id", user.id).eq("active", true),
        supabase.from("users").select("*").eq("id", user.id).single(),
      ]);

      if (sections) setBodySections(sections);
      if (injuries) setInjuryStates(injuries);
      if (profile) {
        setEquipment(profile.equipment ?? []);
        setGoal(profile.goal ?? "weight_loss");
        setIntensityPref(profile.intensity_preference ?? 0.65);
        setDurationPref(profile.duration_preference ?? 45);
        setFrequencyPref(profile.frequency_preference ?? 3);
      }
    }
    load();
  }, []);

  async function setSectionSeverity(sectionId: string, severity: number) {
    if (!userId) return;

    const existing = injuryStates.find((i) => i.body_section_id === sectionId);

    if (severity === 0) {
      // Clear injury
      if (existing) {
        await supabase.from("user_injury_states").update({ active: false }).eq("id", existing.id);
        setInjuryStates((prev) => prev.filter((i) => i.body_section_id !== sectionId));
      }
      return;
    }

    if (existing) {
      await supabase.from("user_injury_states").update({ severity }).eq("id", existing.id);
      setInjuryStates((prev) => prev.map((i) => i.body_section_id === sectionId ? { ...i, severity } : i));
    } else {
      const { data: newEntry } = await supabase.from("user_injury_states").insert({
        user_id: userId,
        body_section_id: sectionId,
        severity,
        active: true,
      }).select().single();
      if (newEntry) setInjuryStates((prev) => [...prev, newEntry]);
    }
  }

  function toggleEquipment(id: string) {
    setEquipment((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  }

  async function savePreferences() {
    if (!userId) return;
    setSaving(true);
    await supabase.from("users").update({
      equipment,
      goal: goal as "weight_loss" | "muscle_gain" | "strength" | "sport_specific",
      intensity_preference: intensityPref,
      duration_preference: durationPref,
      frequency_preference: frequencyPref,
    }).eq("id", userId);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getSeverity(sectionId: string): number {
    return injuryStates.find((i) => i.body_section_id === sectionId)?.severity ?? 0;
  }

  const INTENSITY_LABELS = ["Easy (0.5)", "Moderate (0.65)", "Hard (0.8)", "Beast (1.0)"];
  const INTENSITY_VALUES = [0.5, 0.65, 0.8, 1.0];
  const DURATION_OPTIONS = [20, 30, 45, 60];

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>Profile</h1>
        <button onClick={handleSignOut} className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Injury State */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Body Status
        </h2>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          Tap a muscle group to set its status. Injured areas are avoided in your sessions.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {bodySections.map((bs) => {
            const sev = getSeverity(bs.id);
            return (
              <div key={bs.id} className="rounded-xl p-3 border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{bs.display_name}</span>
                  {sev > 0 && (
                    <span className="text-xs font-semibold" style={{ color: SEVERITY_COLORS[sev - 1] }}>
                      {SEVERITY_LABELS[sev - 1]}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((level) => (
                    <button
                      key={level}
                      onClick={() => setSectionSeverity(bs.id, level)}
                      className={cn(
                        "flex-1 py-1 rounded-lg text-xs font-bold border transition-all",
                        sev === level
                          ? level === 0
                            ? "border-[var(--success)]/50 bg-[var(--success)]/15 text-[var(--success)]"
                            : level === 1
                            ? "border-[var(--success)]/50 bg-[var(--success)]/15 text-[var(--success)]"
                            : level === 2
                            ? "border-[var(--accent2)]/50 bg-[var(--accent2)]/15 text-[var(--accent2)]"
                            : "border-[var(--danger)]/50 bg-[var(--danger)]/15 text-[var(--danger)]"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      )}
                    >
                      {level === 0 ? "OK" : level === 1 ? "Sore" : level === 2 ? "Tender" : "Hurt"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Equipment */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Equipment
        </h2>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map((eq) => (
            <button
              key={eq.id}
              onClick={() => toggleEquipment(eq.id)}
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
      </section>

      {/* Goal */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Goal
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((g) => (
            <button
              key={g.id}
              onClick={() => setGoal(g.id)}
              className={cn(
                "py-3 px-4 rounded-xl text-sm font-semibold border transition-all text-left",
                goal === g.id
                  ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </section>

      {/* Preferences */}
      <section className="space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          Preferences
        </h2>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Weekly frequency — {frequencyPref}x/week
          </label>
          <input
            type="range" min={2} max={6} value={frequencyPref}
            onChange={(e) => setFrequencyPref(Number(e.target.value))}
            className="w-full accent-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Intensity
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INTENSITY_VALUES.map((val, idx) => (
              <button
                key={val}
                onClick={() => setIntensityPref(val)}
                className={cn(
                  "py-2 px-3 rounded-xl text-sm font-semibold border transition-all text-left",
                  intensityPref === val
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {INTENSITY_LABELS[idx]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Session duration — {durationPref} min
          </label>
          <div className="grid grid-cols-4 gap-2">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDurationPref(d)}
                className={cn(
                  "py-2 rounded-xl text-sm font-semibold border transition-all",
                  durationPref === d
                    ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]"
                )}
              >
                {d}m
              </button>
            ))}
          </div>
        </div>
      </section>

      <Button size="lg" fullWidth onClick={savePreferences} disabled={saving}>
        <Save size={16} />
        {saving ? "Saving…" : savedMsg ? "Saved!" : "Save Changes"}
      </Button>
    </div>
  );
}
