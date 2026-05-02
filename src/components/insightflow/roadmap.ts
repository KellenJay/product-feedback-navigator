import type { AnalysisResult, Issue, Quote } from "./types";

export type Bucket = "now" | "next" | "later";
export type Effort = "S" | "M" | "L";

export interface Quarter {
  q: 1 | 2 | 3 | 4;
  year: number;
}

export interface RoadmapItem {
  id: string;
  issueIndex: number;
  title: string;
  bucket: Bucket;
  effort: Effort;
  quarter: Quarter;
  order?: number;
  impactScore: number;
  priority: "P1" | "P2" | "P3";
  category: string;
  mentions: number;
  rationale: string;
  quotes: Quote[];
}

export const BUCKET_META: Record<
  Bucket,
  { label: string; subtitle: string; tone: string }
> = {
  now: {
    label: "Now",
    subtitle: "This sprint",
    tone: "text-destructive",
  },
  next: {
    label: "Next",
    subtitle: "1–2 sprints",
    tone: "text-warning",
  },
  later: {
    label: "Later",
    subtitle: "Backlog",
    tone: "text-foreground-muted",
  },
};

export const EFFORT_META: Record<Effort, { label: string; days: string }> = {
  S: { label: "S", days: "~1–2 days" },
  M: { label: "M", days: "~3–5 days" },
  L: { label: "L", days: "~1–2 weeks" },
};

function priorityToBucket(p: Issue["priority"]): Bucket {
  if (p === "P1") return "now";
  if (p === "P2") return "next";
  return "later";
}

export function bucketToPriority(b: Bucket): "P1" | "P2" | "P3" {
  if (b === "now") return "P1";
  if (b === "next") return "P2";
  return "P3";
}

export function priorityClasses(p: "P1" | "P2" | "P3"): string {
  if (p === "P1") return "bg-destructive/15 text-destructive";
  if (p === "P2") return "bg-warning/15 text-warning";
  return "bg-success/15 text-success";
}

function deriveEffort(issue: Issue): Effort {
  if (issue.impactScore >= 75) return "L";
  if (issue.mentions >= 10 && issue.impactScore < 50) return "S";
  return "M";
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : trimmed).trim();
}

// ----- Quarter helpers -----

export function currentQuarter(date: Date = new Date()): Quarter {
  const month = date.getMonth(); // 0-11
  const q = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  return { q, year: date.getFullYear() };
}

export function addQuarters(quarter: Quarter, n: number): Quarter {
  const total = (quarter.year * 4 + (quarter.q - 1)) + n;
  const year = Math.floor(total / 4);
  const q = ((total % 4) + 1) as 1 | 2 | 3 | 4;
  return { q, year };
}

export function quarterFromBucket(bucket: Bucket, today: Date = new Date()): Quarter {
  const base = currentQuarter(today);
  const offset = bucket === "now" ? 0 : bucket === "next" ? 1 : 2;
  return addQuarters(base, offset);
}

export function bucketFromQuarter(q: Quarter, today: Date = new Date()): Bucket {
  const diff = quarterIndex(q) - quarterIndex(currentQuarter(today));
  if (diff <= 0) return "now";
  if (diff === 1) return "next";
  return "later";
}

export function formatQuarter(q: Quarter): string {
  return `Q${q.q} ${q.year}`;
}

export function quarterIndex(q: Quarter): number {
  return q.year * 4 + (q.q - 1);
}

export function quartersEqual(a: Quarter, b: Quarter): boolean {
  return a.q === b.q && a.year === b.year;
}

export function parseQuarter(s: string): Quarter | null {
  const m = s.match(/^Q([1-4])\s+(\d{4})$/);
  if (!m) return null;
  return { q: Number(m[1]) as 1 | 2 | 3 | 4, year: Number(m[2]) };
}

export function deriveRoadmap(result: AnalysisResult, today: Date = new Date()): RoadmapItem[] {
  return result.issues.map((issue, i) => {
    const bucket = priorityToBucket(issue.priority);
    return {
      id: `issue-${i}`,
      issueIndex: i,
      title: issue.title,
      bucket,
      effort: deriveEffort(issue),
      quarter: quarterFromBucket(bucket, today),
      impactScore: issue.impactScore,
      priority: issue.priority,
      category: issue.category,
      mentions: issue.mentions,
      rationale: firstSentence(issue.description),
      quotes: issue.quotes ?? [],
    };
  });
}

function quoteText(q: Quote): string {
  return typeof q === "string" ? q : q.text;
}

export function buildRoadmapMarkdown(
  items: RoadmapItem[],
  productName: string,
): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const buckets: Bucket[] = ["now", "next", "later"];

  const lines: string[] = [
    `# Roadmap — ${productName || "Untitled"}`,
    `_Generated ${date} from InsightFlow_`,
    "",
  ];

  for (const b of buckets) {
    const meta = BUCKET_META[b];
    const inBucket = items.filter((it) => it.bucket === b);
    if (inBucket.length === 0) continue;
    lines.push(`## ${meta.label} (${meta.subtitle})`);
    for (const it of inBucket) {
      lines.push(
        `- **${it.title}** — ${formatQuarter(it.quarter)} · Impact ${it.impactScore} · ${it.priority} · Effort ${it.effort} · ${it.mentions} mentions`,
      );
      if (it.rationale) lines.push(`  ${it.rationale}`);
      const q = it.quotes[0];
      if (q) lines.push(`  > ${quoteText(q)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
