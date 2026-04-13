"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { Doc } from "@/lib/docs";
import { cn } from "@/lib/utils";
import { BookOpenIcon, CirclesThreePlusIcon } from "@phosphor-icons/react";

interface DocContentProps {
  doc: Doc;
}

function removeDuplicateTitle(content: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^#\\s+${escapedTitle}\\s*\\n+`, "i");
  return content.replace(pattern, "");
}

function normalize(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function isArchitectureDoc(doc: Doc) {
  const title = normalize(doc.title);
  return title.includes("architecture");
}

function ArchitectureDiagram() {
  return (
    <section className="my-10">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl border border-border/50 bg-muted/40 text-foreground">
          <CirclesThreePlusIcon weight="duotone" className="size-4" />
        </div>
        <h2 className="m-0 text-2xl font-semibold tracking-tight text-foreground">
          Three-Stream Pipeline
        </h2>
      </div>

      <div className="rounded-3xl border border-border/40 bg-background/50 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-cyan-500/15 bg-cyan-500/[0.04] p-5">
            <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
              Stream 1
            </div>
            <div className="text-lg font-semibold text-foreground">Vision</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <div>Image (448×448)</div>
              <div>→ MedSigLIP</div>
              <div>→ patch tokens</div>
              <div className="font-mono text-cyan-700/90 dark:text-cyan-100/80">(B, 1024, 1152)</div>
            </div>
            <div className="mt-4 rounded-xl border border-cyan-500/10 bg-cyan-500/[0.05] px-3 py-2 text-xs text-cyan-800 dark:text-cyan-100/80">
              Key, Value
            </div>
          </div>

          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.04] p-5">
            <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-[0.18em] text-violet-700 dark:text-violet-300">
              Stream 2
            </div>
            <div className="text-lg font-semibold text-foreground">Text</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <div>Metadata (26 col)</div>
              <div>→ Textification</div>
              <div>→ ClinicalBERT</div>
              <div className="font-mono text-violet-700/90 dark:text-violet-100/80">(B, 768)</div>
            </div>
            <div className="mt-4 rounded-xl border border-violet-500/10 bg-violet-500/[0.05] px-3 py-2 text-xs text-violet-800 dark:text-violet-100/80">
              Query
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-5">
            <div className="mb-2 text-xs font-mono font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
              Stream 3
            </div>
            <div className="text-lg font-semibold text-foreground">ABCD Features</div>
            <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <div>Lesion mask</div>
              <div>→ Asymmetry</div>
              <div>→ Border</div>
              <div>→ Color</div>
              <div>→ Diameter</div>
            </div>
            <div className="mt-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.05] px-3 py-2 text-xs text-amber-800 dark:text-amber-100/80">
              projection (B, 256)
            </div>
          </div>
        </div>

        <div className="my-5 flex justify-center text-muted-foreground">↓</div>

        <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">
          <div className="text-lg font-semibold text-foreground">
            Cross-Attention
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            d_k = 256, 8 heads
          </div>
          <div className="mt-3 rounded-xl border border-border/40 bg-background/40 px-3 py-2 font-mono text-sm text-foreground">
            pooled (B, 256)
          </div>
        </div>

        <div className="my-5 flex justify-center text-muted-foreground">↓</div>

        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5">
          <div className="text-lg font-semibold text-foreground">
            Late-Fusion Concat
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            [pooled_attn, abcd_proj] → (B, 512)
          </div>
          <div className="mt-3 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.05] px-3 py-2 font-mono text-sm text-emerald-800 dark:text-emerald-100/90">
            MLP 512 → 256 → 6 (logits)
          </div>
        </div>
      </div>
    </section>
  );
}

function buildMarkdownComponents(doc: Doc): Components {
  const architectureDoc = isArchitectureDoc(doc);

  return {
    table: ({ children }) => (
      <div className="my-8 overflow-x-auto rounded-2xl border border-border/40 bg-background/40">
        <table className="w-full min-w-[680px] border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-muted/40">{children}</thead>,
    th: ({ children }) => (
      <th className="border-b border-border/40 px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-border/30 px-4 py-3 align-top text-[14px] leading-6 text-zinc-700 dark:text-zinc-300">
        {children}
      </td>
    ),
    ul: ({ children }) => (
      <ul className="my-6 space-y-2 pl-5 marker:text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="my-6 space-y-2 pl-5 marker:text-muted-foreground">{children}</ol>
    ),
    pre: ({ children }) => {
      if (architectureDoc) return <ArchitectureDiagram />;

      return (
        <div className="my-8 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
              technical block
            </span>
          </div>
          <pre className="m-0 overflow-x-auto bg-transparent px-5 py-4 text-[13px] leading-7 text-white/90">
            {children}
          </pre>
        </div>
      );
    },
  };
}

export function DocContent({ doc }: DocContentProps) {
  const cleanedContent = removeDuplicateTitle(doc.content, doc.title);
  const components = buildMarkdownComponents(doc);

  return (
    <article className="animate-in fade-in slide-in-from-bottom-4 duration-700 font-sans">
      <div className="mb-12 border-b border-border/40 pb-10">
        <div className="mb-6 flex size-11 items-center justify-center rounded-2xl border border-border/50 bg-muted/40 text-foreground shadow-sm">
          <BookOpenIcon weight="duotone" className="size-5" />
        </div>

        <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-foreground md:text-5xl">
          {doc.title}
        </h1>

        {doc.description && (
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
            {doc.description}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-4xl">
        <div
          className={cn(
            "prose prose-zinc max-w-none dark:prose-invert",
            "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-foreground",
            "prose-h1:hidden",
            "prose-h2:mt-14 prose-h2:mb-5 prose-h2:text-3xl prose-h2:border-b prose-h2:border-border/30 prose-h2:pb-3",
            "prose-h3:mt-10 prose-h3:mb-3 prose-h3:text-xl",
            "prose-p:my-5 prose-p:text-[15px] prose-p:leading-7 prose-p:text-zinc-700 dark:prose-p:text-zinc-300",
            "prose-li:my-1 prose-li:text-[15px] prose-li:leading-7 prose-li:text-zinc-700 dark:prose-li:text-zinc-300",
            "prose-strong:font-semibold prose-strong:text-foreground",
            "prose-a:font-medium prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 prose-a:decoration-border hover:prose-a:decoration-foreground",
            "prose-hr:my-10 prose-hr:border-border/30",
            "prose-code:rounded-md prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[13px] prose-code:text-foreground prose-code:before:content-[''] prose-code:after:content-['']",
            "prose-blockquote:rounded-r-xl prose-blockquote:border-l-2 prose-blockquote:border-foreground prose-blockquote:bg-muted/30 prose-blockquote:px-6 prose-blockquote:py-1 prose-blockquote:italic prose-blockquote:text-foreground"
          )}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {cleanedContent}
          </ReactMarkdown>
        </div>
      </div>
    </article>
  );
}