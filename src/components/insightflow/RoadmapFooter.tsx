import { toast } from "sonner";
import { Copy, FileDown, RotateCcw } from "lucide-react";
import { buildRoadmapMarkdown, type RoadmapItem } from "./roadmap";

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
        <SecondaryButton onClick={handleCopy}>
          <Copy className="h-3.5 w-3.5" />
          Copy as markdown
        </SecondaryButton>
        <SecondaryButton
          onClick={() =>
            toast("PDF export coming next", {
              description: "Use markdown copy for now.",
            })
          }
        >
          <FileDown className="h-3.5 w-3.5" />
          Export PDF
        </SecondaryButton>
        {hasOverrides && (
          <SecondaryButton
            onClick={() => {
              onReset();
              toast.success("Reverted to suggested order");
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset overrides
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

function SecondaryButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface"
    >
      {children}
    </button>
  );
}
