"use client";

import { useEffect, useState } from "react";
// Modern Phosphor Imports - No suffixes
import { Sun, MoonStars } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  // On mount, read saved preference or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-xl transition-all duration-300",
        "border border-border/40 bg-background shadow-sm hover:border-foreground/20 hover:bg-muted/50",
        "dark:hover:bg-muted/10"
      )}
    >
      <div className="relative size-4 overflow-hidden">
        {/* Sun Icon for Dark Mode (indicating switch to light) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 ease-out",
          dark ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
        )}>
          <Sun weight="duotone" className="size-4 text-amber-500" />
        </div>

        {/* Moon Icon for Light Mode (indicating switch to dark) */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500 ease-out",
          dark ? "-translate-y-8 opacity-0" : "translate-y-0 opacity-100"
        )}>
          <MoonStars weight="duotone" className="size-4 text-foreground/70 group-hover:text-foreground" />
        </div>
      </div>
    </button>
  );
}