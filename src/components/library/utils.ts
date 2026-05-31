import type { Folder } from "../../types";

export type FolderTreeRow = Folder & { depth: number };

export function getFolderTreeRows(folders: Folder[]): FolderTreeRow[] {
  const rows: FolderTreeRow[] = [];
  const visited = new Set<string>();

  const childrenByParent = new Map<string, Folder[]>();
  for (const folder of folders) {
    const parentKey = folder.parentId ?? "root";
    childrenByParent.set(parentKey, [
      ...(childrenByParent.get(parentKey) ?? []),
      folder,
    ]);
  }

  for (const children of childrenByParent.values()) {
    children.sort((a, b) => a.name.localeCompare(b.name));
  }

  const appendChildren = (parentId: string, depth: number) => {
    for (const folder of childrenByParent.get(parentId) ?? []) {
      if (visited.has(folder.id)) continue;
      visited.add(folder.id);
      rows.push({ ...folder, depth });
      appendChildren(folder.id, depth + 1);
    }
  };

  appendChildren("root", 0);

  for (const folder of folders) {
    if (visited.has(folder.id)) continue;
    visited.add(folder.id);
    rows.push({ ...folder, depth: 0 });
    appendChildren(folder.id, 1);
  }

  return rows;
}

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
