"use client";

import { useEffect, useRef, useState } from "react";
import { useThreeScene } from "@/lib/use-three-scene";

// ── Constants ──────────────────────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  "Vision Encoding",
  "Text Encoding",
  "ABCD Extraction",
  "Fusion & Classification",
] as const;

export const STAGE_INTERVAL_MS = 2000;

// ── Props ──────────────────────────────────────────────────────────────────────

interface MedicalLoadingScreenProps {
  isVisible: boolean;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MedicalLoadingScreen({ isVisible }: MedicalLoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Detect prefers-reduced-motion once on mount
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
  }, []);

  // Stage progression: advances every STAGE_INTERVAL_MS, clamped at last index
  const [currentStage, setCurrentStage] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    setCurrentStage(0);
    const id = setInterval(() => {
      setCurrentStage((prev) => Math.min(prev + 1, PIPELINE_STAGES.length - 1));
    }, STAGE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isVisible]);

  // Elapsed time in seconds, incremented every 1000ms
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    setElapsed(0);
    const id = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [isVisible]);

  // Three.js scene (task 4.2)
  useThreeScene(canvasRef, reducedMotion);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ background: "rgba(5, 10, 20, 0.92)" }}
      aria-label="AI analysis in progress"
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      {/* Three.js canvas — task 4.2 */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      />

      {/* HUD overlay — task 4.3 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        {/* Scan-line sweep */}
        {!reducedMotion && (
          <div
            className="scan-line absolute inset-x-0 h-px pointer-events-none"
            style={{ background: "rgba(0, 212, 255, 0.4)", top: 0 }}
            aria-hidden="true"
          />
        )}

        {/* Central HUD panel */}
        <div className="flex flex-col items-center gap-6">
          {/* Headline */}
          <h1
            className="text-4xl font-bold tracking-widest uppercase"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#00d4ff" }}
          >
            Analyzing Lesion
          </h1>

          {/* Stage list */}
          <ol className="flex flex-col gap-2 w-72" aria-label="Pipeline stages">
            {PIPELINE_STAGES.map((stage, i) => {
              const isActive = i === currentStage;
              return (
                <li
                  key={stage}
                  className="text-sm tracking-wide"
                  style={{
                    fontFamily: "JetBrains Mono, monospace",
                    color: isActive ? "#00d4ff" : "#4a6080",
                    opacity: isActive ? 1 : 0.45,
                    transition: "color 0.3s, opacity 0.3s",
                  }}
                >
                  {isActive ? "▶ " : "  "}{stage}
                </li>
              );
            })}
          </ol>

          {/* Elapsed counter */}
          <p
            className="text-sm tracking-widest"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#4a6080" }}
            aria-live="off"
          >
            Elapsed: {elapsed}s
          </p>

          {/* AI inference label with blinking cursor */}
          <p
            className="text-xs tracking-[0.3em] uppercase"
            style={{ fontFamily: "JetBrains Mono, monospace", color: "#00d4ff", opacity: 0.8 }}
          >
            AI INFERENCE IN PROGRESS
            <span className="blink-cursor ml-1" aria-hidden="true">█</span>
          </p>
        </div>
      </div>

      {/* Corner brackets — task 4.4 */}
      <div className="corner-bracket corner-bracket--tl" aria-hidden="true" />
      <div className="corner-bracket corner-bracket--tr" aria-hidden="true" />
      <div className="corner-bracket corner-bracket--bl" aria-hidden="true" />
      <div className="corner-bracket corner-bracket--br" aria-hidden="true" />

      {/* aria-live region — task 4.5 */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {PIPELINE_STAGES[currentStage]}
      </div>
    </div>
  );
}
