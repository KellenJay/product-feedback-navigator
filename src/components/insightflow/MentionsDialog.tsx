import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { Quote } from "./types";
import { QuoteList } from "./QuoteList";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  mentions: number;
  quotes: Quote[];
}

export function MentionsDialog({
  open,
  onOpenChange,
  title,
  mentions,
  quotes,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
          <DialogDescription>
            {mentions} mention{mentions === 1 ? "" : "s"} · showing{" "}
            {quotes.length} verbatim comment{quotes.length === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>
        {quotes.length > 0 ? (
          <QuoteList quotes={quotes} />
        ) : (
          <p className="rounded-md border border-dashed border-border bg-surface p-6 text-center text-[13px] text-foreground-muted">
            No verbatim comments were captured for this theme.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
