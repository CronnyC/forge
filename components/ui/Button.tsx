"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof HTMLMotionProps<"button">>,
    HTMLMotionProps<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

const GLOW: Record<ButtonVariant, string> = {
  primary: "0 0 0 0 rgba(192,52,29,0)",
  secondary: "none",
  ghost: "none",
  danger: "0 0 0 0 rgba(192,52,29,0)",
  success: "0 0 0 0 rgba(76,175,125,0)",
};

const GLOW_HOVER: Record<ButtonVariant, string> = {
  primary: "0 0 20px 4px rgba(192,52,29,0.35)",
  secondary: "none",
  ghost: "none",
  danger: "0 0 18px 3px rgba(192,52,29,0.3)",
  success: "0 0 18px 3px rgba(76,175,125,0.3)",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", fullWidth, children, disabled, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-semibold tracking-wide rounded-xl transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none";

    const variants: Record<ButtonVariant, string> = {
      primary: "bg-[var(--accent)] text-white hover:brightness-110 shadow-lg shadow-[var(--accent)]/20",
      secondary: "bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
      ghost: "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface2)]",
      danger: "bg-[var(--danger)] text-white hover:brightness-110",
      success: "bg-[var(--success)] text-white hover:brightness-110",
    };

    const sizes: Record<ButtonSize, string> = {
      sm: "text-xs px-3 py-1.5 gap-1.5",
      md: "text-sm px-4 py-2.5 gap-2",
      lg: "text-base px-6 py-3 gap-2",
      xl: "text-lg px-8 py-4 gap-3",
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled}
        className={cn(base, variants[variant], sizes[size], fullWidth && "w-full", className)}
        whileTap={disabled ? {} : { scale: 0.96 }}
        whileHover={disabled ? {} : {
          scale: 1.015,
          boxShadow: GLOW_HOVER[variant],
        }}
        initial={{ boxShadow: GLOW[variant] }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";
export default Button;
