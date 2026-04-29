export type Sentiment = "Negative" | "Mixed" | "Positive";

export interface Issue {
  title: string;
  description: string;
  impactScore: number;
  category: string;
  priority: "P0" | "P1" | "P2";
  mentions: number;
  quotes: string[];
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
