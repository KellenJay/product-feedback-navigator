import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  EFFORT_META,
  formatQuarter,
  addQuarters,
  currentQuarter,
  priorityClasses,
  type Bucket,
  type Effort,
  type Quarter,
  type RoadmapItem,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";

type Priority = "P1" | "P2" | "P3";

interface Props {
  item: RoadmapItem;
  rank: number;
  onMove: (b: Bucket) => void;
  onPriority: (p: Priority) => void;
  onEffort: (e: Effort) => void;
  onQuarter: (q: Quarter) => void;
}

export function RoadmapItemCard({
  item,
  rank,
  onMove,
  onPriority,
  onEffort,
  onQuarter,
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
              <PillSelect
                value={item.priority}
                onChange={(v) => onPriority(v as Priority)}
                className={priorityClasses(item.priority)}
                ariaLabel="Change priority"
                options={[
                  { value: "P1", label: "P1" },
                  { value: "P2", label: "P2" },
                  { value: "P3", label: "P3" },
                ]}
                display={item.priority}
              />
              <PillSelect
                value={quarterKey(item.quarter)}
                onChange={(v) => {
                  const [y, q] = v.split("-").map(Number);
                  onQuarter({ q: q as 1 | 2 | 3 | 4, year: y });
                }}
                className="bg-primary/15 text-primary"
                ariaLabel="Change quarter"
                options={quarterChoices.map((c) => ({
                  value: quarterKey(c),
                  label: formatQuarter(c),
                }))}
                display={formatQuarter(item.quarter)}
              />
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
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
                title={EFFORT_META[item.effort].days}
                options={[
                  { value: "S", label: `S · ${EFFORT_META.S.days}` },
                  { value: "M", label: `M · ${EFFORT_META.M.days}` },
                  { value: "L", label: `L · ${EFFORT_META.L.days}` },
                ]}
                display={`Effort ${item.effort}`}
              />
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
