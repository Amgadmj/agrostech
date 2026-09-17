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
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-md";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base font-semibold",
  };

  const variantStyles = {
    primary:
      "bg-[#00e676] text-black font-semibold hover:bg-[#00ff85] shadow-[0_0_15px_rgba(0,230,118,0.3)] focus:ring-[#00e676] border border-[#00e676]",
    secondary:
      "bg-[#0a0d10] text-white border border-[#1f242b] hover:bg-[#12171e] hover:border-[#00e676]/50 focus:ring-[#00e676]/40",
    danger:
      "bg-red-500/15 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white focus:ring-red-500",
    ghost:
      "bg-transparent text-gray-400 hover:text-white hover:bg-[#12171e]",
    outline:
      "bg-transparent text-[#00e676] border border-[#00e676]/60 hover:bg-[#00e676]/10 focus:ring-[#00e676]",
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
          Processando...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
