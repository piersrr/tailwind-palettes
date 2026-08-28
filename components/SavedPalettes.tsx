import { useEffect, useId, useState } from "react";
import {
  BookmarkIcon,
  CheckIcon,
  ChevronDownIcon,
  FolderOpenIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { cn } from "./ui/utils";
import type { SavedPalette } from "../utils/saved-palettes";

interface SavedPalettesProps {
  palettes: SavedPalette[];
  activeId: string | null;
  defaultName: string;
  isDirty: boolean;
  saveError: string | null;
  onSave: (name: string, mode: "update" | "new") => boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => boolean;
}

function MiniRamp({ hexes }: { hexes: string[] }) {
  if (hexes.length === 0) {
    return (
      <div className="h-7 w-[4.5rem] shrink-0 rounded-md bg-muted ring-1 ring-foreground/10" />
    );
  }
  return (
    <div className="flex h-7 w-[4.5rem] shrink-0 overflow-hidden rounded-md ring-1 ring-foreground/10">
      {hexes.map((hex, index) => (
        <span
          key={`${hex}-${index}`}
          className="min-w-0 flex-1"
          style={{ backgroundColor: hex }}
        />
      ))}
    </div>
  );
}

export function SavedPalettes({
  palettes,
  activeId,
  defaultName,
  isDirty,
  saveError,
  onSave,
  onLoad,
  onDelete,
  onRename,
}: SavedPalettesProps) {
  const nameFieldId = useId();
  const renameFieldId = useId();
  const [saveOpen, setSaveOpen] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [saveName, setSaveName] = useState(defaultName);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const active = palettes.find((palette) => palette.id === activeId) ?? null;
  const canUpdate = active !== null;
  const trimmedSaveName = saveName.trim();

  useEffect(() => {
    if (!saveOpen) return;
    setSaveName(active?.name || defaultName);
  }, [saveOpen, active?.name, defaultName]);

  useEffect(() => {
    if (!savedFlash) return;
    const timer = window.setTimeout(() => setSavedFlash(false), 2000);
    return () => window.clearTimeout(timer);
  }, [savedFlash]);

  const finishSave = (mode: "update" | "new") => {
    if (!trimmedSaveName) return;
    if (onSave(trimmedSaveName, mode)) {
      setSaveOpen(false);
      setSavedFlash(true);
    }
  };

  const commitRename = () => {
    if (!renamingId) return;
    if (renameValue.trim()) onRename(renamingId, renameValue);
    setRenamingId(null);
  };

  const pendingDelete = palettes.find((palette) => palette.id === deleteId);

  return (
    <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:items-end">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSaveOpen(true)}
        >
          {savedFlash ? (
            <CheckIcon className="h-3.5 w-3.5" />
          ) : (
            <BookmarkIcon className="h-3.5 w-3.5" />
          )}
          {savedFlash ? "Saved" : canUpdate && isDirty ? "Update" : "Save"}
        </Button>

        <DropdownMenu
          open={libraryOpen}
          onOpenChange={(open) => {
            setLibraryOpen(open);
            if (!open) setRenamingId(null);
          }}
          modal={false}
        >
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="data-[state=open]:[&_svg:last-child]:rotate-180"
            >
              <FolderOpenIcon className="h-3.5 w-3.5" />
              Library
              {palettes.length > 0 ? (
                <span className="rounded-full bg-muted px-1.5 py-px text-[10px] font-medium tabular-nums text-muted-foreground">
                  {palettes.length}
                </span>
              ) : null}
              <ChevronDownIcon className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-150" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[min(22rem,calc(100vw-2rem))] origin-top-right rounded-xl p-1 data-[state=open]:animate-[dropdown-in_160ms_ease-out]"
            onCloseAutoFocus={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              if (renamingId) {
                event.preventDefault();
                setRenamingId(null);
              }
            }}
          >
            <DropdownMenuLabel className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Saved palettes
            </DropdownMenuLabel>
            {palettes.length === 0 ? (
              <p className="px-2.5 pb-3 pt-1 text-sm text-muted-foreground">
                Nothing saved yet. Save the current scale to keep it on this
                device.
              </p>
            ) : (
              <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
                {palettes.map((palette) => {
                  const isActive = palette.id === activeId;
                  const isRenaming = renamingId === palette.id;
                  return (
                    <div
                      key={palette.id}
                      className={cn(
                        "flex items-center gap-1 rounded-lg",
                        isActive ? "bg-accent" : "hover:bg-accent/60",
                      )}
                    >
                      {isRenaming ? (
                        <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2">
                          <MiniRamp hexes={palette.previewHex} />
                          <Input
                            id={`${renameFieldId}-${palette.id}`}
                            value={renameValue}
                            onChange={(event) =>
                              setRenameValue(event.target.value)
                            }
                            onKeyDown={(event) => {
                              event.stopPropagation();
                              if (event.key === "Enter") {
                                event.preventDefault();
                                commitRename();
                              }
                              if (event.key === "Escape") {
                                event.preventDefault();
                                setRenamingId(null);
                              }
                            }}
                            onBlur={commitRename}
                            autoFocus
                            className="h-8"
                            aria-label="Rename palette"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-2 py-2 text-left"
                          onClick={() => {
                            onLoad(palette.id);
                            setLibraryOpen(false);
                          }}
                        >
                          <MiniRamp hexes={palette.previewHex} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                              {palette.name}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {isActive ? "Current · " : ""}
                              {palette.snapshot.colorName}
                              {palette.snapshot.useTwoColors
                                ? " · two colors"
                                : ""}
                            </span>
                          </span>
                        </button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        aria-label={`Rename ${palette.name}`}
                        onPointerDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setRenamingId(palette.id);
                          setRenameValue(palette.name);
                        }}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Delete ${palette.name}`}
                        onClick={() => {
                          setRenamingId(null);
                          setLibraryOpen(false);
                          setDeleteId(palette.id);
                        }}
                      >
                        <Trash2Icon className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {active ? (
        <p className="max-w-[16rem] truncate text-xs text-muted-foreground">
          {active.name}
          {isDirty ? " · unsaved" : ""}
        </p>
      ) : null}

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {canUpdate ? "Update palette" : "Save palette"}
            </DialogTitle>
            <DialogDescription>
              Stored in this browser only. Clearing site data will remove it.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              finishSave(canUpdate ? "update" : "new");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={nameFieldId} className="font-normal">
                Name
              </Label>
              <Input
                id={nameFieldId}
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="Ocean"
                autoFocus
                autoComplete="off"
              />
            </div>
            {saveError ? (
              <p className="text-sm text-destructive">{saveError}</p>
            ) : null}
            <DialogFooter className="gap-2 sm:justify-between">
              {canUpdate ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => finishSave("new")}
                  disabled={!trimmedSaveName}
                >
                  Save as new
                </Button>
              ) : (
                <span />
              )}
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSaveOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={!trimmedSaveName}>
                  {canUpdate ? "Update" : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this palette?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.name}” will be removed from this browser. The editor will keep its current colors.`
                : "This palette will be removed from this browser."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
