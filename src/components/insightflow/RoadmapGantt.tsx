import { useState } from "react";
import {
  addQuarters,
  currentQuarter,
  EFFORT_META,
  formatTimeframeRange,
  priorityClasses,
  quarterIndex,
  quartersEqual,
  type Quarter,
  type RoadmapItem,
  type Timeframe,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";

interface Props {
  items: RoadmapItem[];
  timeframe: Timeframe;
  onQuarter: (id: string, q: Quarter) => void;
}

const SPAN = 4; // quarters shown
const DRAG_MIME = "application/x-roadmap-item";

export function RoadmapGantt({ items, timeframe, onQuarter }: Props) {
  const [active, setActive] = useState<RoadmapItem | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<string | null>(null);

  // Hide completed items from the schedule view.
  const scheduleItems = items.filter((it) => it.status !== "completed");

  const start = currentQuarter();
  const cols = Array.from({ length: SPAN }, (_, i) => addQuarters(start, i));
  const startIdx = quarterIndex(start);

  const visible = scheduleItems.filter((it) => {
    const idx = quarterIndex(it.quarter);
    return idx >= startIdx && idx < startIdx + SPAN;
  });
  const offscreen = scheduleItems.length - visible.length;

  const cellKey = (itemId: string, qIdx: number) => `${itemId}:${qIdx}`;

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-border bg-card p-4">
      <div className="min-w-[560px] sm:min-w-[640px]">
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
                <div>{formatTimeframeRange(q, timeframe)}</div>
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
            const isDragging = draggingId === it.id;
            return (
              <div
                key={it.id}
                className={`grid items-center gap-1 rounded-md py-1 transition-opacity hover:bg-surface/50 ${
                  isDragging ? "opacity-40" : ""
                }`}
                style={{
                  gridTemplateColumns: `220px repeat(${SPAN}, minmax(0, 1fr))`,
                }}
              >
                <div
                  className="line-clamp-2 pr-2 text-[12px] font-medium leading-tight text-foreground"
                  title={it.note ? `${it.title}\n\nNote: ${it.note}` : it.title}
                >
                  {it.note && <span aria-hidden className="mr-1">📝</span>}
                  {it.title}
                </div>
                {cols.map((q, i) => {
                  const key = cellKey(it.id, i);
                  const isHover = hoverCell === key;
                  return (
                    <div
                      key={i}
                      className={`h-12 rounded-md px-0.5 transition-colors ${
                        isHover ? "bg-primary/10 ring-1 ring-primary/40" : ""
                      }`}
                      onDragOver={(e) => {
                        if (!draggingId) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        setHoverCell(key);
                      }}
                      onDragLeave={() => {
                        if (hoverCell === key) setHoverCell(null);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const id =
                          e.dataTransfer.getData(DRAG_MIME) || draggingId;
                        setHoverCell(null);
                        setDraggingId(null);
                        if (id && !quartersEqual(q, it.quarter && i === colIdx ? it.quarter : q)) {
                          onQuarter(id, q);
                        } else if (id) {
                          onQuarter(id, q);
                        }
                      }}
                    >
                      {i === colIdx && (
                        <Bar
                          item={it}
                          onClick={() => setActive(it)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData(DRAG_MIME, it.id);
                            e.dataTransfer.effectAllowed = "move";
                            setDraggingId(it.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setHoverCell(null);
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {offscreen > 0 && (
          <p className="mt-3 border-t border-border pt-2 text-[11px] text-foreground-muted">
            {offscreen} item{offscreen === 1 ? "" : "s"} scheduled outside this
            window. Drag a bar to a different quarter, or use the Quarter
            selector in List view.
          </p>
        )}

        <p className="mt-2 text-[11px] text-foreground-muted">
          Tip: drag any bar to a different quarter — color and priority update
          automatically.
        </p>
      </div>

      <RoadmapItemDialog
        open={!!active}
        onOpenChange={(v) => !v && setActive(null)}
        item={active}
      />
    </div>
  );
}

function Bar({
  item,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  item: RoadmapItem;
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={`flex h-full w-full cursor-grab items-center rounded-md px-2 text-left text-[10px] font-medium leading-tight transition-opacity hover:opacity-80 active:cursor-grabbing ${priorityClasses(item.priority)}`}
      title={`${item.title} · ${item.priority} · Effort ${item.effort} (${EFFORT_META[item.effort].label}) · ${item.mentions} mentions — drag to reschedule, click for details`}
    >
      <span className="line-clamp-2 pointer-events-none">{item.title}</span>
    </button>
  );
}
