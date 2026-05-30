"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { cn } from "../lib/utils";
import {
  FOLDER_COLORS,
  type Folder,
  NOTEBOOK_COLORS,
  type Notebook,
} from "../types";
import { LibraryDragLayer } from "./library/DragLayer";
import { LibraryContent, type LibrarySortMode } from "./library/LibraryContent";
import {
  LibraryDeleteDialog,
  LibraryEditDialog,
} from "./library/LibraryDialogs";
import { LibrarySidebar } from "./library/LibrarySidebar";
import { getBreadcrumb, getFolderDepth, isDescendant } from "./library/utils";

type DialogMode = "notebook" | "folder" | "rename-notebook" | "delete-confirm";
type ItemTarget =
  | { id: string; type: "notebook" }
  | { id: string; type: "folder" };
type PressState = {
  item: ItemTarget;
  startX: number;
  startY: number;
  timer: number;
  dragging: boolean;
  longPressed: boolean;
};

const LIBRARY_FOLDER_STORAGE_KEY = "knote:library-current-folder";

function readSavedFolderId() {
  if (typeof window === "undefined") return null;
  const saved = window.sessionStorage.getItem(LIBRARY_FOLDER_STORAGE_KEY);
  return saved === "root" ? null : saved;
}

function saveFolderId(folderId: string | null) {
  window.sessionStorage.setItem(LIBRARY_FOLDER_STORAGE_KEY, folderId ?? "root");
}

