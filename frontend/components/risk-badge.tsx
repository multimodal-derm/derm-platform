"use client";

import { Badge } from "@/components/ui/badge";
import { RISK_CONFIG } from "@/lib/types";
import { cn } from "@/lib/utils";
// Modern Phosphor Imports
import { WarningCircleIcon, WarningIcon, ShieldCheckIcon } from "@phosphor-icons/react";

interface RiskBadgeProps {
  level: "HIGH" | "MODERATE" | "LOW";
  size?: "sm" | "lg";
  className?: string;
}

const RISK_ICONS = {
  HIGH: WarningIcon,
  MODERATE: WarningCircleIcon,
  LOW: ShieldCheckIcon,
} as const;

export function RiskBadge({ level, size = "sm", className }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const Icon = RISK_ICONS[level];
  
  // Mapping levels to high-contrast technical colors
  const colorStyles = {
    HIGH: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 dark:border-red-500/30",
    MODERATE: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 dark:border-amber-500/30",
    LOW: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:border-emerald-500/30",
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-2 font-mono font-bold uppercase tracking-widest transition-all",
        colorStyles[level],
        size === "lg" ? "px-5 py-2 text-[11px]" : "px-3 py-1 text-[9px]",
        className
      )}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <Icon 
        weight="duotone" 
        className={size === "lg" ? "size-4" : "size-3.5"} 
        aria-hidden="true" 
      />
      {config.label}
    </Badge>
  );
}