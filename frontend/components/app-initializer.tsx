"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkHealth } from "@/lib/api";
import { GlobeIcon, CpuIcon, FireIcon, CheckCircleIcon, WarningCircleIcon, WifiSlashIcon } from "@phosphor-icons/react";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

const MAX_WAIT_MS = 8_000;
const POLL_INTERVAL_MS = 1_500;
const MIN_DISPLAY_MS = 3_000;

const ONLINE_STAGES = [
  {
    text: "Connecting to Gateway",
    detail: "Establishing Secure API Tunnel",
    icon: GlobeIcon,
  },
  {
    text: "Loading Inference Engine",
    detail: "Allocating GPU Resources",
    icon: CpuIcon,
  },
  {
    text: "Warming Model Weights",
    detail: "Optimizing SigLIP & ClinicalBERT",
    icon: FireIcon,
  },
  {
    text: "System Ready",
    detail: "All Nodes Operational",
    icon: CheckCircleIcon,
  },
] as const;

const OFFLINE_STAGES = [
  {
    text: "Connecting to Gateway",
    detail: "Establishing Secure API Tunnel",
    icon: GlobeIcon,
  },
  {
    text: "Gateway Unreachable",
    detail: "Backend Offline — Switching to Demo Mode",
    icon: WifiSlashIcon,
  },
  {
    text: "Loading Cached Predictions",
    detail: "Real PAD-UFES-20 Validation Samples",
    icon: WarningCircleIcon,
  },
  {
    text: "Demo Mode Active",
    detail: "Backend Offline — Live Inference Unavailable",
    icon: WarningCircleIcon,
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
  const [isOffline, setIsOffline] = useState(false);

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
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);
          const health = await checkHealth();
          clearTimeout(timeout);
          if (health.status === "healthy") {
            if (!cancelled) {
              setIsOffline(false);
              setBackendReady(true);
            }
            return;
          }
        } catch {
          // Network error — backend offline
          if (!cancelled) {
            setIsOffline(true);
            setBackendReady(true);
          }
          return;
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      // Timeout — treat as offline
      if (!cancelled) {
        setIsOffline(true);
        setBackendReady(true);
      }
    };

    poll();
    return () => {
      cancelled = true;
    };
  }, [mounted]);

  const ready = mounted && backendReady && minTimePassed;

  const stages = isOffline ? OFFLINE_STAGES : ONLINE_STAGES;
  const title = isOffline
    ? "DEMO MODE INITIALIZING"
    : "INITIALIZING MULTIMODAL STACK";

  return (
    <>
      <MedicalLoadingScreen
        isVisible={!ready}
        title={title}
        stages={stages}
      />
      {ready && (
        <div className="font-sans antialiased animate-in fade-in duration-700">
          {children}
        </div>
      )}
    </>
  );
}
