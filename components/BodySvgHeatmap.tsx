"use client";

import { motion } from "framer-motion";

interface Props {
  trainedSections: Array<{ name: string; daysAgo: number }>;
}

// Color based on recency: 0 days = hot red, 3+ days = muted gray
function getColor(daysAgo: number | undefined): string {
  if (daysAgo === undefined) return "var(--surface2)";
  if (daysAgo === 0) return "#C0341D";
  if (daysAgo === 1) return "#cc4422";
  if (daysAgo === 2) return "#9e4a2d";
  if (daysAgo === 3) return "#6b3325";
  return "#3a2620";
}

function getOpacity(daysAgo: number | undefined): number {
  if (daysAgo === undefined) return 0.25;
  if (daysAgo === 0) return 1;
  if (daysAgo === 1) return 0.85;
  if (daysAgo === 2) return 0.65;
  if (daysAgo === 3) return 0.45;
  return 0.3;
}

// Named sections with SVG paths for a front-facing body silhouette
const SECTIONS = [
  {
    name: "chest",
    label: "Chest",
    // Pectorals
    d: "M78 105 Q90 98 100 100 Q105 112 100 122 Q90 128 78 125 Z M122 100 Q132 98 144 105 L144 125 Q132 128 122 122 Q117 112 122 100 Z",
  },
  {
    name: "shoulders",
    label: "Shoulders",
    d: "M60 88 Q68 78 80 82 Q84 96 78 105 Q68 105 60 98 Z M142 82 Q154 78 162 88 L162 98 Q154 105 144 105 Q138 96 142 82 Z",
  },
  {
    name: "biceps",
    label: "Biceps",
    d: "M48 108 Q58 106 62 112 Q62 130 56 136 Q46 134 44 122 Z M160 112 Q164 106 174 108 L178 122 Q176 134 166 136 Q160 130 160 112 Z",
  },
  {
    name: "triceps",
    label: "Triceps",
    d: "M44 122 Q46 134 52 140 Q44 144 38 136 Q36 124 40 116 Z M180 116 Q186 124 184 136 Q178 144 170 140 Q176 134 178 122 Z",
  },
  {
    name: "forearms",
    label: "Forearms",
    d: "M38 136 Q46 148 44 162 Q38 166 32 158 Q28 146 32 138 Z M184 136 Q188 146 190 158 Q184 166 178 162 Q176 148 184 136 Z",
  },
  {
    name: "core",
    label: "Core",
    d: "M82 128 Q100 122 140 128 L138 170 Q120 176 102 170 Z",
  },
  {
    name: "upper_back",
    label: "Upper Back",
    // invisible in front view, shown as small accent
    d: "",
  },
  {
    name: "lower_back",
    label: "Lower Back",
    d: "",
  },
  {
    name: "glutes",
    label: "Glutes",
    d: "M82 188 Q100 182 140 188 L138 210 Q120 218 102 210 Z",
  },
  {
    name: "quads",
    label: "Quads",
    d: "M84 212 Q100 208 118 212 L116 268 Q100 274 84 268 Z M104 212 Q120 208 138 212 L138 268 Q122 274 104 268 Z",
  },
  {
    name: "hamstrings",
    label: "Hamstrings",
    d: "",
  },
  {
    name: "calves",
    label: "Calves",
    d: "M86 272 Q100 268 114 272 L112 320 Q100 326 88 320 Z M108 272 Q122 268 136 272 L132 320 Q120 326 108 320 Z",
  },
];

const FRONT_BODY_PATH = `
  M111 10 C100 10 90 18 88 30 C86 42 90 55 96 65
  C84 68 74 75 68 85 L60 88 C52 92 46 102 44 114
  L32 158 C30 166 32 172 36 175 L44 170 L44 162
  L38 136 L40 116 L48 108 L60 98 L60 88
  C60 80 68 74 78 74 L78 105 L80 82
  C76 72 78 68 80 66 C84 65 90 65 96 65
  L96 100 L100 100 L100 122 L102 170
  L84 212 L86 272 L88 320 L92 340 L100 342 L108 340
  L112 320 L114 272 L108 212 L104 212
  L116 268 L118 212 L136 272 L138 268
  L122 212 L140 188 L138 170 L122 100 L122 65
  C128 65 134 65 138 66 C140 68 142 72 138 82
  L142 82 L144 105 L144 125
  C150 74 152 72 154 74 C156 68 162 65 165 66
  L162 88 L174 108 L160 112 L178 122 L184 136 L190 158
  L194 175 L200 172 L202 166 L190 122 L178 88
  C172 75 162 68 150 65 C156 55 160 42 158 30
  C156 18 146 10 135 10 Q123 4 111 10 Z
`;

export default function BodySvgHeatmap({ trainedSections }: Props) {
  const sectionMap = new Map(trainedSections.map((s) => [s.name, s.daysAgo]));

  const activeSections = SECTIONS.filter((s) => s.name !== "upper_back" && s.name !== "lower_back" && s.name !== "hamstrings");
  const legendSections = SECTIONS.filter((s) => sectionMap.has(s.name) && s.name !== "upper_back" && s.name !== "lower_back" && s.name !== "hamstrings");

  return (
    <div className="flex items-start gap-5">
      {/* Body SVG */}
      <div className="flex-shrink-0 relative" style={{ width: 110, height: 220 }}>
        <svg
          viewBox="30 5 155 345"
          width="110"
          height="220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Body base silhouette */}
          <path
            d={FRONT_BODY_PATH}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {/* Head */}
          <ellipse cx="111" cy="22" rx="18" ry="20"
            fill="var(--surface)" stroke="var(--border)" strokeWidth="1.5" />

          {/* Neck */}
          <rect x="104" y="38" width="14" height="16" rx="4"
            fill="var(--surface)" stroke="var(--border)" strokeWidth="1" />

          {/* Muscle group overlays */}
          {activeSections.map((section) => {
            if (!section.d) return null;
            const daysAgo = sectionMap.get(section.name);
            const color = getColor(daysAgo);
            const opacity = getOpacity(daysAgo);
            return (
              <motion.path
                key={section.name}
                d={section.d}
                fill={color}
                opacity={opacity}
                initial={{ opacity: 0.15 }}
                animate={{ opacity }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            );
          })}
        </svg>
      </div>

      {/* Legend / section list */}
      <div className="flex-1 min-w-0">
        {trainedSections.length === 0 ? (
          <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Complete a session to see which muscles you&apos;ve trained recently.
            <br /><br />
            Areas will glow red when freshly trained and fade over 4 days.
          </p>
        ) : (
          <div className="space-y-2">
            {legendSections.map((s) => {
              const daysAgo = sectionMap.get(s.name)!;
              const color = getColor(daysAgo);
              return (
                <div key={s.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: color }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--text)" }}>{s.label}</span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`}
                  </span>
                </div>
              );
            })}

            <div className="pt-2 mt-2 flex items-center gap-3 border-t" style={{ borderColor: "var(--border)" }}>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Rest: </span>
              <div className="flex gap-1 items-center">
                {["#C0341D", "#9e4a2d", "#6b3325", "#3a2620", "var(--surface2)"].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Fresh → Rested</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
