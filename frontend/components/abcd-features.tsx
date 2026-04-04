"use client";

import { ABCDFeatures } from "@/lib/types";

interface ABCDFeaturesDisplayProps {
  features: ABCDFeatures;
}

const FEATURE_GROUPS = [
  {
    key: "asymmetry" as const,
    label: "Asymmetry",
    icon: "A",
    description: "Shape symmetry along major/minor axes",
    color: "bg-blue-500",
  },
  {
    key: "border" as const,
    label: "Border",
    icon: "B",
    description: "Border irregularity and sharpness",
    color: "bg-violet-500",
  },
  {
    key: "color" as const,
    label: "Color",
    icon: "C",
    description: "Color variation across 6 channels",
    color: "bg-amber-500",
  },
  {
    key: "diameter" as const,
    label: "Diameter",
    icon: "D",
    description: "Lesion diameter in mm",
    color: "bg-emerald-500",
  },
  {
    key: "texture" as const,
    label: "Texture",
    icon: "T",
    description: "Surface texture features",
    color: "bg-rose-500",
  },
];

export function ABCDFeaturesDisplay({ features }: ABCDFeaturesDisplayProps) {
  return (
    <div className="space-y-3" role="list" aria-label="ABCD dermatological features">
      {FEATURE_GROUPS.map((group) => {
        const values = features[group.key];
        return (
          <div
            key={group.key}
            role="listitem"
            aria-label={`${group.label}: ${values.map((v) => group.key === "diameter" ? `${v.toFixed(1)}mm` : v.toFixed(3)).join(", ")}`}
            className="rounded-lg border border-clinical-border p-3"
          >
            <div className="flex items-center gap-2.5 mb-2">
              <span
                className={`w-7 h-7 rounded-md ${group.color} text-white text-xs font-bold flex items-center justify-center`}
                aria-hidden="true"
              >
                {group.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-clinical-text">
                  {group.label}
                </p>
                <p className="text-xs text-clinical-muted">{group.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 ml-9">
              {values.map((val, i) => (
                <span
                  key={i}
                  className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-clinical-text"
                >
                  {group.key === "diameter"
                    ? `${val.toFixed(1)}mm`
                    : val.toFixed(3)}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
