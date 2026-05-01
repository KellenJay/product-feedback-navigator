import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ExportMenu } from "./ExportMenu";
import { exportAnalysisPdf } from "./exportPdf";
import { exportAnalysisCsv } from "./exportCsv";
import type { AnalysisResult } from "./types";

interface Props {
  productName: string;
  result: AnalysisResult;
}

export function AnalysisFooter({ productName, result }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
      <p className="text-xs text-foreground-muted">
        Analysis complete — {productName || "Untitled"} · {today}
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          Open roadmap
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={() =>
            toast.success("Saved", {
              description: "View it in Library when that tab ships.",
            })
          }
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          Save to library
        </button>
        <ExportMenu
          onExportPdf={() => {
            try {
              exportAnalysisPdf(result, productName, null);
              toast.success("PDF downloaded");
            } catch {
              toast.error("Couldn't export PDF");
            }
          }}
          onExportCsv={() => {
            try {
              exportAnalysisCsv(result, productName);
              toast.success("CSV downloaded");
            } catch {
              toast.error("Couldn't export CSV");
            }
          }}
        />
      </div>
    </div>
  );
}
