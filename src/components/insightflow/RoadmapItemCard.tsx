import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  formatQuarter,
  formatTimeframeLabel,
  addQuarters,
  currentQuarter,
  priorityClasses,
  type Bucket,
  type Effort,
  type Quarter,
  type RoadmapItem,
  type Status,
  type Timeframe,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";
import { StatusPill } from "./StatusPill";

interface Props {
  item: RoadmapItem;
  rank: number;
  timeframe: Timeframe;
  onMove: (b: Bucket) => void;
  onEffort: (e: Effort) => void;
  onQuarter: (q: Quarter) => void;
  onStatus: (s: Status) => void;
}

export function RoadmapItemCard({
  item,
  rank,
  timeframe,
  onMove,
  onEffort,
  onQuarter,
  onStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const impactColor =
    item.impactScore >= 70
      ? "bg-success/15 text-success"
      : item.impactScore >= 40
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";

  const quarterChoices = quarterOptions(item.quarter);

  const isCompleted = item.status === "completed";

  return (
    <>
      <article
        className={`rounded-xl border border-border bg-card p-4 ${
          isCompleted ? "opacity-70" : ""
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground">
            {rank}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={() => setDetailOpen(true)}
                className={`text-left text-[15px] font-medium leading-snug hover:text-primary hover:underline ${
                  isCompleted ? "text-foreground-muted line-through" : "text-foreground"
                }`}
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
              <StatusPill value={item.status} onChange={onStatus} />
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityClasses(item.priority)}`}
                title="Priority is set by the bucket (Now/Next/Later)"
              >
                {item.priority}
              </span>
              <PillSelect
                value={quarterKey(item.quarter)}
                onChange={(v) => {
                  const [y, q] = v.split("-").map(Number);
                  onQuarter({ q: q as 1 | 2 | 3 | 4, year: y });
                }}
                className="bg-primary/15 text-primary"
                ariaLabel="Change schedule"
                options={quarterChoices.map((c) => ({
                  value: quarterKey(c),
                  label: formatTimeframeLabel(c, timeframe),
                }))}
                display={formatTimeframeLabel(item.quarter, timeframe)}
              />
              <span className="rounded-full border border-border/60 bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-foreground">
                {item.category}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
                {item.mentions} mentions
              </span>
              <PillSelect
                value={item.effort}
                onChange={(v) => onEffort(v as Effort)}
                className="bg-surface text-foreground border border-border"
                ariaLabel="Change effort"
                title="Effort: L=Low, M=Medium, H=High"
                options={[
                  { value: "L", label: "Effort L (Low)" },
                  { value: "M", label: "Effort M (Medium)" },
                  { value: "H", label: "Effort H (High)" },
                ]}
                display={`Effort ${item.effort}`}
              />
              {isCompleted && item.completedAt && (
                <span className="text-[11px] text-foreground-muted">
                  · Completed {new Date(item.completedAt).toLocaleDateString()}
                </span>
              )}
            </div>

            {item.rationale && (
              <p className="mt-2 text-[13px] leading-6 text-foreground-muted">
                {item.rationale}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              {item.quotes.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOpen((o) => !o)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
                >
                  {open ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                  {open
                    ? "Hide evidence"
                    : `Show evidence (${item.quotes.length})`}
                </button>
              ) : (
                <span />
              )}

              <MoveSelect value={item.bucket} onChange={onMove} />
            </div>

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
          </div>
        </div>
      </article>
      <RoadmapItemDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        item={item}
      />
    </>
  );
}

function quarterKey(q: Quarter): string {
  return `${q.year}-${q.q}`;
}

function quarterOptions(current: Quarter): Quarter[] {
  const base = currentQuarter();
  const choices = Array.from({ length: 8 }, (_, i) => addQuarters(base, i));
  const includes = choices.some(
    (c) => c.q === current.q && c.year === current.year,
  );
  return includes ? choices : [current, ...choices];
}

/**
 * A pill-shaped span that has an invisible <select> overlaid for native
 * dropdown UX. The visible label updates from `display`.
 */
function PillSelect({
  value,
  onChange,
  options,
  className,
  display,
  ariaLabel,
  title,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className: string;
  display: string;
  ariaLabel: string;
  title?: string;
}) {
  return (
    <span
      className={`relative inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
      title={title}
    >
      <span className="pointer-events-none flex items-center gap-0.5">
        {display}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card text-foreground">
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

function MoveSelect({
  value,
  onChange,
}: {
  value: Bucket;
  onChange: (b: Bucket) => void;
}) {
  return (
    <label className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
      Move to
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Bucket)}
        className="cursor-pointer bg-transparent text-[12px] font-medium text-foreground focus:outline-none"
      >
        <option value="now" className="bg-card">
          Now
        </option>
        <option value="next" className="bg-card">
          Next
        </option>
        <option value="later" className="bg-card">
          Later
        </option>
      </select>
    </label>
  );
}
