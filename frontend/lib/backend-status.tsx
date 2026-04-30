"use client";

import { createContext, useContext } from "react";

export type BackendStatus = "checking" | "online" | "offline";

export const BackendStatusContext = createContext<BackendStatus>("checking");

export function useBackendStatus() {
  return useContext(BackendStatusContext);
}