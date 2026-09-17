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
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  const variantStyles = {
    regular: "bg-[#00e676]/10 text-[#00e676] border-[#00e676]/40",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/40",
    embargo: "bg-red-500/10 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]",
    app: "bg-[#00e5ff]/10 text-[#00e5ff] border-[#00e5ff]/40",
    neutral: "bg-[#12171e] text-gray-400 border-[#1f242b]",
    neon: "bg-[#00e676]/15 text-[#00e676] border-[#00e676]",
  };

  return (
    <span className={clsx(baseStyles, sizeStyles[size], variantStyles[variant], className)}>
      {children}
    </span>
  );
};
