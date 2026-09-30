import type { Metadata } from "next";
import { ThemeToggle, GithubIcon } from "@/components/ThemeToggle";
import "./globals.css";

export const metadata: Metadata = {
  title: "Washboard — volume vs. people",
  description:
    "A forensic blotter for DEX tokens: turnover anomalies and price-vs-participation gaps, computed from CMC-reported fields. Observed, not predicted.",
};

const themeBoot = `try{var t=localStorage.getItem("wb-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body>
        <a className="skip" href="#main">skip to content</a>
        <header className="wrap">
          <div className="site-header">
            <a className="brandmark" href="/">
              <span className="w">Washboard</span>
              <span className="tag">spot-market blotter</span>
            </a>
            <nav className="header-nav" aria-label="primary">
              <a className="navlink" href="/">the blotter</a>
              <a className="navlink" href="/drill">drill a token</a>
              <a
                className="icon-btn"
                href="https://github.com/alfindigital/washboard"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub repository"
                title="GitHub"
              >
                <GithubIcon />
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main id="main" className="wrap" style={{ paddingTop: 20, paddingBottom: 40 }}>
          {children}
        </main>
        <footer className="wrap">
          <div className="site-footer">
            <div className="footer-grid">
              <div>
                <h4>Washboard</h4>
                <p>
                  Two flags over one tape: turnover anomaly and empty-room moves,
                  measured against a sha-pinned snapshot of 2,466 spot tokens.
                  Observations — never verdicts.
                </p>
              </div>
              <div>
                <h4>Board</h4>
                <ul>
                  <li><a href="/">the blotter</a></li>
                  <li><a href="/drill">drill a token</a></li>
                  <li><a href="https://github.com/alfindigital/washboard" target="_blank" rel="noopener noreferrer">source on GitHub</a></li>
                </ul>
              </div>
              <div>
                <h4>Method</h4>
                <ul>
                  <li><a href="/drill/Base:0xba3785f43d0b28080879cdbd9cf8d1759b0979f0">sample drill card</a></li>
                  <li><a href="/api/board" target="_blank" rel="noopener noreferrer">board JSON</a></li>
                </ul>
              </div>
            </div>
            <div className="footer-legal">
              <span>provider-reported fields · addresses ≠ entities · not financial advice</span>
              <span>spot only · CMC API hackathon 2026</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
