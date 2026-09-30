import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Washboard — the tokens everyone's trading, and who's actually there",
  description:
    "Multi-token forensic board: turnover anomaly and empty-room flags over a query-bounded DEX universe. Observed anomalies, not accusations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('wb-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='light';}",
          }}
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
