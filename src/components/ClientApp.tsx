"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, LayoutGrid, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { Canvas } from "../features/canvas/Canvas";
import { useAppStore } from "../stores/useAppStore";
import { Library } from "./Library";
import { PageSidebar } from "./PageSidebar";
import { Toolbar } from "./Toolbar";

export function ClientApp({
  initialNotebookId = null,
}: {
  initialNotebookId?: string | null;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const closeNotebook = useAppStore((state) => state.closeNotebook);
  const openNotebook = useAppStore((state) => state.openNotebook);
  const activePageId = useAppStore((state) => state.activePageId);
  const setActivePageId = useAppStore((state) => state.setActivePageId);
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  const notebookId = initialNotebookId;

  useEffect(() => {
    if (notebookId) {
      openNotebook(notebookId);
    } else {
      closeNotebook();
    }
  }, [notebookId, openNotebook, closeNotebook]);

  const notebook = useLiveQuery(
    () => (notebookId ? db.notebooks.get(notebookId) : undefined),
    [notebookId],
  );
  const pages = useLiveQuery(
    () =>
      notebookId
        ? db.pages.where("notebookId").equals(notebookId).sortBy("order")
        : [],
    [notebookId],
  );

  // Auto-select first page when opening notebook
  useEffect(() => {
    if (pages && pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId, setActivePageId]);

  const handleAddPage = async () => {
    if (!notebookId || !pages) return;
    const id = uuidv4();
    await db.pages.add({
      id,
      notebookId,
      order: pages.length,
      createdAt: Date.now(),
    });
    setActivePageId(id);
  };

  const currentPageIndex = pages?.findIndex((p) => p.id === activePageId) ?? -1;

  const goPage = (delta: number) => {
    if (!pages) return;
    const next = currentPageIndex + delta;
    if (next >= 0 && next < pages.length) {
      setActivePageId(pages[next].id);
    }
  };

  const handleCloseNotebook = () => {
    router.push("/");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-knote-bg">
        <div className="text-knote-primary/60 text-lg font-medium tracking-wide">
          KNote
        </div>
      </div>
    );
  }

  // Library view — no notebook selected
  if (!notebookId) {
    return <Library />;
  }

  // Writing view — ~85% canvas, minimal chrome
  return (
    <div className="h-screen w-screen flex flex-col bg-knote-bg overflow-hidden page-enter">
      {/* Minimal top bar — barely visible, feels native */}
      <div className="shrink-0 h-11 flex items-center justify-between px-4 bg-knote-surface border-b border-knote-border/60 z-30 relative">
        {/* Left Side: Back & Sidebar Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCloseNotebook}
            className="flex items-center gap-0.5 text-knote-primary font-medium text-[15px] h-9 px-2 -ml-2 rounded-xl active:bg-black/5 hover:bg-black/5 transition-colors"
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-px h-5 bg-knote-border mx-1" />

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
              sidebarOpen
                ? "bg-knote-primary/10 text-knote-primary"
                : "text-knote-text/60 hover:bg-black/5 active:scale-95"
            }`}
            title="Toggle Pages"
          >
            <LayoutGrid size={18} strokeWidth={sidebarOpen ? 2.5 : 2} />
          </button>
        </div>

        {/* Notebook title */}
        <span className="text-[15px] font-medium text-knote-text/70 truncate max-w-[200px]">
          {notebook?.name}
        </span>

        {/* Page nav */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goPage(-1)}
            disabled={currentPageIndex <= 0}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-knote-text/50 hover:bg-black/5 disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-medium text-knote-text/40 tabular-nums min-w-[36px] text-center">
            {currentPageIndex + 1} / {pages?.length ?? 0}
          </span>
          <button
            type="button"
            onClick={() => goPage(1)}
            disabled={!pages || currentPageIndex >= pages.length - 1}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-knote-text/50 hover:bg-black/5 disabled:opacity-20 active:scale-90 transition-all"
          >
            <ChevronRight size={18} />
          </button>
          <button
            type="button"
            onClick={handleAddPage}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-knote-text/40 hover:bg-black/5 active:scale-90 transition-all ml-1"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 relative overflow-hidden flex">
        <PageSidebar />
        <div className="flex-1 relative h-full">
          <Canvas />
          <Toolbar />
        </div>
      </div>
    </div>
  );
}
