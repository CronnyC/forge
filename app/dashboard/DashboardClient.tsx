"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Zap, ChevronRight, Trophy, Clock } from "lucide-react";
import BodySvgHeatmap from "@/components/BodySvgHeatmap";

interface Props {
  streak: number;
  recentSessions: Array<{
    id: string;
    date: string;
    actual_duration: number | null;
    exercises_completed: Array<{ name: string }>;
  }>;
  enrollments: Array<{
    id: string;
    program_id: string;
    current_step: number;
    programs: { id: string; name: string; description: string | null; target_skill: string | null } | null;
  }>;
  goalLabel: string;
  durationPreference: number;
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export default function DashboardClient({ streak, recentSessions, enrollments, goalLabel, durationPreference }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="px-4 pt-8 pb-4 max-w-lg mx-auto space-y-5"
    >
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter" style={{ color: "var(--text)" }}>
            Ready to{" "}
            <span className="gradient-text">FORGE</span>?
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Today&apos;s session: {goalLabel}
          </p>
        </div>

        {/* Streak badge */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl"
          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
        >
          <Flame size={20} style={{ color: "var(--accent2)" }} />
          <span className="text-2xl font-black" style={{ color: "var(--text)" }}>{streak}</span>
          <span className="text-[10px] uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>streak</span>
        </motion.div>
      </motion.div>

      {/* Main CTA */}
      <motion.div variants={item}>
        <Link href="/dashboard/session">
          <motion.div
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.985 }}
            className="relative overflow-hidden rounded-3xl p-6 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #C0341D 0%, #8B2010 60%, #4D1208 100%)",
              boxShadow: "0 8px 40px rgba(192,52,29,0.35), 0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {/* Texture overlay */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "20px 20px",
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-white/70" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">
                  {durationPreference} min · {goalLabel}
                </span>
              </div>
              <h2 className="text-2xl font-black text-white mb-1">Start Session</h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                FORGE builds your workout in real-time
              </p>
            </div>
            <div className="absolute right-4 bottom-3 opacity-[0.08]">
              <Zap size={88} />
            </div>
          </motion.div>
        </Link>
      </motion.div>

      {/* Body heatmap */}
      <motion.div
        variants={item}
        className="rounded-2xl p-4"
        style={{
          background: "var(--glass-bg)",
          backdropFilter: "blur(var(--glass-blur))",
          WebkitBackdropFilter: "blur(var(--glass-blur))",
          border: "1px solid var(--glass-border)",
        }}
      >
        <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-muted)" }}>
          Muscle Coverage
        </h3>
        <BodySvgHeatmap trainedSections={[]} />
      </motion.div>

      {/* Active Programs */}
      {enrollments.length > 0 && (
        <motion.div variants={item}>
          <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
            Active Programs
          </h3>
          <div className="space-y-2">
            {enrollments.map((e) => (
              <Link key={e.id} href="/dashboard/programs">
                <motion.div
                  whileHover={{ scale: 1.01, borderColor: "rgba(232,150,60,0.4)" }}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <Trophy size={16} style={{ color: "var(--accent2)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate" style={{ color: "var(--text)" }}>
                      {e.programs?.name}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Step {e.current_step} in progress
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Recent Sessions */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Recent Sessions
          </h3>
          <Link href="/dashboard/history" className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
            See all
          </Link>
        </div>

        {recentSessions.length === 0 ? (
          <div
            className="py-10 text-center rounded-2xl border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <Zap size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No sessions yet. Start your first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((s, i) => {
              const exs = s.exercises_completed ?? [];
              const dateStr = new Date(s.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              });
              return (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="flex items-center gap-3 p-3 rounded-xl border"
                  style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                >
                  <Clock size={15} style={{ color: "var(--text-muted)" }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>{dateStr}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {exs.length > 0 ? exs.map((e) => e.name).join(", ") : "Completed"}
                    </div>
                  </div>
                  {s.actual_duration && (
                    <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {s.actual_duration}m
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
