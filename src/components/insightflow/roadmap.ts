import type { AnalysisResult, Issue, Quote } from "./types";

export type Bucket = "now" | "next" | "later";
export type Effort = "S" | "M" | "L";

export interface RoadmapItem {
  id: string;
  issueIndex: number;
  title: string;
  bucket: Bucket;
  effort: Effort;
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

function deriveEffort(issue: Issue): Effort {
  // Rough heuristic: high impact = bigger fix; very high mentions w/ low score
  // suggests a quick UX win.
  if (issue.impactScore >= 75) return "L";
  if (issue.mentions >= 10 && issue.impactScore < 50) return "S";
  return "M";
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const m = trimmed.match(/^(.+?[.!?])(\s|$)/);
  return (m ? m[1] : trimmed).trim();
}

export function deriveRoadmap(result: AnalysisResult): RoadmapItem[] {
  return result.issues.map((issue, i) => ({
    id: `issue-${i}`,
    issueIndex: i,
    title: issue.title,
    bucket: priorityToBucket(issue.priority),
    effort: deriveEffort(issue),
    impactScore: issue.impactScore,
    priority: issue.priority,
    category: issue.category,
    mentions: issue.mentions,
    rationale: firstSentence(issue.description),
    quotes: issue.quotes ?? [],
  }));
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
        `- **${it.title}** — Impact ${it.impactScore} · ${it.priority} · Effort ${it.effort} · ${it.mentions} mentions`,
      );
      if (it.rationale) lines.push(`  ${it.rationale}`);
      const q = it.quotes[0];
      if (q) lines.push(`  > ${quoteText(q)}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd() + "\n";
}
