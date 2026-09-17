import React from "react";
import clsx from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "active" | "danger" | "glass";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "default",
  ...props
}) => {
  const variantStyles = {
    default: "bg-surface border border-surface-border",
    active: "bg-surface border border-brand-neon/60 shadow-neon",
    danger: "bg-surface border border-status-embargo/60 shadow-embargo",
    glass: "bg-surface/80 backdrop-blur-md border border-surface-border/60",
  };

  return (
    <div
      className={clsx(
        "rounded-lg p-4 transition-all duration-200",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
