"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  GlobeIcon,
  CpuIcon,
  FireIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  WifiSlashIcon,
} from "@phosphor-icons/react";
import { BackendStatusContext, type BackendStatus } from "@/lib/backend-status";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

const HEALTH_CHECK_TIMEOUT_MS = 2_500;
const MIN_DISPLAY_MS = 1_500;

const ONLINE_STAGES = [
  { text: "Connecting to Gateway", detail: "Establishing Secure API Tunnel", icon: GlobeIcon },
  { text: "Loading Inference Engine", detail: "Allocating GPU Resources", icon: CpuIcon },
  { text: "Warming Model Weights", detail: "Optimizing SigLIP & ClinicalBERT", icon: FireIcon },
  { text: "System Ready", detail: "All Nodes Operational", icon: CheckCircleIcon },
] as const;

const OFFLINE_STAGES = [
  { text: "Connecting to Gateway", detail: "Establishing Secure API Tunnel", icon: GlobeIcon },
  { text: "Gateway Unreachable", detail: "Backend Offline — Switching to Demo Mode", icon: WifiSlashIcon },
  { text: "Loading Cached Predictions", detail: "Real PAD-UFES-20 Validation Samples", icon: WarningCircleIcon },
  { text: "Demo Mode Active", detail: "Backend Offline — Live Inference Unavailable", icon: WarningCircleIcon },
] as const;

export default function AppInitializer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [backendReady, setBackendReady] = useState(false);
  const [minTimePassed, setMinTimePassed] = useState(false);
  const [status, setStatus] = useState<BackendStatus>("checking");

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
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      HEALTH_CHECK_TIMEOUT_MS,
    );

    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/health`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);
        if (cancelled) return;
        setStatus(res.ok ? "online" : "offline");
        setBackendReady(true);
      } catch {
        clearTimeout(timeoutId);
        if (!cancelled) {
          setStatus("offline");
          setBackendReady(true);
        }
      }
    };

    check();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [mounted]);

  const ready = mounted && backendReady && minTimePassed;
  const isOffline = status === "offline";

  const stages = isOffline ? OFFLINE_STAGES : ONLINE_STAGES;
  const title = isOffline
    ? "DEMO MODE INITIALIZING"
    : "INITIALIZING MULTIMODAL STACK";

  return (
    <BackendStatusContext.Provider value={status}>
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
    </BackendStatusContext.Provider>
  );
}