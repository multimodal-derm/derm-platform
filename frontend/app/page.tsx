import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Eye, FileText, Shield, Layers, Zap } from "lucide-react";
import AppInitializer from "@/components/app-initializer";

const FEATURES = [
  {
    icon: Eye,
    title: "MedSigLIP Vision",
    description: "Medical vision encoder extracts 1152-dim features from dermoscopic images",
  },
  {
    icon: FileText,
    title: "ClinicalBERT NLP",
    description: "Clinical text encoder processes auto-generated patient narratives",
  },
  {
    icon: Layers,
    title: "ABCD Features",
    description: "14 handcrafted dermatological features: asymmetry, border, color, diameter, texture",
  },
  {
    icon: Brain,
    title: "Cross-Attention Fusion",
    description: "Text queries attend to image regions via cross-attention with explainable weights",
  },
  {
    icon: Shield,
    title: "Fairness Aware",
    description: "Model performance benchmarked across Fitzpatrick skin types for equitable diagnosis",
  },
  {
    icon: Zap,
    title: "6-Class Detection",
    description: "ACK, BCC, MEL, NEV, SCC, SEK — covering the most common skin lesion types",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppInitializer />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-blue-50" />
        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Multimodal AI for Dermatology
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-clinical-text leading-tight tracking-tight mb-6">
              Skin Cancer Detection,{" "}
              <span className="text-brand-600">Reimagined</span>
            </h1>
            <p className="text-xl text-clinical-muted leading-relaxed mb-8 max-w-2xl">
              A three-stream multimodal system that fuses dermoscopic imaging,
              clinical text, and ABCD dermatological features for accurate,
              explainable skin lesion classification.
            </p>
            <div className="flex items-center gap-4">
              <a href="/analyze">
                <Button size="lg" className="text-base px-8">
                  Start Analysis
                </Button>
              </a>
              <a
                href="https://github.com/multimodal-derm/derm-platform"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="text-base px-8">
                  View Architecture
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture overview */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">
            Architecture
          </p>
          <h2 className="text-3xl font-bold text-clinical-text mb-3">
            Three Streams, One Diagnosis
          </h2>
          <p className="text-clinical-muted max-w-xl mx-auto">
            Each modality captures different clinical signals. Cross-attention
            fusion lets the model learn which image regions matter for each
            clinical description.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="group hover:border-brand-200 hover:shadow-md transition-all"
            >
              <CardContent className="pt-6">
                <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4 group-hover:bg-brand-100 transition-colors">
                  <feature.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-clinical-text mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-sm text-clinical-muted leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pipeline visual */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700 text-white overflow-hidden">
          <CardContent className="pt-8 pb-8">
            <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-4">
              Inference Pipeline
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
              {[
                "Image",
                "→ MedSigLIP [1152]",
                "→ Cross-Attention",
                "→ Late Fusion [270]",
                "→ MLP",
                "→ 6 Classes",
              ].map((step, i) => (
                <span
                  key={i}
                  className={
                    step.startsWith("→")
                      ? "text-gray-400"
                      : "bg-gray-700/60 rounded-md px-3 py-1.5 text-brand-300"
                  }
                >
                  {step}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-mono mt-3">
              {[
                "Text",
                "→ ClinicalBERT [768]",
                "→ Cross-Attention Q",
                "",
              ].map((step, i) =>
                step ? (
                  <span
                    key={i}
                    className={
                      step.startsWith("→")
                        ? "text-gray-400"
                        : "bg-gray-700/60 rounded-md px-3 py-1.5 text-violet-300"
                    }
                  >
                    {step}
                  </span>
                ) : null,
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-mono mt-3">
              {[
                "ABCD [14]",
                "→ Late Fusion concat",
              ].map((step, i) => (
                <span
                  key={i}
                  className={
                    step.startsWith("→")
                      ? "text-gray-400"
                      : "bg-gray-700/60 rounded-md px-3 py-1.5 text-emerald-300"
                  }
                >
                  {step}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-clinical-border dark:border-slate-700 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-sm text-clinical-muted dark:text-slate-400">
            Northeastern University — CS5330 / CS6120 / ML
          </p>
          <p className="text-sm text-clinical-muted dark:text-slate-400">
            PAD-UFES-20 Dataset · 2,298 images · 6 classes
          </p>
        </div>
      </footer>
    </div>
  );
}
