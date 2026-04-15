"use client";

import { useEffect, useState } from "react";
import {
  PredictionResponse,
  ClinicalMetadata,
  CLASS_LABELS,
  RISK_CONFIG,
} from "@/lib/types";
import { generateSummary } from "@/lib/api";
import { ProbabilityChart } from "@/components/probability-chart";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import {
  ActivityIcon,
  BrainIcon,
  StackIcon,
  SparkleIcon,
  CircleNotchIcon,
  ArrowsClockwiseIcon,
  FileTextIcon,
  CpuIcon,
  WarningCircleIcon,
  CheckCircleIcon,
  EyeIcon,
} from "@phosphor-icons/react";

// ── Typewriter Hook ──────────────────────────────────────────────────────────
function useTypewriter(text: string | null, speed = 6) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) { setDisplayed(""); return; }
    setIsTyping(true);
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, isTyping };
}

// ── ABCD Visual Bar ──────────────────────────────────────────────────────────
function ABCDBar({
  label,
  description,
  values,
  max = 1,
}: {
  label: string;
  description: string;
  values: number[];
  max?: number;
}) {
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const pct = Math.min((avg / max) * 100, 100);
  const level = pct > 66 ? "high" : pct > 33 ? "moderate" : "low";

  const cfg = {
    high:     { label: "High",     bar: "bg-red-400",     text: "text-red-400",     icon: <WarningCircleIcon weight="fill" className="size-3" /> },
    moderate: { label: "Moderate", bar: "bg-amber-400",   text: "text-amber-400",   icon: <ActivityIcon weight="fill" className="size-3" /> },
    low:      { label: "Low",      bar: "bg-emerald-400", text: "text-emerald-400", icon: <CheckCircleIcon weight="fill" className="size-3" /> },
  }[level];

  return (
    <div className="group">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
            {label}
          </span>
          <p className="font-mono text-[9px] text-muted-foreground mt-0.5">{description}</p>
        </div>
        <div className={cn("flex items-center gap-1 font-mono text-[9px] font-bold uppercase tracking-widest", cfg.text)}>
          {cfg.icon}
          {cfg.label}
        </div>
      </div>

      <div className="relative h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full rounded-full", cfg.bar)}
        />
      </div>

      {/* Raw values revealed on hover */}
      <div className="mt-1.5 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {values.map((v, i) => (
          <span key={i} className="font-mono text-[9px] text-muted-foreground">
            {v.toFixed(3)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── ABCD Section ─────────────────────────────────────────────────────────────
function ABCDSection({ features }: { features: PredictionResponse["abcd_features"] | null | undefined }) {
  if (!features) return (
    <p className="font-mono text-[11px] text-muted-foreground">ABCD features unavailable.</p>
  );

  const diameterMm = features.diameter?.[0] ?? 0;

  const rows = [
    {
      label: "A — Asymmetry",
      description: "Shape symmetry along major/minor axes",
      values: features.asymmetry ?? [0, 0],
    },
    {
      label: "B — Border",
      description: "Irregularity and sharpness",
      values: features.border ?? [0, 0],
    },
    {
      label: "C — Color",
      description: "Variation across 6 channels",
      values: features.color ?? [0, 0, 0, 0, 0, 0],
      max: 255,
    },
    {
      label: "D — Diameter",
      description: `Lesion size — ${diameterMm.toFixed(1)} mm`,
      values: [Math.min(diameterMm / 20, 1)],
    },
    {
      label: "T — Texture",
      description: "Surface texture descriptors",
      values: features.texture ?? [0, 0, 0],
    },
  ];

  return (
    <div className="space-y-5">
      {rows.map((r) => (
        <ABCDBar key={r.label} {...r} />
      ))}
      <p className="font-mono text-[9px] text-muted-foreground border-t border-border/40 pt-4 mt-4">
        Hover any feature to reveal raw vector values · Computed on 512×512 lesion crop
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResultsDashboard({
  result,
  imagePreview,
  metadata,
}: {
  result: PredictionResponse;
  imagePreview: string | null;
  metadata: ClinicalMetadata;
}) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  const riskCfg = RISK_CONFIG[result.risk_level];
  const { displayed: typedSummary, isTyping } = useTypewriter(summary);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummary(null);
    try {
      const res = await generateSummary(result);
      setSummary(res.summary);
    } catch {
      setSummary("Clinical summary unavailable. Please retry.");
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const riskBarColor =
    result.risk_level === "HIGH"     ? "bg-red-500" :
    result.risk_level === "MODERATE" ? "bg-amber-500" :
    "bg-emerald-500";

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">

          {/* Classification card */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-background p-10 shadow-2xl shadow-foreground/5">
            <div className={cn("absolute inset-x-0 top-0 h-1", riskBarColor)} />

            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Classification
                </p>
                <h2 className="text-7xl font-extrabold tracking-tighter text-foreground leading-none">
                  {result.prediction}
                </h2>
                {CLASS_LABELS && CLASS_LABELS[result.prediction] && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {CLASS_LABELS[result.prediction]}
                  </p>
                )}
                <div className="mt-4">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                    riskCfg.bg, riskCfg.color
                  )}>
                    {result.risk_level} Risk
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:items-end">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                  Confidence
                </p>
                <span className="font-mono text-7xl font-extrabold tracking-tighter tabular-nums leading-none">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
              <p className="font-mono text-[10px] text-amber-600 dark:text-amber-400">
                ⚠ Clinical decision support only — not a diagnosis. Consult a dermatologist.
              </p>
            </div>
          </div>

          {/* Probability matrix */}
          <div className="rounded-[2.5rem] border border-border/40 bg-muted/5 p-10">
            <h3 className="mb-8 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <ActivityIcon weight="duotone" className="size-4" /> Probability Matrix
            </h3>
            <ProbabilityChart
              probabilities={result.probabilities}
              prediction={result.prediction}
            />
          </div>

          {/* ABCD analysis */}
          <div className="rounded-[2.5rem] border border-border/40 bg-background p-10">
            <h3 className="mb-8 flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <StackIcon weight="duotone" className="size-4" /> ABCD Feature Analysis
            </h3>
            <ABCDSection features={result.abcd_features} />
          </div>
        </div>

        {/* ── RIGHT COLUMN: AI SUMMARY ─────────────────────────────────────── */}
        <div className="lg:col-span-5">
          <div className="sticky top-10 flex flex-col rounded-[2.5rem] border border-border/50 bg-foreground p-9 text-background shadow-2xl">

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-background/10">
                  <FileTextIcon weight="duotone" className="size-5 text-background" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-background">
                    Analytical Briefing
                  </span>
                  <span className="font-mono text-[9px] text-background/40">
                    MedGemma 4B · RAG-verified corpus
                  </span>
                </div>
              </div>
              <button
                onClick={fetchSummary}
                disabled={summaryLoading}
                aria-label="Regenerate summary"
                className="flex size-8 items-center justify-center rounded-full hover:bg-background/10 transition-colors disabled:opacity-40"
              >
                <ArrowsClockwiseIcon
                  weight="bold"
                  className={cn("size-3.5 text-background", summaryLoading && "animate-spin")}
                />
              </button>
            </div>

            {/* Summary content */}
            <div className="flex-1 min-h-[320px] border-l border-background/15 pl-6">
              {summaryLoading ? (
                <div className="flex h-48 flex-col items-center justify-center gap-4">
                  <div className="relative flex size-12 items-center justify-center">
                    <CircleNotchIcon weight="bold" className="absolute size-12 animate-spin opacity-20 text-background" />
                    <SparkleIcon weight="fill" className="size-4 animate-pulse text-background" />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.4em] text-background/30">
                    Synthesising clinical context...
                  </span>
                </div>
              ) : (
                <div className="space-y-5">
                  {typedSummary.split("\n").map((p, i) =>
                    p.trim() ? (
                      <p key={i} className="font-mono text-[12px] leading-[1.8] text-background/85">
                        {p}
                      </p>
                    ) : null
                  )}
                  {isTyping && (
                    <span className="inline-block h-3.5 w-2 translate-y-0.5 rounded-sm bg-background shadow-[0_0_10px_rgba(255,255,255,0.6)] animate-pulse ml-0.5" />
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 flex items-center justify-between border-t border-background/10 pt-6">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-full bg-background/5">
                  <CpuIcon weight="duotone" className="size-3.5 text-background/40" />
                </div>
                <div className="flex flex-col">
                  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-background/40">
                    Knowledge Synthesis
                  </span>
                  <span className="font-mono text-[8px] italic text-background/20">
                    RAG-verified clinical corpus
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowNarrative(!showNarrative)}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-widest transition-all",
                  showNarrative
                    ? "bg-background text-foreground"
                    : "bg-background/10 text-background hover:bg-background/20"
                )}
              >
                <FileTextIcon weight="duotone" className="size-3" />
                {showNarrative ? "Hide" : "View"} Context
              </button>
            </div>

            {/* Clinical narrative */}
            <AnimatePresence>
              {showNarrative && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-2xl border border-background/10 bg-background/5 p-4">
                    <div className="mb-2 flex items-center gap-1.5 opacity-50">
                      <EyeIcon weight="duotone" className="size-3 text-background" />
                      <span className="font-mono text-[9px] uppercase tracking-widest text-background">
                        Clinical Input
                      </span>
                    </div>
                    <p className="font-mono text-[10px] italic leading-relaxed text-background/50">
                      &gt; {result.clinical_text}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}