"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProbabilityChart } from "@/components/probability-chart";
import { RiskBadge } from "@/components/risk-badge";
import { CLASS_LABELS, ClinicalMetadata, PredictionResponse } from "@/lib/types";
import { ClockIcon, SparkleIcon } from "@phosphor-icons/react";

interface ResultsDashboardProps {
  result: PredictionResponse;
  imagePreview: string | null;
  metadata: ClinicalMetadata;
}

export default function ResultsDashboard({
  result,
  imagePreview,
  metadata,
}: ResultsDashboardProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border-border/40 bg-background">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Inference Result
              </p>
              <CardTitle className="text-3xl tracking-tight">
                {CLASS_LABELS[result.prediction] ?? result.prediction}
              </CardTitle>
            </div>
            <RiskBadge level={result.risk_level} size="lg" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-4">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Submitted lesion"
                  className="aspect-square w-full rounded-2xl border border-border/40 object-cover"
                />
              ) : null}
              <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                  <ClockIcon weight="duotone" className="size-4" />
                  <span className="font-mono text-[10px] font-bold uppercase tracking-widest">
                    Runtime
                  </span>
                </div>
                <p className="text-2xl font-bold tracking-tight">
                  {result.inference_time_ms}ms
                </p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-muted/10 p-4">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Metadata Snapshot
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {metadata.age}y • {metadata.sex} • {metadata.location}
                </p>
              </div>
            </div>

            <div className="space-y-5 lg:col-span-8">
              <div className="rounded-2xl border border-border/40 bg-muted/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <SparkleIcon weight="duotone" className="size-4" />
                  <h3 className="font-semibold">Confidence</h3>
                </div>
                <p className="text-4xl font-extrabold tracking-tight">
                  {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-muted/5 p-5">
                <h3 className="mb-4 font-semibold">Class Distribution</h3>
                <ProbabilityChart
                  probabilities={result.probabilities}
                  prediction={result.prediction}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}