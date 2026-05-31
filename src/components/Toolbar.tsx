"use client";

import { useLiveQuery } from "dexie-react-hooks";
import {
  Brush,
  ChevronDown,
  Circle,
  EllipsisVertical,
  Eraser,
  Highlighter,
  Minus,
  MousePointer2,
  Pen,
  Pencil,
  Plus,
  Redo2,
  Shapes,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { db } from "../db";
import { cn } from "../lib/utils";
import { useAppStore } from "../stores/useAppStore";
import type { Stroke, Tool } from "../types";

const TOOL_COLORS = [
  "#262421",
  "#7C6A46",
  "#B56A6A",
  "#4F6F8F",
  "#5F8A6D",
  "#D8A428",
];
const HIGHLIGHT_COLORS = [
  "#F4CF58",
  "#9AD7A8",
  "#87C4F4",
  "#F3A6B4",
  "#C8B5F4",
];
const SHAPE_COLORS = ["#262421", "#7C6A46", "#B56A6A", "#4F6F8F", "#5F8A6D"];
const EMPTY_REDO_STACK: Stroke[] = [];
const TOOLBAR_POSITION_KEY = "knote:toolbar-position";

const TOOL_SIZES: Record<Tool, number> = {
  pen: 3,
  pencil: 2,
  brush: 5,
  marker: 6,
  highlighter: 12,
  shape: 4,
  eraser: 20,
  selection: 1,
};

const sortStrokesByTime = (strokes: Stroke[]) =>
  [...strokes].sort((a, b) => {
    const timeA = a.createdAt ?? 0;
    const timeB = b.createdAt ?? 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });

type ToolbarPosition = "top" | "right" | "bottom" | "left";
type ToolCategory = "brush" | "highlighter" | "shape" | "eraser" | "selection";
type ToolbarPlacement = {
  dock: ToolbarPosition | "free";
  x: number;
  y: number;
};

function readToolbarPlacement(): ToolbarPlacement {
  const fallback: ToolbarPlacement = { dock: "bottom", x: 0, y: 0 };
  if (typeof window === "undefined") return fallback;
  const saved = window.localStorage.getItem(TOOLBAR_POSITION_KEY);
  if (
    saved === "top" ||
    saved === "right" ||
    saved === "bottom" ||
    saved === "left"
  ) {
    return { dock: saved, x: 0, y: 0 };
  }

  try {
    const parsed = JSON.parse(saved ?? "");
    if (
      parsed &&
      (parsed.dock === "top" ||
        parsed.dock === "right" ||
        parsed.dock === "bottom" ||
        parsed.dock === "left" ||
        parsed.dock === "free") &&
      typeof parsed.x === "number" &&
      typeof parsed.y === "number"
    ) {
      return parsed;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function Toolbar({ darkMode = false }: { darkMode?: boolean }) {
  const [placement, setPlacement] =
    useState<ToolbarPlacement>(readToolbarPlacement);
  const [dragging, setDragging] = useState(false);
  const [openSettings, setOpenSettings] = useState<ToolCategory | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const activeTool = useAppStore((state) => state.activeTool);
  const setActiveTool = useAppStore((state) => state.setActiveTool);
  const activeColor = useAppStore((state) => state.activeColor);
  const setActiveColor = useAppStore((state) => state.setActiveColor);
  const strokeWidth = useAppStore((state) => state.strokeWidth);
  const setStrokeWidth = useAppStore((state) => state.setStrokeWidth);
  const selectionMode = useAppStore((state) => state.selectionMode);
  const setSelectionMode = useAppStore((state) => state.setSelectionMode);
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const activePageId = useAppStore((state) => state.activePageId);
  const redoStrokes = useAppStore((state) =>
    activePageId
      ? (state.redoStrokesByPage[activePageId] ?? EMPTY_REDO_STACK)
      : EMPTY_REDO_STACK,
  );
  const pushRedoStroke = useAppStore((state) => state.pushRedoStroke);
  const popRedoStroke = useAppStore((state) => state.popRedoStroke);

  const strokes = useLiveQuery(async () => {
    if (!activePageId) return [];
    const pageStrokes = await db.strokes
      .where("pageId")
      .equals(activePageId)
      .toArray();
    return sortStrokesByTime(pageStrokes);
  }, [activePageId]);

  const canUndo = !!strokes?.length;
  const canRedo = redoStrokes.length > 0;

  const handleToolSelect = (tool: Tool) => {
    setActiveTool(tool);
    setOpenSettings(null);
    if (tool === "selection") return;
    setStrokeWidth(TOOL_SIZES[tool]);
  };

  const handleUndo = async () => {
    if (!activePageId || !strokes?.length) return;

    const lastStroke = sortStrokesByTime(strokes).at(-1);
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

    await db.strokes.put({
      ...stroke,
      createdAt: stroke.createdAt ?? Date.now(),
    });
    if (activeNotebookId) {
      await db.notebooks.update(activeNotebookId, { updatedAt: Date.now() });
    }
  };

  const BrushIcon =
    activeTool === "pen"
      ? Pen
      : activeTool === "pencil"
        ? Pencil
        : activeTool === "marker"
          ? Circle
          : Brush;

  const tools: {
    category: ToolCategory;
    tool: Tool;
    icon: React.ElementType;
    label: string;
  }[] = [
    { category: "brush", tool: "brush", icon: BrushIcon, label: "Brush" },
    {
      category: "highlighter",
      tool: "highlighter",
      icon: Highlighter,
      label: "Highlight",
    },
    { category: "shape", tool: "shape", icon: Shapes, label: "Shape" },
    { category: "eraser", tool: "eraser", icon: Eraser, label: "Eraser" },
    {
      category: "selection",
      tool: "selection",
      icon: MousePointer2,
      label: "Selection",
    },
  ];

  const getCategoryActive = (category: ToolCategory) => {
    if (category === "brush") {
      return (
        activeTool === "pen" ||
        activeTool === "pencil" ||
        activeTool === "brush" ||
        activeTool === "marker"
      );
    }
    return activeTool === category;
  };

  const getCategoryColor = (category: ToolCategory) => {
    if (category === "eraser") return "#d8d1c4";
    if (category === "selection") return "#4F6F8F";
    return activeColor;
  };

  const changeWidth = (delta: number) => {
    setStrokeWidth(Math.min(32, Math.max(1, strokeWidth + delta)));
  };

  useEffect(() => {
    window.localStorage.setItem(
      TOOLBAR_POSITION_KEY,
      JSON.stringify(placement),
    );
  }, [placement]);

  const positionClass = (() => {
    switch (placement.dock) {
      case "top":
        return "top-5 left-1/2 -translate-x-1/2 flex-row max-w-[calc(100%-1.5rem)] overflow-x-auto";
      case "right":
        return "right-5 top-1/2 -translate-y-1/2 flex-col max-h-[calc(100%-1.5rem)] overflow-y-auto";
      case "left":
        return "left-5 top-1/2 -translate-y-1/2 flex-col max-h-[calc(100%-1.5rem)] overflow-y-auto";
      case "free":
        return "flex-row max-w-[calc(100%-1.5rem)] overflow-x-auto";
      default:
        return "bottom-6 left-1/2 -translate-x-1/2 flex-row max-w-[calc(100%-1.5rem)] overflow-x-auto";
    }
  })();

  const vertical = placement.dock === "left" || placement.dock === "right";

  const updatePopoverPosition = useCallback((category: ToolCategory) => {
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    const button = toolbar?.querySelector(
      `[data-settings-button="${category}"]`,
    ) as HTMLButtonElement | null;
    if (!toolbar || !parent || !button) return;

    const parentRect = parent.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    const popoverW = 288;
    const popoverH = 268;
    const buttonCenterX =
      buttonRect.left - parentRect.left + buttonRect.width / 2;
    const x = buttonCenterX - popoverW / 2;
    let y = buttonRect.top - parentRect.top - popoverH - 10;

    if (y < 8) {
      y = buttonRect.bottom - parentRect.top + 10;
    }

    setPopoverPosition({
      x: Math.min(Math.max(8, x), Math.max(8, parentRect.width - popoverW - 8)),
      y: Math.min(
        Math.max(8, y),
        Math.max(8, parentRect.height - popoverH - 8),
      ),
    });
  }, []);

  useEffect(() => {
    if (!openSettings) return;
    const frame = requestAnimationFrame(() =>
      updatePopoverPosition(openSettings),
    );
    return () => cancelAnimationFrame(frame);
  }, [openSettings, updatePopoverPosition]);

  useEffect(() => {
    if (!openSettings) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest("[data-toolbar-root]") ||
        target?.closest("[data-toolbar-popover]")
      ) {
        return;
      }
      setOpenSettings(null);
    };
    window.addEventListener("pointerdown", close, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", close, { capture: true });
  }, [openSettings]);

  const clampFreePosition = (x: number, y: number) => {
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    if (!toolbar || !parent) return { x, y };

    const parentRect = parent.getBoundingClientRect();
    const toolbarRect = toolbar.getBoundingClientRect();
    return {
      x: Math.min(
        Math.max(8, x),
        Math.max(8, parentRect.width - toolbarRect.width - 8),
      ),
      y: Math.min(
        Math.max(8, y),
        Math.max(8, parentRect.height - toolbarRect.height - 8),
      ),
    };
  };

  const getDockFromPoint = (x: number, y: number): ToolbarPosition | null => {
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    if (!parent) return null;

    const parentRect = parent.getBoundingClientRect();
    const distances = [
      { dock: "top" as const, value: y },
      {
        dock: "right" as const,
        value: parentRect.width - (x + toolbar.getBoundingClientRect().width),
      },
      {
        dock: "bottom" as const,
        value: parentRect.height - (y + toolbar.getBoundingClientRect().height),
      },
      { dock: "left" as const, value: x },
    ].sort((a, b) => a.value - b.value);

    return distances[0].value <= 72 ? distances[0].dock : null;
  };

  const beginDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const toolbar = toolbarRef.current;
    const parent = toolbar?.parentElement;
    if (!toolbar || !parent) return;
    const toolbarRect = toolbar.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    setDragging(true);
    dragRef.current = {
      offsetX: event.clientX - toolbarRect.left,
      offsetY: event.clientY - toolbarRect.top,
    };
    setPlacement({
      dock: "free",
      x: toolbarRect.left - parentRect.left,
      y: toolbarRect.top - parentRect.top,
    });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (dragRafRef.current !== null) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const drag = dragRef.current;
      const parent = toolbarRef.current?.parentElement;
      if (!dragging || !drag || !parent) return;
      const parentRect = parent.getBoundingClientRect();
      const next = clampFreePosition(
        event.clientX - parentRect.left - drag.offsetX,
        event.clientY - parentRect.top - drag.offsetY,
      );
      setPlacement({ dock: "free", ...next });
    });
  };

  const endDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!dragging) return;
    const parent = toolbarRef.current?.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const drag = dragRef.current;
    if (parentRect && drag) {
      const x = event.clientX - parentRect.left - drag.offsetX;
      const y = event.clientY - parentRect.top - drag.offsetY;
      const next = clampFreePosition(x, y);
      const dock = getDockFromPoint(next.x, next.y);
      setPlacement(dock ? { dock, x: 0, y: 0 } : { dock: "free", ...next });
    }
    setDragging(false);
    dragRef.current = null;
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  return (
    <>
      <div
        ref={toolbarRef}
        data-toolbar-root
        className={`absolute z-40 flex items-center gap-2 rounded-[22px] border px-2.5 py-2 backdrop-blur-2xl transition-[background-color,border-color,left,top,transform,opacity,box-shadow] duration-300 ease-out [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${positionClass} ${
          dragging ? "scale-[1.03] opacity-90 shadow-2xl" : "shadow-lg"
        } ${
          darkMode
            ? "border-white/10 bg-[#201e19]/90"
            : "border-white/70 bg-white/86"
        }`}
        style={
          placement.dock === "free"
            ? {
                left: placement.x,
                top: placement.y,
                willChange: "left, top",
              }
            : undefined
        }
        onPointerDown={(event) => event.stopPropagation()}
        onPointerMove={(event) => event.stopPropagation()}
        onPointerUp={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onTouchEnd={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Move toolbar"
          title="Move toolbar"
          onPointerDown={beginDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`flex h-11 w-9 shrink-0 touch-none items-center justify-center rounded-2xl transition-all active:scale-95 ${
            darkMode
              ? "text-[#f4efe7]/44 hover:bg-white/8"
              : "text-knote-text/38 hover:bg-black/5"
          }`}
        >
          <EllipsisVertical size={17} />
        </button>

        <div
          className={`flex rounded-[18px] ${
            vertical ? "flex-col" : "items-center"
          } gap-1`}
        >
          {tools.map(({ category, tool, icon: Icon, label }) => (
            <div
              key={category}
              className={`flex shrink-0 overflow-hidden rounded-2xl transition-colors ${
                getCategoryActive(category)
                  ? darkMode
                    ? "bg-[#f4efe7] text-[#201e19]"
                    : "bg-knote-text text-white"
                  : darkMode
                    ? "text-[#f4efe7]/62 hover:bg-white/8"
                    : "text-knote-text/60 hover:bg-black/5"
              }`}
            >
              <button
                type="button"
                aria-label={label}
                title={label}
                onClick={() => handleToolSelect(tool)}
                className="flex h-11 w-10 items-center justify-center transition-transform active:scale-95"
              >
                <span className="relative">
                  <Icon
                    size={19}
                    strokeWidth={getCategoryActive(category) ? 2.5 : 2}
                  />
                  <span
                    className={`absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full border ${
                      getCategoryActive(category)
                        ? darkMode
                          ? "border-[#f4efe7]"
                          : "border-knote-text"
                        : darkMode
                          ? "border-[#201e19]"
                          : "border-white"
                    }`}
                    style={{ backgroundColor: getCategoryColor(category) }}
                  />
                </span>
              </button>
              <button
                type="button"
                data-settings-button={category}
                aria-label={`${label} settings`}
                title={`${label} settings`}
                onClick={() => {
                  updatePopoverPosition(category);
                  setOpenSettings((current) =>
                    current === category ? null : category,
                  );
                }}
                className="flex h-11 w-6 items-center justify-center transition-transform active:scale-95"
              >
                <ChevronDown
                  size={13}
                  className={`transition-transform ${
                    openSettings === category ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div
          className={`shrink-0 ${vertical ? "h-px w-7" : "h-7 w-px"} ${
            darkMode ? "bg-white/10" : "bg-knote-border"
          }`}
        />

        <button
          type="button"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={handleUndo}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-25 disabled:hover:bg-transparent disabled:active:scale-100 ${
            darkMode
              ? "text-[#f4efe7]/58 hover:bg-white/8"
              : "text-knote-text/55 hover:bg-black/5"
          }`}
        >
          <Undo2 size={20} />
        </button>
        <button
          type="button"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={handleRedo}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all active:scale-95 disabled:opacity-25 disabled:hover:bg-transparent disabled:active:scale-100 ${
            darkMode
              ? "text-[#f4efe7]/58 hover:bg-white/8"
              : "text-knote-text/55 hover:bg-black/5"
          }`}
        >
          <Redo2 size={20} />
        </button>
      </div>
      {openSettings && (
        <ToolSettingsPopover
          activeColor={activeColor}
          activeTool={activeTool}
          category={openSettings}
          darkMode={darkMode}
          position={popoverPosition}
          strokeWidth={strokeWidth}
          selectionMode={selectionMode}
          onChangeWidth={changeWidth}
          onSelectColor={setActiveColor}
          onSelectSelectionMode={setSelectionMode}
          onSelectTool={handleToolSelect}
        />
      )}
    </>
  );
}

function ToolSettingsPopover({
  activeColor,
  activeTool,
  category,
  darkMode,
  position,
  selectionMode,
  strokeWidth,
  onChangeWidth,
  onSelectColor,
  onSelectSelectionMode,
  onSelectTool,
}: {
  activeColor: string;
  activeTool: Tool;
  category: ToolCategory;
  darkMode: boolean;
  position: { x: number; y: number };
  selectionMode: "rectangle" | "free";
  strokeWidth: number;
  onChangeWidth: (delta: number) => void;
  onSelectColor: (color: string) => void;
  onSelectSelectionMode: (mode: "rectangle" | "free") => void;
  onSelectTool: (tool: Tool) => void;
}) {
  const brushTypes: Array<{
    tool: Tool;
    label: string;
    icon: React.ElementType;
  }> = [
    { tool: "pen", label: "Pen", icon: Pen },
    { tool: "pencil", label: "Pencil", icon: Pencil },
    { tool: "brush", label: "Brush", icon: Brush },
    { tool: "marker", label: "Marker", icon: Circle },
  ];
  const colors =
    category === "highlighter"
      ? HIGHLIGHT_COLORS
      : category === "shape"
        ? SHAPE_COLORS
        : TOOL_COLORS;
  const showInkControls = category !== "selection";
  const showColors = category !== "eraser" && category !== "selection";
  const title =
    category === "highlighter"
      ? "Highlight"
      : category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <div
      className={`absolute z-50 w-[288px] rounded-2xl border p-3 backdrop-blur-2xl ${
        darkMode
          ? "border-white/10 bg-[#201e19]/94"
          : "border-white/70 bg-white/94"
      }`}
      data-toolbar-popover
      style={{ left: position.x, top: position.y }}
      onPointerDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onTouchMove={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className={`text-xs font-semibold ${
            darkMode ? "text-[#f4efe7]/58" : "text-knote-text/50"
          }`}
        >
          {title}
        </div>
        <div
          className="h-3.5 w-3.5 rounded-full"
          style={{
            backgroundColor: category === "eraser" ? "#d8d1c4" : activeColor,
          }}
        />
      </div>

      {category === "brush" && (
        <div className="mb-3">
          <div
            className={`mb-1.5 text-[11px] font-semibold ${
              darkMode ? "text-[#f4efe7]/36" : "text-knote-text/35"
            }`}
          >
            Type
          </div>
          <div className="grid grid-cols-4 gap-1">
            {brushTypes.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tool}
                  type="button"
                  aria-label={item.label}
                  title={item.label}
                  onClick={() => onSelectTool(item.tool)}
                  className={`flex h-10 items-center justify-center rounded-xl transition-colors ${
                    activeTool === item.tool
                      ? darkMode
                        ? "bg-[#f4efe7] text-[#201e19]"
                        : "bg-knote-text text-white"
                      : darkMode
                        ? "text-[#f4efe7]/58 hover:bg-white/8"
                        : "text-knote-text/55 hover:bg-black/5"
                  }`}
                >
                  <Icon
                    size={17}
                    strokeWidth={activeTool === item.tool ? 2.5 : 2}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showInkControls && (
        <>
          {showColors && (
            <div className="mb-3">
              <div
                className={`mb-2 text-[11px] font-semibold ${
                  darkMode ? "text-[#f4efe7]/36" : "text-knote-text/35"
                }`}
              >
                Color
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Use ${color}`}
                    onClick={() => onSelectColor(color)}
                    className={cn(
                      "rounded-full transition-all duration-150",
                      activeColor === color
                        ? darkMode
                          ? "h-7 w-7 scale-110 ring-2 ring-[#f4efe7]/50 ring-offset-2 ring-offset-[#201e19]"
                          : "h-7 w-7 scale-110 ring-2 ring-knote-text/25 ring-offset-2 ring-offset-white/80"
                        : "h-6 w-6 hover:scale-110 active:scale-95",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <label
                  className={`relative h-8 w-8 shrink-0 overflow-hidden rounded-full border transition-transform active:scale-95 ${
                    darkMode ? "border-white/10" : "border-knote-border/70"
                  }`}
                  style={{ backgroundColor: activeColor }}
                  title="Custom color"
                >
                  <input
                    type="color"
                    aria-label="Custom color"
                    value={activeColor}
                    onChange={(event) => onSelectColor(event.target.value)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                </label>
              </div>
            </div>
          )}

          <div>
            <div
              className={`mb-1.5 text-[11px] font-semibold ${
                darkMode ? "text-[#f4efe7]/36" : "text-knote-text/35"
              }`}
            >
              Size
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl">
              <button
                type="button"
                aria-label="Decrease stroke width"
                onClick={() => onChangeWidth(-1)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-95 ${
                  darkMode
                    ? "text-[#f4efe7]/58 hover:bg-white/8"
                    : "text-knote-text/55 hover:bg-black/5"
                }`}
              >
                <Minus size={15} />
              </button>
              <div className="flex min-w-11 items-center justify-center gap-2 px-1">
                <span
                  className="block rounded-full"
                  style={{
                    width: Math.min(18, Math.max(5, strokeWidth)),
                    height: Math.min(18, Math.max(5, strokeWidth)),
                    backgroundColor:
                      activeTool === "eraser" ? "#d8d1c4" : activeColor,
                  }}
                />
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    darkMode ? "text-[#f4efe7]/50" : "text-knote-text/45"
                  }`}
                >
                  {strokeWidth}
                </span>
              </div>
              <button
                type="button"
                aria-label="Increase stroke width"
                onClick={() => onChangeWidth(1)}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all active:scale-95 ${
                  darkMode
                    ? "text-[#f4efe7]/58 hover:bg-white/8"
                    : "text-knote-text/55 hover:bg-black/5"
                }`}
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </>
      )}
      {category === "selection" && (
        <div>
          <div
            className={`mb-1.5 text-[11px] font-semibold ${
              darkMode ? "text-[#f4efe7]/36" : "text-knote-text/35"
            }`}
          >
            Select
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { mode: "rectangle" as const, label: "Rectangle" },
              { mode: "free" as const, label: "Free" },
            ].map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => onSelectSelectionMode(item.mode)}
                className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
                  selectionMode === item.mode
                    ? darkMode
                      ? "bg-[#f4efe7] text-[#201e19]"
                      : "bg-knote-text text-white"
                    : darkMode
                      ? "text-[#f4efe7]/58 hover:bg-white/8"
                      : "text-knote-text/55 hover:bg-black/5"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
