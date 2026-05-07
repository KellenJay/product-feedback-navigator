import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Bookmark,
  BookmarkCheck,
  FolderInput,
  Trash2,
  ExternalLink,
  Pencil,
  FolderPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ResultsView } from "./ResultsView";
import { libraryStore, useLibrary, formatRelativeDate, type LibraryEntry } from "./libraryStore";
import { analyzeStore } from "./analyzeStore";
import { roadmapStore } from "./roadmapStore";
import { prdStore } from "./prdStore";
import { marketContextStore } from "./marketContextStore";
import {
  pinEntry,
  unpinEntry,
  deleteEntry,
  renameEntry,
  moveEntryToFolder,
  createFolder as createFolderCloud,
} from "@/lib/cloudSync";

interface Props {
  entry: LibraryEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LibraryEntryDialog({ entry, open, onOpenChange }: Props) {
  const { folders, entries } = useLibrary();
  const navigate = useNavigate();
  const [renaming, setRenaming] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderInputRef = useRef<HTMLInputElement>(null);

  if (!entry) return null;
  // Always read fresh entry from store (in case it was updated)
  const live = entries.find((e) => e.id === entry.id) ?? entry;

  const folderName = live.folderId
    ? folders.find((f) => f.id === live.folderId)?.name ?? null
    : null;

  const handleOpenInAnalyze = () => {
    analyzeStore.set({
      productName: live.productName,
      businessGoal: live.businessGoal,
      mode: live.mode,
      result: live.result,
      entryId: live.id,
    });
    // Hydrate downstream stores so we don't re-run AI calls.
    roadmapStore.hydrate(live.roadmapOverrides ?? {});
    prdStore.hydrate(live.prd ?? null);
    marketContextStore.hydrate(live.marketContext ?? null, live.id);
    onOpenChange(false);
    navigate({ to: "/" });
    toast.success("Opened in Analyze");
  };

  const handleSave = async () => {
    if (live.saved) {
      libraryStore.unsave(live.id);
      void unpinEntry(live.id);
      toast("Removed from library", { description: "Moved back to Recent." });
    } else {
      libraryStore.save(live.id);
      const ok = await pinEntry(live.id);
      if (ok) toast.success("Saved to library");
      else toast.error("Save failed — please try again");
    }
  };

  const handleMove = (folderId: string | null) => {
    libraryStore.moveToFolder(live.id, folderId);
    void moveEntryToFolder(live.id, folderId);
    toast.success(folderId ? "Moved to folder" : "Moved to Unfiled Items");
  };

  const handleCreateAndMove = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setCreatingFolder(false);
      setNewFolderName("");
      return;
    }
    const cloud = await createFolderCloud(name);
    if (cloud) {
      // Replace the local placeholder via hydrate-style merge.
      libraryStore.hydrate({
        entries: libraryStore.get().entries,
        folders: [cloud, ...libraryStore.get().folders],
      });
      libraryStore.moveToFolder(live.id, cloud.id);
      void moveEntryToFolder(live.id, cloud.id);
      toast.success(`Moved to "${cloud.name}"`);
    } else {
      const folder = libraryStore.createFolder(name);
      libraryStore.moveToFolder(live.id, folder.id);
      toast.success(`Moved to "${folder.name}"`);
    }
    setCreatingFolder(false);
    setNewFolderName("");
  };

  const handleDelete = () => {
    libraryStore.remove(live.id);
    void deleteEntry(live.id);
    onOpenChange(false);
    toast("Deleted");
  };

  const startRename = () => {
    setTitleDraft(live.title);
    setRenaming(true);
  };
  const commitRename = () => {
    libraryStore.rename(live.id, titleDraft);
    void renameEntry(live.id, titleDraft.trim() || live.title);
    setRenaming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden p-0">
        <DialogHeader className="border-b border-border bg-card px-6 py-4 pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {renaming ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") setRenaming(false);
                    }}
                    onBlur={commitRename}
                    className="w-full rounded-md border border-border bg-background px-2 py-1 text-base font-medium text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <DialogTitle className="truncate text-base font-semibold text-foreground">
                    {live.title}
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={startRename}
                    className="rounded p-1 text-foreground-muted hover:text-foreground"
                    aria-label="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-[11px] text-foreground-muted">
                {live.source} · {formatRelativeDate(live.createdAt)}
                {folderName ? ` · in ${folderName}` : live.saved ? " · Unfiled Items" : " · Recent Search (unsaved)"}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSave}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                live.saved
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
                  : "border-border bg-background text-foreground hover:bg-surface"
              }`}
            >
              {live.saved ? (
                <>
                  <BookmarkCheck className="h-3.5 w-3.5" />
                  Saved
                </>
              ) : (
                <>
                  <Bookmark className="h-3.5 w-3.5" />
                  Save to library
                </>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
                >
                  <FolderInput className="h-3.5 w-3.5" />
                  {folderName ? `Folder: ${folderName}` : "Move to folder"}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem onClick={() => handleMove(null)}>
                  Unfiled Items
                </DropdownMenuItem>
                {folders.length > 0 && <DropdownMenuSeparator />}
                {folders.map((f) => (
                  <DropdownMenuItem key={f.id} onClick={() => handleMove(f.id)}>
                    {f.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {creatingFolder ? (
                  <div
                    className="px-2 py-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={newFolderInputRef}
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleCreateAndMove();
                        }
                        if (e.key === "Escape") {
                          setCreatingFolder(false);
                          setNewFolderName("");
                        }
                      }}
                      placeholder="Folder name"
                      className="w-full rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                ) : (
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      setCreatingFolder(true);
                    }}
                    className="text-foreground-muted"
                  >
                    <FolderPlus className="mr-2 h-3.5 w-3.5" />
                    New folder…
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={handleOpenInAnalyze}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open in Analyze
            </button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes "{live.title}" from your library.
                    This can't be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(88vh-160px)] overflow-y-auto px-6 pb-6">
          <ResultsView result={live.result} productName={live.productName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
