"use client";

import { BookOpen, Check, Trash2 } from "lucide-react";
import type React from "react";
import { cn } from "../../lib/utils";
import { FOLDER_COLORS, NOTEBOOK_COLORS } from "../../types";
import { getFolderIcon, PICKER_ICONS } from "./icons";

type DialogMode = "notebook" | "folder" | "rename-notebook" | "delete-confirm";
type ItemTarget =
  | { id: string; type: "notebook" }
  | { id: string; type: "folder" };

export function LibraryDeleteDialog({
  darkMode,
  target,
  onClose,
  onConfirm,
}: {
  darkMode: boolean;
  target: ItemTarget | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  if (!target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pb-6 sm:pb-0">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "dialog-enter relative w-full max-w-[360px] rounded-[24px] p-6 text-center shadow-2xl",
          darkMode
            ? "bg-[#1c1a14] text-[#f4efe7]"
            : "bg-[#FDFAF5] text-[#1f1f1f]",
        )}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <Trash2 size={28} strokeWidth={2} />
        </div>
        <h3 className="mb-2 text-xl font-semibold tracking-tight">
          Delete {target.type === "folder" ? "Folder" : "Notebook"}
        </h3>
        <p
          className={cn(
            "mb-6 text-sm",
            darkMode ? "text-white/60" : "text-black/60",
          )}
        >
          Are you sure you want to delete this {target.type}? This action cannot
          be undone.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "h-11 flex-1 rounded-xl text-[15px] font-medium transition-colors",
              darkMode
                ? "bg-white/8 text-[#f4efe7]/75 hover:bg-white/12"
                : "bg-black/6 text-knote-text/70 hover:bg-black/9",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 flex-1 rounded-xl bg-red-500 text-[15px] font-semibold text-white shadow-sm transition-all hover:bg-red-600 active:scale-95"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function LibraryEditDialog({
  darkMode,
  dialogMode,
  draftColor,
  draftIcon,
  draftName,
  editingFolderId,
  iconSearch,
  inputRef,
  onClose,
  onDraftColor,
  onDraftIcon,
  onDraftName,
  onIconSearch,
  onSubmit,
}: {
  darkMode: boolean;
  dialogMode: Exclude<DialogMode, "delete-confirm"> | null;
  draftColor: string;
  draftIcon: string;
  draftName: string;
  editingFolderId: string | null;
  iconSearch: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onDraftColor: (color: string) => void;
  onDraftIcon: (icon: string) => void;
  onDraftName: (name: string) => void;
  onIconSearch: (value: string) => void;
  onSubmit: () => void | Promise<void>;
}) {
  if (!dialogMode) return null;

  const title =
    dialogMode === "folder"
      ? editingFolderId
        ? "Edit Folder"
        : "New Folder"
      : dialogMode === "rename-notebook"
        ? "Rename Notebook"
        : "New Notebook";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-3 pb-4 sm:items-center sm:p-5">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-dialog-title"
        className={cn(
          "dialog-enter relative flex max-h-[min(760px,calc(100dvh-32px))] w-full max-w-[760px] overflow-hidden rounded-[26px]",
          darkMode
            ? "bg-[#1c1a14] text-[#f4efe7]"
            : "bg-[#FDFAF5] text-[#1f1f1f]",
        )}
      >
        <div className="grid min-h-0 w-full grid-cols-1 overflow-y-auto min-[680px]:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]">
          <div
            className="relative flex min-h-[190px] items-center justify-center overflow-hidden p-6 min-[680px]:min-h-[420px] min-[680px]:p-8"
            style={{
              background:
                dialogMode === "folder"
                  ? `linear-gradient(160deg, ${draftColor}d9 0%, ${draftColor} 100%)`
                  : `linear-gradient(160deg, ${draftColor}c9 0%, ${draftColor} 100%)`,
            }}
          >
            <span className="absolute inset-x-8 top-8 h-px bg-white/18" />
            <span className="absolute bottom-8 left-8 h-px w-20 bg-white/16" />
            {dialogMode === "folder" ? (
              <FolderPreview
                color={draftColor}
                icon={draftIcon}
                name={draftName}
              />
            ) : (
              <NotebookPreview color={draftColor} name={draftName} />
            )}
          </div>

          <div className="flex min-h-0 flex-col p-5 sm:p-6">
            <div className="mb-5">
              <p
                id="library-dialog-title"
                className={cn(
                  "text-xs font-semibold uppercase tracking-[0.14em]",
                  darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40",
                )}
              >
                {title}
              </p>
              <h3 className="mt-1 text-[24px] font-semibold tracking-tight">
                {draftName ||
                  (dialogMode === "folder" ? "Untitled folder" : "Untitled")}
              </h3>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <label className="block">
                <span
                  className={cn(
                    "mb-2 block text-xs font-semibold uppercase tracking-[0.14em]",
                    darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40",
                  )}
                >
                  Name
                </span>
                <input
                  ref={inputRef}
                  value={draftName}
                  onChange={(event) => onDraftName(event.target.value)}
                  onFocus={(event) =>
                    event.currentTarget.focus({ preventScroll: true })
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") onSubmit();
                  }}
                  placeholder={
                    dialogMode === "folder" ? "Folder name" : "Notebook name"
                  }
                  className={cn(
                    "h-12 w-full rounded-2xl border px-4 text-[15px] outline-none transition-[border-color,background-color,box-shadow] focus:ring-2 focus:ring-knote-primary/25",
                    darkMode
                      ? "border-[#3a3528] bg-[#252118] text-[#f4efe7] placeholder:text-[#f4efe7]/35 focus:border-knote-primary"
                      : "border-[#e2dbd0] bg-white text-[#1f1f1f] placeholder:text-[#1f1f1f]/35 focus:border-knote-primary",
                  )}
                />
              </label>

              {dialogMode !== "rename-notebook" && (
                <ColorField
                  darkMode={darkMode}
                  dialogMode={dialogMode}
                  draftColor={draftColor}
                  onDraftColor={onDraftColor}
                />
              )}

              {dialogMode === "folder" && (
                <IconField
                  darkMode={darkMode}
                  draftIcon={draftIcon}
                  iconSearch={iconSearch}
                  onDraftIcon={onDraftIcon}
                  onIconSearch={onIconSearch}
                />
              )}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "h-12 rounded-2xl text-[15px] font-medium transition-[background-color,transform] active:scale-[0.98]",
                  darkMode
                    ? "bg-white/8 text-[#f4efe7]/75 hover:bg-white/12"
                    : "bg-black/6 text-knote-text/70 hover:bg-black/9",
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="h-12 rounded-2xl bg-knote-primary text-[15px] font-semibold text-white transition-[opacity,transform] hover:opacity-90 active:scale-[0.98]"
              >
                {editingFolderId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderPreview({
  color,
  icon,
  name,
}: {
  color: string;
  icon: string;
  name: string;
}) {
  const PreviewIcon = getFolderIcon(icon);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[86px] w-[120px] min-[680px]:h-[108px] min-[680px]:w-[150px]">
        <span className="absolute inset-x-0 bottom-0 top-3 rounded-[14px]">
          <span
            className="absolute -top-2.5 left-2.5 h-5 w-[48%] rounded-t-[10px]"
            style={{ backgroundColor: color }}
          />
          <span
            className="absolute inset-0 rounded-[14px]"
            style={{ backgroundColor: color }}
          />
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-[14px] bg-white/16" />
        </span>
        <span className="absolute inset-x-0 bottom-0 top-3 flex items-center justify-center text-white/88">
          <PreviewIcon
            className="h-8 w-8 min-[680px]:h-10 min-[680px]:w-10"
            strokeWidth={1.65}
          />
        </span>
      </div>
      <span className="max-w-[200px] truncate text-sm font-semibold text-white drop-shadow-sm">
        {name || "Folder name"}
      </span>
    </div>
  );
}

