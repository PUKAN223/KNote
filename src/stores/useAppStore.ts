import { create } from "zustand";
import type { RedoStrokesByPage, Stroke, Tool } from "../types";

type AppState = {
  // Navigation
  activeNotebookId: string | null;
  activePageId: string | null;

  // Tools
  activeTool: Tool;
  activeColor: string;
  strokeWidth: number;
  redoStrokesByPage: RedoStrokesByPage;

  // UI
  sidebarOpen: boolean;

  // Actions
  setActiveNotebookId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  setActiveTool: (tool: Tool) => void;
  setActiveColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  clearRedoStrokes: (pageId: string) => void;
  pushRedoStroke: (pageId: string, stroke: Stroke) => void;
  popRedoStroke: (pageId: string) => Stroke | null;
  setSidebarOpen: (open: boolean) => void;

  // Navigation helpers
  openNotebook: (notebookId: string) => void;
  closeNotebook: () => void;
};

export const useAppStore = create<AppState>((set) => ({
  activeNotebookId: null,
  activePageId: null,
  activeTool: "pen",
  activeColor: "#2D2D2D",
  strokeWidth: 3,
  redoStrokesByPage: {},
  sidebarOpen: false,

  setActiveNotebookId: (id) => set({ activeNotebookId: id }),
  setActivePageId: (id) => set({ activePageId: id }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  clearRedoStrokes: (pageId) =>
    set((state) => ({
      redoStrokesByPage: { ...state.redoStrokesByPage, [pageId]: [] },
    })),
  pushRedoStroke: (pageId, stroke) =>
    set((state) => ({
      redoStrokesByPage: {
        ...state.redoStrokesByPage,
        [pageId]: [...(state.redoStrokesByPage[pageId] ?? []), stroke],
      },
    })),
  popRedoStroke: (pageId) => {
    let stroke: Stroke | null = null;
    set((state) => {
      const pageStack = state.redoStrokesByPage[pageId] ?? [];
      stroke = pageStack.at(-1) ?? null;

      return {
        redoStrokesByPage: {
          ...state.redoStrokesByPage,
          [pageId]: pageStack.slice(0, -1),
        },
      };
    });
    return stroke;
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  openNotebook: (notebookId) =>
    set({
      activeNotebookId: notebookId,
      activePageId: null,
    }),
  closeNotebook: () =>
    set({
      activeNotebookId: null,
      activePageId: null,
    }),
}));
