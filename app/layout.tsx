import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Washboard — volume vs. people",
  description:
    "A forensic blotter for DEX tokens: turnover anomalies and price-vs-participation gaps, computed from CMC-reported fields. Observed, not predicted.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#main">skip to content</a>
        <header className="wrap">
          <div className="masthead">
            <div>
              <div className="kicker">forensic blotter · universe-bounded · observed</div>
              <h1>Washboard</h1>
            </div>
            <nav aria-label="primary" style={{ marginLeft: "auto", display: "flex", gap: 14, fontSize: 13 }}>
              <a className="link" href="/">the blotter</a>
              <a className="link" href="/drill">drill a token</a>
            </nav>
          </div>
          <div className="rule-double" />
        </header>
        <main id="main" className="wrap" style={{ paddingTop: 16, paddingBottom: 40 }}>
          {children}
        </main>
        <footer className="wrap">
          <div className="footnote">
            Washboard reports what the provider printed — volume, pool depth, and a unique-trader counter.
            Flags are measurements, not verdicts. Addresses are not entities. Nothing here is a prediction
            or financial advice. Built for the CMC API hackathon; spot data only.
          </div>
        </footer>
      </body>
    </html>
  );
}
