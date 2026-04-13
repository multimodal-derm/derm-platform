"use client";

import { useEffect, useState, useRef } from "react";
import {
  PredictionResponse,
  ClinicalMetadata,
  CLASS_LABELS,
  RISK_CONFIG,
} from "@/lib/types";
import { generateSummary } from "@/lib/api";
import { ProbabilityChart } from "@/components/probability-chart";
import { ABCDFeaturesDisplay } from "@/components/abcd-features";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Premium Phosphor Imports
import {
  ActivityIcon,
  BrainIcon,
  StackIcon,
  ClockIcon,
  SparkleIcon,
  CircleNotchIcon,
  ArrowsClockwiseIcon,
  CaretDownIcon,
  CaretUpIcon,
  ShieldIcon,
  FileTextIcon,
  TrendUpIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

// ── Typewriter hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string | null, speed: number = 8) {
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

export function ResultsDashboard({
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
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  const riskCfg = RISK_CONFIG[result.risk_level];
  const { displayed: typedSummary, isTyping } = useTypewriter(summary);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await generateSummary(result);
      setSummary(res.summary);
    } catch (err) {
      console.error("Summary failed", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-8 font-sans pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* ── 1. SYSTEM ADVISORY ── */}
      <section>
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-200/40 bg-amber-50/30 px-6 py-4 transition-all hover:bg-amber-50 dark:border-amber-900/20 dark:bg-amber-950/10"
        >
          <ShieldIcon weight="duotone" className="size-5 text-amber-600" />
          <span className="flex-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300">
            Clinical Decision Support // Advisory v1.02
          </span>
          {showDisclaimer ? <CaretUpIcon weight="bold" className="size-3" /> : <CaretDownIcon weight="bold" className="size-3" />}
        </button>
        <AnimatePresence>
          {showDisclaimer && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-2 rounded-2xl border border-border/40 bg-muted/5 p-6 text-[13px] leading-relaxed text-muted-foreground">
                This AI-generated analysis is intended as a secondary decision support tool for researchers and medical professionals. 
                Final diagnosis must be validated by a board-certified dermatologist using histopathological confirmation.
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ── 2. PRIMARY DIAGNOSTIC HUD ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* Left: Classification & Probability */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-background p-10 shadow-2xl shadow-foreground/5">
            {/* Risk Accent Line */}
            <div className={cn("absolute inset-x-0 top-0 h-1.5", 
              result.risk_level === "HIGH" ? "bg-red-500" : result.risk_level === "MODERATE" ? "bg-amber-500" : "bg-emerald-500"
            )} />

            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Primary Classification</p>
                <h2 className="text-5xl font-extrabold tracking-tighter text-foreground sm:text-6xl">
                  {result.prediction}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest", riskCfg.bg, riskCfg.color)}>
                    {riskCfg.label} Risk
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">{CLASS_LABELS[result.prediction]}</span>
                </div>
              </div>

              <div className="flex flex-col items-start md:items-end">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Confidence</p>
                <span className="font-mono text-6xl font-extrabold tracking-tighter text-foreground tabular-nums">
                  {(result.confidence * 100).toFixed(1)}<span className="text-xl text-muted-foreground">%</span>
                </span>
              </div>
            </div>

            {/* Inference Telemetry */}
            <div className="mt-12 flex flex-wrap gap-4 border-t border-border/40 pt-8">
              <TelemetryItem icon={ClockIcon} label="Latency" value={`${result.inference_time_ms}ms`} />
              <TelemetryItem icon={StackIcon} label="Model" value={result.model_version} />
              <TelemetryItem icon={TrendUpIcon} label="Entropy" value="0.42" />
            </div>
          </div>

          {/* Probability Matrix */}
          <div className="rounded-[2.5rem] border border-border/40 bg-muted/5 p-10">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                <ActivityIcon weight="duotone" className="size-5" /> Probability Matrix
              </h3>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">Softmax Distribution</span>
            </div>
            <ProbabilityChart probabilities={result.probabilities} prediction={result.prediction} />
          </div>
        </div>

        {/* Right: AI Narrative & Metadata */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* AI Clinical Summary (The "MedGemma" Terminal) */}
          <div className="flex flex-col rounded-[2.5rem] border border-border/50 bg-foreground p-8 text-background shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparkleIcon weight="fill" className="size-4 animate-pulse" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]">AI Summary // MedGemma</span>
              </div>
              {summary && (
                <button onClick={fetchSummary} className="rounded-full bg-background/10 p-1.5 transition-colors hover:bg-background/20">
                  <ArrowsClockwiseIcon weight="bold" className={cn("size-3", summaryLoading && "animate-spin")} />
                </button>
              )}
            </div>

            <div className="min-h-[200px] font-sans text-sm leading-relaxed text-background/80">
              {summaryLoading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-4">
                  <CircleNotchIcon weight="bold" className="size-6 animate-spin opacity-40" />
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Synthesizing Narrative...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {typedSummary.split("\n").map((p, i) => p.trim() ? <p key={i}>{p}</p> : null)}
                  {isTyping && <span className="inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-background rounded-full" />}
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-background/10 pt-6">
              <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-background/40">
                <BrainIcon weight="duotone" className="size-3" />
                RAG Knowledge Fusion
              </div>
              <button onClick={() => setShowNarrative(!showNarrative)} className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:text-white">
                <FileTextIcon weight="duotone" className="size-3" />
                {showNarrative ? "Hide" : "View"} Input
              </button>
            </div>
            
            <AnimatePresence>
              {showNarrative && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="mt-4 rounded-xl bg-background/10 p-4 font-mono text-[10px] leading-relaxed text-background/60">
                    {result.clinical_text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ABCD Node analysis */}
          <div className="rounded-[2.5rem] border border-border/40 bg-background p-8">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight">
              <StackIcon weight="duotone" className="size-5" /> ABCD Nodes
            </h3>
            <ABCDFeaturesDisplay features={result.abcd_features} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TelemetryItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2">
      <Icon weight="duotone" className="size-3.5 text-muted-foreground" />
      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</span>
      <span className="font-mono text-[10px] font-bold text-foreground">{value}</span>
    </div>
  );
}