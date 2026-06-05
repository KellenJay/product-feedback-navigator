import { MessageSquare, Lightbulb } from "lucide-react";
import type { Intent } from "./types";

interface Props {
  intent: Intent;
  setIntent: (i: Intent) => void;
}

const tabs: { id: Intent; label: string; icon: typeof MessageSquare; hint: string }[] = [
  {
    id: "feedback",
    label: "User feedback",
    icon: MessageSquare,
    hint: "Analyze real feedback for an existing product",
  },
  {
    id: "idea",
    label: "Idea validation",
    icon: Lightbulb,
    hint: "Validate a new idea against real-world pain points",
  },
];

export function IntentTabs({ intent, setIntent }: Props) {
  const active = tabs.find((t) => t.id === intent) ?? tabs[0];
  return (
    <div className="mb-4">
      <div
        role="tablist"
        aria-label="What do you want to do?"
        className="inline-flex w-full rounded-xl border border-border bg-surface p-1 sm:w-auto"
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = intent === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => setIntent(id)}
              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors sm:flex-none ${
                isActive
                  ? "bg-foreground text-background"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-foreground-muted">{active.hint}</p>
    </div>
  );
}
