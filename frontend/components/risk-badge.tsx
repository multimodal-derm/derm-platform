import { Badge } from "@/components/ui/badge";
import { RISK_CONFIG } from "@/lib/types";
import { AlertTriangle, AlertCircle, ShieldCheck } from "lucide-react";

interface RiskBadgeProps {
  level: "HIGH" | "MODERATE" | "LOW";
  size?: "sm" | "lg";
}

const RISK_ICONS = {
  HIGH: AlertTriangle,
  MODERATE: AlertCircle,
  LOW: ShieldCheck,
} as const;

export function RiskBadge({ level, size = "sm" }: RiskBadgeProps) {
  const config = RISK_CONFIG[level];
  const variant = level.toLowerCase() as "high" | "moderate" | "low";
  const Icon = RISK_ICONS[level];
  const iconSize = size === "lg" ? "w-4 h-4" : "w-3.5 h-3.5";

  return (
    <Badge
      variant={variant}
      className={size === "lg" ? "px-4 py-1.5 text-sm" : ""}
      role="status"
      aria-label={`Risk level: ${config.label}`}
    >
      <Icon className={iconSize} aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
