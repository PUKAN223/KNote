"use client";

import { BookOpen, Folder as FolderIcon, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import type { Folder, Notebook } from "../../types";
import { getFolderIcon } from "./icons";

export function LibraryDragLayer({
  darkMode,
  dragPoint,
  dropTrash,
  folder,
  notebook,
}: {
  darkMode: boolean;
  dragPoint: { x: number; y: number };
  dropTrash: boolean;
  folder: Folder | null;
  notebook: Notebook | null;
}) {
  if (!folder && !notebook) return null;

  const FolderPreviewIcon = folder ? getFolderIcon(folder.icon) : FolderIcon;

  return (
    <>
      <div
        className="library-drag-preview pointer-events-none fixed z-[70]"
        style={{ left: dragPoint.x, top: dragPoint.y }}
      >
        {folder && (
          <div className="relative h-[104px] w-[144px]">
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
              <FolderPreviewIcon size={30} strokeWidth={1.65} />
            </span>
          </div>
        )}

        {notebook && (
          <div className="relative h-[136px] w-[102px] overflow-hidden rounded-[10px] border border-black/10">
            <span
              className="absolute inset-0 rounded-[10px]"
              style={{ backgroundColor: notebook.color || "#7C6A46" }}
            />
            <span className="absolute bottom-0 left-0 top-0 w-2.5 bg-black/10" />
            <span className="absolute inset-x-3.5 top-4 h-px bg-white/20" />
            <span className="absolute inset-x-3.5 top-7 h-px bg-white/14" />
            <span className="absolute inset-0 flex items-center justify-center text-white/88">
              <BookOpen size={33} strokeWidth={1.6} />
            </span>
          </div>
        )}
      </div>

      <div
        data-trash-drop="true"
        className={cn(
          "fixed bottom-12 left-1/2 z-40 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full transition-all duration-200",
          dropTrash
            ? "scale-110 bg-red-500 text-white shadow-xl"
            : darkMode
              ? "bg-[#393226]/90 text-[#f4efe7]/70 shadow-lg backdrop-blur"
              : "bg-white/90 text-[#1f1f1f]/70 shadow-lg backdrop-blur",
        )}
      >
        <Trash2 size={24} strokeWidth={dropTrash ? 2.5 : 2} />
      </div>
    </>
  );
}
