import { create } from "zustand";
import type { RedoStrokesByPage, SelectionMode, Stroke, Tool } from "../types";

const OPEN_NOTEBOOK_TABS_KEY = "knote:open-notebook-tabs";

function uniqueIds(ids: string[]) {
  return Array.from(new Set(ids));
}

function readOpenNotebookTabs() {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(OPEN_NOTEBOOK_TABS_KEY) ?? "[]",
    );
    return Array.isArray(parsed)
      ? uniqueIds(
          parsed.filter((item): item is string => typeof item === "string"),
        )
      : [];
  } catch {
    return [];
  }
}

function writeOpenNotebookTabs(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(OPEN_NOTEBOOK_TABS_KEY, JSON.stringify(ids));
}

type AppState = {
  // Navigation
  activeNotebookId: string | null;
  activePageId: string | null;
  openNotebookIds: string[];

  // Tools
  activeTool: Tool;
  activeColor: string;
  strokeWidth: number;
  selectionMode: SelectionMode;
  redoStrokesByPage: RedoStrokesByPage;

  // UI
  sidebarOpen: boolean;

  // Actions
  setActiveNotebookId: (id: string | null) => void;
  setActivePageId: (id: string | null) => void;
  closeNotebookTab: (id: string) => void;
  setActiveTool: (tool: Tool) => void;
  setActiveColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setSelectionMode: (mode: SelectionMode) => void;
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
  openNotebookIds: readOpenNotebookTabs(),
  activeTool: "pen",
  activeColor: "#2D2D2D",
  strokeWidth: 3,
  selectionMode: "rectangle",
  redoStrokesByPage: {},
  sidebarOpen: false,

  setActiveNotebookId: (id) => set({ activeNotebookId: id }),
  setActivePageId: (id) => set({ activePageId: id }),
  closeNotebookTab: (id) =>
    set((state) => {
      const openNotebookIds = state.openNotebookIds.filter(
        (notebookId) => notebookId !== id,
      );
      writeOpenNotebookTabs(openNotebookIds);
      const activeNotebookId =
        state.activeNotebookId === id
          ? (openNotebookIds.at(-1) ?? null)
          : state.activeNotebookId;

      return {
        openNotebookIds,
        activeNotebookId,
        activePageId: state.activeNotebookId === id ? null : state.activePageId,
      };
    }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveColor: (color) => set({ activeColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setSelectionMode: (selectionMode) => set({ selectionMode }),
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
    set((state) => {
      const openNotebookIds = state.openNotebookIds.includes(notebookId)
        ? state.openNotebookIds
        : [...state.openNotebookIds, notebookId];
      writeOpenNotebookTabs(openNotebookIds);

      return {
        activeNotebookId: notebookId,
        activePageId: null,
        openNotebookIds,
      };
    }),
  closeNotebook: () =>
    set({
      activeNotebookId: null,
      activePageId: null,
    }),
}));
