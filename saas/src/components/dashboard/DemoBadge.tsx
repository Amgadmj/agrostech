import React from "react";
import clsx from "clsx";

interface DemoBadgeProps {
  isDemo?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/**
 * Persistent visual badge to clearly distinguish demonstration / mock data from live telemetry.
 * Renders whenever isDemo is true (or env NEXT_PUBLIC_DEMO_MODE !== 'false').
 */
export const DemoBadge: React.FC<DemoBadgeProps> = ({
  isDemo = true,
  className,
  size = "sm",
}) => {
  // If explicitly configured as non-demo in production, hide
  const showBadge =
    isDemo && process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  if (!showBadge) return null;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded border transition-colors",
        "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30 dark:border-amber-400/40 shadow-xs",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        className
      )}
      title="Ambiente com dados simulados/demonstrativos para validação de risco"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
      <span>Dados de Demonstração</span>
    </span>
  );
};
