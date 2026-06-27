"use client";

const BODY_SECTIONS = [
  { id: "shoulders", label: "Shoulders", cx: 150, cy: 85, r: 20 },
  { id: "chest", label: "Chest", cx: 150, cy: 115, r: 22 },
  { id: "biceps", label: "Biceps", cx: 105, cy: 120, r: 14 },
  { id: "triceps", label: "Triceps", cx: 195, cy: 120, r: 14 },
  { id: "core", label: "Core", cx: 150, cy: 155, r: 20 },
  { id: "forearms", label: "Forearms", cx: 95, cy: 155, r: 12 },
  { id: "upper_back", label: "Upper Back", cx: 150, cy: 90, r: 20 },
  { id: "lower_back", label: "Lower Back", cx: 150, cy: 135, r: 16 },
  { id: "glutes", label: "Glutes", cx: 150, cy: 195, r: 20 },
  { id: "quads", label: "Quads", cx: 135, cy: 240, r: 18 },
  { id: "hamstrings", label: "Hamstrings", cx: 165, cy: 240, r: 18 },
  { id: "calves", label: "Calves", cx: 150, cy: 290, r: 14 },
];

// Placeholder — in production, fetch from recent sessions
export default function BodyHeatmap() {
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 300 340" className="w-32 flex-shrink-0" aria-label="Body muscle map">
        {/* Body outline */}
        <ellipse cx="150" cy="55" rx="22" ry="25" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="120" y="80" width="60" height="90" rx="10" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="90" y="90" width="25" height="75" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="185" y="90" width="25" height="75" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="122" y="170" width="26" height="90" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="152" y="170" width="26" height="90" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="125" y="260" width="22" height="60" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />
        <rect x="153" y="260" width="22" height="60" rx="8" fill="none" stroke="var(--border)" strokeWidth="1.5" />

        {/* Muscle group dots — all grey (no data) */}
        {BODY_SECTIONS.slice(0, 8).map((s) => (
          <circle
            key={s.id}
            cx={s.cx} cy={s.cy} r={s.r}
            fill="var(--surface2)"
            stroke="var(--border)"
            strokeWidth="1"
            opacity="0.6"
          />
        ))}
      </svg>

      <div className="flex flex-wrap gap-1.5">
        {BODY_SECTIONS.map((s) => (
          <span
            key={s.id}
            className="text-xs px-2 py-1 rounded-lg"
            style={{ background: "var(--surface2)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
