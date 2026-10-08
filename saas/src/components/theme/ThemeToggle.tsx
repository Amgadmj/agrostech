"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-8 h-8 rounded-lg bg-slate-100 dark:bg-zinc-800 animate-pulse ${className}`} />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className={`inline-flex items-center justify-center gap-2 px-2.5 py-1.5 min-w-11 min-h-11 sm:min-w-0 sm:min-h-0 rounded-lg text-xs font-medium transition-all border
        ${isDark
          ? "bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 border-zinc-700/80 hover:border-zinc-600 shadow-sm"
          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 shadow-sm"
        } ${className}`}
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 text-amber-400 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-slate-600 transition-transform hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-sans font-medium">
          {isDark ? "Modo Claro" : "Modo Escuro"}
        </span>
      )}
    </button>
  );
};
