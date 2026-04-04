import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "high" | "moderate" | "low";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        {
          "bg-gray-100 text-gray-700": variant === "default",
          "bg-risk-high-bg text-risk-high border border-risk-high/20":
            variant === "high",
          "bg-risk-moderate-bg text-risk-moderate border border-risk-moderate/20":
            variant === "moderate",
          "bg-risk-low-bg text-risk-low border border-risk-low/20":
            variant === "low",
        },
        className,
      )}
      {...props}
    />
  );
}
