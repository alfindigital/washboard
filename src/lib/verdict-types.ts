// Minimal shared types required by vendored verdex lib files.
export interface ParsedRows<T> {
  rows: T[];
  rejected: number;
  duplicates: number;
  reasons: string[];
}

export interface SourceEvidence {
  endpoint: string;
  params: Record<string, unknown>;
  ts: string;
  credits: number;
  sha256: string;
  cached: boolean;
}
