"use client";

import { useRef, Suspense, lazy, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Zap, Activity, Brain, ChevronRight, Dumbbell, Shield, TrendingUp } from "lucide-react";

// Lazy-load the heavy Three.js component
const ForgeHero3D = lazy(() => import("@/components/landing/ForgeHero3D"));
const ParticleField = lazy(() => import("@/components/landing/ParticleField"));

const STATS = [
  { value: "34+", label: "Exercises", icon: <Dumbbell size={16} /> },
  { value: "Real-time", label: "Adaptation", icon: <Brain size={16} /> },
  { value: "Zero", label: "Decision fatigue", icon: <Zap size={16} /> },
];

const FEATURES = [
  {
    icon: <Brain size={28} />,
    title: "Session Engine",
    desc: "Scores every exercise by your history, injuries, goal, and feedback. No randomness — pure signal.",
    accent: "var(--accent)",
  },
  {
    icon: <Activity size={28} />,
    title: "Live Adaptation",
    desc: "Too easy? Too hard? Hurts? Tap once and the next exercise recalibrates instantly.",
    accent: "var(--accent2)",
  },
  {
    icon: <Shield size={28} />,
    title: "Injury Awareness",
    desc: "Flag sore muscles and the engine filters them out. Train hard, train smart, never regress.",
    accent: "var(--success)",
  },
  {
    icon: <TrendingUp size={28} />,
    title: "Progressive Overload",
    desc: "Personal bests feed the algorithm. Every session builds on the last, automatically.",
    accent: "var(--accent)",
  },
];

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)" }}>
      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Particle field (desktop) */}
        {!isMobile && (
          <Suspense fallback={null}>
            <ParticleField />
          </Suspense>
        )}

        {/* Radial gradient backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(192,52,29,0.12) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 20% 80%, rgba(232,150,60,0.06) 0%, transparent 70%)",
          }}
        />

        {/* Animated grid lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.035]">
          <div
            style={{
              position: "absolute",
              inset: "-200px",
              backgroundImage:
                "linear-gradient(var(--text-muted) 1px, transparent 1px), linear-gradient(90deg, var(--text-muted) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              animation: "grid-shift 8s linear infinite",
            }}
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16 max-w-6xl mx-auto px-6 py-24 md:py-0 w-full"
        >
          {/* Left — copy */}
          <div className="flex-1 text-center md:text-left">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-8 border"
                style={{ borderColor: "rgba(192,52,29,0.35)", background: "rgba(192,52,29,0.08)", color: "var(--accent2)" }}
              >
                <Zap size={12} />
                Home fitness, redefined
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="font-black leading-[0.92] tracking-tighter mb-6"
              style={{ fontSize: "clamp(3.5rem, 9vw, 7.5rem)" }}
            >
              <span className="block" style={{ color: "var(--text)" }}>FORGE</span>
              <span
                className="block gradient-text"
                style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)", letterSpacing: "-0.02em" }}
              >
                YOURSELF.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="text-lg md:text-xl max-w-md mx-auto md:mx-0 mb-10 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              The first fitness app that builds your workout{" "}
              <em style={{ color: "var(--text)", fontStyle: "normal", fontWeight: 600 }}>as you train</em>.
              No planning. No decision fatigue. Pure output.
            </motion.p>

            {/* Stats bar */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap gap-4 justify-center md:justify-start mb-10"
            >
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <span style={{ color: "var(--accent2)" }}>{s.icon}</span>
                  <span className="font-bold text-sm" style={{ color: "var(--text)" }}>{s.value}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</span>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.38 }}
              className="flex flex-col sm:flex-row items-center gap-3 justify-center md:justify-start"
            >
              <Link href="/signup">
                <button
                  className="pulse-glow btn-glow inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base"
                  style={{ background: "var(--accent)" }}
                >
                  Start Training Free
                  <ChevronRight size={18} />
                </button>
              </Link>
              <Link href="/login">
                <button
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-base border transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
                  Sign In
                </button>
              </Link>
            </motion.div>
          </div>

          {/* Right — 3D / Static gradient */}
          <div className="flex-shrink-0 w-72 h-72 md:w-[420px] md:h-[420px] relative">
            {isMobile ? (
              /* Mobile: static gradient orb */
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: "radial-gradient(circle at 40% 35%, #e8963c 0%, #c0341d 45%, #3d0f07 100%)",
                  boxShadow: "0 0 80px rgba(192,52,29,0.4), 0 0 160px rgba(192,52,29,0.15)",
                  animation: "spin-slow 20s linear infinite",
                }}
              />
            ) : (
              <Suspense
                fallback={
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: "radial-gradient(circle, rgba(192,52,29,0.3), transparent 70%)" }}
                  />
                }
              >
                <ForgeHero3D />
              </Suspense>
            )}

            {/* Ambient glow under the shape */}
            <div
              className="absolute inset-x-8 bottom-0 h-24 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse, rgba(192,52,29,0.35) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: "var(--text-muted)" }}
        >
          <span className="text-xs uppercase tracking-widest font-semibold">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="w-1 h-2 rounded-full" style={{ background: "var(--accent)" }} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <FadeUp className="text-center mb-16">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--accent)" }}>
            How it works
          </p>
          <h2
            className="font-black tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--text)" }}
          >
            No app thinks for you like FORGE does.
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((f, i) => (
            <FadeUp key={f.title} delay={i * 0.08}>
              <div
                className="h-full p-6 rounded-3xl border transition-all group hover:border-[var(--accent)]/40"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: `${f.accent}18`, color: f.accent }}
                >
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>{f.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── HOW SESSION WORKS ── */}
      <section className="py-24 px-6 max-w-4xl mx-auto">
        <FadeUp className="text-center mb-16">
          <h2
            className="font-black tracking-tight mb-4"
            style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", color: "var(--text)" }}
          >
            A session that learns{" "}
            <span className="gradient-text">while you train</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-muted)" }}>
            Every rep, every tap, every skip — fed back into the engine in real-time.
          </p>
        </FadeUp>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-6 top-0 bottom-0 w-px hidden md:block"
            style={{ background: "linear-gradient(to bottom, transparent, var(--border), transparent)" }}
          />

          <div className="space-y-6">
            {[
              { step: "01", title: "Start Session", desc: "FORGE reads your goal, equipment, injury state, and last 14 days of history. It builds a real-time queue before you see the first exercise." },
              { step: "02", title: "Train & Adapt", desc: "Complete sets, log reps. Hit Too Easy and it swaps to a harder variant. Hit Hurts and the rest of your session avoids that muscle group." },
              { step: "03", title: "Rest, Not Waste", desc: "60-second rest timers. During rest, FORGE prefetches your next exercise so it's instant when you're ready." },
              { step: "04", title: "Finish Stronger", desc: "Rate exercises, track personal bests, and watch the algorithm calibrate for next time. Sessions improve as you do." },
            ].map((item, i) => (
              <FadeUp key={item.step} delay={i * 0.07}>
                <div className="md:pl-16 relative">
                  <div
                    className="absolute left-0 w-12 h-12 rounded-full items-center justify-center hidden md:flex text-sm font-black"
                    style={{ background: "var(--surface2)", color: "var(--accent)", border: "1px solid var(--border)" }}
                  >
                    {item.step}
                  </div>
                  <div
                    className="p-6 rounded-2xl border"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className="text-sm font-black md:hidden"
                        style={{ color: "var(--accent)", flexShrink: 0 }}
                      >
                        {item.step}
                      </span>
                      <div>
                        <h3 className="font-bold text-lg mb-2" style={{ color: "var(--text)" }}>{item.title}</h3>
                        <p style={{ color: "var(--text-muted)" }}>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6">
        <FadeUp>
          <div
            className="max-w-2xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(192,52,29,0.15) 0%, rgba(232,150,60,0.08) 100%)",
              border: "1px solid rgba(192,52,29,0.25)",
            }}
          >
            {/* Corner glow */}
            <div
              className="absolute -top-20 -right-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(192,52,29,0.2) 0%, transparent 70%)" }}
            />
            <h2
              className="font-black tracking-tight mb-4"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", color: "var(--text)" }}
            >
              Your best session starts{" "}
              <span className="gradient-text">right now.</span>
            </h2>
            <p className="text-lg mb-10" style={{ color: "var(--text-muted)" }}>
              Free. No equipment required. Train anywhere.
            </p>
            <Link href="/signup">
              <button
                className="pulse-glow btn-glow inline-flex items-center gap-3 px-10 py-5 rounded-2xl text-white font-bold text-lg"
                style={{ background: "var(--accent)" }}
              >
                <Zap size={20} />
                Create Free Account
              </button>
            </Link>
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Takes 2 minutes to set up. No credit card.
            </p>
          </div>
        </FadeUp>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center border-t" style={{ borderColor: "var(--border)" }}>
        <p className="text-sm font-black tracking-tighter" style={{ color: "var(--accent)" }}>FORGE</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} · Built for the obsessed
        </p>
      </footer>
    </div>
  );
}
