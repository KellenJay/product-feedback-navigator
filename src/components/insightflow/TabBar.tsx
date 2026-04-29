import { toast } from "sonner";

type Tab = "analyze" | "roadmap" | "library";

export function TabBar({ active }: { active: Tab }) {
  const handleStub = (label: string) => {
    toast(`${label} coming soon`, {
      description: "Build next session.",
    });
  };

  const baseTab =
    "relative px-1 pb-3 pt-1 text-sm transition-colors focus:outline-none";
  const inactive =
    "text-foreground-muted hover:text-foreground cursor-pointer";
  const activeCls = "text-foreground font-medium";

  return (
    <nav className="border-b border-border">
      <div className="mx-auto flex max-w-[780px] items-center gap-7 px-6">
        <button
          type="button"
          className={`${baseTab} ${active === "analyze" ? activeCls : inactive}`}
        >
          Analyze
          {active === "analyze" && (
            <span className="absolute inset-x-0 -bottom-px h-[2px] bg-foreground" />
          )}
        </button>
        <button
          type="button"
          onClick={() => handleStub("Roadmap")}
          className={`${baseTab} ${inactive} opacity-60`}
        >
          Roadmap
        </button>
        <button
          type="button"
          onClick={() => handleStub("Library")}
          className={`${baseTab} ${inactive} opacity-60`}
        >
          Library
        </button>
      </div>
    </nav>
  );
}
