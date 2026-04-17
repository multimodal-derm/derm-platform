"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BrainIcon,
  ApertureIcon,
  FileTextIcon,
  ShieldCheckIcon,
  StackSimpleIcon,
  LightningIcon,
  GithubLogoIcon,
  PulseIcon,
  CaretRightIcon,
} from "@phosphor-icons/react";
import { motion, type Variants } from "framer-motion";
import AppInitializer from "@/components/app-initializer";
import Hero3DScene from "@/components/hero-3d-scene";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    id: "vision",
    icon: ApertureIcon,
    title: "MedSigLIP Vision",
    description:
      "Our core medical vision encoder extracts hyper-dense 1152-dim feature vectors from raw dermoscopic imagery, capturing microscopic lesion textures invisible to the human eye.",
    className: "md:col-span-2 md:row-span-2",
  },
  {
    id: "nlp",
    icon: FileTextIcon,
    title: "ClinicalBERT NLP",
    description: "Processes patient narratives into semantic vectors.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "abcd",
    icon: StackSimpleIcon,
    title: "ABCD Extraction",
    description: "14 hand-crafted features: asymmetry, border, color, diameter.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    id: "classes",
    icon: LightningIcon,
    title: "6-Class Detection",
    description: "Identifies ACK, BCC, MEL, NEV, SCC, SEK.",
    className: "md:col-span-1 md:row-span-1",
  },
  {
    id: "fusion",
    icon: BrainIcon,
    title: "Cross-Attention Nexus",
    description:
      "Text queries dynamically attend to specific image regions, weighting multimodal data for an explainable, unified classification.",
    className: "md:col-span-2 md:row-span-1",
  },
  {
    id: "fairness",
    icon: ShieldCheckIcon,
    title: "Fairness Aware",
    description: "Rigorously benchmarked across all Fitzpatrick skin types.",
    className: "md:col-span-2 md:row-span-1",
  },
] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  },
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const PipelineNode = ({
  text,
  type,
  isEnd = false,
  delay = 0,
}: {
  text: string;
  type?: string;
  isEnd?: boolean;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20, scale: 0.98 }}
    whileInView={{ opacity: 1, y: 0, scale: 1 }}
    viewport={{ once: true, amount: 0.35 }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -6 }}
    className={cn(
      "group relative flex min-w-[200px] flex-col items-start justify-center rounded-2xl border border-border/50 p-6 backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.05)]",
      isEnd ? "bg-foreground text-background" : "bg-background/80"
    )}
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: delay + 0.1 }}
      className={cn(
        "mb-4 flex size-8 items-center justify-center rounded-full border shadow-inner",
        isEnd
          ? "border-background/20 bg-background/10 text-background"
          : "border-border/50 bg-muted/50 text-foreground"
      )}
    >
      <BrainIcon weight="duotone" className="size-4" />
    </motion.div>

    <span
      className={cn(
        "font-sans text-base font-bold tracking-tight",
        isEnd ? "text-background" : "text-foreground"
      )}
    >
      {text}
    </span>

    {type && (
      <span
        className={cn(
          "mt-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em]",
          isEnd ? "text-background/70" : "text-muted-foreground"
        )}
      >
        {type}
      </span>
    )}
  </motion.div>
);

function BackendStatusBadge() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );

  useEffect(() => {
    const check = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/api/v1/health`,
          { signal: controller.signal },
        );
        setStatus("online");
      } catch {
        setStatus("offline");
      } finally {
        clearTimeout(timeoutId);
      }
    };

    check();
  }, []);

  const config = {
    checking: {
      dot: "bg-amber-500",
      ping: "bg-amber-500",
      label: "Checking Engine...",
    },
    online: {
      dot: "bg-emerald-500",
      ping: "bg-emerald-500",
      label: "Multimodal Engine Live",
    },
    offline: {
      dot: "bg-red-500",
      ping: "bg-red-500",
      label: "Demo Mode — Backend Offline",
    },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="inline-flex items-center gap-2.5 rounded-full border border-border/50 bg-background/80 px-5 py-2 font-mono text-xs font-bold uppercase tracking-widest text-foreground shadow-sm"
    >
      <span className="relative flex size-2">
        <span
          className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.ping} opacity-40`}
        />
        <span className={`relative inline-flex size-2 rounded-full ${config.dot}`} />
      </span>
      {config.label}
    </motion.div>
  );
}

