import { toast } from "sonner";
import { Copy, RotateCcw } from "lucide-react";
import { buildRoadmapMarkdown, type RoadmapItem } from "./roadmap";
import { ExportMenu } from "./ExportMenu";
import { exportRoadmapPdf } from "./exportPdf";
import { exportRoadmapCsv } from "./exportCsv";

interface Props {
  items: RoadmapItem[];
  productName: string;
  hasOverrides: boolean;
  onReset: () => void;
}

export function RoadmapFooter({
  items,
  productName,
  hasOverrides,
  onReset,
}: Props) {
  const handleCopy = async () => {
    const md = buildRoadmapMarkdown(items, productName);
    try {
      await navigator.clipboard.writeText(md);
      toast.success("Roadmap copied as markdown", {
        description: "Paste into Notion, Linear, GitHub, or Slack.",
      });
    } catch {
      toast.error("Couldn't access clipboard");
    }
  };

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <p className="text-xs text-foreground-muted">
        {items.length} prioritized {items.length === 1 ? "item" : "items"} ·
        defensible from the analysis
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy as markdown
        </button>
        <ExportMenu
          onExportPdf={() => {
            try {
              exportRoadmapPdf(items, productName);
              toast.success("PDF downloaded");
            } catch {
              toast.error("Couldn't export PDF");
            }
          }}
          onExportCsv={() => {
            try {
              exportRoadmapCsv(items, productName);
              toast.success("CSV downloaded");
            } catch {
              toast.error("Couldn't export CSV");
            }
          }}
        />
        {hasOverrides && (
          <button
            type="button"
            onClick={() => {
              onReset();
              toast.success("Reverted to suggested order");
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset overrides
          </button>
        )}
      </div>
    </div>
  );
}
