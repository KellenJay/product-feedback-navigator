import { useState } from "react";
import {
  addQuarters,
  currentQuarter,
  priorityClasses,
  quarterIndex,
  quartersEqual,
  type RoadmapItem,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";

interface Props {
  items: RoadmapItem[];
}

const SPAN = 4; // quarters shown

export function RoadmapGantt({ items }: Props) {
  const [active, setActive] = useState<RoadmapItem | null>(null);
  const start = currentQuarter();
  const cols = Array.from({ length: SPAN }, (_, i) => addQuarters(start, i));
  const startIdx = quarterIndex(start);

  const visible = items.filter((it) => {
    const idx = quarterIndex(it.quarter);
    return idx >= startIdx && idx < startIdx + SPAN;
  });
  const offscreen = items.length - visible.length;

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card p-4">
      <div className="min-w-[640px]">
        {/* Header row */}
        <div
          className="grid items-end gap-1 border-b border-border pb-2"
          style={{
            gridTemplateColumns: `220px repeat(${SPAN}, minmax(0, 1fr))`,
          }}
        >
          <div className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            Item
          </div>
          {cols.map((q, i) => {
            const isToday = i === 0;
            return (
              <div
                key={`${q.year}-${q.q}`}
                className={`text-center text-[11px] font-medium leading-tight ${
                  isToday ? "text-primary" : "text-foreground-muted"
                }`}
              >
                <div>Q{q.q}</div>
                <div className="text-[10px] text-foreground-muted">
                  {q.year}
                </div>
                {isToday && (
                  <div className="mx-auto mt-1 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="mt-2 space-y-1.5">
          {visible.length === 0 && (
            <p className="py-8 text-center text-[13px] text-foreground-muted">
              No items fall in the next {SPAN} quarters.
            </p>
          )}
          {visible.map((it) => {
            const colIdx = cols.findIndex((c) => quartersEqual(c, it.quarter));
            return (
              <div
                key={it.id}
                className="grid items-center gap-1 rounded-md py-1 hover:bg-surface/50"
                style={{
                  gridTemplateColumns: `220px repeat(${SPAN}, minmax(0, 1fr))`,
                }}
              >
                <div
                  className="line-clamp-2 pr-2 text-[12px] font-medium leading-tight text-foreground"
                  title={it.title}
                >
                  {it.title}
                </div>
                {cols.map((_, i) => (
                  <div key={i} className="h-12 px-0.5">
                    {i === colIdx && (
                      <Bar item={it} onClick={() => setActive(it)} />
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {offscreen > 0 && (
          <p className="mt-3 border-t border-border pt-2 text-[11px] text-foreground-muted">
            {offscreen} item{offscreen === 1 ? "" : "s"} scheduled outside this
            window. Use the Quarter selector in List view to bring them forward.
          </p>
        )}
      </div>

      <RoadmapItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        item={active}
      />
    </div>
  );
}

function Bar({ item, onClick }: { item: RoadmapItem; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-full w-full items-center rounded-md px-2 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 ${priorityClasses(item.priority)}`}
      title={`${item.title} · ${item.priority} · Effort ${item.effort} · ${item.mentions} mentions — click for details`}
    >
      <span className="line-clamp-2">{item.title}</span>
    </button>
  );
}
