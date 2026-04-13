"use client";

import { useEffect, useRef, useState } from "react";
import { useThreeScene } from "@/lib/use-three-scene"; 
import { cn } from "@/lib/utils";

// 1. Import the premium Phosphor Icons
import { Brain, FileText, Stack, Microscope, Cpu, Aperture, CircleNotch } from "@phosphor-icons/react";

// 2. Map the new icons to the stages
const PIX_STAGES = [
  { text: "Acquiring Dermoscopic Image Data", icon: Microscope, detail: "Initializing MedSigLIP Encoder" },
  { text: "Analyzing Clinical Narrative", icon: FileText, detail: "ClinicalBERT NLP Processing" },
  { text: "Computing ABCD Features", icon: Stack, detail: "Extracting 14 Dermatological Metrics" },
  { text: "Calibrating Multimodal Nexus", icon: Brain, detail: "Cross-Attention Fusion Layer" },
  { text: "Performing Classification", icon: Cpu, detail: "MLP Dense Network Routing" },
] as const;

const STAGE_INTERVAL_MS = 1800;

interface MultimodalLoadingScreenProps {
  isVisible: boolean;
  title?: string;
  stages?: readonly any[]; 
}

export default function MedicalLoadingScreen({
  isVisible,
  title = "Analyzing Lesion",
  stages = PIX_STAGES,
}: MultimodalLoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const startTimeRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState("0.0");

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      const diff = (Date.now() - startTimeRef.current) / 1000;
      setElapsed(diff.toFixed(1));
    }, 80); 
    return () => clearInterval(id);
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    setCurrentStage(0);
    const id = setInterval(() => {
      setCurrentStage((prev) => Math.min(prev + 1, stages.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isVisible, stages]);

  useThreeScene(canvasRef, reducedMotion);

  if (!isVisible) return null;

  const currentStagePercentage = stages.length > 1 
    ? Math.round((currentStage / (stages.length - 1)) * 100) 
    : 0;

  const displayStages = typeof stages[0] === 'string' ? PIX_STAGES : stages;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-6 backdrop-blur-md transition-all duration-500"
      aria-label={`${title} in progress`}
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 h-full w-full opacity-10 mix-blend-luminosity"
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-border/50 bg-background/80 shadow-2xl ring-1 ring-white/5 backdrop-blur-2xl md:flex-row">
        
        {/* Left Pane */}
        <div className="flex flex-col items-start justify-between border-b border-border/50 bg-muted/10 p-10 md:w-2/5 md:border-b-0 md:border-r">
          <div>
            <div className="relative mb-6 flex size-16 items-center justify-center rounded-2xl border border-border/50 bg-background shadow-inner">
              {/* Premium Duotone Main Icon */}
              <Aperture weight="duotone" className="size-8 text-foreground" />
              <CircleNotch weight="bold" className="absolute size-[72px] animate-spin text-muted-foreground/30 opacity-70" style={{ animationDuration: '3s' }} />
            </div>
            <h2 className="mb-3 font-sans text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h2>
            <p className="font-sans text-sm leading-relaxed text-muted-foreground">
              Fusing visual, textual, and metadata streams into a unified diagnostic space.
            </p>
          </div>

          <div className="mt-12 w-full">
            <div className="mb-3 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Engine Status</span>
              <span className="flex items-center gap-1.5 text-foreground">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-60"></span>
                  <span className="relative inline-flex size-1.5 rounded-full bg-foreground"></span>
                </span>
                Active
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background p-4">
              <span className="font-mono text-xs text-muted-foreground">T-Elapsed</span>
              <span className="font-mono text-lg font-bold tracking-tighter text-foreground tabular-nums">{elapsed}s</span>
            </div>
          </div>
        </div>

        {/* Right Pane */}
        <div className="flex flex-col justify-center p-10 md:w-3/5">
          <div className="mb-6 flex items-center justify-between">
            <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              Multimodal Data Nexus
            </span>
            <span className="font-mono text-[10px] font-bold text-muted-foreground">
              {currentStagePercentage}%
            </span>
          </div>

          <div className="relative mb-8 space-y-2 px-3 before:absolute before:inset-y-3 before:left-[27px] before:w-px before:bg-border/60">
            {displayStages.map((stageItem: any, i: number) => {
              const isCompleted = i < currentStage;
              const isActive = i === currentStage;
              const isPending = i > currentStage;

              const stageText = stageItem.text;
              const stageDetail = stageItem.detail;
              const Icon = stageItem.icon;

              return (
                <div
                  key={stageText}
                  className={cn(
                    "relative z-10 flex items-center gap-5 rounded-2xl px-3 py-2.5 transition-all duration-500",
                    isPending ? "opacity-30" : "opacity-100",
                    isActive ? "translate-x-2 border border-border/50 bg-background shadow-lg" : "translate-x-0 border border-transparent bg-transparent"
                  )}
                >
                  <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/50 shadow-inner transition-colors duration-500", 
                    isActive ? "bg-foreground text-background" : isCompleted ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/50")}>
                    {isActive ? (
                      <CircleNotch weight="bold" className="size-5 animate-spin" />
                    ) : (
                      // Apply duotone weight here to all list icons
                      <Icon weight="duotone" className="size-5" /> 
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "font-sans text-sm font-bold tracking-tight transition-colors",
                        isActive ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {stageText}
                    </span>
                    <span className={cn(
                      "mt-0.5 font-mono text-[10px] tracking-tight transition-colors",
                      isActive ? "text-muted-foreground" : "text-muted-foreground/50"
                    )}>
                      {stageDetail}
                    </span>
                  </div>
                  
                  {isCompleted && <div className="ml-auto mr-2 size-1.5 rounded-full bg-foreground shadow-sm" />}
                </div>
              );
            })}
          </div>

          {/* Master Progress Bar */}
          <div className="relative h-1.5 w-full overflow-hidden rounded-full border border-border/50 bg-muted/50">
            <div
              className="absolute inset-y-0 left-0 bg-foreground transition-all duration-[1200ms] ease-in-out"
              style={{ width: `${currentStagePercentage}%` }}
            />
            <div className="absolute inset-0 w-full -translate-x-full animate-[shimmer_1.5s_infinite] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]" />
          </div>
        </div>
        
      </div>

      <div role="status" aria-live="polite" className="sr-only">
        {displayStages[currentStage].text}
      </div>
    </div>
  );
}