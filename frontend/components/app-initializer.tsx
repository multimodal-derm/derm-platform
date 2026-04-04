"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { checkHealth } from "@/lib/api";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false }
);

const MAX_WAIT_MS = 30_000;
const POLL_INTERVAL_MS = 1_500;

export default function AppInitializer() {
  // Start as "ready" to avoid SSR mismatch — flip to false on mount, then
  // back to true once the health check passes.
  const [ready, setReady] = useState(true);

  useEffect(() => {
    setReady(false); // show loading screen immediately on client

    let cancelled = false;
    const deadline = Date.now() + MAX_WAIT_MS;

    const poll = async () => {
      while (!cancelled && Date.now() < deadline) {
        try {
          const health = await checkHealth();
          if (health.status === "healthy") {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // backend not up yet — keep polling
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      }
      // Timed out — show the app anyway
      if (!cancelled) setReady(true);
    };

    poll();
    return () => { cancelled = true; };
  }, []);

  return <MedicalLoadingScreen isVisible={!ready} />;
}
