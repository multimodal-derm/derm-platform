import { notFound } from "next/navigation";
import { getDocBySlug, getAllDocSlugs } from "@/lib/docs";
import { DocContent } from "@/components/DocContent";

interface PageProps {
  params: { slug: string[] };
}

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({ params }: PageProps) {
  const slug = params.slug.join("/");
  const doc = getDocBySlug(slug);
  if (!doc) return {};
  return {
    title: `${doc.title} | Multimodal Derm Docs`,
    description: doc.description ?? "",
  };
}

export default function DocPage({ params }: PageProps) {
  const slug = params.slug.join("/");
  const doc = getDocBySlug(slug);
  if (!doc) notFound();
  return <DocContent doc={doc} />;
}
