import { toast } from "sonner";
import { ArrowUp } from "lucide-react";

interface Props {
  productName: string;
}

export function AnalysisFooter({ productName }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
      <p className="text-xs text-foreground-muted">
        Analysis complete — {productName || "Untitled"} · {today}
      </p>
      <div className="flex flex-wrap gap-2">
        <SecondaryButton
          onClick={() =>
            toast.success("Saved", {
              description: "View it in Library when that tab ships.",
            })
          }
        >
          Save to library
        </SecondaryButton>
        <SecondaryButton onClick={() => toast("Coming in next build")}>
          Export as PDF
        </SecondaryButton>
        <SecondaryButton onClick={scrollToTop}>
          <ArrowUp className="h-3.5 w-3.5" />
          Back to top
        </SecondaryButton>
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
