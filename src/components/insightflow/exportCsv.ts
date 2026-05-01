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

function quoteFields(q: Quote | undefined): {
  text: string;
  source: string;
  context: string;
  date: string;
  url: string;
} {
  if (!q) return { text: "", source: "", context: "", date: "", url: "" };
  if (typeof q === "string")
    return { text: q, source: "", context: "", date: "", url: "" };
  return {
    text: q.text ?? "",
    source: q.source ?? "",
    context: q.context ?? "",
    date: q.date ?? "",
    url: q.url ?? "",
  };
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
    "Quote #",
    "Quote Text",
    "Quote Source",
    "Quote Context",
    "Quote Date",
    "Quote URL",
  ];
  const rows: string[] = [];
  result.issues.forEach((it, i) => {
    const quotes = it.quotes && it.quotes.length > 0 ? it.quotes : [undefined];
    quotes.forEach((q, qi) => {
      const f = quoteFields(q);
      rows.push(
        csvRow([
          i + 1,
          it.title,
          it.priority,
          it.category,
          it.impactScore,
          it.mentions,
          it.description,
          q ? qi + 1 : "",
          f.text,
          f.source,
          f.context,
          f.date,
          f.url,
        ]),
      );
    });
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
    "Quote #",
    "Quote Text",
    "Quote Source",
    "Quote Context",
    "Quote Date",
    "Quote URL",
  ];
  const rows: string[] = [];
  items.forEach((it, i) => {
    const quotes = it.quotes && it.quotes.length > 0 ? it.quotes : [undefined];
    quotes.forEach((q, qi) => {
      const f = quoteFields(q);
      rows.push(
        csvRow([
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
          q ? qi + 1 : "",
          f.text,
          f.source,
          f.context,
          f.date,
          f.url,
        ]),
      );
    });
  });
  const csv = [csvRow(header), ...rows].join("\n");
  downloadBlob(csv, `${safeName(productName)}-roadmap.csv`, "text/csv;charset=utf-8");
}
