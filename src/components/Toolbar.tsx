"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { Eraser, Highlighter, Pen, Pencil, Redo2, Undo2 } from "lucide-react";
import { db } from "../db";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/useAppStore";
import type { Stroke, Tool } from "../types";

const TOOL_COLORS = ["#2D2D2D", "#7C6A46", "#B56A6A", "#5C6B7E", "#6B8E6E"];
const EMPTY_REDO_STACK: Stroke[] = [];

const TOOL_SIZES: Record<Tool, number> = {
  pen: 3,
  pencil: 2,
  highlighter: 12,
  eraser: 20,
};

export function Toolbar() {
  const activeTool = useAppStore((state) => state.activeTool);
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const activeColor = useAppStore((state) => state.activeColor);
  const setActiveColor = useAppStore((state) => state.setActiveColor);
  const setStrokeWidth = useAppStore((state) => state.setStrokeWidth);
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const activePageId = useAppStore((state) => state.activePageId);
  const redoStrokes = useAppStore((state) =>
    activePageId
      ? (state.redoStrokesByPage[activePageId] ?? EMPTY_REDO_STACK)
      : EMPTY_REDO_STACK,
  );
  const pushRedoStroke = useAppStore((state) => state.pushRedoStroke);
  const popRedoStroke = useAppStore((state) => state.popRedoStroke);

  const strokes = useLiveQuery(
    () =>
      activePageId
        ? db.strokes.where("pageId").equals(activePageId).toArray()
        : [],
    [activePageId],
  );

  const canUndo = !!strokes?.length;
  const canRedo = redoStrokes.length > 0;

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setStrokeWidth(TOOL_SIZES[tool]);
  };

  const handleUndo = async () => {
    if (!activePageId || !strokes?.length) return;

    const lastStroke = strokes.at(-1);
    if (!lastStroke) return;

    await db.strokes.delete(lastStroke.id);
    if (activeNotebookId) {
      await db.notebooks.update(activeNotebookId, { updatedAt: Date.now() });
    }
    pushRedoStroke(activePageId, lastStroke);
  };

  const handleRedo = async () => {
    if (!activePageId) return;

    const stroke = popRedoStroke(activePageId);
    if (!stroke) return;

    await db.strokes.put(stroke);
    if (activeNotebookId) {
      await db.notebooks.update(activeNotebookId, { updatedAt: Date.now() });
    }
  };

  const tools: { tool: Tool; icon: React.ElementType; label: string }[] = [
    { tool: "pen", icon: Pen, label: "Pen" },
    { tool: "pencil", icon: Pencil, label: "Pencil" },
    { tool: "highlighter", icon: Highlighter, label: "Highlighter" },
    { tool: "eraser", icon: Eraser, label: "Eraser" },
  ];

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-[20px] glass shadow-xl">
      {/* Drawing Tools */}
      {tools.map(({ tool, icon: Icon }) => (
        <button
          key={tool}
          type="button"
          aria-label={tool}
          onClick={() => handleToolSelect(tool)}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-150",
            activeTool === tool
              ? "bg-knote-primary text-white shadow-md scale-105"
              : "text-knote-text/60 hover:bg-black/5 active:scale-95",
          )}
        >
          <Icon size={20} strokeWidth={activeTool === tool ? 2.5 : 2} />
        </button>
      ))}

      {/* Divider */}
      <div className="w-px h-7 bg-knote-border mx-1" />

      {/* Colors */}
      <div className="flex items-center gap-1.5 mx-1">
        {TOOL_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Use ${color}`}
            onClick={() => setActiveColor(color)}
            className={cn(
              "rounded-full transition-all duration-150",
              activeColor === color
                ? "w-7 h-7 ring-2 ring-offset-2 ring-offset-white/80 ring-knote-text/25 scale-110"
                : "w-6 h-6 hover:scale-110 active:scale-95",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-7 bg-knote-border mx-1" />

      {/* Undo / Redo */}
      <button
        type="button"
        aria-label="Undo"
        disabled={!canUndo}
        onClick={handleUndo}
        className="w-12 h-12 flex items-center justify-center rounded-2xl text-knote-text/55 hover:bg-black/5 active:scale-95 transition-all disabled:text-knote-text/20 disabled:hover:bg-transparent disabled:active:scale-100"
      >
        <Undo2 size={20} />
      </button>
      <button
        type="button"
        aria-label="Redo"
        disabled={!canRedo}
        onClick={handleRedo}
        className="w-12 h-12 flex items-center justify-center rounded-2xl text-knote-text/55 hover:bg-black/5 active:scale-95 transition-all disabled:text-knote-text/20 disabled:hover:bg-transparent disabled:active:scale-100"
      >
        <Redo2 size={20} />
      </button>
    </div>
  );
}
