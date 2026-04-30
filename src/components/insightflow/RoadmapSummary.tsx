import type { RoadmapItem } from "./roadmap";

interface Props {
  items: RoadmapItem[];
}

export function RoadmapSummary({ items }: Props) {
  const counts = {
    P1: items.filter((i) => i.priority === "P1").length,
    P2: items.filter((i) => i.priority === "P2").length,
    P3: items.filter((i) => i.priority === "P3").length,
  };
  const effort = {
    S: items.filter((i) => i.effort === "S").length,
    M: items.filter((i) => i.effort === "M").length,
    L: items.filter((i) => i.effort === "L").length,
  };

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="Total items" value={String(items.length)} />
      <Stat
        label="Priority mix"
        value={`${counts.P1} · ${counts.P2} · ${counts.P3}`}
        hint="P1 · P2 · P3"
      />
      <Stat
        label="Effort mix"
        value={`${effort.S} · ${effort.M} · ${effort.L}`}
        hint="S · M · L"
      />
      <Stat
        label="Now bucket"
        value={String(items.filter((i) => i.bucket === "now").length)}
        hint="this sprint"
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[12px] text-foreground-muted">{label}</p>
      <p className="mt-1 text-[20px] font-medium leading-tight text-foreground">
        {value}
      </p>
      {hint && (
        <p className="mt-0.5 text-[11px] text-foreground-muted">{hint}</p>
      )}
    </div>
  );
}
