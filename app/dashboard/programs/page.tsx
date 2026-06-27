"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Progress from "@/components/ui/Progress";
import Badge from "@/components/ui/Badge";
import { Trophy, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Program {
  id: string;
  name: string;
  description: string | null;
  target_skill: string | null;
  is_active: boolean;
  influencers: { name: string; social_link: string | null } | null;
  program_exercises: Array<{ sequence_order: number }>;
}

interface Enrollment {
  id: string;
  program_id: string;
  current_step: number;
  started_at: string;
  active: boolean;
}

export default function ProgramsPage() {
  const supabase = createClient(); // safe: only called client-side due to force-dynamic
  const [programs, setPrograms] = useState<Program[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: progsRaw }, { data: enrs }, { data: influencersData }, { data: progExercisesData }] = await Promise.all([
        supabase.from("programs").select("*").eq("is_active", true),
        supabase.from("user_program_enrollments").select("*").eq("user_id", user.id),
        supabase.from("influencers").select("id, name, social_link"),
        supabase.from("program_exercises").select("program_id, sequence_order"),
      ]);

      const infMap = new Map((influencersData ?? []).map((i) => [i.id, i]));
      const progExMap = new Map<string, number[]>();
      for (const pe of progExercisesData ?? []) {
        const list = progExMap.get(pe.program_id) ?? [];
        list.push(pe.sequence_order);
        progExMap.set(pe.program_id, list);
      }
      const progs: Program[] = (progsRaw ?? []).map((p) => ({
        ...p,
        influencers: p.created_by_influencer_id ? (infMap.get(p.created_by_influencer_id) ?? null) : null,
        program_exercises: (progExMap.get(p.id) ?? []).map((o) => ({ sequence_order: o })),
      }));

      setPrograms(progs);
      if (enrs) setEnrollments(enrs);
      setLoading(false);
    }
    load();
  }, []);

  function isEnrolled(programId: string) {
    return enrollments.some((e) => e.program_id === programId && e.active);
  }

  function getEnrollment(programId: string) {
    return enrollments.find((e) => e.program_id === programId && e.active);
  }

  async function toggleEnrollment(programId: string) {
    setToggling(programId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setToggling(null); return; }

    const enrollment = getEnrollment(programId);
    if (enrollment) {
      await supabase.from("user_program_enrollments").update({ active: false }).eq("id", enrollment.id);
      setEnrollments((prev) => prev.map((e) => e.id === enrollment.id ? { ...e, active: false } : e));
    } else {
      const existing = enrollments.find((e) => e.program_id === programId);
      if (existing) {
        await supabase.from("user_program_enrollments").update({ active: true }).eq("id", existing.id);
        setEnrollments((prev) => prev.map((e) => e.id === existing.id ? { ...e, active: true } : e));
      } else {
        const { data: newEnr } = await supabase.from("user_program_enrollments").insert({
          user_id: user.id,
          program_id: programId,
          current_step: 0,
          active: true,
        }).select().single();
        if (newEnr) setEnrollments((prev) => [...prev, newEnr]);
      }
    }
    setToggling(null);
  }

  if (loading) {
    return (
      <div className="px-4 pt-8 max-w-lg mx-auto">
        <div className="h-8 w-40 rounded-lg mb-6 animate-pulse" style={{ background: "var(--surface)" }} />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl mb-3 animate-pulse" style={{ background: "var(--surface)" }} />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 pt-8 pb-4 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black mb-1" style={{ color: "var(--text)" }}>Programs</h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Structured skill progressions. Enroll and FORGE will inject program exercises into your sessions.
        </p>
      </div>

      <div className="space-y-4">
        {programs.map((prog) => {
          const enrolled = isEnrolled(prog.id);
          const enrollment = getEnrollment(prog.id);
          const totalSteps = prog.program_exercises.length;
          const currentStep = enrollment?.current_step ?? 0;
          const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

          return (
            <div
              key={prog.id}
              className={cn(
                "rounded-2xl p-5 border transition-all",
                enrolled
                  ? "border-[var(--accent)]/40 bg-[var(--surface)]"
                  : "border-[var(--border)] bg-[var(--surface)]"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-lg" style={{ color: "var(--text)" }}>{prog.name}</h3>
                    {enrolled && <Badge variant="accent">Enrolled</Badge>}
                    {prog.target_skill && (
                      <Badge variant="muted">{prog.target_skill.replace("_", " ")}</Badge>
                    )}
                  </div>
                  {prog.description && (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{prog.description}</p>
                  )}
                </div>
                <Trophy size={20} className="flex-shrink-0 mt-1" style={{ color: "var(--accent2)" }} />
              </div>

              {prog.influencers && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>by</span>
                  {prog.influencers.social_link ? (
                    <a
                      href={prog.influencers.social_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold hover:underline"
                      style={{ color: "var(--accent2)" }}
                    >
                      {prog.influencers.name}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: "var(--accent2)" }}>
                      {prog.influencers.name}
                    </span>
                  )}
                </div>
              )}

              {enrolled && totalSteps > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Progress</span>
                    <span className="text-xs font-bold" style={{ color: "var(--text)" }}>
                      Step {currentStep} / {totalSteps}
                    </span>
                  </div>
                  <Progress value={progress} color="accent" />
                  {currentStep === totalSteps && (
                    <div className="flex items-center gap-2 mt-2">
                      <CheckCircle size={14} style={{ color: "var(--success)" }} />
                      <span className="text-xs font-semibold" style={{ color: "var(--success)" }}>Completed!</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {totalSteps} exercise{totalSteps !== 1 ? "s" : ""}
                </span>
                <Button
                  variant={enrolled ? "secondary" : "primary"}
                  size="sm"
                  onClick={() => toggleEnrollment(prog.id)}
                  disabled={toggling === prog.id}
                >
                  {toggling === prog.id ? "…" : enrolled ? "Unenroll" : "Enroll"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
