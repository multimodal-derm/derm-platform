"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { ClinicalForm } from "@/components/clinical-form";
import ResultsDashboard from "@/components/results-dashboard";
import { predict, checkHealth } from "@/lib/api";
import { ClinicalMetadata, PredictionResponse } from "@/lib/types";
import { DEMO_CASES, DemoCase } from "@/lib/demo-data";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

import {
  MicroscopeIcon,
  SelectionPlusIcon,
  StethoscopeIcon,
  ChartBarIcon,
  ArrowRightIcon,
  PencilCircleIcon,
  WarningCircleIcon,
  InfoIcon,
  FilesIcon,
  WifiSlashIcon,
  FlaskIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const DEFAULT_METADATA: ClinicalMetadata = {
  age: 0,
  sex: "",
  fitzpatrick: "",
  location: "",
  diameter: 0,
  itch: false,
  grew: false,
  hurt: false,
  changed: false,
  bleed: false,
  elevation: false,
};

type Step = "input" | "confirm" | "loading" | "results";

const STEPS = [
  { key: "input", icon: MicroscopeIcon, label: "Acquisition", detail: "Data Input" },
  { key: "confirm", icon: SelectionPlusIcon, label: "Verification", detail: "Review Stage" },
  { key: "loading", icon: StethoscopeIcon, label: "Inference", detail: "Processing" },
  { key: "results", icon: ChartBarIcon, label: "Diagnostic", detail: "Output" },
] as const;

// ── Risk badge colors ────────────────────────────────────────────────────────
const RISK_COLORS = {
  HIGH: "bg-red-500/10 text-red-500 border-red-500/20",
  MODERATE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  LOW: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

export default function AnalyzePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ClinicalMetadata>(DEFAULT_METADATA);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [demoSummary, setDemoSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("input");

  // Demo mode state
  const [isOnline, setIsOnline] = useState<boolean | null>(null); // null = checking
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoCase | null>(null);

  const isFormValid =
    image &&
    metadata.age > 0 &&
    metadata.sex &&
    metadata.fitzpatrick &&
    metadata.location &&
    metadata.diameter > 0;

  // ── Check backend health on mount ─────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/health`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        setIsOnline(true);
        setIsDemoMode(false);
      } catch {
        setIsOnline(false);
        setIsDemoMode(true);
      }
    };
    check();
  }, []);

  // ── Live inference submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await predict(image!, metadata);
      setResult(res);
      setDemoSummary(null);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("input");
    }
  };

  // ── Demo case select ───────────────────────────────────────────────────────
  const handleDemoSelect = (demo: DemoCase) => {
    setSelectedDemo(demo);
    setResult(demo.result);
    setDemoSummary(demo.summary);
    setPreview(demo.imageUrl);
    setMetadata(demo.metadata);
    setStep("results");
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] font-sans selection:bg-foreground/10">
      <MedicalLoadingScreen isVisible={step === "loading"} />

      <div className="mx-auto flex max-w-[1600px] gap-0">

        {/* ── LEFT NAV ──────────────────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-80 flex-col border-r border-border/40 bg-background/50 backdrop-blur-xl lg:flex">
          <div className="p-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="size-8 rounded-lg bg-foreground flex items-center justify-center">
                <span className="font-mono text-xs font-bold text-background">DP</span>
              </div>
              <span className="font-bold tracking-tighter text-lg">DermPlatform</span>
            </div>

            <nav className="space-y-10">
              {STEPS.map((s, i) => {
                const isActive = i === stepIndex;
                const isCompleted = i < stepIndex;
                return (
                  <div
                    key={s.key}
                    className={cn(
                      "group relative flex items-start gap-4 transition-all duration-500",
                      !isActive && !isCompleted && "opacity-30"
                    )}
                  >
                    <div className={cn(
                      "z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500",
                      isActive
                        ? "border-foreground bg-foreground text-background shadow-2xl shadow-foreground/20"
                        : "border-border bg-muted/50"
                    )}>
                      <s.icon weight={isActive ? "bold" : "duotone"} className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-widest transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {s.label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground/60">{s.detail}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-5 top-10 h-10 w-px bg-border/40" />
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="mt-auto p-10 space-y-3">
            {/* Backend status indicator */}
            <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                Backend Status
              </p>
              <div className="flex items-center gap-2">
                {isOnline === null && (
                  <>
                    <div className="size-2 animate-pulse rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-tighter text-amber-500">Checking...</span>
                  </>
                )}
                {isOnline === true && (
                  <>
                    <div className="size-2 animate-pulse rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-tighter text-emerald-500">Live</span>
                  </>
                )}
                {isOnline === false && (
                  <>
                    <div className="size-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold uppercase tracking-tighter text-red-500">Offline — Demo Mode</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* ── MAIN WORKSPACE ───────────────────────────────────────────────── */}
        <main className="flex-1 px-6 py-12 lg:px-20 lg:py-20">

          {/* Demo mode banner */}
          <AnimatePresence>
            {isDemoMode && step !== "results" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8 flex items-center gap-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 px-6 py-4"
              >
                <WifiSlashIcon weight="duotone" className="size-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                    Backend offline — Demo Mode
                  </p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">
                    Showing cached predictions from real PAD-UFES-20 validation samples. Select a case below to explore the full analysis flow.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">

            {/* ── STEP: INPUT (live mode) ──────────────────────────────────── */}
            {step === "input" && !isDemoMode && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="mx-auto max-w-6xl space-y-12"
              >
                <header>
                  <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
                    Data Acquisition.
                  </h1>
                  <p className="mt-4 text-xl text-muted-foreground">
                    Upload dermoscopic imagery and define patient variables.
                  </p>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background transition-all hover:border-foreground/20 hover:shadow-2xl hover:shadow-foreground/5">
                      <div className="p-8">
                        <ImageUpload
                          image={image}
                          preview={preview}
                          onImageSelect={(file, prev) => { setImage(file); setPreview(prev); }}
                          onImageClear={() => { setImage(null); setPreview(null); }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <div className="rounded-[2.5rem] border border-border/40 bg-background p-8">
                      <ClinicalForm metadata={metadata} onChange={setMetadata} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[2.5rem] border border-border/40 bg-background p-4 pr-4">
                  <div className="flex items-center gap-4 pl-6 text-muted-foreground">
                    <InfoIcon size={20} weight="duotone" />
                    <span className="text-sm font-medium">
                      All fields must be completed to initialize the MedSigLIP encoder.
                    </span>
                  </div>
                  <Button
                    size="lg"
                    disabled={!isFormValid}
                    onClick={() => setStep("confirm")}
                    className="h-16 rounded-full px-12 text-lg font-bold shadow-xl transition-all hover:scale-[1.02]"
                  >
                    Initiate Engine
                    <ArrowRightIcon weight="bold" className="ml-3" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── STEP: INPUT (demo mode — case selector) ─────────────────── */}
            {step === "input" && isDemoMode && (
              <motion.div
                key="demo-select"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="mx-auto max-w-4xl space-y-10"
              >
                <header>
                  <div className="flex items-center gap-3 mb-4">
                    <FlaskIcon weight="duotone" className="size-6 text-amber-500" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-amber-500">
                      Demo Mode
                    </span>
                  </div>
                  <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">
                    Sample Cases.
                  </h1>
                  <p className="mt-4 text-xl text-muted-foreground">
                    Select a real PAD-UFES-20 validation sample to explore the full analysis pipeline.
                  </p>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {DEMO_CASES.map((demo) => (
                    <motion.button
                      key={demo.id}
                      onClick={() => handleDemoSelect(demo)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="group relative overflow-hidden rounded-[2rem] border border-border/40 bg-background p-6 text-left transition-all hover:border-foreground/20 hover:shadow-xl hover:shadow-foreground/5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-2xl font-extrabold tracking-tighter text-foreground">
                              {demo.result.prediction}
                            </span>
                            <span className={cn(
                              "rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
                              RISK_COLORS[demo.result.risk_level]
                            )}>
                              {demo.result.risk_level}
                            </span>
                          </div>
                          <p className="font-mono text-[11px] text-muted-foreground">
                            {demo.description}
                          </p>
                        </div>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/20 group-hover:border-foreground/20 group-hover:bg-foreground/5 transition-all">
                          <ArrowRightIcon weight="bold" className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>

                      {/* Confidence bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                            Confidence
                          </span>
                          <span className="font-mono text-[9px] font-bold text-foreground">
                            {(demo.result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-muted/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-foreground"
                            style={{ width: `${demo.result.confidence * 100}%` }}
                          />
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-border/30 bg-muted/10 px-6 py-4">
                  <CheckCircleIcon weight="duotone" className="size-4 text-muted-foreground shrink-0" />
                  <p className="font-mono text-[10px] text-muted-foreground">
                    All cases are real validation samples from PAD-UFES-20 with actual model predictions, ABCD features, and pre-generated clinical summaries.
                  </p>
                </div>
              </motion.div>
            )}

            {/* ── STEP: CONFIRM ────────────────────────────────────────────── */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                className="mx-auto max-w-5xl space-y-12"
              >
                <div className="relative overflow-hidden rounded-[3rem] border border-border/50 bg-background shadow-2xl">
                  <motion.div
                    initial={{ top: "-10%" }} animate={{ top: "110%" }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 z-20 h-px w-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-5">
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border/40 bg-muted/10 p-12">
                      <p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">
                        Raw Data Asset
                      </p>
                      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 grayscale-[0.2]">
                        <img src={preview!} alt="Subject" className="h-full w-full object-cover" />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-12 md:col-span-3">
                      <div>
                        <div className="flex items-center justify-between mb-10">
                          <h2 className="text-3xl font-bold tracking-tight">Technical Review</h2>
                          <FilesIcon weight="duotone" className="size-8 text-muted-foreground/30" />
                        </div>

                        <div className="grid grid-cols-2 gap-y-10">
                          <ReviewItem label="Subject Age" value={`${metadata.age}y`} />
                          <ReviewItem label="Sex Assigned" value={metadata.sex} />
                          <ReviewItem label="Scale" value={metadata.fitzpatrick} />
                          <ReviewItem label="Diameter" value={`${metadata.diameter}mm`} />
                        </div>
                      </div>

                      <div className="mt-20 flex gap-4">
                        <Button
                          onClick={handleSubmit}
                          className="h-16 flex-1 rounded-2xl text-lg font-bold shadow-xl"
                        >
                          Confirm & Run Inference
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setStep("input")}
                          className="h-16 rounded-2xl border-border/50 px-8"
                        >
                          <PencilCircleIcon weight="duotone" className="size-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP: RESULTS ────────────────────────────────────────────── */}
            {step === "results" && result && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-7xl"
              >
                {/* Demo mode indicator on results */}
                {isDemoMode && (
                  <div className="mb-6 flex items-center justify-between rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-3">
                    <div className="flex items-center gap-3">
                      <FlaskIcon weight="duotone" className="size-4 text-amber-500" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500">
                        Demo — {selectedDemo?.label}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setStep("input");
                        setResult(null);
                        setSelectedDemo(null);
                      }}
                      className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500/60 hover:text-amber-500 transition-colors"
                    >
                      ← Try another case
                    </button>
                  </div>
                )}

                <ResultsDashboard
                  result={result}
                  imagePreview={preview}
                  metadata={metadata}
                  cachedSummary={demoSummary}
                />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {error && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-10">
          <div className="flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive backdrop-blur-xl">
            <WarningCircleIcon weight="duotone" className="size-6" />
            <p className="text-sm font-bold tracking-tight">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
        {label}
      </span>
      <span className="text-2xl font-bold tabular-nums text-foreground capitalize">{value}</span>
    </div>
  );
}
