"use client";

import React, { useState, useEffect } from "react";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  portalRole?: "b2c" | "b2b";
  className?: string;
  noScroll?: boolean;
}

/**
 * Shared AppShell providing consistent Header, Theme, and Portal Context across all SaaS routes.
 * Standardizes layout and eliminates redundant custom headers.
 */
export const AppShell: React.FC<AppShellProps> = ({
  children,
  portalRole,
  className = "",
  noScroll = true,
}) => {
  const [effectiveRole, setEffectiveRole] = useState<"b2c" | "b2b">(portalRole || "b2b");

  useEffect(() => {
    if (portalRole) {
      setEffectiveRole(portalRole);
      return;
    }
    const match = document.cookie.match(/agrostech_portal=([^;]+)/);
    if (match && (match[1] === "b2c" || match[1] === "b2b")) {
      setEffectiveRole(match[1] as "b2c" | "b2b");
    }
  }, [portalRole]);

  return (
    <div
      className={`min-h-dvh w-full bg-background text-foreground flex flex-col transition-colors duration-150 ${
        noScroll ? "h-dvh overflow-hidden" : ""
      } ${className}`}
    >
      <Header portalRole={effectiveRole} />
      <main
        className={`flex-1 w-full relative flex flex-col ${
          noScroll ? "overflow-hidden" : "overflow-y-auto"
        }`}
      >
        {children}
      </main>
    </div>
  );
};
