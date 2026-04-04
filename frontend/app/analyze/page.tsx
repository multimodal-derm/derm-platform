"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/image-upload";
import { ClinicalForm } from "@/components/clinical-form";
import { ResultsDashboard } from "@/components/results-dashboard";
import { predict } from "@/lib/api";
import { ClinicalMetadata, PredictionResponse } from "@/lib/types";

const MedicalLoadingScreen = dynamic(
  () => import("@/components/medical-loading-screen"),
  { ssr: false }
);

import {
  Loader2,
  ArrowLeft,
  Microscope,
  ClipboardList,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Edit3,
} from "lucide-react";

const DEFAULT_METADATA: ClinicalMetadata = {
  age: 0,
  sex: "",
  fitzpatrick: "",
  location: "",
  diameter: 0,
  itch: false,
  grew: false,
  hurt: false,
  changed: false,
  bleed: false,
  elevation: false,
};

type Step = "input" | "confirm" | "loading" | "results";

const STEPS = [
  { key: "input", icon: Microscope, label: "Upload & Input" },
  { key: "confirm", icon: CheckCircle2, label: "Review" },
  { key: "loading", icon: Loader2, label: "Analysis" },
  { key: "results", icon: BarChart3, label: "Results" },
] as const;

const FITZPATRICK_LABELS: Record<string, string> = {
  I: "Type I — Light, pale white",
  II: "Type II — White, fair",
  III: "Type III — Medium, white to olive",
  IV: "Type IV — Olive, moderate brown",
  V: "Type V — Brown, dark brown",
  VI: "Type VI — Very dark brown to black",
};

