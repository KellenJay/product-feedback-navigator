import { List, Columns3, BarChart3 } from "lucide-react";

export type RoadmapView = "list" | "kanban" | "gantt";

interface Props {
  value: RoadmapView;
  onChange: (v: RoadmapView) => void;
}

const TABS: { value: RoadmapView; label: string; icon: typeof List }[] = [
  { value: "list", label: "List", icon: List },
  { value: "kanban", label: "Kanban", icon: Columns3 },
  { value: "gantt", label: "Gantt", icon: BarChart3 },
];

export function RoadmapViewTabs({ value, onChange }: Props) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
      {TABS.map(({ value: v, label, icon: Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-foreground-muted hover:text-foreground"
            }`}
            aria-pressed={active}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
