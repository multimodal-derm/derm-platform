"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { ClinicalForm } from "@/components/clinical-form";
import { ResultsDashboard } from "@/components/results-dashboard";
import { predict } from "@/lib/api";
import { ClinicalMetadata, PredictionResponse } from "@/lib/types";

// Cinematic Loading Screen
const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

// Premium Phosphor Icons
import { 
  Microscope, 
  ClipboardText, 
  ChartBar, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  PencilLine,
  WarningCircle,
  Stethoscope,
  Info
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
  { key: "input", icon: Microscope, label: "Acquisition" },
  { key: "confirm", icon: CheckCircle, label: "Verification" },
  { key: "loading", icon: Stethoscope, label: "Inference" },
  { key: "results", icon: ChartBar, label: "Analysis" },
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
    <div className="min-h-screen bg-background font-sans selection:bg-foreground/10">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-20">
        
        {/* ========== 1. NAV & HEADER ========== */}
        <header className="mb-12 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="max-w-2xl"
          >
            {step !== "input" && (
              <button
                onClick={() => setStep("input")}
                className="group mb-4 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft weight="bold" className="size-3 transition-transform group-hover:-translate-x-1" />
                Reset Session
              </button>
            )}
            <h1 className="text-4xl font-extrabold tracking-tighter text-foreground md:text-5xl">
              {step === "results" ? "Analysis Ready." : "Diagnostic Workspace."}
            </h1>
          </motion.div>

          {/* Progress Stepper */}
          <nav className="flex items-center gap-2 rounded-2xl border border-border/50 bg-muted/5 p-1.5 backdrop-blur-md">
            {STEPS.map((s, i) => {
              const isActive = i === stepIndex;
              const isCompleted = i < stepIndex;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 transition-all duration-300",
                    isActive ? "bg-foreground text-background shadow-lg" : isCompleted ? "text-foreground" : "text-muted-foreground/40"
                  )}>
                    <s.icon weight={isActive ? "bold" : "duotone"} className="size-4" />
                    <span className="hidden font-mono text-[10px] font-bold uppercase tracking-widest md:block">{s.label}</span>
                  </div>
                </div>
              );
            })}
          </nav>
        </header>

        {/* Error State */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="flex items-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-destructive">
                <WarningCircle weight="duotone" className="size-6" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <MedicalLoadingScreen isVisible={step === "loading"} />

        {/* ========== 2. DYNAMIC WORKSPACE (Progressive Reveal) ========== */}
        <main className="relative">
          <AnimatePresence mode="wait">
            
            {/* STEP: INPUT */}
            {step === "input" && (
              <motion.div 
                key="input"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 gap-6 lg:grid-cols-12"
              >
                <Card className="rounded-[2.5rem] border-border/40 bg-muted/5 shadow-none transition-all hover:bg-background hover:shadow-2xl lg:col-span-7">
                  <CardHeader className="p-10 pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-foreground text-background shadow-lg">
                        <Microscope weight="duotone" className="size-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl tracking-tight">Image Acquisition</CardTitle>
                        <CardDescription>Upload dermoscopic source imagery.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <ImageUpload image={image} preview={preview} onImageSelect={(file, prev) => { setImage(file); setPreview(prev); }} onImageClear={() => { setImage(null); setPreview(null); }} />
                  </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border-border/40 bg-muted/5 shadow-none transition-all hover:bg-background hover:shadow-2xl lg:col-span-5">
                  <CardHeader className="p-10 pb-0">
                    <div className="flex items-center gap-4">
                      <div className="flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-background text-foreground shadow-sm">
                        <ClipboardText weight="duotone" className="size-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl tracking-tight">Metadata</CardTitle>
                        <CardDescription>Enter patient clinical variables.</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-10">
                    <ClinicalForm metadata={metadata} onChange={setMetadata} />
                  </CardContent>
                </Card>

                <div className="lg:col-span-12">
                  <Button size="lg" disabled={!isFormValid} onClick={() => setStep("confirm")} className="h-20 w-full rounded-full text-xl font-bold shadow-2xl transition-all hover:scale-[1.01] active:scale-95">
                    Proceed to Verification
                    <ArrowRight weight="bold" className="ml-3 size-6" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP: CONFIRM (Cinematic HUD) */}
            {step === "confirm" && (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="mx-auto max-w-5xl"
              >
                <div className="relative overflow-hidden rounded-[3rem] border border-border/50 bg-background p-1 shadow-2xl ring-1 ring-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-5">
                    <div className="bg-muted/20 p-12 md:col-span-2">
                      <p className="mb-6 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Subject Profile</p>
                      <div className="aspect-square overflow-hidden rounded-[2rem] border-4 border-background shadow-2xl">
                        <img src={preview!} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <div className="mt-8 flex items-center gap-3">
                        <div className="size-2 animate-pulse rounded-full bg-foreground" />
                        <span className="font-mono text-xs font-bold uppercase text-foreground">Ready for Inference</span>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between p-12 md:col-span-3">
                      <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Demographics</p>
                          <DataPoint label="Age" value={`${metadata.age}y`} />
                          <DataPoint label="Sex" value={metadata.sex} />
                        </div>
                        <div className="space-y-6">
                          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Metrics</p>
                          <DataPoint label="Diameter" value={`${metadata.diameter}mm`} />
                          <DataPoint label="Location" value={metadata.location} />
                        </div>
                      </div>

                      <div className="mt-12 flex flex-col gap-4">
                        <Button onClick={handleSubmit} className="h-16 rounded-2xl text-lg font-bold">
                          Run Multimodal Fusion
                        </Button>
                        <Button variant="ghost" onClick={() => setStep("input")} className="h-12 text-muted-foreground hover:text-foreground">
                          <PencilLine className="mr-2" /> Modify Input
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
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <ResultsDashboard result={result} imagePreview={preview} metadata={metadata} />
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* Footer Disclaimer */}
        <footer className="mt-20 flex items-center justify-center gap-3 border-t border-border/40 pt-10 text-muted-foreground">
          <Info weight="duotone" className="size-4" />
          <p className="font-mono text-[10px] uppercase tracking-widest">Decision Support Only // Not for Primary Diagnosis</p>
        </footer>
      </div>
    </div>
  );
}

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[10px] uppercase tracking-tighter text-muted-foreground">{label}</span>
      <span className="text-xl font-bold capitalize text-foreground">{value}</span>
    </div>
  );
}