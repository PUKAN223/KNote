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
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 sm:items-center sm:pb-0">
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
          "dialog-enter relative w-full max-w-[460px] overflow-hidden rounded-[28px] shadow-2xl",
          darkMode
            ? "bg-[#1c1a14] text-[#f4efe7]"
            : "bg-[#FDFAF5] text-[#1f1f1f]",
        )}
      >
        <div
          className="flex h-[130px] items-center justify-center"
          style={{
            background:
              dialogMode === "folder"
                ? `linear-gradient(160deg, ${draftColor}cc 0%, ${draftColor} 100%)`
                : `linear-gradient(160deg, ${draftColor}bb 0%, ${draftColor} 100%)`,
          }}
        >
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

        <div className="px-6 pb-6 pt-5">
          <p
            id="library-dialog-title"
            className={cn(
              "mb-4 text-xs font-semibold uppercase tracking-[0.14em]",
              darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40",
            )}
          >
            {title}
          </p>

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
              "h-12 w-full rounded-2xl border px-4 text-[15px] outline-none transition-all focus:ring-2 focus:ring-knote-primary/30",
              darkMode
                ? "border-[#3a3528] bg-[#252118] text-[#f4efe7] placeholder:text-[#f4efe7]/35 focus:border-knote-primary"
                : "border-[#e2dbd0] bg-white text-[#1f1f1f] placeholder:text-[#1f1f1f]/35 focus:border-knote-primary",
            )}
          />

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

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "h-12 flex-1 rounded-2xl text-[15px] font-medium transition-colors",
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
              className="h-12 flex-1 rounded-2xl bg-knote-primary text-[15px] font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
            >
              {editingFolderId ? "Save" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FolderPreview({
  color: _color,
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
      <div className="relative h-[58px] w-[80px]">
        <span className="absolute inset-x-0 bottom-0 top-4 rounded-[12px] bg-white/30" />
        <span className="absolute -top-0 left-2.5 h-4 w-[40%] rounded-t-[8px] bg-white/20" />
        <span className="absolute inset-x-0 bottom-0 top-4 flex items-center justify-center text-white/90">
          <PreviewIcon size={22} strokeWidth={1.7} />
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
      <div className="relative h-[68px] w-[50px] overflow-hidden rounded-[8px] border border-white/20 shadow-lg">
        <span className="absolute inset-0" style={{ backgroundColor: color }} />
        <span className="absolute bottom-0 left-0 top-0 w-1.5 bg-black/12" />
        <span className="absolute inset-x-2 top-3 h-px bg-white/25" />
        <span className="absolute inset-x-2 top-5 h-px bg-white/16" />
        <span className="absolute inset-0 flex items-center justify-center text-white/80">
          <BookOpen size={18} strokeWidth={1.6} />
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
      <div className="flex justify-between">
        {(dialogMode === "folder" ? FOLDER_COLORS : NOTEBOOK_COLORS).map(
          (color) => (
            <button
              type="button"
              key={color}
              aria-label={`Use ${color}`}
              onClick={() => onDraftColor(color)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-90",
                draftColor === color
                  ? "scale-110 border-white/90 shadow-md"
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
      <div className="max-h-[180px] overflow-y-auto rounded-xl">
        <div className="grid grid-cols-6 gap-1.5">
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
