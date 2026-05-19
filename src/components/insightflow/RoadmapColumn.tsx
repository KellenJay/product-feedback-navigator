import { BUCKET_META, type Bucket, type Effort, type Quarter, type RoadmapItem, type Status, type Timeframe } from "./roadmap";
import { RoadmapItemCard } from "./RoadmapItemCard";

interface Props {
  bucket: Bucket;
  items: RoadmapItem[];
  timeframe: Timeframe;
  onMove: (id: string, b: Bucket) => void;
  onEffort: (id: string, e: Effort) => void;
  onQuarter: (id: string, q: Quarter) => void;
  onStatus: (id: string, s: Status) => void;
}

export function RoadmapColumn({ bucket, items, timeframe, onMove, onEffort, onQuarter, onStatus }: Props) {
  const meta = BUCKET_META[bucket];
  return (
    <section className="mt-6">
      <header className="flex items-baseline justify-between border-b border-border pb-2">
        <div className="flex items-baseline gap-2">
          <h2 className={`text-base font-semibold ${meta.tone}`}>
            {meta.label}
          </h2>
          <span className="text-[12px] text-foreground-muted">
            {meta.subtitle}
          </span>
        </div>
        <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </header>

      {items.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-border bg-surface px-4 py-6 text-center text-[13px] text-foreground-muted">
          Nothing here yet.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item, i) => (
            <RoadmapItemCard
              key={item.id}
              item={item}
              rank={i + 1}
              timeframe={timeframe}
              onMove={(b) => onMove(item.id, b)}
              onEffort={(e) => onEffort(item.id, e)}
              onQuarter={(q) => onQuarter(item.id, q)}
              onStatus={(s) => onStatus(item.id, s)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
