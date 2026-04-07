"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkHealth } from "@/lib/api";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false },
);

const MAX_WAIT_MS = 30_000;
const POLL_INTERVAL_MS = 1_500;
const MIN_DISPLAY_MS = 4_000;

const INIT_STAGES = [
  "Connecting to Gateway",
  "Loading Inference Engine",
  "Warming Model Weights",
  "Ready",
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
        isVisible={mounted && !ready}
        title="Initializing"
        stages={INIT_STAGES}
        subtitle="STARTING SERVICES"
      />
      {ready && children}
    </>
  );
}