import React from "react";
import clsx from "clsx";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "regular" | "warning" | "embargo" | "app" | "neutral" | "neon";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "sm",
  className,
}) => {
  const baseStyles = "inline-flex items-center font-mono font-medium rounded border uppercase tracking-wider";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    regular: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-[#00e676]/10 dark:text-[#00e676] dark:border-[#00e676]/40",
    warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/40",
    embargo: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/40 shadow-sm",
    app: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-[#00e5ff]/10 dark:text-[#00e5ff] dark:border-[#00e5ff]/40",
    neutral: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-[#12171e] dark:text-gray-400 dark:border-[#1f242b]",
    neon: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-[#00e676]/15 dark:text-[#00e676] dark:border-[#00e676]",
  };

  return (
    <span className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}>
      {children}
    </span>
  );
};
