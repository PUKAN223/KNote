"use client";

import {
  ChevronRight,
  Folder as FolderIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  User,
} from "lucide-react";
import { cloneElement, type ReactElement, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import type { Folder, Notebook } from "../../types";
import { getFolderIcon } from "./icons";
import { type FolderTreeRow, getFolderItemCount } from "./utils";

export function LibrarySidebar({
  activeFolderId,
  allFolders,
  allNotebooks,
  darkMode,
  dropFolderId,
  favoriteFolders,
  favoriteNotebooks,
  folderRows,
  searchTerm,
  sidebarMinimized,
  onNavigateFolder,
  onOpenNotebook,
  onSearchChange,
  onToggleMinimized,
}: {
  activeFolderId: string | null;
  allFolders: Folder[];
  allNotebooks: Notebook[];
  darkMode: boolean;
  dropFolderId: string | null;
  favoriteFolders: Folder[];
  favoriteNotebooks: Notebook[];
  folderRows: FolderTreeRow[];
  searchTerm: string;
  sidebarMinimized: boolean;
  onNavigateFolder: (folderId: string | null) => void;
  onOpenNotebook: (notebookId: string) => void;
  onSearchChange: (value: string) => void;
  onToggleMinimized: () => void;
}) {
  const [collapsedFolderIds, setCollapsedFolderIds] = useState<string[]>([]);
  const childFolderIds = useMemo(() => {
    const ids = new Set<string>();
    for (const folder of allFolders) {
      if (folder.parentId) ids.add(folder.parentId);
    }
    return ids;
  }, [allFolders]);
  const visibleFolderRows = useMemo(() => {
    if (sidebarMinimized) {
      return folderRows.filter((folder) => folder.depth === 0);
    }

    const collapsed = new Set(collapsedFolderIds);
    const folderById = new Map(allFolders.map((folder) => [folder.id, folder]));

    return folderRows.filter((folder) => {
      let currentParentId = folder.parentId;

      while (currentParentId) {
        if (collapsed.has(currentParentId)) return false;
        currentParentId = folderById.get(currentParentId)?.parentId ?? null;
      }

      return true;
    });
  }, [allFolders, collapsedFolderIds, folderRows, sidebarMinimized]);
  const toggleFolderCollapsed = (folderId: string) => {
    setCollapsedFolderIds((ids) =>
      ids.includes(folderId)
        ? ids.filter((id) => id !== folderId)
        : [...ids, folderId],
    );
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r py-6 transition-[width,background-color,border-color] duration-300 ease-out md:flex md:flex-col",
        darkMode
          ? "border-[#322d25] bg-[#211f1a]"
          : "border-[#e6dfd3] bg-[#f4f0e8]",
        sidebarMinimized ? "w-[72px] px-3" : "w-[272px] px-4",
      )}
    >
      <div
        className={cn(
          "mb-7 flex items-center",
          sidebarMinimized ? "justify-center" : "justify-between px-2",
        )}
      >
        {!sidebarMinimized && (
          <div>
            <h1 className="text-[31px] font-semibold tracking-tight">KNote</h1>
          </div>
        )}
        <button
          type="button"
          aria-label={sidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
          onClick={onToggleMinimized}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,transform] duration-200 active:scale-95",
            darkMode
              ? "text-[#d9cbb8] hover:bg-white/10"
              : "text-[#6f6046] hover:bg-white/60",
          )}
        >
          {sidebarMinimized ? (
            <PanelLeftOpen size={19} />
          ) : (
            <PanelLeftClose size={19} />
          )}
        </button>
      </div>

      <button
        type="button"
        data-folder-drop="root"
        onClick={() => onNavigateFolder(null)}
        className={cn(
          "mb-1.5 flex h-11 items-center rounded-[10px] text-left text-[16px] font-medium transition-[background-color,transform] duration-200 active:scale-[0.98]",
          sidebarMinimized ? "justify-center px-0" : "gap-3 px-3",
          dropFolderId === "root"
            ? darkMode
              ? "bg-[#332d22]"
              : "bg-[#ece5d8]"
            : activeFolderId === null
              ? darkMode
                ? "bg-[#393226] text-[#f4efe7]"
                : "bg-[#e8dfcf] text-[#1f1f1f]"
              : darkMode
                ? "text-[#f4efe7] hover:bg-white/8"
                : "text-[#1f1f1f] hover:bg-white/52",
        )}
      >
        <FolderIcon size={20} className="text-[var(--library-label)]" />
        {!sidebarMinimized && <span>Documents</span>}
      </button>

      {sidebarMinimized ? (
        <button
          type="button"
          aria-label="Search"
          className={cn(
            "mb-1.5 flex h-11 items-center justify-center rounded-[10px] transition-[background-color,transform] duration-200 active:scale-[0.98]",
            darkMode
              ? "text-[#f4efe7] hover:bg-white/8"
              : "text-[#1f1f1f] hover:bg-white/52",
          )}
        >
          <Search size={20} />
        </button>
      ) : (
        <label
          className={cn(
            "mb-1.5 flex h-11 items-center gap-3 rounded-[10px] px-3 text-[16px] font-medium transition-[background-color,transform] duration-200",
            darkMode
              ? "text-[#f4efe7] focus-within:bg-white/10 hover:bg-white/8"
              : "text-[#1f1f1f] focus-within:bg-white/70 hover:bg-white/52",
          )}
        >
          <Search size={20} />
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            onFocus={(event) =>
              event.currentTarget.focus({ preventScroll: true })
            }
            placeholder="Search"
            className={cn(
              "min-w-0 flex-1 bg-transparent outline-none",
              darkMode
                ? "placeholder:text-[#f4efe7]/45"
                : "placeholder:text-[#1f1f1f]",
            )}
          />
        </label>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!sidebarMinimized && (
          <p
            className={cn(
              "mb-2 mt-4 px-3 text-xs font-medium uppercase tracking-[0.14em]",
              darkMode ? "text-[#f4efe7]/42" : "text-black/35",
            )}
          >
            Folders
          </p>
        )}
        <div className="space-y-1">
          {visibleFolderRows.map((folder) => {
            const Icon = getFolderIcon(folder.icon);
            const hasChildren = childFolderIds.has(folder.id);
            const collapsed = collapsedFolderIds.includes(folder.id);

            return (
              <div
                key={folder.id}
                className={cn(
                  "library-list-row flex h-10 w-full items-center rounded-[12px] transition-[background-color,transform,opacity] duration-200",
                  sidebarMinimized && "justify-center",
                  dropFolderId === folder.id
                    ? darkMode
                      ? "bg-[#332d22]"
                      : "bg-[#ece5d8]"
                    : activeFolderId === folder.id
                      ? darkMode
                        ? "bg-white/10 text-[#f4efe7]"
                        : "bg-white/72 text-[#1f1f1f]"
                      : darkMode
                        ? "text-[#f4efe7]/70 hover:bg-white/8"
                        : "text-black/62 hover:bg-white/52",
                )}
                style={{
                  paddingLeft: sidebarMinimized
                    ? undefined
                    : `${8 + folder.depth * 16}px`,
                }}
              >
                {!sidebarMinimized && (
                  <button
                    type="button"
                    aria-label={
                      collapsed
                        ? `Expand ${folder.name}`
                        : `Collapse ${folder.name}`
                    }
                    disabled={!hasChildren}
                    onClick={() => toggleFolderCollapsed(folder.id)}
                    className={cn(
                      "mr-0.5 flex h-7 w-5 shrink-0 items-center justify-center rounded-md transition-[background-color,transform,opacity]",
                      hasChildren ? "opacity-100" : "opacity-0",
                      darkMode ? "hover:bg-white/8" : "hover:bg-black/5",
                    )}
                  >
                    <ChevronRight
                      size={14}
                      className={cn(
                        "transition-transform duration-200",
                        !collapsed && "rotate-90",
                      )}
                    />
                  </button>
                )}
                <button
                  type="button"
                  data-folder-drop={folder.id}
                  onClick={() => onNavigateFolder(folder.id)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center text-left text-sm font-medium transition-transform duration-200 active:scale-[0.98]",
                    sidebarMinimized ? "justify-center px-0" : "gap-2 pr-2",
                  )}
                >
                  <SidebarFolderIcon color={folder.color} icon={<Icon />} />
                  {!sidebarMinimized && (
                    <>
                      <span className="truncate">{folder.name}</span>
                      <span
                        className={cn(
                          "ml-auto rounded-full px-2 py-0.5 text-[11px]",
                          darkMode
                            ? "bg-white/8 text-[#f4efe7]/38"
                            : "bg-black/[0.04] text-black/35",
                        )}
                      >
                        {getFolderItemCount(
                          allFolders,
                          allNotebooks,
                          folder.id,
                        )}
                      </span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className={cn("mt-5", sidebarMinimized && "hidden")}>
          <p
            className={cn(
              "mb-2 px-3 text-xs font-medium uppercase tracking-[0.14em]",
              darkMode ? "text-[#f4efe7]/42" : "text-black/35",
            )}
          >
            Favorites
          </p>
          <div className="space-y-1">
            {favoriteFolders.length === 0 && favoriteNotebooks.length === 0 ? (
              <p
                className={cn(
                  "px-3 py-3 text-sm leading-5",
                  darkMode ? "text-[#f4efe7]/38" : "text-knote-text/35",
                )}
              >
                Long-press an item and star it.
              </p>
            ) : (
              <>
                {favoriteFolders.map((folder) => (
                  <button
                    type="button"
                    key={folder.id}
                    onClick={() => onNavigateFolder(folder.id)}
                    className={cn(
                      "library-list-row flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-medium transition-[background-color,transform,opacity] duration-200 active:scale-[0.98]",
                      darkMode
                        ? "text-[#f4efe7]/70 hover:bg-white/8"
                        : "text-black/62 hover:bg-white/52",
                    )}
                  >
                    <Star size={16} className="fill-current text-[#c58a1c]" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
                {favoriteNotebooks.map((notebook) => (
                  <button
                    type="button"
                    key={notebook.id}
                    onClick={() => onOpenNotebook(notebook.id)}
                    className={cn(
                      "library-list-row flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-medium transition-[background-color,transform,opacity] duration-200 active:scale-[0.98]",
                      darkMode
                        ? "text-[#f4efe7]/70 hover:bg-white/8"
                        : "text-black/62 hover:bg-white/52",
                    )}
                  >
                    <Star size={16} className="fill-current text-[#c58a1c]" />
                    <span className="truncate">{notebook.name}</span>
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-4 flex items-center rounded-[14px] p-2.5",
          sidebarMinimized ? "justify-center" : "gap-3",
        )}
      >
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            darkMode
              ? "bg-[#393226] text-[#d9cbb8]"
              : "bg-[#e8dfcf] text-[#7c6a46]",
          )}
        >
          <User size={18} />
        </div>
        {!sidebarMinimized && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Local Profile</p>
            <p
              className={cn(
                "truncate text-xs",
                darkMode ? "text-[#f4efe7]/42" : "text-black/40",
              )}
            >
              Sign-in ready
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function SidebarFolderIcon({
  color,
  icon,
}: {
  color: string;
  icon: ReactElement<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <span className="relative h-7 w-8 shrink-0">
      <span className="absolute inset-x-0 bottom-0 top-1 rounded-[6px]">
        <span
          className="absolute -top-1 left-1 h-2 w-[48%] rounded-t-[4px]"
          style={{ backgroundColor: color }}
        />
        <span
          className="absolute inset-0 rounded-[6px]"
          style={{ backgroundColor: color }}
        />
        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-[6px] bg-white/16" />
      </span>
      <span className="absolute inset-x-0 bottom-0 top-1 flex items-center justify-center text-white/88">
        {cloneElement(icon, { size: 13, strokeWidth: 1.65 })}
      </span>
    </span>
  );
}
