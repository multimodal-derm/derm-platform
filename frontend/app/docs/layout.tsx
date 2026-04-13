import { DocsSidebar } from "@/components/DocsSidebar";
import { buildSearchIndex } from "@/lib/docs";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const searchIndex = buildSearchIndex();

  return (
    <div className="min-h-screen bg-background flex">
      <DocsSidebar searchIndex={searchIndex} />
      <main className="flex-1 min-w-0 px-8 py-10 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}