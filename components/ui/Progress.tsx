import { cn } from "@/lib/utils";

interface ProgressProps {
  value: number; // 0–100
  className?: string;
  color?: "accent" | "success" | "accent2";
  height?: "sm" | "md" | "lg";
}

export default function Progress({ value, className, color = "accent", height = "md" }: ProgressProps) {
  const colors = {
    accent: "bg-[var(--accent)]",
    success: "bg-[var(--success)]",
    accent2: "bg-[var(--accent2)]",
  };

  const heights = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full rounded-full bg-[var(--surface2)] overflow-hidden", heights[height], className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", colors[color])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
