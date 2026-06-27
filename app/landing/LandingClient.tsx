"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Target, Cpu, Zap } from "lucide-react";

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function SessionMockup() {
  return (
    <div
      className="rounded-2xl overflow-hidden w-full max-w-xs"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--accent)" }}
          >
            FORMA Session
          </span>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--border)" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--border)" }} />
            <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          </div>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: "var(--surface2)" }}>
          <div className="h-1 rounded-full" style={{ background: "var(--accent)", width: "40%" }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Exercise 4 of 10</span>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>22 min left</span>
        </div>
      </div>

      {/* Exercise content */}
      <div className="px-5 py-5">
        <div
          className="w-full h-28 rounded-xl mb-4 flex items-center justify-center"
          style={{ background: "var(--surface2)" }}
        >
          <span className="text-4xl">💪</span>
        </div>

        <h3 className="text-2xl font-bold mb-1" style={{ color: "var(--text)" }}>Push-Up</h3>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>3 × 15 reps</p>

        <div className="grid grid-cols-2 gap-2">
          {["Too Easy ↑", "Too Hard ↓", "Hurts", "Done ✓"].map((label, i) => (
            <button
              key={label}
              className="py-2.5 rounded-lg text-xs font-semibold"
              style={
                i === 3
                  ? { background: "var(--accent)", color: "white" }
                  : {
                      background: "var(--surface2)",
                      color: "var(--text-muted)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const HOW_STEPS = [
  {
    icon: <Target size={24} />,
    title: "Tell us your goal",
    desc: "Weight loss, strength, muscle gain — we calibrate everything around it.",
  },
  {
    icon: <Cpu size={24} />,
    title: "We build your session",
    desc: "Based on your history, equipment, and energy level. No planning needed.",
  },
  {
    icon: <Zap size={24} />,
    title: "Adapt in real time",
    desc: "Too easy? Too hard? One tap and the session recalibrates instantly.",
  },
];

const PROGRAMS = [
  { name: "Push-Up Mastery", skill: "Strength", steps: 12 },
  { name: "Pull-Up Progression", skill: "Calisthenics", steps: 16 },
  { name: "Handstand Journey", skill: "Balance", steps: 20 },
];

export default function LandingClient() {
  return (
    <div style={{ background: "var(--bg)" }}>
      {/* ── NAV ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "rgba(13,17,23,0.9)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderColor: "var(--border)",
        }}
      >
        <span className="text-base font-bold tracking-tight" style={{ color: "var(--text)" }}>
          FORMA
        </span>
        <div className="flex items-center gap-2">
          <Link href="/login">
            <button
              className="text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              Sign in
            </button>
          </Link>
          <Link href="/signup">
            <button
              className="text-sm font-semibold px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "var(--accent)", color: "white" }}
            >
              Get started
            </button>
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center pt-16">
        <div className="max-w-6xl mx-auto px-6 py-20 w-full">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            {/* Left — copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-6"
                style={{ color: "var(--accent)" }}
              >
                Home fitness, redesigned
              </p>
              <h1
                className="font-bold mb-6"
                style={{
                  fontSize: "clamp(2.8rem, 6vw, 5rem)",
                  lineHeight: 1.1,
                  color: "var(--text)",
                  letterSpacing: "-0.02em",
                }}
              >
                Training that
                <br />
                thinks.
              </h1>
              <p
                className="text-lg mb-10 leading-relaxed"
                style={{ color: "var(--text-muted)", maxWidth: "26rem" }}
              >
                FORMA builds your session dynamically. No planning. No decisions.
                Just work.
              </p>
              <Link href="/signup">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{ background: "var(--accent)", color: "white" }}
                >
                  Start training
                  <ArrowRight size={16} />
                </button>
              </Link>
            </motion.div>

            {/* Right — session mockup (desktop only) */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
              className="hidden md:flex justify-center"
            >
              <SessionMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <FadeUp className="mb-16">
          <h2
            className="text-3xl font-bold mb-3"
            style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
          >
            How it works
          </h2>
          <p style={{ color: "var(--text-muted)" }}>Three steps, zero friction.</p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-10">
          {HOW_STEPS.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.08}>
              <div className="mb-4" style={{ color: "var(--accent)" }}>
                {step.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2" style={{ color: "var(--text)" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                {step.desc}
              </p>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── PROGRAMS PREVIEW ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <FadeUp className="mb-12">
          <h2
            className="text-3xl font-bold mb-3"
            style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
          >
            Skill programs by the best
          </h2>
          <p style={{ color: "var(--text-muted)" }}>
            Structured paths from beginner to mastery. Enroll once, progress automatically.
          </p>
        </FadeUp>
        <div className="grid md:grid-cols-3 gap-4">
          {PROGRAMS.map((prog, i) => (
            <FadeUp key={prog.name} delay={i * 0.07}>
              <div
                className="p-5 rounded-2xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <span
                  className="inline-block text-xs font-semibold px-2 py-0.5 rounded mb-4"
                  style={{ background: "rgba(46,143,166,0.12)", color: "var(--accent)" }}
                >
                  {prog.skill}
                </span>
                <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>
                  {prog.name}
                </h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {prog.steps} steps
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <FadeUp>
          <div
            className="max-w-2xl mx-auto text-center rounded-2xl p-12 border"
            style={{ background: "var(--surface)", borderColor: "var(--border)" }}
          >
            <h2
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--text)", letterSpacing: "-0.01em" }}
            >
              Ready to stop planning and start training?
            </h2>
            <p className="mb-10" style={{ color: "var(--text-muted)" }}>
              Free. No equipment required. Train anywhere.
            </p>
            <Link href="/signup">
              <button
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)", color: "white" }}
              >
                Get started
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            © 2026 FORMA
          </p>
          <div className="flex gap-6">
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Privacy
            </span>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>
              Terms
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
