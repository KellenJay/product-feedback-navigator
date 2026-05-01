import { ExternalLink } from "lucide-react";
import type { Quote } from "./types";

interface Props {
  quotes: Quote[];
  limit?: number;
  className?: string;
}

function normalize(q: Quote) {
  if (typeof q === "string") return { text: q };
  return q;
}

export function QuoteList({ quotes, limit, className }: Props) {
  const list = limit ? quotes.slice(0, limit) : quotes;
  if (list.length === 0) return null;
  return (
    <div
      className={`space-y-2.5 rounded-md border border-border bg-surface p-3 ${className ?? ""}`}
    >
      {list.map((raw, i) => {
        const q = normalize(raw);
        const attrParts = [q.source, q.context, q.date].filter(Boolean) as string[];
        return (
          <div key={i} className="space-y-1">
            <p className="text-[12px] italic leading-5 text-foreground">
              “{q.text}”
            </p>
            {(attrParts.length > 0 || q.url) && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-foreground-muted">
                {attrParts.length > 0 && <span>— {attrParts.join(" · ")}</span>}
                {q.url && (
                  <a
                    href={q.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 font-medium text-accent hover:underline"
                  >
                    View source
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