export function Library() {
  const router = useRouter();

  const folders = useLiveQuery(() => db.folders.orderBy("createdAt").toArray());
  const notebooks = useLiveQuery(() =>
    db.notebooks.orderBy("updatedAt").reverse().toArray(),
  );

  const [activeFolderId, setActiveFolderId] = useState<string | null>(() =>
    readSavedFolderId(),
  );
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingNotebookId, setEditingNotebookId] = useState<string | null>(
    null,
  );
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>(NOTEBOOK_COLORS[0]);
  const [draftIcon, setDraftIcon] = useState<string>("Folder");
  const [iconSearch, setIconSearch] = useState("");
  const [menuTarget, setMenuTarget] = useState<ItemTarget | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [dragTarget, setDragTarget] = useState<ItemTarget | null>(null);
  const [dragPoint, setDragPoint] = useState({ x: 0, y: 0 });
  const [dropFolderId, setDropFolderId] = useState<string | null>(null);
  const [dropTrash, setDropTrash] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ItemTarget | null>(null);
  const [newMenuOpen, setNewMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortMode, setSortMode] = useState<LibrarySortMode>("date");
  const [folderTransitioning, setFolderTransitioning] = useState(false);
  const folderTransitionTimerRef = useRef<number | null>(null);
  const [favoriteNotebookIds, setFavoriteNotebookIds] = useState<string[]>([]);
  const [favoriteFolderIds, setFavoriteFolderIds] = useState<string[]>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      const saved = window.localStorage.getItem("knote:library-theme");
      if (saved !== null) return saved === "dark";
      return (
        window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false
      );
    } catch {
      return false;
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const pressRef = useRef<PressState | null>(null);
  const suppressClickRef = useRef(false);

  const openNotebookRoute = useCallback(
    (notebookId: string) => {
      saveFolderId(activeFolderId);
      router.push(`/notebooks/${notebookId}`);
    },
    [activeFolderId, router],
  );

  const allFolders = folders ?? [];
  const allNotebooks = notebooks ?? [];
  const activeFolder = allFolders.find(
    (folder) => folder.id === activeFolderId,
  );
  const isSearching = searchTerm.trim().length > 0;

  const folderRows = useMemo(
    () =>
      allFolders
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((folder) => ({
          ...folder,
          depth: getFolderDepth(allFolders, folder),
        })),
    [allFolders],
  );

  const filteredFolders = useMemo(() => {
    if (isSearching) {
      return allFolders.filter((folder) =>
        folder.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      );
    }

    return allFolders.filter((folder) => folder.parentId === activeFolderId);
  }, [activeFolderId, allFolders, isSearching, searchTerm]);

  const filteredNotebooks = useMemo(() => {
    if (isSearching) {
      return allNotebooks.filter((notebook) =>
        notebook.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
      );
    }

    return allNotebooks.filter(
      (notebook) => notebook.folderId === activeFolderId,
    );
  }, [activeFolderId, allNotebooks, isSearching, searchTerm]);

  const sortedFolders = useMemo(() => {
    const sorted = filteredFolders.slice();

    return sorted.sort((a, b) => {
      if (sortMode === "date") return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });
  }, [filteredFolders, sortMode]);

  const sortedNotebooks = useMemo(() => {
    const sorted = filteredNotebooks.slice();

    return sorted.sort((a, b) => {
      if (sortMode === "date") return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });
  }, [filteredNotebooks, sortMode]);

  const favoriteNotebooks = allNotebooks.filter((notebook) =>
    favoriteNotebookIds.includes(notebook.id),
  );
  const favoriteFolders = allFolders.filter((folder) =>
    favoriteFolderIds.includes(folder.id),
  );
  const breadcrumb = getBreadcrumb(allFolders, activeFolderId);

  useLayoutEffect(() => {
    const savedFavorites = window.localStorage.getItem("knote:favorites");
    if (savedFavorites) {
      setFavoriteNotebookIds(JSON.parse(savedFavorites));
    }
    const savedFolderFavorites = window.localStorage.getItem(
      "knote:favorite-folders",
    );
    if (savedFolderFavorites) {
      setFavoriteFolderIds(JSON.parse(savedFolderFavorites));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.localStorage.setItem(
      "knote:favorites",
      JSON.stringify(favoriteNotebookIds),
    );
  }, [favoriteNotebookIds]);

  useEffect(() => {
    window.localStorage.setItem(
      "knote:favorite-folders",
      JSON.stringify(favoriteFolderIds),
    );
  }, [favoriteFolderIds]);

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    window.localStorage.setItem(
      "knote:library-theme",
      darkMode ? "dark" : "light",
    );
  }, [darkMode]);

  useEffect(() => {
    if (dialogMode === "rename-notebook") {
      inputRef.current?.focus({ preventScroll: true });
    }
  }, [dialogMode]);

  const closeDialog = () => {
    setDialogMode(null);
    setEditingFolderId(null);
    setEditingNotebookId(null);
    setDraftName("");
    setDeleteTarget(null);
    setNewMenuOpen(false);
  };

  const navigateToFolder = useCallback((folderId: string | null) => {
    saveFolderId(folderId);

    if (folderTransitionTimerRef.current !== null) {
      window.clearTimeout(folderTransitionTimerRef.current);
    }

    setFolderTransitioning(true);
    folderTransitionTimerRef.current = window.setTimeout(() => {
      setActiveFolderId(folderId);
      setFolderTransitioning(false);
      folderTransitionTimerRef.current = null;
    }, 140);
  }, []);

  useEffect(() => {
    if (!folders || !activeFolderId) return;
    const folderExists = allFolders.some(
      (folder) => folder.id === activeFolderId,
    );
    if (!folderExists) {
      saveFolderId(null);
      setActiveFolderId(null);
    }
  }, [activeFolderId, allFolders, folders]);

  useEffect(() => {
    return () => {
      if (folderTransitionTimerRef.current !== null) {
        window.clearTimeout(folderTransitionTimerRef.current);
      }
    };
  }, []);

  const openNotebookDialog = () => {
    setDialogMode("notebook");
    setDraftName("");
    setDraftColor(NOTEBOOK_COLORS[0]);
    setDraftIcon("folder");
    setEditingFolderId(null);
    setEditingNotebookId(null);
  };

  const openFolderDialog = (folder?: Folder) => {
    setDialogMode("folder");
    setEditingFolderId(folder?.id ?? null);
    setEditingNotebookId(null);
    setDraftName(folder?.name ?? "");
    setDraftColor(folder?.color ?? FOLDER_COLORS[0]);
    setDraftIcon(folder?.icon ?? "Folder");
    setIconSearch("");
  };

  const openNotebookRenameDialog = (notebook: Notebook) => {
    setDialogMode("rename-notebook");
    setEditingFolderId(null);
    setEditingNotebookId(notebook.id);
    setDraftName(notebook.name);
    setDraftColor(NOTEBOOK_COLORS[0]);
    setDraftIcon("folder");
  };

  const handleSubmitDialog = async () => {
    const name =
      draftName.trim() || (dialogMode === "folder" ? "New Folder" : "Untitled");
    const now = Date.now();

    if (dialogMode === "rename-notebook" && editingNotebookId) {
      await db.notebooks.update(editingNotebookId, {
        name,
        updatedAt: now,
      });
      closeDialog();
      return;
    }

    if (dialogMode === "folder") {
      if (editingFolderId) {
        await db.folders.update(editingFolderId, {
          name,
          color: draftColor,
          icon: draftIcon,
          updatedAt: now,
        });
      } else {
        await db.folders.add({
          id: uuidv4(),
          name,
          color: draftColor,
          icon: draftIcon,
          parentId: activeFolderId,
          createdAt: now,
          updatedAt: now,
        });
      }
      closeDialog();
      return;
    }

    if (dialogMode === "notebook") {
      const notebookId = uuidv4();
      await db.notebooks.add({
        id: notebookId,
        name,
        color: draftColor,
        folderId: activeFolderId,
        createdAt: now,
        updatedAt: now,
      });
      await db.pages.add({
        id: uuidv4(),
        notebookId,
        order: 0,
        createdAt: now,
      });
      closeDialog();
    }
  };

  const handleCreateQuickNote = async () => {
    const notebookId = uuidv4();
    const now = Date.now();
    await db.notebooks.add({
      id: notebookId,
      name: "Quick Note",
      color: NOTEBOOK_COLORS[0],
      folderId: activeFolderId,
      createdAt: now,
      updatedAt: now,
    });
    const pageId = uuidv4();
    await db.pages.add({
      id: pageId,
      notebookId,
      order: 0,
      createdAt: now,
    });
    openNotebookRoute(notebookId);
  };

  const handleMoveNotebook = useCallback(
    async (notebookId: string, folderId: string | null) => {
      await db.notebooks.update(notebookId, {
        folderId,
        updatedAt: Date.now(),
      });
      setMenuTarget(null);
    },
    [],
  );

  const handleMoveFolder = useCallback(
    async (folder: Folder, folderId: string | null) => {
      if (folderId === folder.id) return;
      if (folderId && isDescendant(allFolders, folder.id, folderId)) return;

      await db.folders.update(folder.id, {
        parentId: folderId,
        updatedAt: Date.now(),
      });
      setMenuTarget(null);
    },
    [allFolders],
  );

  const moveDraggedItem = useCallback(
    async (item: ItemTarget, folderId: string | null) => {
      if (item.type === "notebook") {
        await handleMoveNotebook(item.id, folderId);
        return;
      }

      const folder = allFolders.find((entry) => entry.id === item.id);
      if (folder) {
        await handleMoveFolder(folder, folderId);
      }
    },
    [allFolders, handleMoveFolder, handleMoveNotebook],
  );

  const handleDeleteNotebook = async (notebookId: string) => {
    const pages = await db.pages
      .where("notebookId")
      .equals(notebookId)
      .toArray();
    for (const page of pages) {
      await db.strokes.where("pageId").equals(page.id).delete();
    }
    await db.pages.where("notebookId").equals(notebookId).delete();
    await db.notebooks.delete(notebookId);
    setFavoriteNotebookIds((ids) => ids.filter((id) => id !== notebookId));
    setMenuTarget(null);
  };

  const handleDeleteFolder = async (folder: Folder) => {
    await db.transaction("rw", db.folders, db.notebooks, async () => {
      await db.folders
        .where("parentId")
        .equals(folder.id)
        .modify({ parentId: folder.parentId });
      await db.notebooks
        .where("folderId")
        .equals(folder.id)
        .modify({ folderId: folder.parentId });
      await db.folders.delete(folder.id);
    });
    if (activeFolderId === folder.id) {
      setActiveFolderId(folder.parentId);
    }
    setFavoriteFolderIds((ids) => ids.filter((id) => id !== folder.id));
    setMenuTarget(null);
  };

  const toggleFavorite = (notebookId: string) => {
    setFavoriteNotebookIds((ids) =>
      ids.includes(notebookId)
        ? ids.filter((id) => id !== notebookId)
        : [...ids, notebookId],
    );
    setMenuTarget(null);
  };

  const toggleFavoriteFolder = (folderId: string) => {
    setFavoriteFolderIds((ids) =>
      ids.includes(folderId)
        ? ids.filter((id) => id !== folderId)
        : [...ids, folderId],
    );
    setMenuTarget(null);
  };

  const handleNotebookColor = async (notebookId: string, color: string) => {
    await db.notebooks.update(notebookId, {
      color,
      updatedAt: Date.now(),
    });
  };

  const handleFolderColor = async (folderId: string, color: string) => {
    await db.folders.update(folderId, {
      color,
      updatedAt: Date.now(),
    });
  };

  const handleFolderIcon = async (folderId: string, icon: string) => {
    await db.folders.update(folderId, {
      icon,
      updatedAt: Date.now(),
    });
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press) return;

      const distance = Math.hypot(
        event.clientX - press.startX,
        event.clientY - press.startY,
      );

      if (distance > 12 && !press.dragging) {
        window.clearTimeout(press.timer);
        press.dragging = true;
        setMenuTarget(null);
        setDragTarget(press.item);
      }

      if (!press.dragging) return;

      setDragPoint({ x: event.clientX, y: event.clientY });
      const dropElement = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-folder-drop], [data-trash-drop]");

      setDropFolderId(dropElement?.dataset.folderDrop ?? null);
      setDropTrash(!!dropElement?.dataset.trashDrop);
    };

    const handlePointerUp = async (event: PointerEvent) => {
      const press = pressRef.current;
      if (!press) return;

      window.clearTimeout(press.timer);
      pressRef.current = null;

      if (press.dragging) {
        const dropElement = document
          .elementFromPoint(event.clientX, event.clientY)
          ?.closest<HTMLElement>("[data-folder-drop], [data-trash-drop]");
        const folderId = dropElement?.dataset.folderDrop;
        const isTrash = !!dropElement?.dataset.trashDrop;

        if (isTrash) {
          setDeleteTarget(press.item);
          setDialogMode("delete-confirm");
        } else if (folderId) {
          await moveDraggedItem(
            press.item,
            folderId === "root" ? null : folderId,
          );
        }
      }

      if (press.dragging || press.longPressed) {
        suppressClickRef.current = true;
        window.setTimeout(() => {
          suppressClickRef.current = false;
        }, 80);
      }

      setDragTarget(null);
      setDropFolderId(null);
      setDropTrash(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [moveDraggedItem]);

  const startPress = (
    item: ItemTarget,
    event: React.PointerEvent<HTMLElement>,
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const menuX = event.clientX + 12;
    const menuY = event.clientY + 12;

    pressRef.current = {
      item,
      startX: event.clientX,
      startY: event.clientY,
      timer: window.setTimeout(() => {
        if (!pressRef.current || pressRef.current.dragging) return;
        pressRef.current.longPressed = true;
        setMenuPosition({ x: menuX, y: menuY });
        setMenuTarget(item);
      }, 520),
      dragging: false,
      longPressed: false,
    };
    setDragPoint({ x: event.clientX, y: event.clientY });
  };

  const shouldIgnoreTap = () => {
    const press = pressRef.current;
    return (
      suppressClickRef.current || !!press?.dragging || !!press?.longPressed
    );
  };
  const draggedFolder =
    dragTarget?.type === "folder"
      ? allFolders.find((folder) => folder.id === dragTarget.id)
      : null;
  const draggedNotebook =
    dragTarget?.type === "notebook"
      ? allNotebooks.find((notebook) => notebook.id === dragTarget.id)
      : null;
  const libraryThemeVars = {
    "--library-label": darkMode ? "#d9cbb8" : "#6f6046",
    "--library-label-hover": darkMode ? "#f0e3d1" : "#4e432f",
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        "page-enter fixed inset-0 flex transition-colors duration-300",
        darkMode
          ? "bg-[#151411] text-[#f4efe7]"
          : "bg-[#fbfaf6] text-[#1f1f1f]",
      )}
      style={libraryThemeVars}
    >
      <LibrarySidebar
        activeFolderId={activeFolderId}
        allFolders={allFolders}
        allNotebooks={allNotebooks}
        darkMode={darkMode}
        dropFolderId={dropFolderId}
        favoriteFolders={favoriteFolders}
        favoriteNotebooks={favoriteNotebooks}
        folderRows={folderRows}
        searchTerm={searchTerm}
        sidebarMinimized={sidebarMinimized}
        onNavigateFolder={navigateToFolder}
        onOpenNotebook={openNotebookRoute}
        onSearchChange={setSearchTerm}
        onToggleMinimized={() => setSidebarMinimized((value) => !value)}
      />

      <LibraryContent
        activeFolder={activeFolder}
        allFolders={allFolders}
        allNotebooks={allNotebooks}
        breadcrumb={breadcrumb}
        darkMode={darkMode}
        dragTarget={dragTarget}
        dropFolderId={dropFolderId}
        favoriteFolderIds={favoriteFolderIds}
        favoriteNotebookIds={favoriteNotebookIds}
        filteredFolders={sortedFolders}
        filteredNotebooks={sortedNotebooks}
        folderTransitioning={folderTransitioning}
        isSearching={isSearching}
        menuPosition={menuPosition}
        menuTarget={menuTarget}
        newMenuOpen={newMenuOpen}
        onCreateQuickNote={handleCreateQuickNote}
        onDeleteFolder={handleDeleteFolder}
        onDeleteNotebook={handleDeleteNotebook}
        onFolderColor={handleFolderColor}
        onFolderIcon={handleFolderIcon}
        onMoveFolder={handleMoveFolder}
        onMoveNotebook={handleMoveNotebook}
        onNavigateFolder={navigateToFolder}
        onNewFolder={() => openFolderDialog()}
        onNewNotebook={openNotebookDialog}
        onNotebookColor={handleNotebookColor}
        onOpenNotebook={openNotebookRoute}
        onRenameFolder={openFolderDialog}
        onRenameNotebook={openNotebookRenameDialog}
        onSetDarkMode={setDarkMode}
        onSetMenuPosition={setMenuPosition}
        onSetMenuTarget={setMenuTarget}
        onSetNewMenuOpen={setNewMenuOpen}
        onSetSidebarMinimized={setSidebarMinimized}
        onStartPress={startPress}
        onToggleFavoriteFolder={toggleFavoriteFolder}
        onToggleFavoriteNotebook={toggleFavorite}
        shouldIgnoreTap={shouldIgnoreTap}
        sortMode={sortMode}
        onSortModeChange={setSortMode}
      />

      <LibraryDragLayer
        darkMode={darkMode}
        dragPoint={dragPoint}
        dropTrash={dropTrash}
        folder={draggedFolder ?? null}
        notebook={draggedNotebook ?? null}
      />

      {dialogMode === "delete-confirm" && (
        <LibraryDeleteDialog
          darkMode={darkMode}
          target={deleteTarget}
          onClose={closeDialog}
          onConfirm={async () => {
            if (!deleteTarget) return;
            if (deleteTarget.type === "notebook") {
              await handleDeleteNotebook(deleteTarget.id);
            } else {
              const folder = allFolders.find(
                (item) => item.id === deleteTarget.id,
              );
              if (folder) await handleDeleteFolder(folder);
            }
            closeDialog();
          }}
        />
      )}

      <LibraryEditDialog
        darkMode={darkMode}
        dialogMode={dialogMode === "delete-confirm" ? null : dialogMode}
        draftColor={draftColor}
        draftIcon={draftIcon}
        draftName={draftName}
        editingFolderId={editingFolderId}
        iconSearch={iconSearch}
        inputRef={inputRef}
        onClose={closeDialog}
        onDraftColor={setDraftColor}
        onDraftIcon={setDraftIcon}
        onDraftName={setDraftName}
        onIconSearch={setIconSearch}
        onSubmit={handleSubmitDialog}
      />

      {menuTarget && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30"
          onClick={() => setMenuTarget(null)}
        />
      )}
    </div>
  );
}
