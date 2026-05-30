"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getStroke } from "perfect-freehand";
import { useCallback, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../../db";
import { useAppStore } from "../../stores/useAppStore";
import type { Point, Stroke } from "../../types";

function getSvgPathFromStroke(stroke: number[][]) {
  if (!stroke.length) return "";

  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ["M", ...stroke[0], "Q"],
  );

  d.push("Z");
  return d.join(" ");
}

// Perfect-freehand options per tool
function getStrokeOptions(tool: string, width: number) {
  switch (tool) {
    case "pen":
      return {
        size: width * 2.5,
        thinning: 0.6,
        smoothing: 0.5,
        streamline: 0.4,
        simulatePressure: false,
      };
    case "pencil":
      return {
        size: width * 1.5,
        thinning: 0.7,
        smoothing: 0.3,
        streamline: 0.3,
        simulatePressure: false,
      };
    case "highlighter":
      return {
        size: width * 3,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      };
    default:
      return {
        size: width * 2,
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: false,
      };
  }
}

export function Canvas() {
  const activePageId = useAppStore((state) => state.activePageId);
  const activeNotebookId = useAppStore((state) => state.activeNotebookId);
  const activeTool = useAppStore((state) => state.activeTool);
  const activeColor = useAppStore((state) => state.activeColor);
  const strokeWidth = useAppStore((state) => state.strokeWidth);
  const clearRedoStrokes = useAppStore((state) => state.clearRedoStrokes);

  const strokes = useLiveQuery(
    () =>
      activePageId
        ? db.strokes.where("pageId").equals(activePageId).toArray()
        : [],
    [activePageId],
  );

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const currentPointsRef = useRef<Point[]>([]);
  const lastPenAtRef = useRef(0);

  const getPointFromClient = useCallback(
    (clientX: number, clientY: number, pressure = 0.5): Point => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) {
        return { x: 0, y: 0, pressure };
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        pressure,
      };
    },
    [],
  );

  const getPoint = useCallback(
    (e: React.PointerEvent<SVGSVGElement>): Point => {
      return getPointFromClient(
        e.clientX,
        e.clientY,
        e.pointerType === "pen" ? e.pressure : 0.5,
      );
    },
    [getPointFromClient],
  );

  const eraseAt = useCallback(
    async (x: number, y: number) => {
      if (!strokes || !activePageId) return;
      const radius = 14;
      const toDelete = strokes.filter((s) =>
        s.points.some((p) => Math.hypot(p.x - x, p.y - y) < radius),
      );
      if (toDelete.length > 0) {
        await db.strokes.bulkDelete(toDelete.map((s) => s.id));
        if (activeNotebookId) {
          await db.notebooks.update(activeNotebookId, {
            updatedAt: Date.now(),
          });
        }
        clearRedoStrokes(activePageId);
      }
    },
    [activePageId, activeNotebookId, clearRedoStrokes, strokes],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!activePageId) return;
      if (e.pointerType === "touch") return;
      e.preventDefault();
      if (e.button !== 0 && e.pointerType !== "pen") return;
      if (drawingPointerIdRef.current !== null) return;

      if (e.pointerType === "pen") {
        lastPenAtRef.current = Date.now();
      }
      drawingPointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      currentPointsRef.current = [];
      const pt = getPoint(e);

      if (activeTool === "eraser") {
        eraseAt(pt.x, pt.y);
      } else {
        currentPointsRef.current = [pt];
        setCurrentPoints([pt]);
      }
    },
    [activePageId, activeTool, eraseAt, getPoint],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (drawingPointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      if (e.pointerType === "pen") {
        lastPenAtRef.current = Date.now();
      }
      if (e.pointerType === "mouse" && e.buttons !== 1) return;
      const pt = getPoint(e);

      if (activeTool === "eraser") {
        eraseAt(pt.x, pt.y);
      } else if (currentPointsRef.current.length > 0) {
        currentPointsRef.current = [...currentPointsRef.current, pt];
        setCurrentPoints(currentPointsRef.current);
      }
    },
    [activeTool, eraseAt, getPoint],
  );

  const handlePointerUp = useCallback(
    async (e: React.PointerEvent<SVGSVGElement>) => {
      if (drawingPointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      drawingPointerIdRef.current = null;
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      const points = currentPointsRef.current;

      if (points.length > 0 && activePageId && activeTool !== "eraser") {
        const newStroke: Stroke = {
          id: uuidv4(),
          pageId: activePageId,
          tool: activeTool,
          color: activeTool === "highlighter" ? activeColor : activeColor,
          width: strokeWidth,
          opacity: activeTool === "highlighter" ? 0.35 : 1,
          points,
        };
        await db.strokes.add(newStroke);
        if (activeNotebookId) {
          await db.notebooks.update(activeNotebookId, {
            updatedAt: Date.now(),
          });
        }
        clearRedoStrokes(activePageId);
        currentPointsRef.current = [];
        setCurrentPoints([]);
      }
    },
    [
      activePageId,
      activeTool,
      activeColor,
      strokeWidth,
      activeNotebookId,
      clearRedoStrokes,
    ],
  );

  const renderStroke = (stroke: Stroke) => {
    const options = getStrokeOptions(stroke.tool || "pen", stroke.width);
    const pathData = getSvgPathFromStroke(getStroke(stroke.points, options));

    return (
      <path
        key={stroke.id}
        d={pathData}
        fill={stroke.color}
        opacity={stroke.opacity ?? 1}
      />
    );
  };

  const renderCurrent = () => {
    if (currentPoints.length === 0) return null;
    const options = getStrokeOptions(activeTool, strokeWidth);
    const pathData = getSvgPathFromStroke(getStroke(currentPoints, options));
    return (
      <path
        d={pathData}
        fill={activeColor}
        opacity={activeTool === "highlighter" ? 0.35 : 1}
      />
    );
  };

  if (!activePageId) {
    return (
      <div className="flex-1 flex items-center justify-center text-knote-text/30 text-lg bg-knote-bg">
        Select a page to start writing.
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto bg-[radial-gradient(circle_at_center,#ffffff_0,#f7f1e8_68%,#eee3d3_100%)] px-4 py-5 sm:px-8 sm:py-8">
      <div className="mx-auto min-h-[calc(100vh-8rem)] w-full max-w-[980px] rounded-[18px] border border-knote-border/80 bg-white shadow-[0_18px_70px_rgba(86,70,38,0.13),0_2px_10px_rgba(86,70,38,0.08)]">
        <svg
          ref={svgRef}
          aria-label="Writing page"
          className="h-full min-h-[calc(100vh-8rem)] w-full touch-none rounded-[18px]"
          style={{
            cursor: activeTool === "eraser" ? "crosshair" : "default",
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <title>Writing page</title>
          <defs>
            <pattern
              id="dotgrid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="12" cy="12" r="0.6" fill="#D9D4CA" />
            </pattern>
            <linearGradient id="paperWarmth" x1="0" x2="1" y1="0" y2="1">
              <stop stopColor="#FFFFFF" />
              <stop offset="1" stopColor="#FFFDF8" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#paperWarmth)" />
          <rect
            width="100%"
            height="100%"
            fill="url(#dotgrid)"
            opacity="0.75"
          />

          {strokes?.map(renderStroke)}
          {renderCurrent()}
        </svg>
      </div>
    </div>
  );
}
