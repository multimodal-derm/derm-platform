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
import { ABCDFeaturesDisplay } from "@/components/abcd-features";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Modern Phosphor Imports
import { 
  ActivityIcon, 
  BrainIcon, 
  StackIcon, 
  ClockIcon, 
  SparkleIcon, 
  CircleNotchIcon,
  ArrowsClockwiseIcon
} from "@phosphor-icons/react";

// ── Typewriter Hook ─────────────────────────────────────────────────────────
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
    try {
      const res = await generateSummary(result);
      setSummary(res.summary);
    } catch (err) {
      console.error("Summary generation failed", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  // Trigger summary on mount
  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        
        {/* LEFT COLUMN: PRIMARY RESULTS */}
        <div className="lg:col-span-7 space-y-8">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-border/50 bg-background p-10 shadow-2xl shadow-foreground/5">
            <div className={cn("absolute inset-x-0 top-0 h-1.5", 
              result.risk_level === "HIGH" ? "bg-red-500" : "bg-emerald-500"
            )} />

            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Classification</p>
                <h2 className="text-6xl font-extrabold tracking-tighter text-foreground">
                  {result.prediction}
                </h2>
                <div className="mt-4 flex items-center gap-3">
                  <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest", riskCfg.bg, riskCfg.color)}>
                    {riskCfg.label} Risk
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:items-end">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Confidence</p>
                <span className="font-mono text-6xl font-extrabold tracking-tighter tabular-nums">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap gap-4 border-t border-border/40 pt-8">
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2 font-mono text-[10px] font-bold">
                <ClockIcon weight="duotone" className="size-3.5" /> {result.inference_time_ms}MS LATENCY
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 px-4 py-2 font-mono text-[10px] font-bold">
                <StackIcon weight="duotone" className="size-3.5" /> {result.model_version}
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-border/40 bg-muted/5 p-10">
            <h3 className="mb-8 flex items-center gap-2 text-xl font-bold tracking-tight">
              <ActivityIcon weight="duotone" className="size-5" /> Probability Matrix
            </h3>
            <ProbabilityChart probabilities={result.probabilities} prediction={result.prediction} />
          </div>
        </div>

        {/* RIGHT COLUMN: MEDGEMMA SUMMARY */}
        <div className="lg:col-span-5 space-y-8">
          
          <div className="flex flex-col rounded-[2.5rem] border border-border/50 bg-foreground p-8 text-background shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SparkleIcon weight="fill" className="size-4 animate-pulse text-background" />
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.3em]">AI Summary // MedGemma</span>
              </div>
              <button onClick={fetchSummary} className="hover:opacity-60 transition-opacity">
                <ArrowsClockwiseIcon weight="bold" className={cn("size-3", summaryLoading && "animate-spin")} />
              </button>
            </div>

            <div className="min-h-[250px] font-sans text-sm leading-relaxed text-background/80">
              {summaryLoading ? (
                <div className="flex h-40 flex-col items-center justify-center gap-4">
                  <CircleNotchIcon weight="bold" className="size-6 animate-spin opacity-40" />
                  <span className="font-mono text-[10px] uppercase tracking-widest opacity-40">Reasoning...</span>
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
                <BrainIcon weight="duotone" className="size-3" /> RAG Knowledge Fusion
              </div>
              <button onClick={() => setShowNarrative(!showNarrative)} className="font-mono text-[10px] font-bold uppercase tracking-widest hover:text-white">
                {showNarrative ? "Hide" : "View"} Context
              </button>
            </div>
            
            <AnimatePresence>
              {showNarrative && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="mt-4 rounded-xl bg-background/10 p-4 font-mono text-[10px] text-background/50">
                    {result.clinical_text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-[2.5rem] border border-border/40 bg-background p-8">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold tracking-tight text-foreground">
              <StackIcon weight="duotone" className="size-5" /> ABCD Vector analysis
            </h3>
            <ABCDFeaturesDisplay features={result.abcd_features} />
          </div>
        </div>
      </div>
    </div>
  );
}