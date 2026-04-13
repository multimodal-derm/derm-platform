"use client";

import { ABCDFeatures } from "@/lib/types";
import { cn } from "@/lib/utils";
// Updated Phosphor imports
import {
  SquaresFourIcon,
  SelectionBackgroundIcon,
  PaletteIcon,
  ArrowsOutCardinalIcon,
  FingerprintIcon,
} from "@phosphor-icons/react";

interface ABCDFeaturesDisplayProps {
  features: ABCDFeatures;
}

const FEATURE_GROUPS = [
  {
    key: "asymmetry" as const,
    label: "Asymmetry",
    icon: SquaresFourIcon,
    description: "Shape symmetry along major/minor axes",
  },
  {
    key: "border" as const,
    label: "Border",
    icon: SelectionBackgroundIcon,
    description: "Border irregularity and sharpness",
  },
  {
    key: "color" as const,
    label: "Color",
    icon: PaletteIcon,
    description: "Color variation across 6 channels",
  },
  {
    key: "diameter" as const,
    label: "Diameter",
    icon: ArrowsOutCardinalIcon,
    description: "Lesion diameter in mm",
  },
  {
    key: "texture" as const,
    label: "Texture",
    icon: FingerprintIcon,
    description: "Surface texture features",
  },
];

export function ABCDFeaturesDisplay({ features }: ABCDFeaturesDisplayProps) {
  return (
    <div className="space-y-3 font-sans" role="list" aria-label="ABCD dermatological features">
      {FEATURE_GROUPS.map((group) => {
        const values = features[group.key];
        const Icon = group.icon;

        return (
          <div
            key={group.key}
            role="listitem"
            className="group rounded-2xl border border-border/50 bg-muted/5 p-4 transition-all duration-300 hover:bg-background hover:shadow-xl hover:shadow-foreground/5"
          >
            <div className="flex items-start gap-4">
              {/* Technical Monochrome Icon Container */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background text-foreground shadow-sm transition-all duration-300 group-hover:bg-foreground group-hover:text-background">
                <Icon weight="duotone" className="size-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold tracking-tight text-foreground">
                    {group.label}
                  </p>
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
                    Vector Node
                  </span>
                </div>
                <p className="font-sans text-[11px] leading-relaxed text-muted-foreground/80">
                  {group.description}
                </p>

                {/* Value Tags - Using Geist Mono for a technical readout feel */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {values.map((val, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-lg border border-border/50 bg-background px-2.5 py-1 font-mono text-[10px] font-bold text-foreground shadow-sm transition-transform hover:scale-105"
                    >
                      {group.key === "diameter"
                        ? `${val.toFixed(1)}mm`
                        : val.toFixed(3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}