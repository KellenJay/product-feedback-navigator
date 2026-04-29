export type Sentiment = "Negative" | "Mixed" | "Positive";

export interface QuoteAttribution {
  text: string;
  source?: string | null;       // e.g. "Reddit", "Capterra", "G2", "Support ticket"
  context?: string | null;      // e.g. "r/godaddy", "review #482"
  date?: string | null;         // human-readable, e.g. "2 weeks ago" or "2025-03-14"
  url?: string | null;
}

// Backwards-compatible: AI may return plain strings or rich objects.
export type Quote = string | QuoteAttribution;

export interface Issue {
  title: string;
  description: string;
  impactScore: number;
  category: string;
  priority: "P0" | "P1" | "P2";
  mentions: number;
  quotes: Quote[];
}

export interface Recommendation {
  title: string;
  detail: string;
}

export interface AnalysisResult {
  reviewsAnalyzed: number;
  overallSentiment: Sentiment;
  criticalIssuesCount: number;
  topPainArea: string;
  executiveSummary: string;
  issues: Issue[];
  recommendations: Recommendation[];
}

export type SourceMode = "paste" | "upload" | "deep-research";
