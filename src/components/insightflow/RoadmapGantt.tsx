import {
  addQuarters,
  currentQuarter,
  formatQuarter,
  quarterIndex,
  quartersEqual,
  type RoadmapItem,
} from "./roadmap";

interface Props {
  items: RoadmapItem[];
}

const SPAN = 6; // quarters shown

export function RoadmapGantt({ items }: Props) {
  const start = currentQuarter();
  const cols = Array.from({ length: SPAN }, (_, i) => addQuarters(start, i));
  const startIdx = quarterIndex(start);

  // Items inside the visible window only.
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
            gridTemplateColumns: `200px repeat(${SPAN}, minmax(0, 1fr))`,
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
                className={`text-center text-[11px] font-medium ${
                  isToday ? "text-primary" : "text-foreground-muted"
                }`}
              >
                {formatQuarter(q)}
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
                  gridTemplateColumns: `200px repeat(${SPAN}, minmax(0, 1fr))`,
                }}
              >
                <div className="truncate pr-2 text-[12px] font-medium text-foreground" title={it.title}>
                  {it.title}
                </div>
                {cols.map((_, i) => (
                  <div key={i} className="h-7 px-0.5">
                    {i === colIdx && <Bar item={it} />}
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
    </div>
  );
}

function Bar({ item }: { item: RoadmapItem }) {
  const bg =
    item.priority === "P1"
      ? "bg-destructive/80 text-destructive-foreground"
      : item.priority === "P2"
        ? "bg-warning/80 text-warning-foreground"
        : "bg-muted text-foreground";
  return (
    <div
      className={`flex h-full items-center gap-1 truncate rounded-md px-2 text-[10px] font-medium ${bg}`}
      title={`${item.title} · ${item.priority} · Effort ${item.effort} · ${item.mentions} mentions`}
    >
      <span className="truncate">{item.title}</span>
    </div>
  );
}
