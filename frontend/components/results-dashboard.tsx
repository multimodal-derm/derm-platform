"use client";

import { PredictionResponse, ClinicalMetadata, CLASS_LABELS } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { RiskBadge } from "@/components/risk-badge";
import { ProbabilityChart } from "@/components/probability-chart";
import { ABCDFeaturesDisplay } from "@/components/abcd-features";
import {
  Activity,
  Brain,
  Layers,
  FileText,
  Clock,
  Info,
  User,
} from "lucide-react";

interface ResultsDashboardProps {
  result: PredictionResponse;
  imagePreview: string | null;
  metadata: ClinicalMetadata;
}

export function ResultsDashboard({
  result,
  imagePreview,
  metadata,
}: ResultsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* ── FDA CDS Disclaimer ── */}
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex gap-3"
        role="alert"
        aria-label="Clinical decision support disclaimer"
      >
        <Info
          className="w-5 h-5 text-risk-moderate flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-semibold text-risk-moderate">
            Clinical Decision Support — Not a Diagnosis
          </p>
          <p className="text-xs text-gray-700 mt-1 leading-relaxed">
            This tool provides AI-assisted analysis to support clinical
            decision-making. Results should be independently reviewed by a
            qualified healthcare professional. Do not rely solely on this output
            for diagnosis or treatment decisions. The model was trained on the
            PAD-UFES-20 dataset (2,298 images) and has not been clinically
            validated or FDA-cleared.
          </p>
        </div>
      </div>

      {/* ── Patient Context Banner (persistent) ── */}
      <div
        className="rounded-lg border border-clinical-border bg-white p-4 flex items-center justify-between"
        role="banner"
        aria-label="Patient context"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="w-4 h-4 text-clinical-muted" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="text-clinical-muted">Age: </span>
              <span className="font-semibold">{metadata.age}</span>
            </span>
            <span className="text-clinical-border">|</span>
            <span>
              <span className="text-clinical-muted">Sex: </span>
              <span className="font-semibold capitalize">{metadata.sex}</span>
            </span>
            <span className="text-clinical-border">|</span>
            <span>
              <span className="text-clinical-muted">Fitzpatrick: </span>
              <span className="font-semibold">{metadata.fitzpatrick}</span>
            </span>
            <span className="text-clinical-border">|</span>
            <span>
              <span className="text-clinical-muted">Location: </span>
              <span className="font-semibold capitalize">
                {metadata.location}
              </span>
            </span>
            <span className="text-clinical-border">|</span>
            <span>
              <span className="text-clinical-muted">Diameter: </span>
              <span className="font-semibold">{metadata.diameter}mm</span>
            </span>
          </div>
        </div>
        <RiskBadge level={result.risk_level} />
      </div>

      {/* ── Primary Diagnosis ── */}
      <Card className="border-2 border-brand-200 bg-gradient-to-br from-brand-50/50 to-white">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-clinical-muted uppercase tracking-wider mb-1">
                Primary Classification
              </p>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-clinical-text">
                  {result.prediction}
                </h2>
                <RiskBadge level={result.risk_level} size="lg" />
              </div>
              <p className="text-base text-clinical-muted">
                {CLASS_LABELS[result.prediction]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-clinical-muted mb-1">Confidence</p>
              <p className="text-4xl font-bold font-mono text-brand-700">
                {(result.confidence * 100).toFixed(1)}
                <span className="text-lg text-clinical-muted">%</span>
              </p>
            </div>
          </div>
          <div
            className="flex items-center gap-4 mt-4 pt-4 border-t border-clinical-border text-xs text-clinical-muted"
            aria-label="Inference metadata"
          >
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              {result.inference_time_ms}ms inference
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              Model {result.model_version}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Probability Distribution ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity
                className="w-5 h-5 text-brand-600"
                aria-hidden="true"
              />
              <CardTitle>Class Probabilities</CardTitle>
            </div>
            <CardDescription>
              Softmax distribution across all 6 classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProbabilityChart
              probabilities={result.probabilities}
              prediction={result.prediction}
            />
          </CardContent>
        </Card>

        {/* ── ABCD Features ── */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-600" aria-hidden="true" />
              <CardTitle>ABCD Feature Analysis</CardTitle>
            </div>
            <CardDescription>
              14 handcrafted dermatological features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ABCDFeaturesDisplay features={result.abcd_features} />
          </CardContent>
        </Card>
      </div>

      {/* ── Clinical Text (CDS explainability: show inputs used) ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" aria-hidden="true" />
            <CardTitle>Clinical Narrative</CardTitle>
          </div>
          <CardDescription>
            Auto-generated text sent to ClinicalBERT encoder — review this input
            to verify the basis for classification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-gray-50 border border-clinical-border p-4">
            <p className="text-sm text-clinical-text leading-relaxed font-mono">
              {result.clinical_text}
            </p>
          </div>
          <p className="text-xs text-clinical-muted mt-3 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" aria-hidden="true" />
            This narrative was generated from the clinical metadata you
            provided. Verify accuracy before interpreting results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