export default function HomePage() {
  return (
    <AppInitializer>
      <div className="min-h-screen bg-background selection:bg-foreground/10 selection:text-foreground">
        <section className="relative flex min-h-[95vh] flex-col items-center justify-center overflow-hidden border-b border-border/40 text-center">
          <div className="absolute inset-0 z-0">
            <Hero3DScene />
          </div>

          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="z-10 mx-6 flex max-w-5xl flex-col items-center gap-8 rounded-[2.5rem] border border-border/40 bg-background/20 p-10 shadow-2xl ring-1 ring-white/10 backdrop-blur-2xl sm:p-20"
          >
            <BackendStatusBadge />

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.7 }}
              className="font-sans text-5xl font-extrabold leading-[1.05] tracking-tighter text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            >
              Skin Cancer Detection, <br className="hidden sm:block" />
              <motion.span
                initial={{ opacity: 0, filter: "blur(8px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ delay: 0.35, duration: 0.8 }}
                className="italic text-muted-foreground"
              >
                Reimagined.
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28, duration: 0.7 }}
              className="max-w-2xl font-sans text-lg font-medium leading-relaxed text-muted-foreground sm:text-xl"
            >
              A unified three-stream system fusing dermoscopic imaging,
              ClinicalBERT narratives, and ABCD features for explainable
              classification.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.6 }}
              className="pointer-events-auto mt-4 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row"
            >
              <motion.a
                href="/analyze"
                className="w-full sm:w-auto"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  size="lg"
                  className="h-14 w-full rounded-full px-8 font-sans text-base shadow-xl sm:w-auto"
                >
                  <PulseIcon weight="duotone" className="mr-2 size-5" />
                  Start Analysis
                </Button>
              </motion.a>

              <motion.a
                href="https://github.com/multimodal-derm/derm-platform"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 w-full rounded-full bg-background/50 px-8 font-sans text-base backdrop-blur-md hover:bg-muted/80 sm:w-auto"
                >
                  <GithubLogoIcon weight="duotone" className="mr-2 size-5 opacity-70" />
                  View Architecture
                </Button>
              </motion.a>
            </motion.div>
          </motion.div>
        </section>

        <section className="relative bg-muted/5 px-6 py-32">
          <div className="mx-auto max-w-7xl">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end"
            >
              <motion.div variants={fadeUp} className="max-w-2xl">
                <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  The Architecture
                </p>
                <h2 className="font-sans text-4xl font-extrabold tracking-tighter text-foreground md:text-5xl">
                  Three Streams. <br /> One Diagnosis.
                </h2>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="max-w-md font-sans text-base leading-relaxed text-muted-foreground md:text-right"
              >
                Cross-attention fusion lets the model learn which image regions
                matter most for specific clinical descriptions.
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.15 }}
              className="grid grid-cols-1 gap-4 md:auto-rows-[220px] md:grid-cols-4"
            >
              {FEATURES.map((feature) => (
                <motion.div
                  key={feature.id}
                  variants={fadeUp}
                  whileHover={{ y: -6, scale: 1.01 }}
                  transition={{ duration: 0.25 }}
                  className={cn(
                    "group relative overflow-hidden rounded-3xl border border-border/50 bg-background p-8 transition-all duration-500 hover:border-foreground/30 hover:shadow-2xl hover:shadow-foreground/5",
                    feature.className
                  )}
                >
                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <motion.div
                      whileHover={{ scale: 1.08, rotate: -4 }}
                      transition={{ duration: 0.25 }}
                      className="flex size-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/50 text-foreground transition-all duration-500 group-hover:bg-foreground group-hover:text-background"
                    >
                      <feature.icon weight="duotone" className="size-6" />
                    </motion.div>

                    <div className="mt-8">
                      <h3 className="mb-3 font-sans text-xl font-bold tracking-tight text-foreground">
                        {feature.title}
                      </h3>
                      <p className="font-sans text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <motion.div
                    aria-hidden="true"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 z-0 bg-gradient-to-br from-foreground/5 to-transparent"
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-border/40 bg-background px-6 py-32">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

          <div className="mx-auto max-w-7xl text-center">
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="mb-24 font-sans text-4xl font-extrabold tracking-tighter text-foreground md:text-5xl"
            >
              Visual Inference Pipeline
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.8 }}
              className="relative mx-auto max-w-5xl rounded-3xl border border-border/50 bg-muted/10 p-8 shadow-2xl backdrop-blur-xl md:p-16"
            >
              <div className="overflow-x-auto pb-8">
                <div className="flex min-w-[900px] flex-col gap-12 pt-8">
                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55 }}
                    className="relative z-30 flex items-center gap-6"
                  >
                    <PipelineNode text="Dermoscopic Image" type="Raw Input" delay={0} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.15 }}
                    >
                      <CaretRightIcon weight="bold" className="size-6 text-muted-foreground/30" />
                    </motion.div>
                    <PipelineNode text="MedSigLIP [1152]" type="Vision Encoder" delay={0.08} />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      style={{ originX: 0 }}
                      className="mx-4 flex-1 border-t-2 border-dashed border-border/50"
                    />
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4">
                      <PipelineNode
                        text="Diagnosis"
                        type="6-Class Classification"
                        isEnd={true}
                        delay={0.28}
                      />
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.08 }}
                    className="relative z-20 flex items-center gap-6"
                  >
                    <PipelineNode text="Patient Narrative" type="Text Input" delay={0.05} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 }}
                    >
                      <CaretRightIcon weight="bold" className="size-6 text-muted-foreground/30" />
                    </motion.div>
                    <PipelineNode text="ClinicalBERT [768]" type="NLP Encoder" delay={0.12} />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.24 }}
                      style={{ originX: 0 }}
                      className="mx-4 mr-[240px] flex-1 border-t-2 border-dashed border-border/50"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: -24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: 0.14 }}
                    className="relative z-10 flex items-center gap-6"
                  >
                    <PipelineNode text="ABCD [14]" type="Metadata Input" delay={0.1} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.24 }}
                    >
                      <CaretRightIcon weight="bold" className="size-6 text-muted-foreground/30" />
                    </motion.div>
                    <PipelineNode text="Late Fusion [270]" type="Concatenation" delay={0.18} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 }}
                    >
                      <CaretRightIcon weight="bold" className="size-6 text-muted-foreground/30" />
                    </motion.div>
                    <PipelineNode text="MLP Head" type="Dense Network" delay={0.24} />
                    <motion.div
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.34 }}
                      style={{ originX: 0 }}
                      className="mx-4 mr-[240px] flex-1 border-t-2 border-dashed border-border/50"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <footer className="border-t border-border/40 bg-background">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-12 text-muted-foreground sm:flex-row"
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="flex size-10 items-center justify-center rounded-xl border border-border/50 bg-muted/30 shadow-sm">
                <span className="font-mono text-xs font-bold tracking-tighter text-foreground">
                  NU
                </span>
              </div>
              <p className="font-sans text-sm font-medium">
                Multimodal Dermatology Project <br className="hidden sm:block" />
                CS5330 / CS6120 Research Unit
              </p>
            </div>
            <p className="font-mono text-sm tracking-tight">
              Dataset: PAD-UFES-20 • N=2,298
            </p>
          </motion.div>
        </footer>
      </div>
    </AppInitializer>
  );
}