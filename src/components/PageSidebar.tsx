"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/useAppStore";

export function PageSidebar({ darkMode = false }: { darkMode?: boolean }) {
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
    <div
      className={`w-64 shrink-0 h-full border-r flex flex-col z-20 transition-all duration-300 ${
        darkMode
          ? "border-[#343025] bg-[#201e19]"
          : "border-knote-border/60 bg-knote-surface"
      }`}
    >
      <div
        className={`h-11 flex items-center justify-between px-4 border-b shrink-0 ${
          darkMode ? "border-[#343025]" : "border-knote-border/40"
        }`}
      >
        <span
          className={`text-sm font-semibold tracking-wide uppercase ${
            darkMode ? "text-[#f4efe7]/65" : "text-knote-text/70"
          }`}
        >
          Pages
        </span>
        <button
          type="button"
          onClick={handleAddPage}
          className={`p-1.5 rounded-lg transition-colors ${
            darkMode
              ? "text-[#d9cbb8] hover:bg-white/8"
              : "text-knote-primary hover:bg-black/5"
          }`}
          title="Add Page"
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {pages?.map((page, index) => (
          <div key={page.id} className="relative group">
            <button
              type="button"
              onClick={() => setActivePageId(page.id)}
              className={cn(
                "w-full aspect-[3/4] rounded-xl border-2 flex flex-col overflow-hidden transition-all duration-200",
                activePageId === page.id
                  ? darkMode
                    ? "border-[#d9cbb8] ring-4 ring-[#d9cbb8]/12"
                    : "border-knote-primary ring-4 ring-knote-primary/10"
                  : darkMode
                    ? "border-[#3a352b] hover:border-[#5b5242]"
                    : "border-knote-border/50 hover:border-knote-border",
              )}
            >
              <div className="flex-1 w-full bg-white relative">
                {page.backgroundImage ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${page.backgroundImage})` }}
                  />
                ) : (
                  <>
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,#ffffff_0,#f7f1e8_68%,#eee3d3_100%)]" />
                    <div className="absolute inset-x-2 top-4 h-0.5 bg-black/10 rounded-full" />
                    <div className="absolute inset-x-2 top-6 h-0.5 bg-black/10 rounded-full w-3/4" />
                    <div className="absolute inset-x-2 top-8 h-0.5 bg-black/10 rounded-full w-5/6" />
                  </>
                )}
              </div>
              <div
                className={`shrink-0 h-8 border-t flex items-center justify-center ${
                  darkMode
                    ? "border-[#3a352b] bg-[#151411]"
                    : "border-knote-border/30 bg-black/5"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    darkMode ? "text-[#f4efe7]/55" : "text-knote-text/60"
                  }`}
                >
                  {index + 1}
                </span>
              </div>
            </button>

            {pages.length > 1 && (
              <button
                type="button"
                onClick={(e) => handleDeletePage(e, page.id)}
                className={`absolute -top-2 -right-2 w-7 h-7 border text-knote-danger rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-knote-danger hover:text-white transition-all scale-90 group-hover:scale-100 ${
                  darkMode
                    ? "border-[#40392d] bg-[#201e19]"
                    : "border-knote-border bg-white"
                }`}
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
