import fs from "fs";
import path from "path";
import matter from "gray-matter";

const DOCS_DIR = path.join(process.cwd(), "content/docs");

export interface Doc {
  slug: string;
  title: string;
  description?: string;
  content: string;
}

export interface SearchEntry {
  slug: string;
  title: string;
  section: string;
  excerpt: string; // plain text, markdown stripped
}

export function getDocBySlug(slug: string): Doc | null {
  const filePath = path.join(DOCS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  let title = data.title;
  if (!title) {
    const match = content.match(/^#\s+(.+)/m);
    title = match ? match[1] : slug.split("/").pop() ?? slug;
  }

  return { slug, title, description: data.description ?? "", content };
}

export function getAllDocSlugs(): string[] {
  const results: string[] = [];

  function walk(dir: string, prefix: string) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(
          path.join(dir, entry.name),
          prefix ? `${prefix}/${entry.name}` : entry.name
        );
      } else if (entry.name.endsWith(".md")) {
        const slug =
          (prefix ? `${prefix}/` : "") + entry.name.replace(/\.md$/, "");
        results.push(slug);
      }
    }
  }

  walk(DOCS_DIR, "");
  return results;
}

const SLUG_TO_SECTION: Record<string, string> = {
  index: "Overview",
  "getting-started": "Overview",
  architecture: "Overview",
  dataset: "Overview",
  fairness: "Overview",
  "api/cv": "API Reference",
  "api/fusion": "API Reference",
  "api/nlp": "API Reference",
  "proposals/nlp_proposal": "Research Proposals",
  "proposals/cv_proposal": "Research Proposals",
  "proposals/ml_proposal": "Research Proposals",
  "proposals/Fusion_arch": "Research Proposals",
  "proposals/prcv_proposal": "Research Proposals",
  "reports/resnet18_baseline": "Reports & Specs",
  "specs/nlp_fusion_contract": "Reports & Specs",
};

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, "") // code blocks
    .replace(/`[^`]*`/g, "")        // inline code
    .replace(/#{1,6}\s+/g, "")      // headings
    .replace(/\*\*([^*]+)\*\*/g, "$1") // bold
    .replace(/\*([^*]+)\*/g, "$1")   // italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links
    .replace(/^\s*[-*>|]+\s*/gm, "") // bullets, blockquotes, tables
    .replace(/\n{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchIndex(): SearchEntry[] {
  return getAllDocSlugs().map((slug) => {
    const doc = getDocBySlug(slug);
    const plain = doc ? stripMarkdown(doc.content) : "";
    return {
      slug,
      title: doc?.title ?? slug,
      section: SLUG_TO_SECTION[slug] ?? "Docs",
      excerpt: plain.slice(0, 2000), // cap at 2000 chars per doc
    };
  });
}