import type { AnalysisResult, Quote } from "./types";
import { formatQuarter, type RoadmapItem } from "./roadmap";

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function csvRow(cols: unknown[]): string {
  return cols.map(csvEscape).join(",");
}

function quoteText(q: Quote): string {
  return typeof q === "string" ? q : q.text;
}

function quoteSource(q: Quote): string {
  if (typeof q === "string") return "";
  const parts = [q.source, q.context, q.date].filter(Boolean);
  return parts.join(" · ");
}

function safeName(s: string): string {
  return (s || "untitled").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase();
}

function downloadBlob(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAnalysisCsv(result: AnalysisResult, productName: string) {
  const header = [
    "Rank",
    "Title",
    "Priority",
    "Category",
    "Impact",
    "Mentions",
    "Description",
    "Quote 1",
    "Quote 1 Source",
    "Quote 2",
    "Quote 2 Source",
    "Quote 3",
    "Quote 3 Source",
  ];
  const rows = result.issues.map((it, i) => {
    const q1 = it.quotes?.[0];
    const q2 = it.quotes?.[1];
    const q3 = it.quotes?.[2];
    return csvRow([
      i + 1,
      it.title,
      it.priority,
      it.category,
      it.impactScore,
      it.mentions,
      it.description,
      q1 ? quoteText(q1) : "",
      q1 ? quoteSource(q1) : "",
      q2 ? quoteText(q2) : "",
      q2 ? quoteSource(q2) : "",
      q3 ? quoteText(q3) : "",
      q3 ? quoteSource(q3) : "",
    ]);
  });
  const csv = [csvRow(header), ...rows].join("\n");
  downloadBlob(csv, `${safeName(productName)}-analysis.csv`, "text/csv;charset=utf-8");
}

export function exportRoadmapCsv(items: RoadmapItem[], productName: string) {
  const header = [
    "Rank",
    "Title",
    "Bucket",
    "Quarter",
    "Priority",
    "Effort",
    "Impact",
    "Mentions",
    "Category",
    "Rationale",
    "Quote 1",
  ];
  const rows = items.map((it, i) => {
    const q1 = it.quotes?.[0];
    return csvRow([
      i + 1,
      it.title,
      it.bucket,
      formatQuarter(it.quarter),
      it.priority,
      it.effort,
      it.impactScore,
      it.mentions,
      it.category,
      it.rationale,
      q1 ? quoteText(q1) : "",
    ]);
  });
  const csv = [csvRow(header), ...rows].join("\n");
  downloadBlob(csv, `${safeName(productName)}-roadmap.csv`, "text/csv;charset=utf-8");
}
