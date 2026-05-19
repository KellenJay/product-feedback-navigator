import { ChevronDown, Check, Circle, Loader2 } from "lucide-react";
import { STATUS_META, type Status } from "./roadmap";

interface Props {
  value: Status;
  onChange: (s: Status) => void;
  size?: "sm" | "xs";
}

export function StatusPill({ value, onChange, size = "sm" }: Props) {
  const meta = STATUS_META[value];
  const Icon =
    value === "completed" ? Check : value === "in_progress" ? Loader2 : Circle;
  const text = size === "xs" ? "text-[10px]" : "text-[11px]";
  return (
    <span
      className={`relative inline-flex cursor-pointer items-center rounded-full px-2 py-0.5 font-medium ${meta.tone} ${text}`}
      title="Change status"
    >
      <span className="pointer-events-none flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {meta.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </span>
      <select
        aria-label="Change status"
        value={value}
        onChange={(e) => onChange(e.target.value as Status)}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        <option value="planned" className="bg-card text-foreground">Planned</option>
        <option value="in_progress" className="bg-card text-foreground">In progress</option>
        <option value="completed" className="bg-card text-foreground">Completed</option>
      </select>
    </span>
  );
}
