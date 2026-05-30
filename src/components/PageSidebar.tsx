"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/useAppStore";

export function PageSidebar() {
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const activePageId = useAppStore((state) => state.activePageId);
  const setActivePageId = useAppStore((state) => state.setActivePageId);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);

  const pages = useLiveQuery(
    () =>
      activeNotebookId
        ? db.pages.where("notebookId").equals(activeNotebookId).sortBy("order")
        : [],
    [activeNotebookId],
  );

  const strokes = useLiveQuery(
    () => (activeNotebookId ? db.strokes.toArray() : []),
    [activeNotebookId],
  ); // For thumbnail preview if we wanted to render tiny SVGs, but for now we'll just show page numbers.

  const handleAddPage = async () => {
    if (!activeNotebookId || !pages) return;
    const id = uuidv4();
    await db.pages.add({
      id,
      notebookId: activeNotebookId,
      order: pages.length,
      createdAt: Date.now(),
    });
    setActivePageId(id);
  };

  const handleDeletePage = async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    if (!pages || pages.length <= 1) return; // Don't delete last page

    await db.strokes.where("pageId").equals(pageId).delete();
    await db.pages.delete(pageId);

    if (activePageId === pageId) {
      const remaining = pages.filter((p) => p.id !== pageId);
      setActivePageId(remaining[0].id);
    }
  };

  if (!sidebarOpen) return null;

  return (
    <div className="w-64 shrink-0 h-full bg-knote-surface border-r border-knote-border/60 flex flex-col shadow-sm z-20 transition-all duration-300">
      <div className="h-11 flex items-center justify-between px-4 border-b border-knote-border/40 shrink-0">
        <span className="text-sm font-semibold tracking-wide text-knote-text/70 uppercase">
          Pages
        </span>
        <button
          onClick={handleAddPage}
          className="p-1.5 text-knote-primary hover:bg-black/5 rounded-lg transition-colors"
          title="Add Page"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pages?.map((page, index) => (
          <div key={page.id} className="relative group">
            <button
              onClick={() => setActivePageId(page.id)}
              className={cn(
                "w-full aspect-[3/4] rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-200",
                activePageId === page.id
                  ? "border-knote-primary shadow-md ring-4 ring-knote-primary/10"
                  : "border-knote-border/50 hover:border-knote-border hover:shadow-sm",
              )}
            >
              <div className="flex-1 w-full bg-white relative">
                {/* Simplified page preview graphic */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#ffffff_0,#f7f1e8_68%,#eee3d3_100%)]" />
                <div className="absolute inset-x-2 top-4 h-0.5 bg-black/10 rounded-full" />
                <div className="absolute inset-x-2 top-6 h-0.5 bg-black/10 rounded-full w-3/4" />
                <div className="absolute inset-x-2 top-8 h-0.5 bg-black/10 rounded-full w-5/6" />
              </div>
              <div className="shrink-0 h-8 bg-black/5 border-t border-knote-border/30 flex items-center justify-center">
                <span className="text-xs font-medium text-knote-text/60">
                  {index + 1}
                </span>
              </div>
            </button>

            {pages.length > 1 && (
              <button
                onClick={(e) => handleDeletePage(e, page.id)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-white border border-knote-border text-knote-danger rounded-full shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-knote-danger hover:text-white transition-all scale-90 group-hover:scale-100"
                title="Delete Page"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
