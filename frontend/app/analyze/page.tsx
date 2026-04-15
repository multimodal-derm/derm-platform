"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { ClinicalForm } from "@/components/clinical-form";
import ResultsDashboard from "@/components/results-dashboard";
import { predict } from "@/lib/api";
import { ClinicalMetadata, PredictionResponse } from "@/lib/types";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

// Corrected Phosphor Imports
import { 
  Microscope, 
  SelectionPlus, 
  Stethoscope, 
  ChartBar, 
  ArrowLeft, 
  ArrowRight, 
  PencilCircle,
  WarningCircle,
  Info,
  Files
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
  { key: "input", icon: Microscope, label: "Acquisition", detail: "Data Input" },
  { key: "confirm", icon: SelectionPlus, label: "Verification", detail: "Review Stage" },
  { key: "loading", icon: Stethoscope, label: "Inference", detail: "Processing" },
  { key: "results", icon: ChartBar, label: "Diagnostic", detail: "Output" },
] as const;

export default function AnalyzePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ClinicalMetadata>(DEFAULT_METADATA);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("input");

  const isFormValid = image && metadata.age > 0 && metadata.sex && metadata.fitzpatrick && metadata.location && metadata.diameter > 0;

  const handleSubmit = async () => {
    setStep("loading");
    setError(null);
    try {
      const res = await predict(image!, metadata);
      setResult(res);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
      setStep("input");
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] font-sans selection:bg-foreground/10">
      <MedicalLoadingScreen isVisible={step === "loading"} />

      <div className="mx-auto flex max-w-[1600px] gap-0">
        
        {/* ========== LEFT: PERSISTENT INSTRUMENT NAV ========== */}
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
                    <div key={s.key} className={cn(
                      "group relative flex items-start gap-4 transition-all duration-500",
                      !isActive && !isCompleted && "opacity-30"
                    )}>
                      <div className={cn(
                        "z-10 flex size-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-500",
                        isActive ? "border-foreground bg-foreground text-background shadow-2xl shadow-foreground/20" : "border-border bg-muted/50"
                      )}>
                        <s.icon weight={isActive ? "bold" : "duotone"} className="size-5" />
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={cn("text-xs font-bold uppercase tracking-widest transition-colors", isActive ? "text-foreground" : "text-muted-foreground")}>
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

          <div className="mt-auto p-10">
             <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Engine Status</p>
                <div className="flex items-center gap-2">
                   <div className="size-2 animate-pulse rounded-full bg-emerald-500" />
                   <span className="text-xs font-bold uppercase tracking-tighter">Ready for Batch</span>
                </div>
             </div>
          </div>
        </aside>

        {/* ========== RIGHT: DYNAMIC WORKSPACE ========== */}
        <main className="flex-1 px-6 py-12 lg:px-20 lg:py-20">
          <AnimatePresence mode="wait">
            
            {/* STEP: INPUT */}
            {step === "input" && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="mx-auto max-w-6xl space-y-12"
              >
                <header>
                   <h1 className="text-5xl font-extrabold tracking-tight text-foreground md:text-6xl">Data Acquisition.</h1>
                   <p className="mt-4 text-xl text-muted-foreground">Upload dermoscopic imagery and define patient variables.</p>
                </header>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                  <div className="lg:col-span-7">
                    <div className="group relative overflow-hidden rounded-[2.5rem] border border-border/40 bg-background transition-all hover:border-foreground/20 hover:shadow-2xl hover:shadow-foreground/5">
                      <div className="p-8">
                        <ImageUpload image={image} preview={preview} onImageSelect={(file, prev) => { setImage(file); setPreview(prev); }} onImageClear={() => { setImage(null); setPreview(null); }} />
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
                    <Info size={20} weight="duotone" />
                    <span className="text-sm font-medium">All fields must be completed to initialize the MedSigLIP encoder.</span>
                  </div>
                  <Button 
                    size="lg" 
                    disabled={!isFormValid} 
                    onClick={() => setStep("confirm")} 
                    className="h-16 rounded-full px-12 text-lg font-bold shadow-xl transition-all hover:scale-[1.02]"
                  >
                    Initiate Engine
                    <ArrowRight weight="bold" className="ml-3" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP: CONFIRM (The "Technical Summary" look) */}
            {step === "confirm" && (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }}
                className="mx-auto max-w-5xl space-y-12"
              >
                <div className="relative overflow-hidden rounded-[3rem] border border-border/50 bg-background shadow-2xl">
                  {/* Verification Scanning Line Animation */}
                  <motion.div 
                    initial={{ top: "-10%" }} animate={{ top: "110%" }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 z-20 h-px w-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-5">
                    <div className="md:col-span-2 border-b md:border-b-0 md:border-r border-border/40 bg-muted/10 p-12">
                      <p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Raw Data Asset</p>
                      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 grayscale-[0.2]">
                        <img src={preview!} alt="Subject" className="h-full w-full object-cover" />
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-12 md:col-span-3">
                      <div>
                        <div className="flex items-center justify-between mb-10">
                           <h2 className="text-3xl font-bold tracking-tight">Technical Review</h2>
                           <Files weight="duotone" className="size-8 text-muted-foreground/30" />
                        </div>

                        <div className="grid grid-cols-2 gap-y-10">
                          <ReviewItem label="Subject Age" value={`${metadata.age}y`} />
                          <ReviewItem label="Sex Assigned" value={metadata.sex} />
                          <ReviewItem label="Scale" value={metadata.fitzpatrick} />
                          <ReviewItem label="Diameter" value={`${metadata.diameter}mm`} />
                        </div>
                      </div>

                      <div className="mt-20 flex gap-4">
                        <Button onClick={handleSubmit} className="h-16 flex-1 rounded-2xl text-lg font-bold shadow-xl">
                          Confirm & Run Inference
                        </Button>
                        <Button variant="outline" onClick={() => setStep("input")} className="h-16 rounded-2xl border-border/50 px-8">
                          <PencilCircle weight="duotone" className="size-6" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP: RESULTS */}
            {step === "results" && result && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-7xl"
              >
                <ResultsDashboard result={result} imagePreview={preview} metadata={metadata} />
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>

      {error && (
        <div className="fixed bottom-10 right-10 z-[200] animate-in slide-in-from-right-10">
          <div className="flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive backdrop-blur-xl">
            <WarningCircle weight="duotone" className="size-6" />
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
      <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-foreground capitalize">{value}</span>
    </div>
  )
}