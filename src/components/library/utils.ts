import type { Folder } from "../../types";

export function isDescendant(
  folders: Folder[],
  folderId: string,
  maybeDescendantId: string,
) {
  let current = folders.find((folder) => folder.id === maybeDescendantId);

  while (current?.parentId) {
    if (current.parentId === folderId) return true;
    current = folders.find((folder) => folder.id === current?.parentId);
  }

  return false;
}

export function getFolderDepth(folders: Folder[], folder: Folder) {
  let depth = 0;
  let current = folder;

  while (current.parentId) {
    const parent = folders.find((item) => item.id === current.parentId);
    if (!parent) break;
    depth += 1;
    current = parent;
  }

  return depth;
}

export function getBreadcrumb(folders: Folder[], folderId: string | null) {
  const path: Folder[] = [];
  let current = folders.find((folder) => folder.id === folderId);

  while (current) {
    path.unshift(current);
    current = folders.find((folder) => folder.id === current?.parentId);
  }

  return path;
}

export function getFolderItemCount(
  folders: Folder[],
  notebooks: { folderId: string | null }[],
  folderId: string,
): number {
  const childFolders = folders.filter((folder) => folder.parentId === folderId);
  const directNotebooks = notebooks.filter(
    (notebook) => notebook.folderId === folderId,
  ).length;

  return childFolders.reduce(
    (count, folder) =>
      count + 1 + getFolderItemCount(folders, notebooks, folder.id),
    directNotebooks,
  );
}

export function formatLibraryDate(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(timestamp);
}
