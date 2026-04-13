import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "DermPlatform — Multimodal Skin Cancer Detection",
  description: "Clinical decision support tool using multimodal AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* We inject the Geist font variables directly into the body */}
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        GeistSans.variable,
        GeistMono.variable
      )}>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = saved ? saved === 'dark' : prefersDark;
                  document.documentElement.classList.toggle('dark', isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
        
        <a href="#main-content" className="skip-to-content">Skip to main content</a>

        <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-300">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
            <a href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
              <div className="flex size-7 items-center justify-center rounded-md bg-foreground shadow-sm">
                <span className="font-mono text-xs font-bold text-background tracking-tighter">DP</span>
              </div>
              <span className="font-sans text-sm font-bold tracking-tight text-foreground">
                DermPlatform
              </span>
            </a>

            <div className="flex items-center gap-6">
              <a href="/analyze" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Analyze</a>
              <a href="/docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Docs</a>
              <a href="https://github.com/multimodal-derm" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">GitHub</a>
              <div className="hidden h-4 w-px bg-border sm:block" />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        <main id="main-content" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}