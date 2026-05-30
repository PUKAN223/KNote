import Dexie, { type EntityTable } from "dexie";
import type { Folder, Notebook, Page, Stroke } from "../types";

const db = new Dexie("KNoteDB") as Dexie & {
  folders: EntityTable<Folder, "id">;
  notebooks: EntityTable<Notebook, "id">;
  pages: EntityTable<Page, "id">;
  strokes: EntityTable<Stroke, "id">;
};

db.version(3).stores({
  folders: "id, name, parentId, createdAt",
  notebooks: "id, name, folderId, createdAt, updatedAt",
  pages: "id, notebookId, order, createdAt",
  strokes: "id, pageId",
});

db.version(4)
  .stores({
    folders: "id, name, parentId, createdAt, updatedAt",
    notebooks: "id, name, folderId, createdAt, updatedAt",
    pages: "id, notebookId, order, createdAt",
    strokes: "id, pageId",
  })
  .upgrade(async (tx) => {
    await tx
      .table("folders")
      .toCollection()
      .modify((folder) => {
        folder.icon ??= "folder";
        folder.updatedAt ??= folder.createdAt ?? Date.now();
      });
  });

export { db };
