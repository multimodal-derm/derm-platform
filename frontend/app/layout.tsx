import type { Metadata } from "next";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "DermPlatform — Multimodal Skin Cancer Detection",
  description:
    "Clinical decision support tool for skin cancer detection using multimodal AI: MedSigLIP vision encoder, ClinicalBERT text encoder, and ABCD feature analysis.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Skip to content — keyboard accessibility */}
        <a href="#main-content" className="skip-to-content">
          Skip to main content
        </a>

        <nav
          className="sticky top-0 z-50 border-b border-clinical-border bg-white/80 dark:bg-slate-900/90 dark:border-slate-700 backdrop-blur-md"
          aria-label="Primary navigation"
        >
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <a
              href="/"
              className="flex items-center gap-2.5"
              aria-label="DermPlatform home"
            >
              <div
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="text-white text-sm font-bold">D</span>
              </div>
              <span className="text-base font-bold text-clinical-text dark:text-slate-100">
                DermPlatform
              </span>
            </a>
            <div className="flex items-center gap-4" role="list">
              <a
                href="/analyze"
                role="listitem"
                className="text-sm font-medium text-clinical-muted dark:text-slate-400 hover:text-clinical-text dark:hover:text-slate-100 transition-colors"
              >
                Analyze
              </a>
              <a
                href="https://github.com/multimodal-derm/derm-platform"
                target="_blank"
                rel="noopener noreferrer"
                role="listitem"
                className="text-sm font-medium text-clinical-muted dark:text-slate-400 hover:text-clinical-text dark:hover:text-slate-100 transition-colors"
              >
                GitHub
                <span className="sr-only"> (opens in new tab)</span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
