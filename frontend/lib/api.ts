import { PredictionResponse, HealthResponse, ClinicalMetadata } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new ApiError(res.status, "Health check failed");
  return res.json();
}

export async function predict(
  image: File,
  metadata: ClinicalMetadata,
): Promise<PredictionResponse> {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("age", String(metadata.age));
  formData.append("sex", metadata.sex);
  formData.append("fitzpatrick", metadata.fitzpatrick);
  formData.append("location", metadata.location);
  formData.append("diameter", String(metadata.diameter));
  formData.append("itch", String(metadata.itch));
  formData.append("grew", String(metadata.grew));
  formData.append("hurt", String(metadata.hurt));
  formData.append("changed", String(metadata.changed));
  formData.append("bleed", String(metadata.bleed));
  formData.append("elevation", String(metadata.elevation));

  const res = await fetch(`${API_BASE}/api/v1/predict`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new ApiError(res.status, err.error, err.details);
  }

  return res.json();
}

export async function getModelInfo(): Promise<Record<string, unknown>> {
  const res = await fetch(`${API_BASE}/api/v1/model/info`);
  if (!res.ok) throw new ApiError(res.status, "Failed to get model info");
  return res.json();
}
