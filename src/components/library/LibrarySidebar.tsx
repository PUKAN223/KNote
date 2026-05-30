"use client";

import {
  Folder as FolderIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Star,
  User,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { Folder, Notebook } from "../../types";
import { getFolderIcon } from "./icons";
import { getFolderItemCount } from "./utils";

type FolderRow = Folder & { depth: number };

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
  folderRows: FolderRow[];
  searchTerm: string;
  sidebarMinimized: boolean;
  onNavigateFolder: (folderId: string | null) => void;
  onOpenNotebook: (notebookId: string) => void;
  onSearchChange: (value: string) => void;
  onToggleMinimized: () => void;
}) {
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
          {folderRows.map((folder) => {
            const Icon = getFolderIcon(folder.icon);

            return (
              <button
                type="button"
                key={folder.id}
                data-folder-drop={folder.id}
                onClick={() => onNavigateFolder(folder.id)}
                className={cn(
                  "flex h-10 w-full items-center rounded-[12px] text-left text-sm font-medium transition-[background-color,transform,opacity] duration-200 active:scale-[0.98]",
                  sidebarMinimized ? "justify-center px-0" : "gap-2 px-2",
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
                <span
                  className="relative flex h-6 w-7 shrink-0 items-center justify-center rounded-[6px] text-white before:absolute before:-top-0.5 before:left-1 before:h-1.5 before:w-3.5 before:rounded-t-[4px] before:bg-white/22"
                  style={{ backgroundColor: folder.color }}
                >
                  <Icon size={13} strokeWidth={1.8} />
                </span>
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
                      {getFolderItemCount(allFolders, allNotebooks, folder.id)}
                    </span>
                  </>
                )}
              </button>
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
                      "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.98]",
                      darkMode
                        ? "text-[#f4efe7]/70 hover:bg-white/8"
                        : "text-black/62 hover:bg-white/52",
                    )}
                  >
                    <FolderIcon
                      size={16}
                      className="text-[var(--library-label)]"
                    />
                    <span className="truncate">{folder.name}</span>
                  </button>
                ))}
                {favoriteNotebooks.map((notebook) => (
                  <button
                    type="button"
                    key={notebook.id}
                    onClick={() => onOpenNotebook(notebook.id)}
                    className={cn(
                      "flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-left text-sm font-medium transition-[background-color,transform] duration-200 active:scale-[0.98]",
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