function NotebookPreview({ color, name }: { color: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-[92px] w-[68px] overflow-hidden rounded-[10px] border border-white/20 min-[680px]:h-[128px] min-[680px]:w-[94px]">
        <span className="absolute inset-0" style={{ backgroundColor: color }} />
        <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-black/12" />
        <span className="absolute inset-x-3 top-4 h-px bg-white/25" />
        <span className="absolute inset-x-3 top-7 h-px bg-white/16" />
        <span className="absolute inset-0 flex items-center justify-center text-white/80">
          <BookOpen
            className="h-7 w-7 min-[680px]:h-9 min-[680px]:w-9"
            strokeWidth={1.6}
          />
        </span>
      </div>
      <span className="max-w-[200px] truncate text-sm font-semibold text-white drop-shadow-sm">
        {name || "Notebook name"}
      </span>
    </div>
  );
}

function ColorField({
  darkMode,
  dialogMode,
  draftColor,
  onDraftColor,
}: {
  darkMode: boolean;
  dialogMode: "folder" | "notebook";
  draftColor: string;
  onDraftColor: (color: string) => void;
}) {
  return (
    <div className="mt-5">
      <p
        className={cn(
          "mb-3 text-xs font-semibold uppercase tracking-[0.14em]",
          darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40",
        )}
      >
        Color
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(36px,1fr))] gap-2">
        {(dialogMode === "folder" ? FOLDER_COLORS : NOTEBOOK_COLORS).map(
          (color) => (
            <button
              type="button"
              key={color}
              aria-label={`Use ${color}`}
              onClick={() => onDraftColor(color)}
              className={cn(
                "mx-auto flex h-9 w-9 items-center justify-center rounded-full border-2 transition-[border-color,transform] duration-150 active:scale-90",
                draftColor === color
                  ? "scale-110 border-white/90"
                  : "border-transparent",
              )}
              style={{ backgroundColor: color }}
            >
              {draftColor === color && (
                <Check
                  size={14}
                  className="text-white drop-shadow-sm"
                  strokeWidth={3}
                />
              )}
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function IconField({
  darkMode,
  draftIcon,
  iconSearch,
  onDraftIcon,
  onIconSearch,
}: {
  darkMode: boolean;
  draftIcon: string;
  iconSearch: string;
  onDraftIcon: (icon: string) => void;
  onIconSearch: (value: string) => void;
}) {
  return (
    <div className="mt-5">
      <p
        className={cn(
          "mb-3 text-xs font-semibold uppercase tracking-[0.14em]",
          darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40",
        )}
      >
        Icon
      </p>
      <input
        value={iconSearch}
        onChange={(event) => onIconSearch(event.target.value)}
        placeholder="Search icons..."
        className={cn(
          "mb-3 h-10 w-full rounded-xl border px-3 text-sm outline-none transition focus:border-knote-primary",
          darkMode
            ? "border-[#3a3528] bg-[#252118] text-[#f4efe7] placeholder:text-[#f4efe7]/35"
            : "border-[#e2dbd0] bg-white text-[#1f1f1f] placeholder:text-[#1f1f1f]/35",
        )}
      />
      <div className="max-h-[168px] overflow-y-auto rounded-xl min-[680px]:max-h-[210px]">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] gap-1.5">
          {PICKER_ICONS.filter(({ name }) =>
            name.toLowerCase().includes(iconSearch.toLowerCase()),
          ).map(({ name: iconName, icon: Icon }) => (
            <button
              type="button"
              key={iconName}
              aria-label={`Use ${iconName} icon`}
              title={iconName}
              onClick={() => onDraftIcon(iconName)}
              className={cn(
                "flex h-10 w-full items-center justify-center rounded-xl border transition-all duration-150 active:scale-90",
                draftIcon === iconName
                  ? "border-knote-primary bg-knote-primary text-white shadow-sm"
                  : darkMode
                    ? "border-[#3a3528] bg-[#252118] text-[#f4efe7]/55 hover:border-[#5a5240] hover:bg-[#2e2a1e]"
                    : "border-[#ede7de] bg-white text-knote-text/50 hover:border-[#c8bfb0] hover:bg-[#f5f0e8]",
              )}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