export default function AnalyzePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ClinicalMetadata>(DEFAULT_METADATA);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("input");

  const isFormValid =
    image &&
    metadata.age > 0 &&
    metadata.sex &&
    metadata.fitzpatrick &&
    metadata.location &&
    metadata.diameter > 0;

  const handleProceedToConfirm = () => {
    if (!isFormValid) return;
    setStep("confirm");
  };

  const handleSubmit = async () => {
    if (!image || !isFormValid) return;
    setStep("loading");
    setError(null);

    try {
      const res = await predict(image, metadata);
      setResult(res);
      setStep("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Prediction failed");
      setStep("input");
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setMetadata(DEFAULT_METADATA);
    setResult(null);
    setError(null);
    setStep("input");
  };

  const activeSymptoms = [
    metadata.itch && "Itching",
    metadata.grew && "Recent growth",
    metadata.hurt && "Pain",
    metadata.changed && "Color/shape change",
    metadata.bleed && "Bleeding",
    metadata.elevation && "Elevated",
  ].filter(Boolean);

  // Step index for progress indicator
  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-clinical-bg">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          {step === "results" && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-clinical-muted hover:text-clinical-text transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              New Analysis
            </button>
          )}
          {step === "confirm" && (
            <button
              onClick={() => setStep("input")}
              className="flex items-center gap-1.5 text-sm text-clinical-muted hover:text-clinical-text transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              Edit Input
            </button>
          )}
          <h1 className="text-2xl font-bold text-clinical-text">
            {step === "results"
              ? "Analysis Results"
              : step === "confirm"
                ? "Review Before Analysis"
                : "Lesion Analysis"}
          </h1>
          <p className="text-sm text-clinical-muted mt-1">
            {step === "results"
              ? "Multimodal prediction with ABCD feature analysis and explainability"
              : step === "confirm"
                ? "Verify the information below is correct before running analysis"
                : "Upload a dermoscopic image and enter clinical metadata for multimodal classification"}
          </p>
        </div>

        {/* Steps indicator */}
        <nav
          className="flex items-center gap-2 mb-8"
          aria-label="Analysis progress"
        >
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`w-8 h-px ${i <= stepIndex ? "bg-brand-300" : "bg-clinical-border"}`}
                  aria-hidden="true"
                />
              )}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  i <= stepIndex
                    ? "bg-brand-50 text-brand-700"
                    : "bg-gray-100 text-clinical-muted"
                }`}
                aria-current={s.key === step ? "step" : undefined}
              >
                <s.icon
                  className={`w-3.5 h-3.5 ${s.key === "loading" && step === "loading" ? "animate-spin" : ""}`}
                  aria-hidden="true"
                />
                {s.label}
              </div>
            </div>
          ))}
        </nav>

        {/* Error */}
        {error && (
          <div
            className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-sm text-red-700 font-medium">{error}</p>
            <p className="text-xs text-red-500 mt-1">
              Make sure the gateway and inference services are running.
            </p>
          </div>
        )}

        {/* ── Loading state ── */}
        <MedicalLoadingScreen isVisible={step === "loading"} />

        {/* ── Input step ── */}
        {step === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Image upload */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Microscope
                    className="w-5 h-5 text-brand-600"
                    aria-hidden="true"
                  />
                  <CardTitle>Dermoscopic Image</CardTitle>
                </div>
                <CardDescription>
                  Upload a high-resolution dermoscopic or clinical photograph
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUpload
                  image={image}
                  preview={preview}
                  onImageSelect={(file, prev) => {
                    setImage(file);
                    setPreview(prev);
                  }}
                  onImageClear={() => {
                    setImage(null);
                    setPreview(null);
                  }}
                />
              </CardContent>
            </Card>

            {/* Right: Clinical form */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ClipboardList
                    className="w-5 h-5 text-brand-600"
                    aria-hidden="true"
                  />
                  <CardTitle>Clinical Metadata</CardTitle>
                </div>
                <CardDescription>
                  Patient demographics and lesion characteristics for text
                  encoding
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ClinicalForm metadata={metadata} onChange={setMetadata} />
              </CardContent>
            </Card>

            {/* Proceed to review */}
            <div className="lg:col-span-2">
              <Button
                size="lg"
                disabled={!isFormValid}
                onClick={handleProceedToConfirm}
                className="w-full text-base h-14"
              >
                Review Before Analysis
                <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
              </Button>
              {!isFormValid && (
                <p
                  className="text-xs text-clinical-muted text-center mt-2"
                  role="status"
                >
                  Please upload an image and fill in all required fields (age,
                  sex, Fitzpatrick type, location, diameter)
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Confirmation step ── */}
        {step === "confirm" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    className="w-5 h-5 text-brand-600"
                    aria-hidden="true"
                  />
                  <CardTitle>Confirm Analysis Input</CardTitle>
                </div>
                <CardDescription>
                  Review the image and clinical data before running multimodal
                  analysis. Once submitted, the system will process the image
                  through MedSigLIP, encode the clinical text via ClinicalBERT,
                  and extract ABCD features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Image preview */}
                {preview && (
                  <div>
                    <p className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                      Image
                    </p>
                    <div className="rounded-lg overflow-hidden border border-clinical-border bg-black/5 max-h-48">
                      <img
                        src={preview}
                        alt="Uploaded dermoscopic image for analysis"
                        className="w-full h-48 object-contain"
                      />
                    </div>
                    <p className="text-xs text-clinical-muted mt-1">
                      {image?.name} (
                      {((image?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}

                {/* Patient demographics */}
                <div>
                  <p className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                    Patient Demographics
                  </p>
                  <div className="rounded-lg border border-clinical-border divide-y divide-clinical-border">
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">Age</span>
                      <span className="text-sm font-semibold">
                        {metadata.age} years
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">Sex</span>
                      <span className="text-sm font-semibold capitalize">
                        {metadata.sex}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">
                        Fitzpatrick
                      </span>
                      <span className="text-sm font-semibold">
                        {FITZPATRICK_LABELS[metadata.fitzpatrick] ||
                          metadata.fitzpatrick}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Lesion characteristics */}
                <div>
                  <p className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-2">
                    Lesion Characteristics
                  </p>
                  <div className="rounded-lg border border-clinical-border divide-y divide-clinical-border">
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">
                        Location
                      </span>
                      <span className="text-sm font-semibold capitalize">
                        {metadata.location}
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">
                        Diameter
                      </span>
                      <span className="text-sm font-semibold">
                        {metadata.diameter} mm
                      </span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-sm text-clinical-muted">
                        Symptoms
                      </span>
                      <span className="text-sm font-semibold">
                        {activeSymptoms.length > 0
                          ? activeSymptoms.join(", ")
                          : "None reported"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setStep("input")}
                    className="flex-1"
                  >
                    <Edit3 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSubmit}
                    className="flex-1"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" aria-hidden="true" />
                    Confirm & Run Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Results step ── */}
        {step === "results" && result && (
          <ResultsDashboard
            result={result}
            imagePreview={preview}
            metadata={metadata}
          />
        )}
      </div>
    </div>
  );
}
