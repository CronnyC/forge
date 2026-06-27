import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent" | "success" | "danger" | "muted";
}

export default function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)]",
    accent: "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30",
    success: "bg-[var(--success)]/15 text-[var(--success)] border border-[var(--success)]/30",
    danger: "bg-[var(--danger)]/15 text-[var(--danger)] border border-[var(--danger)]/30",
    muted: "bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
