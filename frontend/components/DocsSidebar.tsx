"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { ArrowLeftIcon, TrayIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import type { SearchEntry } from "@/lib/docs";

const NAV_SECTIONS = [
	{
		label: "Overview",
		items: [
			{ slug: "index", title: "Introduction" },
			{ slug: "getting-started", title: "Getting Started" },
			{ slug: "architecture", title: "Architecture" },
			{ slug: "dataset", title: "Dataset" },
			{ slug: "fairness", title: "Fairness" },
		],
	},
	{
		label: "API Reference",
		items: [
			{ slug: "api/cv", title: "CV Module" },
			{ slug: "api/fusion", title: "Fusion Module" },
			{ slug: "api/nlp", title: "NLP Module" },
		],
	},
	{
		label: "Research Proposals",
		items: [
			{ slug: "proposals/nlp_proposal", title: "NLP Proposal" },
			{ slug: "proposals/cv_proposal", title: "CV Proposal" },
			{ slug: "proposals/ml_proposal", title: "ML Proposal" },
			{ slug: "proposals/Fusion_arch", title: "Fusion Architecture" },
			{ slug: "proposals/prcv_proposal", title: "PRCV Proposal" },
		],
	},
	{
		label: "Reports & Specs",
		items: [
			{ slug: "reports/resnet18_baseline", title: "ResNet-18 Baseline" },
			{ slug: "specs/nlp_fusion_contract", title: "NLP Fusion Contract" },
		],
	},
];

function getExcerpt(entry: SearchEntry, query: string): string {
  const q = query.toLowerCase();
  const idx = entry.excerpt.toLowerCase().indexOf(q);
  if (idx === -1) return entry.excerpt.slice(0, 80) + "...";
  const start = Math.max(0, idx - 40);
  const end = Math.min(entry.excerpt.length, idx + query.length + 80);
  return (start > 0 ? "…" : "") + entry.excerpt.slice(start, end) + (end < entry.excerpt.length ? "…" : "");
}

export function DocsSidebar({ searchIndex }: { searchIndex: SearchEntry[] }) {
	const pathname = usePathname();
	const [query, setQuery] = useState("");

	const filtered = useMemo(() => {
		if (!query.trim()) return null;
		const q = query.toLowerCase();
		return searchIndex.filter(
			(entry) =>
				entry.title.toLowerCase().includes(q) ||
				entry.section.toLowerCase().includes(q) ||
				entry.excerpt.toLowerCase().includes(q)
		);
	}, [query, searchIndex]);

	return (
		<aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-64 shrink-0 overflow-y-auto border-r border-border/40 bg-background px-6 py-10 md:block">
			{/* Back to App Link */}
			<div className="mb-10">
				<Link
					href="/"
					className="group inline-flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
				>
					<ArrowLeftIcon
						weight="bold"
						className="size-3 transition-transform group-hover:-translate-x-1"
					/>
					Terminal
				</Link>
			</div>

			{/* Search */}
			<div className="mb-8">
				<div className="relative">
					<MagnifyingGlassIcon
						weight="bold"
						className="absolute left-2.5 top-2.5 size-3 text-muted-foreground pointer-events-none"
					/>
					<input
						type="text"
						placeholder="Search docs..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="w-full rounded-lg border border-border/40 bg-muted/20 py-1.5 pl-7 pr-7 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-foreground/20 transition-all"
					/>
					{query && (
						<button
							onClick={() => setQuery("")}
							className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
						>
							<XIcon weight="bold" className="size-3" />
						</button>
					)}
				</div>
			</div>

			{/* Search Results */}
			{filtered !== null ? (
				<div>
					<p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
						Results ({filtered.length})
					</p>
					{filtered.length === 0 ? (
						<p className="px-4 text-xs text-muted-foreground">No results found.</p>
					) : (
						<div className="flex flex-col gap-1">
							{filtered.map((entry) => {
								const href = `/docs/${entry.slug}`;
								const active = pathname === href;
								return (
									<Link
										key={entry.slug}
										href={href}
										onClick={() => setQuery("")}
										className={cn(
											"relative block rounded-lg border border-transparent px-3 py-2 text-sm transition-all duration-200",
											active
												? "border-border/40 bg-muted/50 font-bold text-foreground"
												: "text-muted-foreground hover:border-border/40 hover:bg-muted/30 hover:text-foreground"
										)}
									>
										<span className="block text-xs font-semibold text-foreground">{entry.title}</span>
										<span className="font-mono text-[10px] text-muted-foreground/50">{entry.section}</span>
										<span className="mt-1 block text-[10px] leading-relaxed text-muted-foreground/70 line-clamp-2">
											{getExcerpt(entry, query)}
										</span>
									</Link>
								);
							})}
						</div>
					)}
				</div>
			) : (
				<nav className="space-y-8">
					{NAV_SECTIONS.map((section) => (
						<div key={section.label}>
							<p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
								{section.label}
							</p>
							<div className="flex flex-col gap-0.5 border-l border-border/40">
								{section.items.map((item) => {
									const href = `/docs/${item.slug}`;
									const active = pathname === href;
									return (
										<Link
											key={item.slug}
											href={href}
											className={cn(
												"relative -ml-px block border-l px-4 py-2 text-sm transition-all duration-200",
												active
													? "border-foreground font-bold text-foreground"
													: "border-transparent text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/30"
											)}
										>
											{item.title}
											{active && (
												<motion.div
													layoutId="sidebar-active"
													className="absolute inset-0 z-[-1] bg-muted/50 rounded-r-lg"
												/>
											)}
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</nav>
			)}

			{/* Project Context Footer */}
			<div className="mt-16 rounded-xl border border-border/40 bg-muted/20 p-4">
				<div className="mb-2 flex items-center gap-2 text-foreground">
					<TrayIcon weight="duotone" className="size-4" />
					<span className="font-mono text-[10px] font-bold uppercase tracking-widest">
						Context
					</span>
				</div>
				<p className="text-[10px] leading-relaxed text-muted-foreground">
					DermPlatform Multimodal Documentation v1.0.2 // PAD-UFES-20
				</p>
			</div>
		</aside>
	);
}