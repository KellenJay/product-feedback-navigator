import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Toaster, toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  FolderPlus,
  Folder,
  Search,
  Pencil,
  Trash2,
  Library as LibraryIcon,
  FileText,
} from "lucide-react";
import { TabBar } from "@/components/insightflow/TabBar";
import {
  libraryStore,
  useLibrary,
  daysUntilExpiry,
  formatRelativeDate,
  type LibraryEntry,
} from "@/components/insightflow/libraryStore";
import { LibraryEntryDialog } from "@/components/insightflow/LibraryEntryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/library")({
  component: LibraryPage,
  head: () => ({
    meta: [
      { title: "Library — InsightFlow" },
      {
        name: "description",
        content:
          "Your saved analyses, organized in folders. Recent unsaved searches are kept for 7 days so nothing slips through the cracks.",
      },
      { property: "og:title", content: "Library — InsightFlow" },
      {
        property: "og:description",
        content:
          "Save, organize, and revisit your customer feedback analyses.",
      },
    ],
  }),
});

type FolderSel = "all" | "unfiled" | string;

function LibraryPage() {
  const { entries, folders } = useLibrary();
  const [folderSel, setFolderSel] = useState<FolderSel>("all");
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<LibraryEntry | null>(null);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDraft, setFolderDraft] = useState("");

  const saved = useMemo(() => entries.filter((e) => e.saved), [entries]);
  const recent = useMemo(
    () =>
      entries
        .filter((e) => !e.saved)
        .sort((a, b) => b.createdAt - a.createdAt),
    [entries],
  );

  const filteredSaved = useMemo(() => {
    let list = saved;
    if (folderSel === "unfiled") list = list.filter((e) => !e.folderId);
    else if (folderSel !== "all")
      list = list.filter((e) => e.folderId === folderSel);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          e.result.executiveSummary?.toLowerCase().includes(q),
      );
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }, [saved, folderSel, query]);

  const filteredRecent = useMemo(() => {
    if (!query.trim()) return recent;
    const q = query.toLowerCase();
    return recent.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.productName.toLowerCase().includes(q),
    );
  }, [recent, query]);

  const handleCreateFolder = () => {
    if (!folderDraft.trim()) {
      setCreatingFolder(false);
      return;
    }
    const f = libraryStore.createFolder(folderDraft);
    setFolderDraft("");
    setCreatingFolder(false);
    setFolderSel(f.id);
    toast.success(`Folder "${f.name}" created`);
  };

  const isEmpty = entries.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[780px] items-center justify-between px-6 py-4">
          <Link
            to="/"
            className="text-base font-semibold text-foreground hover:opacity-80"
          >
            InsightFlow
          </Link>
          <span className="text-xs text-foreground-muted">v1 · Library</span>
        </div>
      </header>

      <TabBar active="library" />

      <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-12">
        {/* Hero */}
        <section className="relative isolate text-center">
          <div className="hero-beam" aria-hidden />
          <div className="hero-grid absolute inset-0 -z-10" aria-hidden />

          <div className="relative inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground-muted backdrop-blur">
            <LibraryIcon className="h-3 w-3" />
            Your research library
          </div>

          <h1
            className="font-display relative mt-6 text-foreground"
            style={{ fontSize: "clamp(34px, 5vw, 52px)", lineHeight: 1.05 }}
          >
            Every insight,{" "}
            <span className="text-gradient-brand">on tap</span>
          </h1>
          <p className="relative mx-auto mt-4 max-w-[560px] text-[14px] leading-7 text-foreground-muted">
            Save the analyses worth keeping, organize them in folders, and
            revisit recent searches for up to 7 days — even if you forgot to
            save them.
          </p>
        </section>

        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="mt-10 grid gap-8 lg:grid-cols-[220px_1fr]">
            {/* Sidebar: folders */}
            <aside className="lg:sticky lg:top-6 lg:self-start">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                  Folders
                </h2>
                <button
                  type="button"
                  onClick={() => setCreatingFolder(true)}
                  className="rounded p-1 text-foreground-muted hover:bg-surface hover:text-foreground"
                  aria-label="New folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                </button>
              </div>

              <nav className="mt-2 space-y-0.5">
                <FolderItem
                  active={folderSel === "all"}
                  onClick={() => setFolderSel("all")}
                  icon={<LibraryIcon className="h-3.5 w-3.5" />}
                  label="All saved"
                  count={saved.length}
                />
                <FolderItem
                  active={folderSel === "unfiled"}
                  onClick={() => setFolderSel("unfiled")}
                  icon={<Folder className="h-3.5 w-3.5" />}
                  label="Unfiled"
                  count={saved.filter((e) => !e.folderId).length}
                />

                {folders.map((f) => {
                  const count = saved.filter((e) => e.folderId === f.id).length;
                  return (
                    <FolderRow
                      key={f.id}
                      folderId={f.id}
                      name={f.name}
                      count={count}
                      active={folderSel === f.id}
                      onSelect={() => setFolderSel(f.id)}
                      onDelete={() => {
                        libraryStore.deleteFolder(f.id);
                        if (folderSel === f.id) setFolderSel("all");
                        toast("Folder deleted", {
                          description: "Items moved to Unfiled.",
                        });
                      }}
                    />
                  );
                })}

                {creatingFolder && (
                  <div className="mt-1 px-2">
                    <input
                      autoFocus
                      value={folderDraft}
                      onChange={(e) => setFolderDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateFolder();
                        if (e.key === "Escape") {
                          setCreatingFolder(false);
                          setFolderDraft("");
                        }
                      }}
                      onBlur={handleCreateFolder}
                      placeholder="Folder name"
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </nav>
            </aside>

            {/* Main column */}
            <div>
              {/* Search */}
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-foreground-muted" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product, title, or summary…"
                  className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none"
                />
              </div>

              {/* Saved section */}
              <section className="mt-8">
                <header className="flex items-baseline justify-between border-b border-border pb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {folderSel === "all"
                        ? "Saved"
                        : folderSel === "unfiled"
                          ? "Unfiled"
                          : folders.find((f) => f.id === folderSel)?.name ??
                            "Saved"}
                    </h2>
                    <span className="text-[12px] text-foreground-muted">
                      {filteredSaved.length}{" "}
                      {filteredSaved.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                </header>

                {filteredSaved.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-[13px] text-foreground-muted">
                    {query
                      ? "No saved analyses match your search."
                      : "Nothing saved here yet. Run an analysis, then save it from Recent below."}
                  </p>
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {filteredSaved.map((e) => (
                      <EntryCard
                        key={e.id}
                        entry={e}
                        folderName={
                          e.folderId
                            ? folders.find((f) => f.id === e.folderId)?.name
                            : null
                        }
                        onOpen={() => setDetail(e)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Recent section */}
              <section className="mt-10">
                <header className="flex items-baseline justify-between border-b border-border pb-2">
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-base font-semibold text-foreground">
                      Recent (unsaved)
                    </h2>
                    <span className="text-[12px] text-foreground-muted">
                      Removed after 7 days
                    </span>
                  </div>
                  <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
                    {filteredRecent.length}{" "}
                    {filteredRecent.length === 1 ? "item" : "items"}
                  </span>
                </header>

                {filteredRecent.length === 0 ? (
                  <p className="mt-3 rounded-lg border border-dashed border-border bg-surface px-4 py-8 text-center text-[13px] text-foreground-muted">
                    {query
                      ? "No recent searches match your search."
                      : "No recent unsaved searches. Anything you analyze will appear here for 7 days."}
                  </p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {filteredRecent.map((e) => (
                      <RecentRow
                        key={e.id}
                        entry={e}
                        onOpen={() => setDetail(e)}
                        onSave={() => {
                          libraryStore.save(e.id);
                          toast.success("Saved to library");
                        }}
                      />
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </div>
        )}
      </main>

      <LibraryEntryDialog
        entry={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
      />
    </div>
  );
}

function EmptyState() {
  return (
    <section className="mx-auto mt-10 max-w-[680px] rounded-2xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <p className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
        Nothing here yet
      </p>
      <h2
        className="font-display mx-auto mt-3 max-w-[460px] text-foreground"
        style={{ fontSize: "clamp(24px, 3.5vw, 32px)", lineHeight: 1.15 }}
      >
        Your library starts with your next analysis.
      </h2>
      <p className="mx-auto mt-4 max-w-[460px] text-[14px] leading-7 text-foreground-muted">
        Anything you run on Analyze lands here automatically. Save the keepers
        into folders. Forgotten searches stay in Recent for 7 days.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
      >
        Run your first analysis
      </Link>
    </section>
  );
}

function FolderItem({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-foreground hover:bg-surface"
      }`}
    >
      <span className="flex items-center gap-2 truncate">
        {icon}
        <span className="truncate">{label}</span>
      </span>
      <span className="text-[10px] text-foreground-muted">{count}</span>
    </button>
  );
}

function FolderRow({
  folderId,
  name,
  count,
  active,
  onSelect,
  onDelete,
}: {
  folderId: string;
  name: string;
  count: number;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(name);

  if (renaming) {
    return (
      <div className="px-2">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              libraryStore.renameFolder(folderId, draft);
              setRenaming(false);
            }
            if (e.key === "Escape") {
              setDraft(name);
              setRenaming(false);
            }
          }}
          onBlur={() => {
            libraryStore.renameFolder(folderId, draft);
            setRenaming(false);
          }}
          className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center justify-between gap-1 rounded-md pr-1 transition-colors ${
        active ? "bg-primary/10" : "hover:bg-surface"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className={`flex flex-1 items-center gap-2 truncate px-2 py-1.5 text-left text-[13px] ${
          active ? "text-primary" : "text-foreground"
        }`}
      >
        <Folder className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{name}</span>
      </button>
      <span className="text-[10px] text-foreground-muted">{count}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setRenaming(true);
        }}
        className="hidden rounded p-1 text-foreground-muted hover:text-foreground group-hover:inline-flex"
        aria-label="Rename folder"
      >
        <Pencil className="h-3 w-3" />
      </button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="hidden rounded p-1 text-foreground-muted hover:text-destructive group-hover:inline-flex"
            aria-label="Delete folder"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder "{name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The folder will be removed. Any analyses inside it will be moved
              to Unfiled — they will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete folder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EntryCard({
  entry,
  folderName,
  onOpen,
}: {
  entry: LibraryEntry;
  folderName: string | null | undefined;
  onOpen: () => void;
}) {
  const r = entry.result;
  const topIssue = r.issues?.[0];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-[14px] font-medium leading-snug text-foreground group-hover:text-primary">
          {entry.title}
        </h3>
        <BookmarkCheck className="h-4 w-4 shrink-0 text-primary" />
      </div>
      <p className="mt-1 text-[11px] text-foreground-muted">
        {entry.source} · {formatRelativeDate(entry.createdAt)}
        {folderName ? ` · ${folderName}` : ""}
      </p>
      {r.executiveSummary && (
        <p className="mt-3 line-clamp-3 text-[12px] leading-5 text-foreground-muted">
          {r.executiveSummary}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground-muted">
          {r.issues?.length ?? 0} issues
        </span>
        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-medium text-destructive">
          {r.criticalIssuesCount} critical
        </span>
        {topIssue && (
          <span className="truncate rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            {topIssue.category}
          </span>
        )}
      </div>
    </button>
  );
}

function RecentRow({
  entry,
  onOpen,
  onSave,
}: {
  entry: LibraryEntry;
  onOpen: () => void;
  onSave: () => void;
}) {
  const days = daysUntilExpiry(entry.createdAt);
  return (
    <li className="group flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:border-primary/40">
      <FileText className="h-4 w-4 shrink-0 text-foreground-muted" />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 text-left"
      >
        <p className="truncate text-[13px] font-medium text-foreground group-hover:text-primary">
          {entry.title}
        </p>
        <p className="truncate text-[11px] text-foreground-muted">
          {entry.source} · {formatRelativeDate(entry.createdAt)} ·{" "}
          {entry.result.issues?.length ?? 0} issues
        </p>
      </button>
      <span className="hidden items-center gap-1 text-[10px] text-foreground-muted sm:inline-flex">
        <Clock className="h-3 w-3" />
        Expires in {days}d
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onSave();
        }}
        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-surface"
      >
        <Bookmark className="h-3 w-3" />
        Save
      </button>
    </li>
  );
}
