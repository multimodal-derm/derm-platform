"use client";

import { CLASS_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
// Modern Phosphor Imports - No suffix
import { TargetIcon, ChartBarHorizontalIcon } from "@phosphor-icons/react";
import { motion } from "framer-motion";

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
      className="space-y-5 font-sans"
      role="list"
      aria-label="Class probability distribution"
    >
      {sorted.map(([cls, prob], index) => {
        const isPredicted = cls === prediction;
        const pct = (prob * 100).toFixed(1);
        const barWidth = (prob / maxProb) * 100;

        return (
          <div
            key={cls}
            role="listitem"
            className="group"
            aria-label={`${CLASS_LABELS[cls]}: ${pct}%${isPredicted ? " (predicted)" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {/* Visual Marker */}
                <div className={cn(
                  "flex size-6 items-center justify-center rounded-md border transition-colors",
                  isPredicted 
                    ? "bg-foreground text-background border-foreground shadow-sm" 
                    : "bg-muted/50 text-muted-foreground border-border/50 group-hover:border-border"
                )}>
                  {isPredicted ? (
                    <TargetIcon weight="bold" className="size-3.5" />
                  ) : (
                    <ChartBarHorizontalIcon weight="duotone" className="size-3" />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono text-xs font-bold tracking-tighter",
                      isPredicted ? "text-foreground" : "text-muted-foreground"
                    )}>
                      {cls}
                    </span>
                    {isPredicted && (
                      <span className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] bg-foreground/5 px-1.5 py-0.5 rounded text-foreground border border-foreground/10">
                        Primary Target
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground/60 leading-none mt-0.5">
                    {CLASS_LABELS[cls]}
                  </span>
                </div>
              </div>

              <span className={cn(
                "font-mono text-sm font-bold tabular-nums",
                isPredicted ? "text-foreground" : "text-muted-foreground"
              )}>
                {pct}%
              </span>
            </div>

            {/* High-Contrast Technical Progress Bar */}
            <div
              className="relative h-2 w-full overflow-hidden rounded-full bg-muted/30"
              role="progressbar"
              aria-valuenow={parseFloat(pct)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ duration: 1, ease: "circOut", delay: index * 0.05 }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-colors",
                  isPredicted
                    ? "bg-foreground shadow-[0_0_15px_rgba(var(--foreground),0.1)]"
                    : "bg-muted-foreground/40"
                )}
              />
              {isPredicted && (
                <motion.div 
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-background/20 to-transparent"
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}