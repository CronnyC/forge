import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
  accent?: boolean;
}

export default function Card({ className, elevated, accent, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        elevated ? "bg-[var(--surface2)]" : "bg-[var(--surface)]",
        accent ? "border-[var(--accent)]/40" : "border-[var(--border)]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
