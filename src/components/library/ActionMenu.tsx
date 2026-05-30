"use client";

import {
  Check,
  ChevronRight,
  Folder as FolderIcon,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { FOLDER_COLORS, type Folder, NOTEBOOK_COLORS } from "../../types";
import { getFolderIcon, PICKER_ICONS } from "./icons";
import { isDescendant } from "./utils";

type MenuPosition = { x: number; y: number };

export function ObjectMenuButton({
  label,
  onClick,
  darkMode,
}: {
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  darkMode: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onClick(event);
      }}
      className={cn(
        "absolute right-2 top-2 z-20 flex h-9 w-9 items-center justify-center rounded-full opacity-0 backdrop-blur transition-opacity group-hover:opacity-100",
        darkMode
          ? "border-[#393226] bg-[#211f1a] text-[#d9cbb8] hover:bg-white/8"
          : "border-knote-border bg-white/82 text-knote-text/45 hover:bg-white",
      )}
    >
      <MoreHorizontal size={18} />
    </button>
  );
}

export function NotebookMenu({
  darkMode,
  position,
  folders,
  isFavorite,
  notebookColor,
  onColor,
  onFavorite,
  onRename,
  onMove,
  onDelete,
}: {
  darkMode: boolean;
  position: MenuPosition;
  folders: Folder[];
  isFavorite: boolean;
  notebookColor: string;
  onColor: (color: string) => void;
  onFavorite: () => void;
  onRename: () => void;
  onMove: (folderId: string) => void;
  onDelete: () => void;
}) {
  return (
    <ContextMenu darkMode={darkMode} position={position}>
      <ColorPicker
        darkMode={darkMode}
        colors={NOTEBOOK_COLORS}
        selectedColor={notebookColor}
        title="Set color"
        onColor={onColor}
      />
      <MenuSeparator darkMode={darkMode} />
      <MoveSelect darkMode={darkMode} folders={folders} onMove={onMove} />
      <MenuButton darkMode={darkMode} onClick={onRename}>
        <Pencil size={15} />
        Rename
      </MenuButton>
      <MenuButton darkMode={darkMode} onClick={onFavorite}>
        <Star
          size={15}
          className={isFavorite ? "fill-current text-[#c58a1c]" : undefined}
        />
        {isFavorite ? "Unstar" : "Star"}
      </MenuButton>
      <MenuButton darkMode={darkMode} tone="danger" onClick={onDelete}>
        <Trash2 size={15} />
        Delete
      </MenuButton>
    </ContextMenu>
  );
}

export function FolderMenu({
  darkMode,
  position,
  folder,
  folders,
  isFavorite,
  onColor,
  onIcon,
  onFavorite,
  onRename,
  onMove,
  onDelete,
}: {
  darkMode: boolean;
  position: MenuPosition;
  folder: Folder;
  folders: Folder[];
  isFavorite: boolean;
  onColor: (color: string) => void;
  onIcon: (icon: string) => void;
  onFavorite: () => void;
  onRename: () => void;
  onMove: (folderId: string) => void;
  onDelete: () => void;
}) {
  const movableFolders = folders.filter(
    (candidate) =>
      candidate.id !== folder.id &&
      !isDescendant(folders, folder.id, candidate.id),
  );

  return (
    <ContextMenu darkMode={darkMode} position={position}>
      <ColorPicker
        darkMode={darkMode}
        colors={FOLDER_COLORS}
        selectedColor={folder.color}
        title="Set color"
        onColor={onColor}
      />
      <IconPicker
        darkMode={darkMode}
        selectedIcon={folder.icon}
        onIcon={onIcon}
      />
      <MenuSeparator darkMode={darkMode} />
      <MoveSelect
        darkMode={darkMode}
        folders={movableFolders}
        onMove={onMove}
      />
      <MenuButton darkMode={darkMode} onClick={onRename}>
        <Pencil size={15} />
        Rename
      </MenuButton>
      <MenuButton darkMode={darkMode} onClick={onFavorite}>
        <Star
          size={15}
          className={isFavorite ? "fill-current text-[#c58a1c]" : undefined}
        />
        {isFavorite ? "Unstar" : "Star"}
      </MenuButton>
      <MenuButton darkMode={darkMode} tone="danger" onClick={onDelete}>
        <Trash2 size={15} />
        Delete
      </MenuButton>
    </ContextMenu>
  );
}

function ContextMenu({
  children,
  darkMode,
  position,
}: {
  children: React.ReactNode;
  darkMode: boolean;
  position: MenuPosition;
}) {
  const left = Math.min(position.x, window.innerWidth - 268);
  const top = Math.min(position.y, window.innerHeight - 24);

  return (
    <div
      className={cn(
        "context-menu-enter fixed z-[9999] max-h-[calc(100vh-24px)] w-[252px] overflow-y-auto rounded-[18px] border py-2 shadow-xl",
        darkMode
          ? "border-[#393226] bg-[#211f1a] text-[#f4efe7]"
          : "border-[#e6dfd3] bg-[#fffdf9] text-knote-text",
      )}
      style={{
        left: Math.max(12, left),
        top: Math.max(12, top),
      }}
    >
      {children}
    </div>
  );
}

function MenuSeparator({ darkMode }: { darkMode: boolean }) {
  return (
    <div
      className={cn("my-2 h-px", darkMode ? "bg-white/10" : "bg-[#ece4d8]")}
    />
  );
}

