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
    case "brush":
      return {
        size: width * 2.8,
        thinning: 0.85,
        smoothing: 0.62,
        streamline: 0.38,
        simulatePressure: false,
      };
    case "marker":
      return {
        size: width * 2.1,
        thinning: 0.15,
        smoothing: 0.55,
        streamline: 0.45,
        simulatePressure: true,
      };
    case "highlighter":
      return {
        size: width * 3,
        thinning: 0,
        smoothing: 0.5,
        streamline: 0.5,
        simulatePressure: true,
      };
    case "shape":
      return {
        size: width * 2,
        thinning: 0,
        smoothing: 0.7,
        streamline: 0.62,
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

function sortStrokesByTime(strokes: Stroke[]) {
  return [...strokes].sort((a, b) => {
    const timeA = a.createdAt ?? 0;
    const timeB = b.createdAt ?? 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.id.localeCompare(b.id);
  });
}

function isShapeTool(tool: string) {
  return tool === "shape";
}

function getBounds(points: Point[]) {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function pointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number },
) {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

function moveStroke(stroke: Stroke, dx: number, dy: number): Stroke {
  return {
    ...stroke,
    points: stroke.points.map((point) => ({
      ...point,
      x: point.x + dx,
      y: point.y + dy,
    })),
  };
}

function scaleStroke(stroke: Stroke, scale: number, center: Point): Stroke {
  return {
    ...stroke,
    points: stroke.points.map((point) => ({
      ...point,
      x: center.x + (point.x - center.x) * scale,
      y: center.y + (point.y - center.y) * scale,
    })),
  };
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersects =
      pi.y > point.y !== pj.y > point.y &&
      point.x < ((pj.x - pi.x) * (point.y - pi.y)) / (pj.y - pi.y) + pi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function Canvas({
  darkMode = false,
  pageId,
  notebookId,
  onActivate,
}: {
  darkMode?: boolean;
  pageId?: string;
  notebookId?: string | null;
  onActivate?: () => void;
}) {
  const storeActivePageId = useAppStore((s) => s.activePageId);
  const storeActiveNotebookId = useAppStore((s) => s.activeNotebookId);
  const activePageId = pageId ?? storeActivePageId;
  const activeNotebookId = notebookId ?? storeActiveNotebookId;
  const activeTool = useAppStore((s) => s.activeTool);
  const activeColor = useAppStore((s) => s.activeColor);
  const strokeWidth = useAppStore((s) => s.strokeWidth);
  const selectionMode = useAppStore((s) => s.selectionMode);
  const clearRedoStrokes = useAppStore((s) => s.clearRedoStrokes);

  const strokes = useLiveQuery(async () => {
    if (!activePageId) return [];
    const pageStrokes = await db.strokes
      .where("pageId")
      .equals(activePageId)
      .toArray();
    return sortStrokesByTime(pageStrokes);
  }, [activePageId]);
  const activePage = useLiveQuery(
    () => (activePageId ? db.pages.get(activePageId) : undefined),
    [activePageId],
  );

  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [selectedBounds, setSelectedBounds] = useState<ReturnType<
    typeof getBounds
  > | null>(null);
  const [selectedStrokeIds, setSelectedStrokeIds] = useState<string[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingPointerIdRef = useRef<number | null>(null);
  const currentPointsRef = useRef<Point[]>([]);
  const drawFrameRef = useRef<number | null>(null);
  const [scaleFactor, setScaleFactor] = useState(1);
  const selectionMoveRef = useRef<{
    lastPoint: Point;
    strokeIds: string[];
    startBounds: { x: number; y: number; width: number; height: number };
  } | null>(null);
  const scaleRef = useRef<{
    center: Point;
    startDist: number;
    startScale: number;
  } | null>(null);
  const isScalingRef = useRef(false);

  const getPointFromEvent = useCallback(
    (clientX: number, clientY: number, pressure = 0.5): Point => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0, pressure };

      const rect = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const pageWidth = viewBox.width || 980;
      const pageHeight = viewBox.height || 1280;
      if (rect.width === 0 || rect.height === 0) {
        return { x: 0, y: 0, pressure };
      }

      return {
        x: ((clientX - rect.left) / rect.width) * pageWidth,
        y: ((clientY - rect.top) / rect.height) * pageHeight,
        pressure,
      };
    },
    [],
  );

  const getPointsFromPointerEvent = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const pressure = e.pointerType === "pen" ? e.pressure : 0.5;
      const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent];
      return coalesced.map((event) =>
        getPointFromEvent(event.clientX, event.clientY, pressure),
      );
    },
    [getPointFromEvent],
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
        window.dispatchEvent(new CustomEvent("knote:pen-drawing-start"));
      }

      drawingPointerIdRef.current = e.pointerId;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      currentPointsRef.current = [];

      const pt = getPointFromEvent(
        e.clientX,
        e.clientY,
        e.pointerType === "pen" ? e.pressure : 0.5,
      );

      if (
        activeTool === "selection" &&
        selectedBounds &&
        selectedStrokeIds.length > 0
      ) {
        const cx = selectedBounds.x + selectedBounds.width / 2;
        const cy = selectedBounds.y + selectedBounds.height / 2;
        const corners = [
          { px: selectedBounds.x - 10, py: selectedBounds.y - 10 },
          {
            px: selectedBounds.x + selectedBounds.width + 10,
            py: selectedBounds.y - 10,
          },
          {
            px: selectedBounds.x - 10,
            py: selectedBounds.y + selectedBounds.height + 10,
          },
          {
            px: selectedBounds.x + selectedBounds.width + 10,
            py: selectedBounds.y + selectedBounds.height + 10,
          },
        ];
        let cornerHit = false;
        for (const corner of corners) {
          if (
            Math.abs(pt.x - corner.px) <= 7 &&
            Math.abs(pt.y - corner.py) <= 7
          ) {
            scaleRef.current = {
              center: { x: cx, y: cy, pressure: 0.5 },
              startDist: Math.hypot(pt.x - cx, pt.y - cy),
              startScale: 1,
            };
            isScalingRef.current = true;
            cornerHit = true;
            break;
          }
        }
        if (cornerHit) {
          // handled by scaling
        } else if (
          pointInBounds(pt, {
            x: selectedBounds.x - 10,
            y: selectedBounds.y - 10,
            width: selectedBounds.width + 20,
            height: selectedBounds.height + 20,
          })
        ) {
          selectionMoveRef.current = {
            lastPoint: pt,
            strokeIds: selectedStrokeIds,
            startBounds: { ...selectedBounds },
          };
        }
      } else if (activeTool === "selection") {
        currentPointsRef.current = [pt];
        setCurrentPoints([pt]);
        setSelectedBounds(null);
        setSelectedStrokeIds([]);
      } else if (activeTool === "eraser") {
        eraseAt(pt.x, pt.y);
      } else {
        currentPointsRef.current = [pt];
        setCurrentPoints([pt]);
      }
    },
    [
      activePageId,
      activeTool,
      eraseAt,
      getPointFromEvent,
      selectedBounds,
      selectedStrokeIds,
    ],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (drawingPointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      if (e.pointerType === "mouse" && e.buttons !== 1) return;

      const points = getPointsFromPointerEvent(e);
      const latestPoint = points.at(-1);

      if (isScalingRef.current && scaleRef.current && latestPoint) {
        const { center, startDist, startScale } = scaleRef.current;
        const newDist = Math.hypot(
          latestPoint.x - center.x,
          latestPoint.y - center.y,
        );
        const newScale = Math.max(
          0.1,
          Math.min(10, startScale * (newDist / startDist)),
        );
        setScaleFactor(newScale);
        return;
      }

      if (selectionMoveRef.current && latestPoint && selectedBounds) {
        const dx = latestPoint.x - selectionMoveRef.current.lastPoint.x;
        const dy = latestPoint.y - selectionMoveRef.current.lastPoint.y;
        selectionMoveRef.current.lastPoint = latestPoint;
        setSelectedBounds({
          ...selectedBounds,
          x: selectedBounds.x + dx,
          y: selectedBounds.y + dy,
        });
        return;
      }

      if (activeTool === "eraser") {
        for (const pt of points) eraseAt(pt.x, pt.y);
      } else if (activeTool === "selection") {
        if (selectionMode === "rectangle") {
          currentPointsRef.current = [
            currentPointsRef.current[0],
            points.at(-1) ?? currentPointsRef.current[0],
          ].filter(Boolean);
        } else {
          currentPointsRef.current.push(...points);
        }
        if (drawFrameRef.current === null) {
          drawFrameRef.current = requestAnimationFrame(() => {
            drawFrameRef.current = null;
            setCurrentPoints([...currentPointsRef.current]);
          });
        }
      } else {
        if (isShapeTool(activeTool)) {
          currentPointsRef.current = [
            currentPointsRef.current[0],
            points.at(-1) ?? currentPointsRef.current[0],
          ].filter(Boolean);
        } else {
          currentPointsRef.current.push(...points);
        }
        if (drawFrameRef.current === null) {
          drawFrameRef.current = requestAnimationFrame(() => {
            drawFrameRef.current = null;
            setCurrentPoints([...currentPointsRef.current]);
          });
        }
      }
    },
    [
      activeTool,
      eraseAt,
      getPointsFromPointerEvent,
      selectionMode,
      selectedBounds,
    ],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (drawingPointerIdRef.current !== e.pointerId) return;
      e.preventDefault();

      if (drawFrameRef.current !== null) {
        cancelAnimationFrame(drawFrameRef.current);
        drawFrameRef.current = null;
      }
      if (e.pointerType === "pen") {
        window.dispatchEvent(new CustomEvent("knote:pen-drawing-end"));
      }
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }

      const scaleData = scaleRef.current;
      if (isScalingRef.current && scaleData) {
        isScalingRef.current = false;
        scaleRef.current = null;
        const s = scaleFactor;
        drawingPointerIdRef.current = null;
        if (s !== 1 && strokes && selectedBounds) {
          const center = scaleData.center;
          const scaledIds = new Set(selectedStrokeIds);
          const updatedStrokes = strokes.filter((st) => scaledIds.has(st.id));
          if (updatedStrokes.length > 0) {
            void db.transaction("rw", db.strokes, async () => {
              for (const stroke of updatedStrokes) {
                await db.strokes.put(scaleStroke(stroke, s, center));
              }
            });
            const newPoints = updatedStrokes.flatMap((st) =>
              st.points.map((p) => ({
                x: center.x + (p.x - center.x) * s,
                y: center.y + (p.y - center.y) * s,
                pressure: p.pressure,
              })),
            );
            setSelectedBounds(getBounds(newPoints));
          }
        }
        setScaleFactor(1);
        return;
      }

      const moveData = selectionMoveRef.current;
      selectionMoveRef.current = null;
      if (moveData && strokes) {
        const dx = selectedBounds
          ? selectedBounds.x - moveData.startBounds.x
          : 0;
        const dy = selectedBounds
          ? selectedBounds.y - moveData.startBounds.y
          : 0;
        if (dx !== 0 || dy !== 0) {
          const ids = new Set(moveData.strokeIds);
          void db.transaction("rw", db.strokes, async () => {
            for (const stroke of strokes) {
              if (ids.has(stroke.id)) {
                await db.strokes.put(moveStroke(stroke, dx, dy));
              }
            }
          });
        }
        return;
      }

      drawingPointerIdRef.current = null;

      const finalPoint = getPointFromEvent(
        e.clientX,
        e.clientY,
        e.pointerType === "pen" ? e.pressure : 0.5,
      );
      if (activeTool !== "eraser" && currentPointsRef.current.length > 0) {
        if (
          isShapeTool(activeTool) ||
          (activeTool === "selection" && selectionMode === "rectangle")
        ) {
          currentPointsRef.current = [currentPointsRef.current[0], finalPoint];
        } else {
          currentPointsRef.current.push(finalPoint);
        }
      }

      const points = [...currentPointsRef.current];
      currentPointsRef.current = [];
      setCurrentPoints([]);

      if (activeTool === "selection") {
        if (points.length >= 2 && strokes?.length) {
          const bounds = getBounds(points);
          const selected = strokes.filter((stroke) =>
            stroke.points.some((point) =>
              selectionMode === "free" && points.length > 2
                ? pointInPolygon(point, points)
                : point.x >= bounds.x &&
                  point.x <= bounds.x + bounds.width &&
                  point.y >= bounds.y &&
                  point.y <= bounds.y + bounds.height,
            ),
          );
          const selectedPoints = selected.flatMap((stroke) => stroke.points);
          setSelectedStrokeIds(selected.map((stroke) => stroke.id));
          setSelectedBounds(
            selectedPoints.length ? getBounds(selectedPoints) : bounds,
          );
        }
        return;
      }

      if (points.length > 0 && activePageId && activeTool !== "eraser") {
        const newStroke: Stroke = {
          id: uuidv4(),
          pageId: activePageId,
          tool: activeTool,
          color: activeColor,
          width: strokeWidth,
          opacity:
            activeTool === "highlighter"
              ? 0.35
              : activeTool === "marker"
                ? 0.82
                : 1,
          points,
          createdAt: Date.now(),
        };
        clearRedoStrokes(activePageId);
        void (async () => {
          await db.strokes.add(newStroke);
          if (activeNotebookId) {
            await db.notebooks.update(activeNotebookId, {
              updatedAt: Date.now(),
            });
          }
        })();
      }
    },
    [
      activePageId,
      activeTool,
      activeColor,
      strokeWidth,
      activeNotebookId,
      clearRedoStrokes,
      getPointFromEvent,
      selectionMode,
      strokes,
      selectedBounds,
      selectedStrokeIds,
      scaleFactor,
    ],
  );

  const deleteSelection = useCallback(async () => {
    if (!activePageId || selectedStrokeIds.length === 0) return;
    await db.strokes.bulkDelete(selectedStrokeIds);
    if (activeNotebookId) {
      await db.notebooks.update(activeNotebookId, { updatedAt: Date.now() });
    }
    clearRedoStrokes(activePageId);
    setSelectedBounds(null);
    setSelectedStrokeIds([]);
  }, [activeNotebookId, activePageId, clearRedoStrokes, selectedStrokeIds]);

  const renderStroke = (stroke: Stroke) => {
    if (isShapeTool(stroke.tool) && stroke.points.length >= 2) {
      const [start, end] = stroke.points;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      const width = Math.abs(end.x - start.x);
      const height = Math.abs(end.y - start.y);
      return (
        <rect
          key={stroke.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill="transparent"
          stroke={stroke.color}
          rx={Math.min(14, Math.max(4, stroke.width * 1.5))}
          strokeWidth={stroke.width * 2}
          opacity={stroke.opacity ?? 1}
        />
      );
    }
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
    if (isShapeTool(activeTool) && currentPoints.length >= 2) {
      const [start, end] = currentPoints;
      const x = Math.min(start.x, end.x);
      const y = Math.min(start.y, end.y);
      return (
        <rect
          x={x}
          y={y}
          width={Math.abs(end.x - start.x)}
          height={Math.abs(end.y - start.y)}
          fill="transparent"
          stroke={activeColor}
          rx={Math.min(14, Math.max(4, strokeWidth * 1.5))}
          strokeWidth={strokeWidth * 2}
        />
      );
    }
    if (activeTool === "selection" && currentPoints.length >= 2) {
      const bounds = getBounds(currentPoints);
      const pathData =
        selectionMode === "free" && currentPoints.length > 2
          ? `M ${currentPoints.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`
          : "";
      return selectionMode === "free" && pathData ? (
        <path
          d={pathData}
          fill="rgba(79,111,143,0.08)"
          stroke="#4F6F8F"
          strokeDasharray="12 8"
          strokeWidth={3}
        />
      ) : (
        <rect
          x={bounds.x}
          y={bounds.y}
          width={bounds.width}
          height={bounds.height}
          fill="rgba(79,111,143,0.08)"
          stroke="#4F6F8F"
          strokeDasharray="12 8"
          strokeWidth={3}
        />
      );
    }
    const options = getStrokeOptions(activeTool, strokeWidth);
    const pathData = getSvgPathFromStroke(getStroke(currentPoints, options));
    return (
      <path
        d={pathData}
        fill={activeColor}
        opacity={
          activeTool === "highlighter"
            ? 0.35
            : activeTool === "marker"
              ? 0.82
              : 1
        }
      />
    );
  };

  const pageWidth = activePage?.width ?? 980;
  const pageHeight = activePage?.height ?? 1280;

  if (!activePageId) {
    return (
      <div className="flex-1 flex items-center justify-center text-knote-text/30 text-lg bg-knote-bg">
        Select a page to start writing.
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-[18px] border transition-[border-color,background-color,filter] duration-300 ${
        darkMode
          ? "border-[#4a4336] bg-[#f8f3ea] brightness-[0.94]"
          : "border-knote-border/80 bg-white"
      }`}
    >
      <svg
        ref={svgRef}
        aria-label="Writing page"
        className="w-full h-full touch-none"
        viewBox={`0 0 ${pageWidth} ${pageHeight}`}
        preserveAspectRatio="none"
        style={{
          cursor:
            activeTool === "eraser"
              ? "crosshair"
              : activeTool === "selection"
                ? "default"
                : "crosshair",
          touchAction: "none",
          WebkitUserSelect: "none",
          userSelect: "none",
        }}
        onPointerDown={(e) => {
          onActivate?.();
          handlePointerDown(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <title>Writing page</title>
        <defs>
          <pattern
            id={`dotgrid-${activePageId}`}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="12" cy="12" r="0.6" fill="#D9D4CA" />
          </pattern>
          <linearGradient
            id={`paperWarmth-${activePageId}`}
            x1="0"
            x2="1"
            y1="0"
            y2="1"
          >
            <stop stopColor="#FFFFFF" />
            <stop offset="1" stopColor="#FFFDF8" />
          </linearGradient>
        </defs>
        {activePage?.backgroundImage ? (
          <image
            href={activePage.backgroundImage}
            x="0"
            y="0"
            width={pageWidth}
            height={pageHeight}
            preserveAspectRatio="none"
          />
        ) : (
          <>
            <rect
              width={pageWidth}
              height={pageHeight}
              fill={`url(#paperWarmth-${activePageId})`}
            />
            <rect
              width={pageWidth}
              height={pageHeight}
              fill={`url(#dotgrid-${activePageId})`}
              opacity="0.75"
            />
          </>
        )}
        {strokes?.map(renderStroke)}
        {renderCurrent()}
        {selectedBounds && (
          <g
            transform={
              scaleFactor !== 1
                ? `translate(${selectedBounds.x + selectedBounds.width / 2}, ${selectedBounds.y + selectedBounds.height / 2}) scale(${scaleFactor}) translate(${-(selectedBounds.x + selectedBounds.width / 2)}, ${-(selectedBounds.y + selectedBounds.height / 2)})`
                : undefined
            }
          >
            {/* biome-ignore lint/a11y/noStaticElementInteractions: SVG controls cannot use native HTML button semantics inside this drawing surface. */}
            <g
              onPointerDown={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
              onClick={(event) => {
                event.stopPropagation();
                void deleteSelection();
              }}
              className="cursor-pointer"
            >
              <rect
                x={selectedBounds.x - 10}
                y={selectedBounds.y - 58}
                width={54}
                height={34}
                rx={12}
                fill="#b94b4b"
              />
              <text
                x={selectedBounds.x + 17}
                y={selectedBounds.y - 36}
                textAnchor="middle"
                fontSize={14}
                fontWeight={700}
                fill="#fffdf8"
              >
                Del
              </text>
            </g>
            <rect
              x={selectedBounds.x - 10}
              y={selectedBounds.y - 10}
              width={selectedBounds.width + 20}
              height={selectedBounds.height + 20}
              fill="transparent"
              stroke="#4F6F8F"
              strokeDasharray="10 8"
              strokeWidth={3}
            />
            {[
              [selectedBounds.x - 10, selectedBounds.y - 10],
              [
                selectedBounds.x + selectedBounds.width + 10,
                selectedBounds.y - 10,
              ],
              [
                selectedBounds.x - 10,
                selectedBounds.y + selectedBounds.height + 10,
              ],
              [
                selectedBounds.x + selectedBounds.width + 10,
                selectedBounds.y + selectedBounds.height + 10,
              ],
            ].map(([x, y]) => (
              <rect
                key={`${x}-${y}`}
                x={x - 7}
                y={y - 7}
                width={14}
                height={14}
                rx={4}
                fill="#fffdf8"
                stroke="#4F6F8F"
                strokeWidth={3}
                style={{ cursor: "nwse-resize" }}
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
