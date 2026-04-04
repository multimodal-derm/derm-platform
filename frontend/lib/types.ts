export interface ABCDFeatures {
  asymmetry: number[];
  border: number[];
  color: number[];
  diameter: number[];
  texture: number[];
}

export interface XAIOutput {
  attention_weights: number[][];
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  risk_level: "HIGH" | "MODERATE" | "LOW";
  probabilities: Record<string, number>;
  abcd_features: ABCDFeatures;
  xai: XAIOutput;
  clinical_text: string;
  model_version: string;
  inference_time_ms: number;
}

export interface HealthResponse {
  status: string;
  gateway: string;
  inference: {
    status: string;
    latency_ms?: string;
    error?: string;
  };
  timestamp: string;
}

export interface ClinicalMetadata {
  age: number;
  sex: string;
  fitzpatrick: string;
  location: string;
  diameter: number;
  itch: boolean;
  grew: boolean;
  hurt: boolean;
  changed: boolean;
  bleed: boolean;
  elevation: boolean;
}

export const CLASS_LABELS: Record<string, string> = {
  ACK: "Actinic Keratosis",
  BCC: "Basal Cell Carcinoma",
  MEL: "Melanoma",
  NEV: "Nevus (Mole)",
  SCC: "Squamous Cell Carcinoma",
  SEK: "Seborrheic Keratosis",
};

export const RISK_CONFIG = {
  HIGH: {
    label: "High Risk",
    color: "text-risk-high",
    bg: "bg-risk-high-bg",
    border: "border-risk-high/20",
    dot: "bg-risk-high",
  },
  MODERATE: {
    label: "Moderate Risk",
    color: "text-risk-moderate",
    bg: "bg-risk-moderate-bg",
    border: "border-risk-moderate/20",
    dot: "bg-risk-moderate",
  },
  LOW: {
    label: "Low Risk",
    color: "text-risk-low",
    bg: "bg-risk-low-bg",
    border: "border-risk-low/20",
    dot: "bg-risk-low",
  },
} as const;
