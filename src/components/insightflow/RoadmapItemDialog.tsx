import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EFFORT_META, formatQuarter, priorityClasses, type RoadmapItem } from "./roadmap";
import { QuoteList } from "./QuoteList";
import { NoteEditor } from "./RoadmapItemCard";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: RoadmapItem | null;
}

export function RoadmapItemDialog({ open, onOpenChange, item }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] max-w-2xl overflow-y-auto">
        {item && <Body item={item} />}
      </DialogContent>
    </Dialog>
  );
}

function Body({ item }: { item: RoadmapItem }) {
  const impactColor =
    item.impactScore >= 70
      ? "bg-success/15 text-success"
      : item.impactScore >= 40
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";
  const priorityColor = priorityClasses(item.priority);

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between gap-3 pr-8">
          <DialogTitle className="text-base leading-snug">
            {item.title}
          </DialogTitle>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${impactColor}`}
          >
            Impact {item.impactScore}
          </span>
        </div>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColor}`}
        >
          {item.priority}
        </span>
        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
          {formatQuarter(item.quarter)}
        </span>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
          {item.category}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
          {item.mentions} mentions
        </span>
        <span
          className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground"
          title={`Effort ${EFFORT_META[item.effort].label}`}
        >
          Effort {item.effort}
        </span>
        <span className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground capitalize">
          {item.bucket}
        </span>
      </div>

      {item.rationale && (
        <p className="text-[13px] leading-6 text-foreground-muted">
          {item.rationale}
        </p>
      )}

      <div>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Notes
        </h3>
        <NoteEditor itemId={item.id} initial={item.note ?? ""} />
      </div>

      <div>
        <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Evidence ({item.quotes.length})
        </h3>
        {item.quotes.length > 0 ? (
          <QuoteList quotes={item.quotes} />
        ) : (
          <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-[13px] text-foreground-muted">
            No verbatim comments captured.
          </p>
        )}
      </div>
    </>
  );
}
