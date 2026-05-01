import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  EFFORT_META,
  formatQuarter,
  addQuarters,
  currentQuarter,
  type Bucket,
  type Effort,
  type Quarter,
  type RoadmapItem,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";
import { MentionsDialog } from "./MentionsDialog";

interface Props {
  item: RoadmapItem;
  rank: number;
  onMove: (b: Bucket) => void;
  onEffort: (e: Effort) => void;
  onQuarter: (q: Quarter) => void;
}

export function RoadmapItemCard({ item, rank, onMove, onEffort, onQuarter }: Props) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [mentionsOpen, setMentionsOpen] = useState(false);
  const impactColor =
    item.impactScore >= 70
      ? "bg-success/15 text-success"
      : item.impactScore >= 40
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";

  const priorityColor =
    item.priority === "P1"
      ? "bg-destructive/15 text-destructive"
      : item.priority === "P2"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";

  return (
    <>
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
          {rank}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => setDetailOpen(true)}
              className="text-left text-[15px] font-medium leading-snug text-foreground hover:text-primary hover:underline"
            >
              {item.title}
            </button>
            <span
              className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${impactColor}`}
            >
              Impact {item.impactScore}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
            <button
              type="button"
              onClick={() => setMentionsOpen(true)}
              className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground-muted hover:bg-muted/80 hover:text-foreground"
            >
              {item.mentions} mentions
            </button>
            <span
              className="rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-foreground"
              title={EFFORT_META[item.effort].days}
            >
              Effort {item.effort}
            </span>
          </div>

          {item.rationale && (
            <p className="mt-2 text-[13px] leading-6 text-foreground-muted">
              {item.rationale}
            </p>
          )}

          {item.quotes.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
            >
              {open ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              {open ? "Hide evidence" : `Show evidence (${item.quotes.length})`}
            </button>
          )}

          {open && item.quotes.length > 0 && (
            <div className="mt-2 space-y-2 rounded-md border border-border bg-surface p-3">
              {item.quotes.slice(0, 3).map((raw, qi) => {
                const q = typeof raw === "string" ? { text: raw } : raw;
                return (
                  <p
                    key={qi}
                    className="text-[12px] italic leading-5 text-foreground"
                  >
                    “{q.text}”
                    {"source" in q && q.source && (
                      <span className="ml-2 not-italic text-foreground-muted">
                        — {q.source}
                      </span>
                    )}
                  </p>
                );
              })}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <SelectControl
              label="Move to"
              value={item.bucket}
              onChange={(v) => onMove(v as Bucket)}
              options={[
                { value: "now", label: "Now" },
                { value: "next", label: "Next" },
                { value: "later", label: "Later" },
              ]}
            />
            <SelectControl
              label="Effort"
              value={item.effort}
              onChange={(v) => onEffort(v as Effort)}
              options={[
                { value: "S", label: "S" },
                { value: "M", label: "M" },
                { value: "L", label: "L" },
              ]}
            />
            <QuarterSelect value={item.quarter} onChange={onQuarter} />
          </div>
        </div>
      </div>
    </article>
      <RoadmapItemDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={item}
      />
      <MentionsDialog
        open={mentionsOpen}
        onOpenChange={setMentionsOpen}
        title={item.title}
        mentions={item.mentions}
        quotes={item.quotes}
      />
    </>
  );
}

function SelectControl({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="cursor-pointer bg-transparent text-[12px] font-medium text-foreground focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card">
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuarterSelect({
  value,
  onChange,
}: {
  value: Quarter;
  onChange: (q: Quarter) => void;
}) {
  const base = currentQuarter();
  const choices: Quarter[] = Array.from({ length: 8 }, (_, i) =>
    addQuarters(base, i),
  );
  // Make sure value is included even if it's older/farther.
  const includes = choices.some((c) => c.q === value.q && c.year === value.year);
  const all = includes ? choices : [value, ...choices];
  const key = (q: Quarter) => `${q.year}-${q.q}`;
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
      Quarter
      <select
        value={key(value)}
        onChange={(e) => {
          const [y, q] = e.target.value.split("-").map(Number);
          onChange({ q: q as 1 | 2 | 3 | 4, year: y });
        }}
        className="cursor-pointer bg-transparent text-[12px] font-medium text-foreground focus:outline-none"
      >
        {all.map((c) => (
          <option key={key(c)} value={key(c)} className="bg-card">
            {formatQuarter(c)}
          </option>
        ))}
      </select>
    </label>
  );
}
