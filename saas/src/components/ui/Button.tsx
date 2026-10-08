import React from "react";
import clsx from "clsx";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base font-semibold",
  };

  const variantStyles = {
    primary:
      "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm dark:bg-[#00e676] dark:text-black dark:hover:bg-[#00ff85] focus:ring-emerald-500",
    secondary:
      "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 dark:bg-[#0a0d10] dark:text-white dark:border-[#1f242b] dark:hover:bg-[#12171e] shadow-sm",
    danger:
      "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-600 hover:text-white dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/50 shadow-sm",
    ghost:
      "bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-[#12171e]",
    outline:
      "bg-transparent text-emerald-700 border border-emerald-600 hover:bg-emerald-50 dark:text-[#00e676] dark:border-[#00e676]/60 dark:hover:bg-[#00e676]/10",
  };

  return (
    <button
      className={clsx(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processando...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
