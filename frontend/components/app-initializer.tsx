"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkHealth } from "@/lib/api";
// Modern Phosphor imports
import { GlobeIcon, CpuIcon, FireIcon, CheckCircleIcon } from "@phosphor-icons/react";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

const MAX_WAIT_MS = 30_000;
const POLL_INTERVAL_MS = 1_500;
const MIN_DISPLAY_MS = 4_000;

// Updated to the new rich stage structure
const INIT_STAGES = [
  { 
    text: "Connecting to Gateway", 
    detail: "Establishing Secure API Tunnel", 
    icon: GlobeIcon 
  },
  { 
    text: "Loading Inference Engine", 
    detail: "Allocating GPU Resources", 
    icon: CpuIcon 
  },
  { 
    text: "Warming Model Weights", 
    detail: "Optimizing SigLIP & ClinicalBERT", 
    icon: FireIcon 
  },
  { 
    text: "System Ready", 
    detail: "All Nodes Operational", 
    icon: CheckCircleIcon 
  },
] as const;

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const id = setTimeout(() => setMinTimePassed(true), MIN_DISPLAY_MS);
    return () => clearTimeout(id);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    let cancelled = false;
    const deadline = Date.now() + MAX_WAIT_MS;

    const poll = async () => {
      while (!cancelled && Date.now() < deadline) {
        try {
          const health = await checkHealth();
          if (health.status === "healthy") {
            if (!cancelled) setBackendReady(true);
            return;
          }
        } catch {
          // backend not up yet
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      if (!cancelled) setBackendReady(true);
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const ready = mounted && backendReady && minTimePassed;

  return (
    <>
      <MedicalLoadingScreen
        isVisible={!ready}
        title="INITIALIZING MULTIMODAL STACK"
        stages={INIT_STAGES}
      />
      {ready && (
        <div className="font-sans antialiased animate-in fade-in duration-700">
          {children}
        </div>
      )}
    </>
  );
}