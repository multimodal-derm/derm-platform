"use client";

import { CLASS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ProbabilityChartProps {
  probabilities: Record<string, number>;
  prediction: string;
}

export function ProbabilityChart({
  probabilities,
  prediction,
}: ProbabilityChartProps) {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a);
  const maxProb = Math.max(...Object.values(probabilities));

  return (
    <div
      className="space-y-3"
      role="list"
      aria-label="Class probability distribution"
    >
      {sorted.map(([cls, prob]) => {
        const isPredicted = cls === prediction;
        const pct = (prob * 100).toFixed(1);
        const barWidth = (prob / maxProb) * 100;

        return (
          <div
            key={cls}
            role="listitem"
            aria-label={`${CLASS_LABELS[cls]}: ${pct}%${isPredicted ? " (predicted)" : ""}`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                {/* Icon marker for predicted class — not color-only */}
                {isPredicted && (
                  <Check
                    className="w-4 h-4 text-brand-700 flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span
                  className={cn(
                    "text-sm font-mono font-medium",
                    isPredicted ? "text-brand-700" : "text-clinical-muted",
                  )}
                >
                  {cls}
                </span>
                <span className="text-xs text-clinical-muted hidden sm:inline">
                  {CLASS_LABELS[cls]}
                </span>
                {isPredicted && (
                  <span className="text-xs font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
                    Predicted
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm font-mono font-semibold",
                  isPredicted ? "text-brand-700" : "text-clinical-text",
                )}
              >
                {pct}%
              </span>
            </div>
            <div
              className="h-3 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={parseFloat(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${cls} probability: ${pct}%`}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  isPredicted
                    ? "bg-gradient-to-r from-brand-500 to-brand-600"
                    : "bg-gray-300",
                )}
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
