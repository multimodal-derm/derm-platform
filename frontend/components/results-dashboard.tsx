"use client";

import { useEffect, useState } from "react";
import {
  PredictionResponse,
  ClinicalMetadata,
  CLASS_LABELS,
  RISK_CONFIG,
} from "@/lib/types";
import { generateSummary } from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ProbabilityChart } from "@/components/probability-chart";
import { ABCDFeaturesDisplay } from "@/components/abcd-features";
import {
  Activity,
  Brain,
  Layers,
  Clock,
  Info,
  Sparkles,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Typewriter hook ─────────────────────────────────────────────────────────

function useTypewriter(text: string | null, speed: number = 12) {
  const [displayed, setDisplayed] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed("");
      return;
    }

    setIsTyping(true);
    setDisplayed("");
    let i = 0;

    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, isTyping };
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ResultsDashboardProps {
  result: PredictionResponse;
  imagePreview: string | null;
  metadata: ClinicalMetadata;
}

// ── Component ───────────────────────────────────────────────────────────────

export function ResultsDashboard({
  result,
  imagePreview,
  metadata,
}: ResultsDashboardProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [summaryTimeMs, setSummaryTimeMs] = useState<number | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showNarrative, setShowNarrative] = useState(false);

  const riskCfg = RISK_CONFIG[result.risk_level];

  const fetchSummary = async () => {
    setSummaryLoading(true);
    setSummaryError(null);
    try {
      const res = await generateSummary(result);
      setSummary(res.summary);
      setSummaryTimeMs(res.generation_time_ms);
    } catch (err) {
      setSummaryError(
        err instanceof Error ? err.message : "Failed to generate summary",
      );
    } finally {
      setSummaryLoading(false);
    }
  };

  const { displayed: typedSummary, isTyping } = useTypewriter(summary, 12);

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Patient info pills
  const patientPills = [
    { label: "Age", value: `${metadata.age}` },
    { label: "Sex", value: metadata.sex },
    { label: "Fitzpatrick", value: metadata.fitzpatrick },
    { label: "Location", value: metadata.location },
    { label: "Diameter", value: `${metadata.diameter}mm` },
  ];

  const activeSymptoms = [
    metadata.itch && "Itching",
    metadata.grew && "Growth",
    metadata.hurt && "Pain",
    metadata.changed && "Changes",
    metadata.bleed && "Bleeding",
    metadata.elevation && "Elevated",
  ].filter(Boolean);

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      {/* ── Collapsible Disclaimer ── */}
      <button
        onClick={() => setShowDisclaimer(!showDisclaimer)}
        className="w-full flex items-center gap-2 rounded-lg bg-amber-50/80 border border-amber-200/60 px-4 py-2.5 text-left transition-colors hover:bg-amber-50"
      >
        <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-xs font-medium text-amber-700 flex-1">
          Clinical Decision Support — Not a Diagnosis
        </span>
        {showDisclaimer ? (
          <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
        )}
      </button>
      {showDisclaimer && (
        <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3 -mt-3">
          <p className="text-xs text-amber-800 leading-relaxed">
            This tool provides AI-assisted analysis to support clinical
            decision-making. Results should be independently reviewed by a
            qualified healthcare professional. Do not rely solely on this output
            for diagnosis or treatment decisions. The model was trained on the
            PAD-UFES-20 dataset (2,298 images) and has not been clinically
            validated or FDA-cleared.
          </p>
        </div>
      )}

      {/* ── Hero: Classification + Patient Context ── */}
      <div className="rounded-2xl border border-clinical-border bg-white overflow-hidden shadow-sm">
        {/* Top: Risk color accent bar */}
        <div
          className={`h-1 ${
            result.risk_level === "HIGH"
              ? "bg-risk-high"
              : result.risk_level === "MODERATE"
                ? "bg-risk-moderate"
                : "bg-risk-low"
          }`}
        />

        <div className="p-6 pb-5">
          {/* Classification row */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-semibold text-clinical-muted uppercase tracking-[0.15em] mb-2">
                Primary Classification
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-4xl font-extrabold text-clinical-text tracking-tight">
                  {result.prediction}
                </h2>
                <span
                  className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${riskCfg.bg} ${riskCfg.color}`}
                >
                  {riskCfg.label}
                </span>
              </div>
              <p className="text-sm text-clinical-muted mt-1">
                {CLASS_LABELS[result.prediction]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold text-clinical-muted uppercase tracking-[0.15em] mb-1">
                Confidence
              </p>
              <p className="text-5xl font-extrabold font-mono text-clinical-text tracking-tighter">
                {(result.confidence * 100).toFixed(1)}
                <span className="text-base font-semibold text-clinical-muted ml-0.5">
                  %
                </span>
              </p>
            </div>
          </div>

          {/* Patient context pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {patientPills.map((pill) => (
              <span
                key={pill.label}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-gray-100 rounded-full px-3 py-1"
              >
                <span className="text-clinical-muted">{pill.label}</span>
                <span className="font-semibold text-clinical-text capitalize">
                  {pill.value}
                </span>
              </span>
            ))}
            {activeSymptoms.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs bg-red-50 border border-red-100 rounded-full px-3 py-1">
                <span className="text-red-400">Symptoms</span>
                <span className="font-semibold text-red-700">
                  {activeSymptoms.join(", ")}
                </span>
              </span>
            )}
          </div>

          {/* Metadata footer */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-[11px] text-clinical-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {result.inference_time_ms}ms
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3" aria-hidden="true" />
              {result.model_version}
            </span>
          </div>
        </div>
      </div>

      {/* ── AI Clinical Summary ── */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-b from-violet-50/40 to-white overflow-hidden shadow-sm">
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-500" aria-hidden="true" />
            <h3 className="text-sm font-bold text-clinical-text">
              AI Clinical Summary
            </h3>
            <span className="text-[10px] text-clinical-muted bg-violet-100/60 rounded-full px-2 py-0.5">
              MedGemma 4B
            </span>
          </div>
          {summary && !summaryLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSummary}
              className="text-[11px] text-clinical-muted h-7 px-2"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Regenerate
            </Button>
          )}
        </div>

        <div className="px-6 pb-5">
          {summaryLoading && (
            <div className="flex items-center gap-3 py-10 justify-center">
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
              <p className="text-sm text-clinical-muted">
                Generating clinical summary...
              </p>
            </div>
          )}

          {summaryError && !summaryLoading && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 mt-1">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-700">{summaryError}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchSummary}
                    className="mt-1.5 text-[11px] text-red-600 h-6 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </div>
            </div>
          )}

          {summary && !summaryLoading && (
            <>
              <div className="text-sm text-clinical-text leading-relaxed mt-1">
                {typedSummary.split("\n").map((paragraph, i) =>
                  paragraph.trim() ? (
                    <p key={i} className="mb-3 last:mb-0">
                      {paragraph}
                    </p>
                  ) : null,
                )}
                {isTyping && (
                  <span className="inline-block w-1 h-3.5 bg-violet-400 animate-pulse ml-0.5 align-text-bottom rounded-full" />
                )}
              </div>

              {/* Metadata + narrative toggle */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-violet-100/60">
                <div className="flex items-center gap-3 text-[11px] text-clinical-muted">
                  {summaryTimeMs && !isTyping && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(summaryTimeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3" />
                    ClinicalBERT RAG
                  </span>
                </div>
                <button
                  onClick={() => setShowNarrative(!showNarrative)}
                  className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-700 transition-colors"
                >
                  <FileText className="w-3 h-3" />
                  {showNarrative ? "Hide" : "View"} model input
                  {showNarrative ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              {/* Collapsible narrative */}
              {showNarrative && (
                <div className="mt-3 rounded-lg bg-gray-50/80 border border-gray-100 p-3">
                  <p className="text-[11px] font-semibold text-clinical-muted uppercase tracking-wider mb-1.5">
                    Clinical narrative sent to ClinicalBERT
                  </p>
                  <p className="text-xs text-clinical-text leading-relaxed font-mono">
                    {result.clinical_text}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-clinical-muted mt-3 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0" />
                AI-generated from retrieved clinical knowledge. Not medical
                advice.
              </p>
            </>
          )}
        </div>
      </div>

      {/* ── Probabilities + ABCD side by side ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-2xl border border-clinical-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-brand-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-clinical-text">
              Class Probabilities
            </h3>
          </div>
          <p className="text-[11px] text-clinical-muted mb-4">
            Softmax distribution across all 6 classes
          </p>
          <ProbabilityChart
            probabilities={result.probabilities}
            prediction={result.prediction}
          />
        </div>

        <div className="rounded-2xl border border-clinical-border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-brand-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-clinical-text">
              ABCD Feature Analysis
            </h3>
          </div>
          <p className="text-[11px] text-clinical-muted mb-4">
            14 handcrafted dermatological features
          </p>
          <ABCDFeaturesDisplay features={result.abcd_features} />
        </div>
      </div>
    </div>
  );
}