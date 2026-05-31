"use client";

import {
  BookOpen,
  ChevronRight,
  FileText,
  Folder as FolderIcon,
  Menu,
  Moon,
  PenLine,
  Plus,
  Sun,
  User,
} from "lucide-react";
import type React from "react";
import { cn } from "../../lib/utils";
import type { Folder, Notebook } from "../../types";
import { FolderMenu, NotebookMenu, ObjectMenuButton } from "./ActionMenu";
import { getFolderIcon } from "./icons";
import { formatLibraryDate, getFolderItemCount } from "./utils";

type ItemTarget =
  | { id: string; type: "notebook" }
  | { id: string; type: "folder" };

export type LibrarySortMode = "date" | "name" | "type";

const sortOptions: Array<{ id: LibrarySortMode; label: string }> = [
  { id: "date", label: "Date" },
  { id: "name", label: "Name" },
  { id: "type", label: "Type" },
];

export function LibraryContent({
  activeFolder,
  allFolders,
  allNotebooks,
  breadcrumb,
  darkMode,
  dragTarget,
  dropFolderId,
  favoriteFolderIds,
  favoriteNotebookIds,
  filteredFolders,
  filteredNotebooks,
  folderTransitioning,
  isSearching,
  menuPosition,
  menuTarget,
  newMenuOpen,
  onCreateQuickNote,
  onDeleteFolder,
  onDeleteNotebook,
  onImportPdf,
  onFolderColor,
  onFolderIcon,
  onMoveFolder,
  onMoveNotebook,
  onNavigateFolder,
  onNewFolder,
  onNewNotebook,
  onNotebookColor,
  onOpenNotebook,
  onRenameFolder,
  onRenameNotebook,
  onSetDarkMode,
  onSetMenuPosition,
  onSetMenuTarget,
  onSetNewMenuOpen,
  onSetSidebarMinimized,
  onStartPress,
  onToggleFavoriteFolder,
  onToggleFavoriteNotebook,
  shouldIgnoreTap,
  sortMode,
  onSortModeChange,
}: {
  activeFolder?: Folder;
  allFolders: Folder[];
  allNotebooks: Notebook[];
  breadcrumb: Folder[];
  darkMode: boolean;
  dragTarget: ItemTarget | null;
  dropFolderId: string | null;
  favoriteFolderIds: string[];
  favoriteNotebookIds: string[];
  filteredFolders: Folder[];
  filteredNotebooks: Notebook[];
  folderTransitioning: boolean;
  isSearching: boolean;
  menuPosition: { x: number; y: number };
  menuTarget: ItemTarget | null;
  newMenuOpen: boolean;
  onCreateQuickNote: () => void | Promise<void>;
  onDeleteFolder: (folder: Folder) => void | Promise<void>;
  onDeleteNotebook: (notebookId: string) => void | Promise<void>;
  onImportPdf: () => void;
  onFolderColor: (folderId: string, color: string) => void | Promise<void>;
  onFolderIcon: (folderId: string, icon: string) => void | Promise<void>;
  onMoveFolder: (
    folder: Folder,
    folderId: string | null,
  ) => void | Promise<void>;
  onMoveNotebook: (
    notebookId: string,
    folderId: string | null,
  ) => void | Promise<void>;
  onNavigateFolder: (folderId: string | null) => void;
  onNewFolder: () => void;
  onNewNotebook: () => void;
  onNotebookColor: (notebookId: string, color: string) => void | Promise<void>;
  onOpenNotebook: (notebookId: string) => void;
  onRenameFolder: (folder: Folder) => void;
  onRenameNotebook: (notebook: Notebook) => void;
  onSetDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  onSetMenuPosition: (position: { x: number; y: number }) => void;
  onSetMenuTarget: (target: ItemTarget | null) => void;
  onSetNewMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onSetSidebarMinimized: React.Dispatch<React.SetStateAction<boolean>>;
  onStartPress: (
    item: ItemTarget,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  onToggleFavoriteFolder: (folderId: string) => void;
  onToggleFavoriteNotebook: (notebookId: string) => void;
  shouldIgnoreTap: () => boolean;
  sortMode: LibrarySortMode;
  onSortModeChange: (mode: LibrarySortMode) => void;
}) {
  return (
    <main
      className={cn(
        "min-w-0 flex flex-1 flex-col transition-colors duration-300",
        darkMode ? "bg-[#181715]" : "bg-[#fffdf9]",
      )}
    >
      <header className="shrink-0 px-5 pt-5 md:px-8 md:pt-7">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            {breadcrumb.length > 0 && (
              <div
                className={cn(
                  "mb-2 flex items-center gap-1 text-sm font-medium",
                  darkMode ? "text-[#f4efe7]/38" : "text-black/38",
                )}
              >
                <button
                  type="button"
                  data-folder-drop="root"
                  onClick={() => onNavigateFolder(null)}
                  className={cn(
                    "rounded-md px-1 py-0.5 transition-colors",
                    darkMode ? "hover:bg-white/8" : "hover:bg-[#f0eadf]",
                    dropFolderId === "root" &&
                      (darkMode ? "bg-[#393226]" : "bg-[#e8dfcf]"),
                  )}
                >
                  Documents
                </button>
                {breadcrumb.map((folder) => (
                  <span key={folder.id} className="flex items-center gap-1">
                    <ChevronRight size={14} />
                    <button
                      type="button"
                      data-folder-drop={folder.id}
                      onClick={() => onNavigateFolder(folder.id)}
                      className={cn(
                        "max-w-[150px] truncate rounded-md px-1 py-0.5 transition-colors",
                        darkMode ? "hover:bg-white/8" : "hover:bg-[#f0eadf]",
                        dropFolderId === folder.id &&
                          (darkMode ? "bg-[#393226]" : "bg-[#e8dfcf]"),
                      )}
                    >
                      {folder.name}
                    </button>
                  </span>
                ))}
              </div>
            )}
            <h2 className="truncate text-[31px] font-semibold leading-tight tracking-tight md:text-[34px]">
              {activeFolder?.name ?? "Documents"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={darkMode ? "Use light mode" : "Use dark mode"}
              onClick={() => onSetDarkMode((value) => !value)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,transform] duration-200 active:scale-95",
                darkMode
                  ? "text-[#d9cbb8] hover:bg-white/8"
                  : "text-[#6f6046] hover:bg-[#f0eadf]",
              )}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              aria-label="Show sidebar"
              onClick={() => onSetSidebarMinimized((value) => !value)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-[background-color,transform] duration-200 active:scale-95 md:hidden",
                darkMode
                  ? "text-[#d9cbb8] hover:bg-white/8"
                  : "text-[#6f6046] hover:bg-[#f0eadf]",
              )}
            >
              <Menu size={19} />
            </button>
            <button
              type="button"
              aria-label="Profile"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full transition-transform duration-200 active:scale-95",
                darkMode
                  ? "bg-[#393226] text-[#d9cbb8]"
                  : "bg-[#e8dfcf] text-[#7c6a46]",
              )}
            >
              <User size={17} />
            </button>
          </div>
        </div>

        <div
          className={cn(
            "mt-3 flex min-h-11 items-center justify-center border-t py-2.5",
            darkMode ? "border-[#322d25]" : "border-[#e9e2d7]",
          )}
        >
          <div
            className={cn(
              "grid h-7 w-[220px] grid-cols-3 rounded-[8px] p-0.5 text-[12px] font-medium",
              darkMode
                ? "bg-[#28241d] text-[#f4efe7]/70"
                : "bg-[#eee7dc] text-black/70",
            )}
          >
            {sortOptions.map((option) => {
              const active = sortMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onSortModeChange(option.id)}
                  className={cn(
                    "rounded-[6px] transition-colors",
                    active
                      ? darkMode
                        ? "bg-[#393226] text-[#f4efe7]"
                        : "bg-[#fffdf9] text-black"
                      : darkMode
                        ? "hover:bg-white/8"
                        : "hover:bg-white/45",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <section
        className={cn(
          "min-h-0 flex-1 overflow-y-auto px-5 pb-12 pt-7 md:px-8 transition-[opacity,transform] duration-200 ease-out",
          folderTransitioning ? "opacity-60" : "opacity-100",
        )}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-11 pb-20 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          <NewTile
            darkMode={darkMode}
            open={newMenuOpen}
            onCreateQuickNote={onCreateQuickNote}
            onImportPdf={onImportPdf}
            onNewFolder={onNewFolder}
            onNewNotebook={onNewNotebook}
            onSetOpen={onSetNewMenuOpen}
          />

          {isSearching &&
            filteredFolders.length === 0 &&
            filteredNotebooks.length === 0 && (
              <div
                className={cn(
                  "col-span-full pt-16 text-center text-sm font-medium",
                  darkMode ? "text-[#f4efe7]/38" : "text-black/38",
                )}
              >
                Nothing found.
              </div>
            )}

          {filteredFolders.map((folder) => (
            <FolderTile
              key={folder.id}
              allFolders={allFolders}
              allNotebooks={allNotebooks}
              darkMode={darkMode}
              dragTarget={dragTarget}
              dropFolderId={dropFolderId}
              favoriteFolderIds={favoriteFolderIds}
              folder={folder}
              menuPosition={menuPosition}
              menuTarget={menuTarget}
              onDeleteFolder={onDeleteFolder}
              onFolderColor={onFolderColor}
              onFolderIcon={onFolderIcon}
              onMoveFolder={onMoveFolder}
              onNavigateFolder={onNavigateFolder}
              onRenameFolder={onRenameFolder}
              onSetMenuPosition={onSetMenuPosition}
              onSetMenuTarget={onSetMenuTarget}
              onStartPress={onStartPress}
              onToggleFavoriteFolder={onToggleFavoriteFolder}
              shouldIgnoreTap={shouldIgnoreTap}
            />
          ))}

          {filteredNotebooks.map((notebook) => (
            <NotebookTile
              key={notebook.id}
              allFolders={allFolders}
              darkMode={darkMode}
              dragTarget={dragTarget}
              favoriteNotebookIds={favoriteNotebookIds}
              menuPosition={menuPosition}
              menuTarget={menuTarget}
              notebook={notebook}
              onDeleteNotebook={onDeleteNotebook}
              onMoveNotebook={onMoveNotebook}
              onNotebookColor={onNotebookColor}
              onOpenNotebook={onOpenNotebook}
              onRenameNotebook={onRenameNotebook}
              onSetMenuPosition={onSetMenuPosition}
              onSetMenuTarget={onSetMenuTarget}
              onStartPress={onStartPress}
              onToggleFavoriteNotebook={onToggleFavoriteNotebook}
              shouldIgnoreTap={shouldIgnoreTap}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function NewTile({
  darkMode,
  open,
  onCreateQuickNote,
  onImportPdf,
  onNewFolder,
  onNewNotebook,
  onSetOpen,
}: {
  darkMode: boolean;
  open: boolean;
  onCreateQuickNote: () => void | Promise<void>;
  onImportPdf: () => void;
  onNewFolder: () => void;
  onNewNotebook: () => void;
  onSetOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => onSetOpen((prev) => !prev)}
          className={cn(
            "library-tile-motion mx-auto flex h-[145px] w-[120px] flex-col items-center justify-center gap-3 rounded-[10px] border-2 border-dashed text-[var(--library-label)] transition-[background-color,border-color,transform] duration-200 ease-out active:scale-[0.97]",
            darkMode
              ? "border-[#d9cbb8]/45 bg-[#181715] hover:border-[#d9cbb8] hover:bg-[#211f1a]"
              : "border-[#7c6a46]/45 bg-[#fffdf9] hover:border-[#7c6a46] hover:bg-[#f7f2e9]",
          )}
        >
          <Plus size={23} strokeWidth={1.8} />
          <span className="text-[15px] font-medium">New...</span>
        </button>

        {open && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => onSetOpen(false)}
              aria-label="Close menu"
            />
            <div
              className={cn(
                "absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-[18px] border",
                darkMode
                  ? "border-[#393226] bg-[#211f1a] text-[#f4efe7]"
                  : "border-[#e6dfd3] bg-[#fffdf9] text-knote-text",
              )}
            >
              <div className="p-1.5">
                <p
                  className={cn(
                    "px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    darkMode ? "text-[#f4efe7]/38" : "text-black/36",
                  )}
                >
                  Create
                </p>
                <NewMenuButton
                  darkMode={darkMode}
                  icon={<BookOpen size={16} />}
                  label="New Notebook"
                  onClick={() => {
                    onSetOpen(false);
                    onNewNotebook();
                  }}
                />
                <NewMenuButton
                  darkMode={darkMode}
                  icon={<FolderIcon size={16} />}
                  label="New Folder"
                  onClick={() => {
                    onSetOpen(false);
                    onNewFolder();
                  }}
                />
                <div
                  className={cn(
                    "my-1 h-px",
                    darkMode ? "bg-white/10" : "bg-black/8",
                  )}
                />
                <p
                  className={cn(
                    "px-3 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em]",
                    darkMode ? "text-[#f4efe7]/38" : "text-black/36",
                  )}
                >
                  Quick
                </p>
                <NewMenuButton
                  darkMode={darkMode}
                  icon={<PenLine size={16} />}
                  label="Quick Note"
                  onClick={() => {
                    onSetOpen(false);
                    onCreateQuickNote();
                  }}
                />
                <NewMenuButton
                  darkMode={darkMode}
                  icon={<FileText size={16} />}
                  label="Import PDF"
                  onClick={() => {
                    onSetOpen(false);
                    onImportPdf();
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NewMenuButton({
  darkMode,
  icon,
  label,
  onClick,
}: {
  darkMode: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-sm font-medium transition-colors duration-200 ease-out",
        darkMode ? "hover:bg-white/8" : "hover:bg-black/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function FolderTile({
  allFolders,
  allNotebooks,
  darkMode,
  dragTarget,
  dropFolderId,
  favoriteFolderIds,
  folder,
  menuPosition,
  menuTarget,
  onDeleteFolder,
  onFolderColor,
  onFolderIcon,
  onMoveFolder,
  onNavigateFolder,
  onRenameFolder,
  onSetMenuPosition,
  onSetMenuTarget,
  onStartPress,
  onToggleFavoriteFolder,
  shouldIgnoreTap,
}: {
  allFolders: Folder[];
  allNotebooks: Notebook[];
  darkMode: boolean;
  dragTarget: ItemTarget | null;
  dropFolderId: string | null;
  favoriteFolderIds: string[];
  folder: Folder;
  menuPosition: { x: number; y: number };
  menuTarget: ItemTarget | null;
  onDeleteFolder: (folder: Folder) => void | Promise<void>;
  onFolderColor: (folderId: string, color: string) => void | Promise<void>;
  onFolderIcon: (folderId: string, icon: string) => void | Promise<void>;
  onMoveFolder: (
    folder: Folder,
    folderId: string | null,
  ) => void | Promise<void>;
  onNavigateFolder: (folderId: string | null) => void;
  onRenameFolder: (folder: Folder) => void;
  onSetMenuPosition: (position: { x: number; y: number }) => void;
  onSetMenuTarget: (target: ItemTarget | null) => void;
  onStartPress: (
    item: ItemTarget,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  onToggleFavoriteFolder: (folderId: string) => void;
  shouldIgnoreTap: () => boolean;
}) {
  const Icon = getFolderIcon(folder.icon);
  const itemCount = getFolderItemCount(allFolders, allNotebooks, folder.id);

  return (
    <div className="group relative text-center">
      <button
        type="button"
        data-folder-drop={folder.id}
        onPointerDown={(event) =>
          onStartPress({ id: folder.id, type: "folder" }, event)
        }
        onClick={() => {
          if (shouldIgnoreTap()) return;
          onNavigateFolder(folder.id);
        }}
        className={cn(
          "library-tile-motion relative mx-auto block h-[104px] w-[144px] overflow-visible bg-transparent transition-[transform,opacity,filter] duration-200 ease-out active:scale-[0.97]",
          dropFolderId === folder.id &&
            "rounded-[20px] ring-2 ring-[#7c6a46]/24",
          dragTarget?.type === "folder" &&
            dragTarget.id === folder.id &&
            "scale-[0.94] opacity-35",
        )}
      >
        <span className="absolute inset-x-0 bottom-0 top-4 rounded-[16px]">
          <span
            className="absolute -top-3 left-3 h-6 w-[48%] rounded-t-[11px]"
            style={{ backgroundColor: folder.color }}
          />
          <span
            className="absolute inset-0 rounded-[16px]"
            style={{ backgroundColor: folder.color }}
          />
          <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-[16px] bg-white/16" />
        </span>
        <span className="absolute inset-x-0 bottom-0 top-4 flex items-center justify-center text-white/88">
          <Icon size={30} strokeWidth={1.65} />
        </span>
        <span className="absolute right-3 top-6 rounded-full bg-white/18 px-2 py-0.5 text-[10px] font-semibold text-white/82">
          {itemCount}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onNavigateFolder(folder.id)}
        className="mt-2.5 inline-flex max-w-full items-center justify-center gap-1 text-center text-[15px] font-medium leading-5 text-[var(--library-label)] transition-colors hover:text-[var(--library-label-hover)]"
      >
        <span className="truncate">{folder.name}</span>
        <ChevronRight size={13} className="rotate-90" />
      </button>
      <p
        className={cn(
          "mt-0.5 text-[12px]",
          darkMode ? "text-[#f4efe7]/38" : "text-black/38",
        )}
      >
        {itemCount === 1 ? "1 item" : `${itemCount} items`}
      </p>
      <ObjectMenuButton
        darkMode={darkMode}
        label={`Open menu for ${folder.name}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSetMenuPosition({ x: rect.right + 8, y: rect.top });
          onSetMenuTarget({ id: folder.id, type: "folder" });
        }}
      />
      {menuTarget?.type === "folder" && menuTarget.id === folder.id && (
        <FolderMenu
          folder={folder}
          folders={allFolders}
          darkMode={darkMode}
          position={menuPosition}
          isFavorite={favoriteFolderIds.includes(folder.id)}
          onColor={(color) => onFolderColor(folder.id, color)}
          onIcon={(icon) => onFolderIcon(folder.id, icon)}
          onFavorite={() => onToggleFavoriteFolder(folder.id)}
          onRename={() => {
            onRenameFolder(folder);
            onSetMenuTarget(null);
          }}
          onMove={(folderId) =>
            onMoveFolder(folder, folderId === "root" ? null : folderId)
          }
          onDelete={() => onDeleteFolder(folder)}
        />
      )}
    </div>
  );
}

function NotebookTile({
  allFolders,
  darkMode,
  dragTarget,
  favoriteNotebookIds,
  menuPosition,
  menuTarget,
  notebook,
  onDeleteNotebook,
  onMoveNotebook,
  onNotebookColor,
  onOpenNotebook,
  onRenameNotebook,
  onSetMenuPosition,
  onSetMenuTarget,
  onStartPress,
  onToggleFavoriteNotebook,
  shouldIgnoreTap,
}: {
  allFolders: Folder[];
  darkMode: boolean;
  dragTarget: ItemTarget | null;
  favoriteNotebookIds: string[];
  menuPosition: { x: number; y: number };
  menuTarget: ItemTarget | null;
  notebook: Notebook;
  onDeleteNotebook: (notebookId: string) => void | Promise<void>;
  onMoveNotebook: (
    notebookId: string,
    folderId: string | null,
  ) => void | Promise<void>;
  onNotebookColor: (notebookId: string, color: string) => void | Promise<void>;
  onOpenNotebook: (notebookId: string) => void;
  onRenameNotebook: (notebook: Notebook) => void;
  onSetMenuPosition: (position: { x: number; y: number }) => void;
  onSetMenuTarget: (target: ItemTarget | null) => void;
  onStartPress: (
    item: ItemTarget,
    event: React.PointerEvent<HTMLElement>,
  ) => void;
  onToggleFavoriteNotebook: (notebookId: string) => void;
  shouldIgnoreTap: () => boolean;
}) {
  const isPdf = notebook.kind === "pdf";

  return (
    <div className="group relative text-center">
      <button
        type="button"
        onPointerDown={(event) =>
          onStartPress({ id: notebook.id, type: "notebook" }, event)
        }
        onClick={() => {
          if (shouldIgnoreTap()) return;
          onOpenNotebook(notebook.id);
        }}
        className={cn(
          "library-tile-motion relative mx-auto block h-[136px] w-[102px] overflow-hidden rounded-[10px] border border-black/10 transition-[transform,opacity,filter] duration-200 ease-out active:scale-[0.97]",
          dragTarget?.type === "notebook" &&
            dragTarget.id === notebook.id &&
            "scale-[0.94] opacity-35",
        )}
      >
        <span
          className="absolute inset-0 rounded-[10px]"
          style={{ backgroundColor: notebook.color || "#7C6A46" }}
        />
        <span className="absolute bottom-0 left-0 top-0 w-2.5 bg-black/10" />
        <span className="absolute inset-x-3.5 top-4 h-px bg-white/20" />
        <span className="absolute inset-x-3.5 top-7 h-px bg-white/14" />
        <span className="absolute inset-0 flex items-center justify-center text-white/88">
          {isPdf ? (
            <FileText size={33} strokeWidth={1.6} />
          ) : (
            <BookOpen size={33} strokeWidth={1.6} />
          )}
        </span>
        {isPdf && (
          <span className="absolute bottom-2 right-2 rounded-[5px] bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white/88">
            PDF
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => onOpenNotebook(notebook.id)}
        className="mt-2.5 inline-flex max-w-full items-center justify-center gap-1 text-center text-[15px] font-medium leading-5 text-[var(--library-label)] transition-colors hover:text-[var(--library-label-hover)]"
      >
        <span className="truncate">{notebook.name}</span>
        <ChevronRight size={13} className="rotate-90" />
      </button>
      <p
        className={cn(
          "mt-0.5 text-[12px]",
          darkMode ? "text-[#f4efe7]/38" : "text-black/38",
        )}
      >
        {formatLibraryDate(notebook.updatedAt)}
      </p>
      <ObjectMenuButton
        darkMode={darkMode}
        label={`Open menu for ${notebook.name}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          onSetMenuPosition({ x: rect.right + 8, y: rect.top });
          onSetMenuTarget({ id: notebook.id, type: "notebook" });
        }}
      />
      {menuTarget?.type === "notebook" && menuTarget.id === notebook.id && (
        <NotebookMenu
          darkMode={darkMode}
          position={menuPosition}
          isFavorite={favoriteNotebookIds.includes(notebook.id)}
          notebookColor={notebook.color}
          folders={allFolders}
          onColor={(color) => onNotebookColor(notebook.id, color)}
          onFavorite={() => onToggleFavoriteNotebook(notebook.id)}
          onRename={() => {
            onRenameNotebook(notebook);
            onSetMenuTarget(null);
          }}
          onMove={(folderId) =>
            onMoveNotebook(notebook.id, folderId === "root" ? null : folderId)
          }
          onDelete={() => onDeleteNotebook(notebook.id)}
        />
      )}
    </div>
  );
}