function ColorPicker({
  darkMode,
  colors,
  selectedColor,
  title,
  onColor,
}: {
  darkMode: boolean;
  colors: readonly string[];
  selectedColor: string;
  title: string;
  onColor: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ActionDisclosure
      darkMode={darkMode}
      open={open}
      title={title}
      leading={
        <span
          className="h-4 w-4 rounded-full border border-black/10"
          style={{ backgroundColor: selectedColor }}
        />
      }
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="grid grid-cols-8 gap-2 px-3 pb-2 pt-1">
        {colors.map((color) => (
          <button
            type="button"
            key={color}
            aria-label={`Set color ${color}`}
            onClick={() => onColor(color)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full border border-black/5 transition-transform active:scale-90",
              selectedColor === color &&
                (darkMode
                  ? "ring-2 ring-[#d9cbb8]/40 ring-offset-2 ring-offset-[#211f1a]"
                  : "ring-2 ring-[#7c6a46]/35 ring-offset-2"),
            )}
            style={{ backgroundColor: color }}
          >
            {selectedColor === color && (
              <Check size={13} className="text-white" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>
    </ActionDisclosure>
  );
}

function IconPicker({
  darkMode,
  selectedIcon,
  onIcon,
}: {
  darkMode: boolean;
  selectedIcon: string;
  onIcon: (icon: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filteredIcons = useMemo(
    () =>
      PICKER_ICONS.filter(({ name }) =>
        name.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );
  const SelectedIcon = getFolderIcon(selectedIcon);

  return (
    <ActionDisclosure
      darkMode={darkMode}
      open={open}
      title="Set icon"
      leading={<SelectedIcon size={15} />}
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="px-3 pb-2 pt-1">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search icons"
          className={cn(
            "mb-3 h-10 w-full rounded-2xl border px-3 text-sm outline-none transition focus:border-knote-primary",
            darkMode
              ? "border-[#4c4638] bg-[#1e1b15] text-[#f4efe7] placeholder:text-[#f4efe7]/45"
              : "border-knote-border bg-white text-[#1f1f1f] placeholder:text-[#1f1f1f]",
          )}
        />
        <div className="max-h-[240px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {filteredIcons.map(({ name: iconName, icon: Icon }) => {
              return (
                <button
                  type="button"
                  key={iconName}
                  aria-label={`Set ${iconName} icon`}
                  onClick={() => onIcon(iconName)}
                  className={cn(
                    "flex h-10 w-full items-center justify-center rounded-[9px] border transition-[background-color,transform] active:scale-95",
                    selectedIcon === iconName
                      ? darkMode
                        ? "border-[#d9cbb8]/35 bg-[#393226] text-[#d9cbb8]"
                        : "border-[#7c6a46]/35 bg-[#e8dfcf] text-[#7c6a46]"
                      : darkMode
                        ? "border-transparent text-[#f4efe7]/58 hover:bg-white/8"
                        : "border-transparent text-black/52 hover:bg-[#f3eee5]",
                  )}
                >
                  <Icon size={15} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </ActionDisclosure>
  );
}

function MenuButton({
  darkMode,
  children,
  tone,
  onClick,
}: {
  darkMode: boolean;
  children: React.ReactNode;
  tone?: "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-medium transition-colors",
        darkMode ? "hover:bg-white/8" : "hover:bg-[#f3eee5]",
        tone === "danger"
          ? "text-knote-danger"
          : darkMode
            ? "text-[#f4efe7]"
            : "text-knote-text",
      )}
    >
      {children}
    </button>
  );
}

function MoveSelect({
  darkMode,
  folders,
  onMove,
}: {
  darkMode: boolean;
  folders: Folder[];
  onMove: (folderId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <ActionDisclosure
      darkMode={darkMode}
      open={open}
      title="Move to"
      leading={<FolderIcon size={15} />}
      onToggle={() => setOpen((value) => !value)}
    >
      <div className="max-h-44 overflow-y-auto px-2 pb-2 pt-1">
        <MoveTargetButton darkMode={darkMode} onClick={() => onMove("root")}>
          Documents
        </MoveTargetButton>
        {folders.map((folder) => (
          <MoveTargetButton
            key={folder.id}
            darkMode={darkMode}
            onClick={() => onMove(folder.id)}
          >
            {folder.name}
          </MoveTargetButton>
        ))}
      </div>
    </ActionDisclosure>
  );
}

function ActionDisclosure({
  darkMode,
  open,
  title,
  leading,
  children,
  onToggle,
}: {
  darkMode: boolean;
  open: boolean;
  title: string;
  leading: React.ReactNode;
  children: React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-10 w-full items-center gap-3 px-4 text-left text-sm font-medium transition-colors",
          darkMode ? "hover:bg-white/8" : "hover:bg-[#f3eee5]",
        )}
      >
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-[8px] transition-colors",
            darkMode
              ? "bg-white/8 text-[#d9cbb8]"
              : "bg-[#eee7dc] text-[#6f6046]",
          )}
        >
          {leading}
        </span>
        <span className="flex-1">{title}</span>
        <ChevronRight
          size={15}
          className={cn(
            "transition-transform duration-200",
            open && "rotate-90",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

function MoveTargetButton({
  darkMode,
  children,
  onClick,
}: {
  darkMode: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 w-full items-center gap-2 rounded-[10px] px-2 text-left text-sm font-medium transition-colors",
        darkMode
          ? "text-[#f4efe7]/78 hover:bg-white/8"
          : "text-knote-text/78 hover:bg-[#f3eee5]",
      )}
    >
      <FolderIcon size={14} className="text-[var(--library-label)]" />
      <span className="truncate">{children}</span>
    </button>
  );
}
