import { useState } from "react";
import {
  BUCKET_META,
  formatQuarter,
  priorityClasses,
  type Bucket,
  type RoadmapItem,
} from "./roadmap";
import { RoadmapItemDialog } from "./RoadmapItemDialog";

interface Props {
  items: RoadmapItem[];
  onMoveBucket: (id: string, bucket: Bucket) => void;
  onReorder: (id: string, beforeId: string | null, bucket: Bucket) => void;
}

const BUCKETS: Bucket[] = ["now", "next", "later"];

export function RoadmapKanban({ items, onMoveBucket, onReorder }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<{ bucket: Bucket; beforeId: string | null } | null>(
    null,
  );
  const [detail, setDetail] = useState<RoadmapItem | null>(null);
  const [mentions, setMentions] = useState<RoadmapItem | null>(null);

  const grouped: Record<Bucket, RoadmapItem[]> = {
    now: items.filter((i) => i.bucket === "now"),
    next: items.filter((i) => i.bucket === "next"),
    later: items.filter((i) => i.bucket === "later"),
  };

  const handleDrop = (bucket: Bucket, beforeId: string | null) => {
    if (!draggingId) return;
    const item = items.find((i) => i.id === draggingId);
    if (!item) return;
    if (item.bucket !== bucket) {
      onMoveBucket(draggingId, bucket);
    }
    onReorder(draggingId, beforeId, bucket);
    setDraggingId(null);
    setDragOver(null);
  };

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-3">
      {BUCKETS.map((b) => {
        const meta = BUCKET_META[b];
        const list = grouped[b];
        return (
          <div
            key={b}
            className="flex flex-col rounded-xl border border-border bg-surface/50 p-3"
            onDragOver={(e) => {
              e.preventDefault();
              if (list.length === 0) {
                setDragOver({ bucket: b, beforeId: null });
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (list.length === 0) handleDrop(b, null);
            }}
          >
            <header className="mb-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <h3 className={`text-sm font-semibold ${meta.tone}`}>
                  {meta.label}
                </h3>
                <span className="text-[11px] text-foreground-muted">
                  {meta.subtitle}
                </span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
                {list.length}
              </span>
            </header>

            <div className="flex flex-1 flex-col gap-2">
              {list.length === 0 && (
                <div
                  className={`rounded-md border border-dashed px-3 py-6 text-center text-[12px] text-foreground-muted ${
                    dragOver?.bucket === b
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background/40"
                  }`}
                >
                  Drop here
                </div>
              )}
              {list.map((item) => {
                const showIndicator =
                  dragOver?.bucket === b && dragOver?.beforeId === item.id;
                return (
                  <div key={item.id}>
                    {showIndicator && (
                      <div className="mb-1 h-0.5 rounded-full bg-primary" />
                    )}
                    <KanbanCard
                      item={item}
                      isDragging={draggingId === item.id}
                      onOpenDetail={() => setDetail(item)}
                      onOpenMentions={() => setMentions(item)}
                      onDragStart={() => setDraggingId(item.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        const rect = (
                          e.currentTarget as HTMLDivElement
                        ).getBoundingClientRect();
                        const isUpper = e.clientY < rect.top + rect.height / 2;
                        const idx = list.findIndex((x) => x.id === item.id);
                        const beforeId = isUpper
                          ? item.id
                          : list[idx + 1]?.id ?? null;
                        setDragOver({ bucket: b, beforeId });
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        const rect = (
                          e.currentTarget as HTMLDivElement
                        ).getBoundingClientRect();
                        const isUpper = e.clientY < rect.top + rect.height / 2;
                        const idx = list.findIndex((x) => x.id === item.id);
                        const beforeId = isUpper
                          ? item.id
                          : list[idx + 1]?.id ?? null;
                        handleDrop(b, beforeId);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <RoadmapItemDialog
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        item={detail}
      />
      <MentionsDialog
        open={!!mentions}
        onOpenChange={(v) => !v && setMentions(null)}
        title={mentions?.title ?? ""}
        mentions={mentions?.mentions ?? 0}
        quotes={mentions?.quotes ?? []}
      />
    </div>
  );
}

function KanbanCard({
  item,
  isDragging,
  onOpenDetail,
  onOpenMentions,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: RoadmapItem;
  isDragging: boolean;
  onOpenDetail: () => void;
  onOpenMentions: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const priorityColor =
    item.priority === "P1"
      ? "bg-destructive/15 text-destructive"
      : item.priority === "P2"
        ? "bg-warning/15 text-warning"
        : "bg-muted text-foreground-muted";

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`cursor-grab rounded-lg border border-border bg-card p-3 active:cursor-grabbing ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenDetail();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        className="block w-full text-left text-[13px] font-medium leading-snug text-foreground hover:text-primary hover:underline"
      >
        {item.title}
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColor}`}
        >
          {item.priority}
        </span>
        <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
          {formatQuarter(item.quarter)}
        </span>
        <span className="rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium text-foreground">
          {item.effort}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenMentions();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground-muted hover:bg-muted/80 hover:text-foreground"
        >
          {item.mentions} mentions
        </button>
        <span className="text-[10px] text-foreground-muted">
          · Impact {item.impactScore}
        </span>
      </div>
    </article>
  );
}
