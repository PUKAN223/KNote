"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { jsPDF } from "jspdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  FileImage,
  FileText,
  LayoutGrid,
  Moon,
  Plus,
  Share2,
  Sun,
  X,
} from "lucide-react";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { db } from "../db";
import { Canvas } from "../features/canvas/Canvas";
import { useAppStore } from "../stores/useAppStore";
import type { Notebook, Page } from "../types";
import { Library } from "./Library";
import { PageSidebar } from "./PageSidebar";
import { Toolbar } from "./Toolbar";

const PAGE_GAP = 32;
const CLAMP_MIN = 0.25;
const CLAMP_MAX = 4.0;
const MAX_EXPORT_PIXELS = 8_000_000;
const clamp = (z: number) => Math.min(CLAMP_MAX, Math.max(CLAMP_MIN, z));

type PinchState = {
  startDistance: number;
  startZoom: number;
  worldAnchorX: number;
  worldAnchorY: number;
  latestDistance: number;
  latestScreenX: number;
  latestScreenY: number;
  frameId: number | null;
};

type ExportMode = "png" | "pdf" | "share";

type ExportSettings = {
  mode: ExportMode;
  scope: "current" | "all" | "custom";
  pageRange: string;
  selectedPages: number[];
  scale: 1 | 2 | 3;
};

type ExportProgress = {
  label: string;
  current: number;
  total: number;
} | null;

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/[<>:"/\\|?*]/g, "-")
    .replaceAll(String.fromCharCode(0), "-")
    .replace(/\s+/g, " ")
    .slice(0, 90) || "KNote";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const crcTable = new Uint32Array(256).map((_, index) => {
  let c = index;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};

const writeU16 = (target: number[], value: number) => {
  target.push(value & 0xff, (value >>> 8) & 0xff);
};

const writeU32 = (target: number[], value: number) => {
  target.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
};

const createZipBlob = async (
  files: Array<{ name: string; blob: Blob }>,
): Promise<Blob> => {
  const encoder = new TextEncoder();
  const chunks: Array<Uint8Array> = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const fileName = encoder.encode(file.name);
    const data = new Uint8Array(await file.blob.arrayBuffer());
    const crc = crc32(data);
    const local: number[] = [];

    writeU32(local, 0x04034b50);
    writeU16(local, 20);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU16(local, 0);
    writeU32(local, crc);
    writeU32(local, data.length);
    writeU32(local, data.length);
    writeU16(local, fileName.length);
    writeU16(local, 0);

    const localHeader = new Uint8Array(local);
    chunks.push(localHeader, fileName, data);

    const centralRecord: number[] = [];
    writeU32(centralRecord, 0x02014b50);
    writeU16(centralRecord, 20);
    writeU16(centralRecord, 20);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU32(centralRecord, crc);
    writeU32(centralRecord, data.length);
    writeU32(centralRecord, data.length);
    writeU16(centralRecord, fileName.length);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU16(centralRecord, 0);
    writeU32(centralRecord, 0);
    writeU32(centralRecord, offset);
    central.push(new Uint8Array(centralRecord), fileName);

    offset += localHeader.length + fileName.length + data.length;
  }

  const centralOffset = offset;
  let centralSize = 0;
  for (const chunk of central) centralSize += chunk.length;

  const end: number[] = [];
  writeU32(end, 0x06054b50);
  writeU16(end, 0);
  writeU16(end, 0);
  writeU16(end, files.length);
  writeU16(end, files.length);
  writeU32(end, centralSize);
  writeU32(end, centralOffset);
  writeU16(end, 0);

  const zipChunks = [...chunks, ...central, new Uint8Array(end)].map(
    (chunk) =>
      chunk.buffer.slice(
        chunk.byteOffset,
        chunk.byteOffset + chunk.byteLength,
      ) as ArrayBuffer,
  );

  return new Blob(zipChunks, {
    type: "application/zip",
  });
};

export function ClientApp({
  initialNotebookId = null,
}: {
  initialNotebookId?: string | null;
}) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem("knote:workspace-theme");
    if (saved !== null) return saved === "dark";
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  });

  const cameraRef = useRef({ x: 0, y: -40, zoom: 1 });
  const [camera, setCameraState] = useState({ x: 0, y: -40, zoom: 1 });
  const inertiaRef = useRef<{
    frameId: number | null;
    vx: number;
    vy: number;
  } | null>(null);
  const boundsRef = useRef({ minX: -40, maxX: 40, minY: -40, maxY: 100 });
  const setCamera = useCallback(
    (next: { x: number; y: number; zoom: number }) => {
      if (inertiaRef.current?.frameId)
        cancelAnimationFrame(inertiaRef.current.frameId);
      inertiaRef.current = null;
      cameraRef.current = next;
      setCameraState(next);
    },
    [],
  );

  const workspaceRef = useRef<HTMLDivElement>(null);
  const cameraLayerRef = useRef<HTMLDivElement>(null);
  const penActiveRef = useRef(false);
  const pinchRef = useRef<PinchState | null>(null);
  const panRef = useRef<{
    lastX: number;
    lastY: number;
    lastTime: number;
    vx: number;
    vy: number;
  } | null>(null);
  const applyCameraTransform = useCallback(
    (cam: { x: number; y: number; zoom: number }) => {
      const el = cameraLayerRef.current;
      if (!el) return;
      el.style.transform = `translate(${-cam.x * cam.zoom}px, ${-cam.y * cam.zoom}px) scale(${cam.zoom})`;
    },
    [],
  );

  useEffect(() => {
    applyCameraTransform(camera);
  }, [camera, applyCameraTransform]);

  const closeNotebook = useAppStore((s) => s.closeNotebook);
  const closeNotebookTab = useAppStore((s) => s.closeNotebookTab);
  const openNotebook = useAppStore((s) => s.openNotebook);
  const openNotebookIds = useAppStore((s) => s.openNotebookIds);
  const activePageId = useAppStore((s) => s.activePageId);
  const setActivePageId = useAppStore((s) => s.setActivePageId);
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);
  const notebookId = initialNotebookId;

  useEffect(() => {
    if (notebookId) openNotebook(notebookId);
    else closeNotebook();
  }, [notebookId, openNotebook, closeNotebook]);

  const notebook = useLiveQuery(
    () => (notebookId ? db.notebooks.get(notebookId) : undefined),
    [notebookId],
  );
  const openNotebooks = useLiveQuery(async (): Promise<
    (Notebook | undefined)[]
  > => {
    if (!openNotebookIds.length) return [];
    return db.notebooks.bulkGet(openNotebookIds);
  }, [openNotebookIds]);
  const pages = useLiveQuery(
    () =>
      notebookId
        ? db.pages.where("notebookId").equals(notebookId).sortBy("order")
        : [],
    [notebookId],
  );

  const getPageOffsets = useCallback(() => {
    if (!pages) return [];
    let y = 0;
    return pages.map((page) => {
      const h = page.height ?? 1280;
      const w = page.width ?? 980;
      const offset = { pageId: page.id, y, width: w, height: h };
      y += h + PAGE_GAP;
      return offset;
    });
  }, [pages]);

  const pageOffsets = useMemo(() => getPageOffsets(), [getPageOffsets]);
  const worldW = useMemo(
    () => Math.max(...(pages?.map((p) => p.width ?? 980) ?? [980])),
    [pages],
  );
  const totalH = useMemo(
    () =>
      pageOffsets.length > 0
        ? pageOffsets[pageOffsets.length - 1].y +
          pageOffsets[pageOffsets.length - 1].height
        : 0,
    [pageOffsets],
  );

  boundsRef.current = {
    minX: -40,
    maxX: worldW + 40,
    minY: -40,
    maxY: totalH + 40,
  };

  const clampCam = useCallback(
    (cam: { x: number; y: number; zoom: number }, vpW: number, vpH: number) => {
      const pad = 40;
      const cMinX = -pad;
      const cMaxX = worldW + pad;
      const cMinY = -pad;
      const cMaxY = totalH + pad;
      const vpWw = vpW / cam.zoom;
      const vpHw = vpH / cam.zoom;

      let x: number;
      const minX = cMinX;
      const maxX = cMaxX - vpWw;
      if (maxX < minX) {
        x = (cMinX + cMaxX) / 2 - vpWw / 2;
      } else {
        x = Math.min(maxX, Math.max(minX, cam.x));
      }

      let y: number;
      const minY = cMinY;
      const maxY = cMaxY - vpHw;
      if (maxY < minY) {
        y = (cMinY + cMaxY) / 2 - vpHw / 2;
      } else {
        y = Math.min(maxY, Math.max(minY, cam.y));
      }

      return { x, y, zoom: cam.zoom };
    },
    [worldW, totalH],
  );

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      if (inertiaRef.current?.frameId)
        cancelAnimationFrame(inertiaRef.current.frameId);
      const state: { frameId: number | null; vx: number; vy: number } = {
        frameId: null,
        vx,
        vy,
      };
      inertiaRef.current = state;
      const friction = 0.9;
      const minV = 0.35;
      const tick = () => {
        const s = inertiaRef.current;
        if (!s) return;
        s.vx *= friction;
        s.vy *= friction;
        if (Math.abs(s.vx) < minV && Math.abs(s.vy) < minV) {
          inertiaRef.current = null;
          setCameraState({ ...cameraRef.current });
          return;
        }
        const cam = cameraRef.current;
        const newCam = {
          ...cam,
          x: cam.x - s.vx / cam.zoom,
          y: cam.y - s.vy / cam.zoom,
        };
        const ws = workspaceRef.current?.getBoundingClientRect();
        const clamped = ws ? clampCam(newCam, ws.width, ws.height) : newCam;
        if (clamped.x !== newCam.x) s.vx = 0;
        if (clamped.y !== newCam.y) s.vy = 0;
        cameraRef.current = clamped;
        applyCameraTransform(clamped);
        s.frameId = requestAnimationFrame(tick);
      };
      state.frameId = requestAnimationFrame(tick);
    },
    [applyCameraTransform, clampCam],
  );

  const setCamClamped = (next: { x: number; y: number; zoom: number }) => {
    const ws = workspaceRef.current?.getBoundingClientRect();
    if (ws) next = clampCam(next, ws.width, ws.height);
    setCamera(next);
  };

  const cameraInitRef = useRef(false);

  // camera init once on pages first load
  useEffect(() => {
    if (cameraInitRef.current) return;
    if (!pages?.length || !workspaceRef.current) return;
    cameraInitRef.current = true;
    const ws = workspaceRef.current.getBoundingClientRect();
    const firstPage = pages[0];
    const pageW = firstPage.width ?? 980;
    const x = -(ws.width / 2 - pageW / 2);
    setCamera(clampCam({ x, y: -40, zoom: 1 }, ws.width, ws.height));
  }, [pages, setCamera, clampCam]);

  // active page tracking from camera
  useEffect(() => {
    if (!pages?.length || !workspaceRef.current) return;
    const ws = workspaceRef.current.getBoundingClientRect();
    const viewCenterY = camera.y + ws.height / 2 / camera.zoom;

    let nearest = pageOffsets[0];
    let nearestDist = Infinity;
    for (const off of pageOffsets) {
      const pageCenterY = off.y + off.height / 2;
      const dist = Math.abs(pageCenterY - viewCenterY);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = off;
      }
    }
    if (nearest.pageId !== activePageId) {
      setActivePageId(nearest.pageId);
    }
  }, [
    camera.y,
    camera.zoom,
    pages,
    pageOffsets,
    activePageId,
    setActivePageId,
  ]);

  // auto select first page
  useEffect(() => {
    if (pages && pages.length > 0 && !activePageId) {
      setActivePageId(pages[0].id);
    }
  }, [pages, activePageId, setActivePageId]);

  const handleAddPage = async (duplicateCurrent = false) => {
    if (!notebookId || !pages) return;
    const id = uuidv4();
    const currentPage =
      duplicateCurrent && currentPageIndex >= 0
        ? pages[currentPageIndex]
        : null;
    await db.pages.add({
      id,
      notebookId,
      order: pages.length,
      width: currentPage?.width,
      height: currentPage?.height,
      backgroundImage: currentPage?.backgroundImage,
      createdAt: Date.now(),
    });
    setActivePageId(id);
  };

  const currentPageIndex = pages?.findIndex((p) => p.id === activePageId) ?? -1;
  const isPdf = notebook?.kind === "pdf";

  const goPage = (delta: number) => {
    if (!pages) return;
    const next = currentPageIndex + delta;
    if (next < 0 || next >= pages.length) return;

    const target = pageOffsets[next];
    if (!target || !workspaceRef.current) return;

    const ws = workspaceRef.current.getBoundingClientRect();
    const z = cameraRef.current.zoom;
    const pageW = target.width;
    const newX = -(ws.width / 2 - pageW / 2);
    const newY = target.y - (ws.height / 2 - target.height / 2) / z;

    setCamClamped({ ...cameraRef.current, x: newX, y: newY });
    setActivePageId(pages[next].id);
  };

  const zoomBy = (delta: number) => {
    if (!workspaceRef.current) return;
    const ws = workspaceRef.current.getBoundingClientRect();
    const cam = cameraRef.current;
    const nextZoom = clamp(cam.zoom + delta);
    const screenCX = ws.width / 2;
    const screenCY = ws.height / 2;
    const worldCX = cam.x + screenCX / cam.zoom;
    const worldCY = cam.y + screenCY / cam.zoom;
    setCamClamped({
      zoom: nextZoom,
      x: worldCX - screenCX / nextZoom,
      y: worldCY - screenCY / nextZoom,
    });
  };

  const rasterizePage = useCallback(async (page: Page, scale: 1 | 2 | 3) => {
    const svg = document.querySelector(
      `[data-page-surface="${page.id}"] svg`,
    ) as SVGSVGElement | null;
    if (!svg) return null;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    const w = page?.width ?? 980;
    const h = page?.height ?? 1280;
    clone.removeAttribute("class");
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    clone.setAttribute("viewBox", `0 0 ${w} ${h}`);

    const svgText = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgText], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    try {
      const image = new Image();
      image.decoding = "async";
      const imageReady = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Could not render page SVG."));
      });
      image.src = url;
      await imageReady;

      const canvas = document.createElement("canvas");
      const safeScale = Math.min(scale, Math.sqrt(MAX_EXPORT_PIXELS / (w * h)));
      canvas.width = Math.max(1, Math.round(w * safeScale));
      canvas.height = Math.max(1, Math.round(h * safeScale));
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.fillStyle = "#fffdf8";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/png");
      });
      canvas.width = 1;
      canvas.height = 1;
      if (!blob) return null;
      return { blob, width: w, height: h };
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings | null>(
    null,
  );
  const [exportProgress, setExportProgress] = useState<ExportProgress>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const openExportSettings = (mode: ExportMode) => {
    setExportOpen(false);
    setExportSettings({
      mode,
      scope: mode === "share" ? "current" : "all",
      pageRange: activePageId
        ? String(
            (pages?.findIndex((page) => page.id === activePageId) ?? 0) + 1,
          )
        : "1",
      selectedPages: activePageId
        ? [(pages?.findIndex((page) => page.id === activePageId) ?? 0) + 1]
        : [1],
      scale: 2,
    });
  };

  const runExport = useCallback(async () => {
    if (!exportSettings || !pages?.length || !notebook) return;
    const baseName = sanitizeFileName(notebook.name);
    const selectedPages =
      exportSettings.scope === "current" && activePageId
        ? pages.filter((page) => page.id === activePageId)
        : exportSettings.scope === "custom"
          ? exportSettings.selectedPages
              .map((pageNumber) => pageNumber - 1)
              .map((index) => pages[index])
              .filter((page): page is Page => Boolean(page))
          : pages;
    if (!selectedPages.length) return;

    setExportProgress({
      label: "Preparing export",
      current: 0,
      total: selectedPages.length,
    });

    try {
      if (exportSettings.mode === "png") {
        const files: Array<{ name: string; blob: Blob }> = [];
        for (const [index, page] of selectedPages.entries()) {
          setExportProgress({
            label: `Rendering page ${index + 1}`,
            current: index,
            total: selectedPages.length,
          });
          const rendered = await rasterizePage(page, exportSettings.scale);
          if (!rendered) continue;
          files.push({
            name: `${baseName}-page-${String(index + 1).padStart(2, "0")}.png`,
            blob: rendered.blob,
          });
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        setExportProgress({
          label: "Packing ZIP",
          current: selectedPages.length,
          total: selectedPages.length,
        });
        const zip = await createZipBlob(files);
        downloadBlob(zip, `${baseName}-pages.zip`);
      }

      if (exportSettings.mode === "pdf") {
        let pdf: jsPDF | null = null;
        for (const [index, page] of selectedPages.entries()) {
          setExportProgress({
            label: `Rendering page ${index + 1}`,
            current: index,
            total: selectedPages.length,
          });
          const rendered = await rasterizePage(page, exportSettings.scale);
          if (!rendered) continue;
          const pageW = page.width ?? rendered.width;
          const pageH = page.height ?? rendered.height;
          const orientation = pageW > pageH ? "landscape" : "portrait";
          const dataUrl = await blobToDataUrl(rendered.blob);

          if (!pdf) {
            pdf = new jsPDF({
              format: [pageW, pageH],
              orientation,
              unit: "px",
            });
          } else {
            pdf.addPage([pageW, pageH], orientation);
          }
          pdf.addImage(dataUrl, "PNG", 0, 0, pageW, pageH);
          await new Promise((resolve) => requestAnimationFrame(resolve));
        }
        setExportProgress({
          label: "Saving PDF",
          current: selectedPages.length,
          total: selectedPages.length,
        });
        pdf?.save(`${baseName}.pdf`);
      }

      if (exportSettings.mode === "share") {
        const page = selectedPages[0];
        setExportProgress({ label: "Preparing share", current: 0, total: 1 });
        const rendered = await rasterizePage(page, exportSettings.scale);
        if (!rendered) return;
        const file = new File([rendered.blob], `${baseName}.png`, {
          type: "image/png",
        });
        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: notebook.name });
        } else {
          downloadBlob(rendered.blob, `${baseName}.png`);
        }
      }

      setExportSettings(null);
    } finally {
      setExportProgress(null);
    }
  }, [activePageId, exportSettings, notebook, pages, rasterizePage]);

  useEffect(() => {
    if (!exportOpen) return;
    const onDown = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [exportOpen]);

  // pen state
  useEffect(() => {
    const onStart = () => {
      penActiveRef.current = true;
    };
    const onEnd = () => {
      penActiveRef.current = false;
    };
    window.addEventListener("knote:pen-drawing-start", onStart);
    window.addEventListener("knote:pen-drawing-end", onEnd);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("knote:pen-drawing-start", onStart);
      window.removeEventListener("knote:pen-drawing-end", onEnd);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, []);

  // touch handlers
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (cameraLayerRef.current)
        cameraLayerRef.current.style.transition = "none";
      if (inertiaRef.current?.frameId)
        cancelAnimationFrame(inertiaRef.current.frameId);
      inertiaRef.current = null;
      if (e.touches.length === 1) {
        if (penActiveRef.current) return;
        const t = e.touches[0];
        panRef.current = {
          lastX: t.clientX,
          lastY: t.clientY,
          lastTime: performance.now(),
          vx: 0,
          vy: 0,
        };
        pinchRef.current = null;
        return;
      }

      if (e.touches.length === 2) {
        e.preventDefault();
        panRef.current = null;

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const screenCX = (t1.clientX + t2.clientX) / 2;
        const screenCY = (t1.clientY + t2.clientY) / 2;
        const ws = workspaceRef.current?.getBoundingClientRect();
        if (!ws) return;

        const cam = cameraRef.current;
        const worldAnchorX = cam.x + (screenCX - ws.left) / cam.zoom;
        const worldAnchorY = cam.y + (screenCY - ws.top) / cam.zoom;

        pinchRef.current = {
          startDistance: Math.hypot(
            t2.clientX - t1.clientX,
            t2.clientY - t1.clientY,
          ),
          startZoom: cam.zoom,
          worldAnchorX,
          worldAnchorY,
          latestDistance: Math.hypot(
            t2.clientX - t1.clientX,
            t2.clientY - t1.clientY,
          ),
          latestScreenX: screenCX,
          latestScreenY: screenCY,
          frameId: null,
        };
      }
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (penActiveRef.current) return;

      if (e.touches.length === 1 && panRef.current) {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - panRef.current.lastX;
        const dy = t.clientY - panRef.current.lastY;
        const now = performance.now();
        const dt = Math.max(1, now - panRef.current.lastTime);
        if (dt > 0) {
          const factor = Math.min(16 / dt, 1.25);
          const vx = dx * factor;
          const vy = dy * factor;
          panRef.current.vx = panRef.current.vx * 0.55 + vx * 0.45;
          panRef.current.vy = panRef.current.vy * 0.55 + vy * 0.45;
        }
        panRef.current.lastX = t.clientX;
        panRef.current.lastY = t.clientY;
        panRef.current.lastTime = now;

        const cam = cameraRef.current;
        const newX = cam.x - dx / cam.zoom;
        const newY = cam.y - dy / cam.zoom;
        const ws = workspaceRef.current?.getBoundingClientRect();
        const clamped = ws
          ? clampCam({ ...cam, x: newX, y: newY }, ws.width, ws.height)
          : { ...cam, x: newX, y: newY };
        cameraRef.current = clamped;
        applyCameraTransform(clamped);
        return;
      }

      const pinch = pinchRef.current;
      if (!pinch || e.touches.length !== 2) return;
      e.preventDefault();

      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const screenCX = (t1.clientX + t2.clientX) / 2;
      const screenCY = (t1.clientY + t2.clientY) / 2;
      pinch.latestDistance = dist;
      pinch.latestScreenX = screenCX;
      pinch.latestScreenY = screenCY;

      if (pinch.frameId !== null) return;
      pinch.frameId = requestAnimationFrame(() => {
        const p = pinchRef.current;
        const ws = workspaceRef.current?.getBoundingClientRect();
        if (!p || !ws) return;
        p.frameId = null;

        const ratio = Math.max(0.1, p.latestDistance / p.startDistance);
        const nextZoom = clamp(p.startZoom * ratio ** 0.62);

        const newX = p.worldAnchorX - (p.latestScreenX - ws.left) / nextZoom;
        const newY = p.worldAnchorY - (p.latestScreenY - ws.top) / nextZoom;
        const clamped = clampCam(
          { x: newX, y: newY, zoom: nextZoom },
          ws.width,
          ws.height,
        );
        cameraRef.current = clamped;
        applyCameraTransform(clamped);
      });
    },
    [applyCameraTransform, clampCam],
  );

  const handleTouchEnd = useCallback(() => {
    if (panRef.current) {
      const { vx, vy } = panRef.current;
      panRef.current = null;
      if (Math.abs(vx) > 2 || Math.abs(vy) > 2) {
        startInertia(vx, vy);
        return;
      }
    }
    const pinch = pinchRef.current;
    if (pinch?.frameId) cancelAnimationFrame(pinch.frameId);
    pinchRef.current = null;
    setCameraState({ ...cameraRef.current });
  }, [startInertia]);

  // desktop wheel
  useEffect(() => {
    const el = workspaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ws = el.getBoundingClientRect();
      const cam = cameraRef.current;

      const cc = (next: { x: number; y: number; zoom: number }) => {
        const b = boundsRef.current;
        const vpWw = ws.width / next.zoom;
        const vpHw = ws.height / next.zoom;
        const xLo = b.maxX - vpWw,
          xHi = b.minX;
        const x =
          xLo < xHi
            ? (b.minX + b.maxX) / 2 - vpWw / 2
            : Math.max(xHi, Math.min(xLo, next.x));
        const yLo = b.maxY - vpHw,
          yHi = b.minY;
        const y =
          yLo < yHi
            ? (b.minY + b.maxY) / 2 - vpHw / 2
            : Math.max(yHi, Math.min(yLo, next.y));
        return { x, y, zoom: next.zoom };
      };

      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        const nextZoom = clamp(cam.zoom * factor);
        const worldX = cam.x + (e.clientX - ws.left) / cam.zoom;
        const worldY = cam.y + (e.clientY - ws.top) / cam.zoom;
        setCamera(
          cc({
            zoom: nextZoom,
            x: worldX - (e.clientX - ws.left) / nextZoom,
            y: worldY - (e.clientY - ws.top) / nextZoom,
          }),
        );
      } else {
        setCamera(
          cc({
            ...cam,
            x: cam.x + e.deltaX / cam.zoom,
            y: cam.y + e.deltaY / cam.zoom,
          }),
        );
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [setCamera]);

  useEffect(() => {
    window.localStorage.setItem(
      "knote:workspace-theme",
      darkMode ? "dark" : "light",
    );
  }, [darkMode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-knote-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-[-10px] rounded-[28px] bg-knote-primary/10 blur-xl" />
            <NextImage
              src="/logo.png"
              alt="KNote"
              width={80}
              height={80}
              className="relative h-20 w-20 rounded-[22px]"
              priority
            />
          </div>
          <div className="h-1 w-28 overflow-hidden rounded-full bg-knote-border/70">
            <div className="h-full w-1/2 animate-[pulse_1.2s_ease-in-out_infinite] rounded-full bg-knote-primary/55" />
          </div>
        </div>
      </div>
    );
  }

  if (!notebookId) return <Library />;

  const handleCloseNotebook = () => router.push("/");
  const handleActivateTab = (id: string) => router.push(`/notebooks/${id}`);
  const handleCloseTab = (id: string) => {
    closeNotebookTab(id);
    if (id === notebookId) {
      const nextId = openNotebookIds.filter((i) => i !== id).at(-1);
      router.push(nextId ? `/notebooks/${nextId}` : "/");
    }
  };

  const cam = camera;
  const z = cam.zoom;
  const bgDotSize = 24;
  const dotRadius = Math.max(0.3, 0.6 / z);

  return (
    <div
      className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        darkMode ? "bg-[#161512] text-[#f4efe7]" : "bg-knote-bg text-knote-text"
      }`}
    >
      <DocumentTabs
        activeNotebookId={notebookId}
        darkMode={darkMode}
        notebooks={(openNotebooks ?? []).filter((n): n is Notebook =>
          Boolean(n),
        )}
        onActivate={handleActivateTab}
        onAddNotebook={() => router.push("/")}
        onClose={handleCloseTab}
      />

      <div
        className={`shrink-0 h-12 flex items-center justify-between px-3 border-b z-30 transition-colors duration-300 ${
          darkMode
            ? "border-[#343025] bg-[#201e19]"
            : "border-knote-border/60 bg-knote-surface"
        }`}
      >
        {/* Left: Back + Sidebar + Notebook name */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={handleCloseNotebook}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors active:scale-90 ${
              darkMode
                ? "text-[#d9cbb8] hover:bg-white/8"
                : "text-knote-primary hover:bg-black/5"
            }`}
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <div
            className={`w-px h-4 ${darkMode ? "bg-white/10" : "bg-knote-border"}`}
          />
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
              sidebarOpen
                ? darkMode
                  ? "bg-white/10 text-[#f4efe7]"
                  : "bg-knote-primary/10 text-knote-primary"
                : darkMode
                  ? "text-[#f4efe7]/60 hover:bg-white/8"
                  : "text-knote-text/60 hover:bg-black/5"
            }`}
          >
            <LayoutGrid size={16} strokeWidth={sidebarOpen ? 2.5 : 2} />
          </button>
          <span
            className={`ml-1.5 text-sm font-semibold truncate max-w-[200px] ${
              darkMode ? "text-[#f4efe7]/82" : "text-knote-text/76"
            }`}
          >
            {isPdf && <FileText size={14} className="inline -mt-0.5 mr-1" />}
            {notebook?.name}
          </span>
        </div>

        {/* Center: Page nav */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => goPage(-1)}
            disabled={currentPageIndex <= 0}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-20 active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/50 hover:bg-black/5"
            }`}
          >
            <ChevronLeft size={16} />
          </button>
          <span
            className={`text-xs font-medium tabular-nums min-w-[32px] text-center ${
              darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40"
            }`}
          >
            {currentPageIndex + 1}/{pages?.length ?? 0}
          </span>
          <button
            type="button"
            onClick={() => goPage(1)}
            disabled={!pages || currentPageIndex >= pages.length - 1}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all disabled:opacity-20 active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/50 hover:bg-black/5"
            }`}
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleAddPage()}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/40 hover:bg-black/5"
            }`}
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Right: Zoom + Export + Theme */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => zoomBy(-0.15)}
            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/45 hover:bg-black/5"
            }`}
          >
            <span className="text-lg leading-none -mt-0.5">−</span>
          </button>
          <span
            className={`hidden sm:inline min-w-[40px] text-center text-xs font-semibold tabular-nums ${
              darkMode ? "text-[#f4efe7]/44" : "text-knote-text/42"
            }`}
          >
            {Math.round(cam.zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomBy(0.15)}
            className={`hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/45 hover:bg-black/5"
            }`}
          >
            <span className="text-lg leading-none">+</span>
          </button>
          <div
            className={`w-px h-4 mx-0.5 ${darkMode ? "bg-white/10" : "bg-knote-border"}`}
          />

          {/* Export dropdown */}
          <div ref={exportRef} className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
                exportOpen
                  ? darkMode
                    ? "bg-white/10 text-[#f4efe7]"
                    : "bg-knote-primary/10 text-knote-primary"
                  : darkMode
                    ? "text-[#f4efe7]/55 hover:bg-white/8"
                    : "text-knote-text/45 hover:bg-black/5"
              }`}
            >
              <Download size={16} />
            </button>
            {exportOpen && (
              <div
                className={`absolute right-0 top-full mt-1.5 min-w-[190px] rounded-xl border z-50 py-1 backdrop-blur-xl ${
                  darkMode
                    ? "bg-[#201e19]/96 border-[#40392d]"
                    : "bg-knote-surface/96 border-knote-border/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    openExportSettings("png");
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                    darkMode
                      ? "text-[#f4efe7]/70 hover:bg-white/8 hover:text-[#f4efe7]"
                      : "text-knote-text/65 hover:bg-black/5 hover:text-knote-text"
                  }`}
                >
                  <FileImage size={16} className="shrink-0" />
                  <span>Export as PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openExportSettings("pdf");
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                    darkMode
                      ? "text-[#f4efe7]/70 hover:bg-white/8 hover:text-[#f4efe7]"
                      : "text-knote-text/65 hover:bg-black/5 hover:text-knote-text"
                  }`}
                >
                  <FileDown size={16} className="shrink-0" />
                  <span>Export notebook PDF</span>
                </button>
                <div
                  className={`h-px mx-3 my-1 ${
                    darkMode ? "bg-white/8" : "bg-knote-border/60"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    openExportSettings("share");
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                    darkMode
                      ? "text-[#f4efe7]/70 hover:bg-white/8 hover:text-[#f4efe7]"
                      : "text-knote-text/65 hover:bg-black/5 hover:text-knote-text"
                  }`}
                >
                  <Share2 size={16} className="shrink-0" />
                  <span>Share</span>
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setDarkMode((v) => !v)}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all active:scale-90 ${
              darkMode
                ? "text-[#f4efe7]/70 hover:bg-white/8"
                : "text-knote-text/45 hover:bg-black/5"
            }`}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden flex">
        <PageSidebar darkMode={darkMode} />

        <div
          ref={workspaceRef}
          className={`flex-1 relative h-full overflow-hidden transition-colors duration-300 ${
            darkMode
              ? "bg-[radial-gradient(circle_at_center,#242119_0,#191813_62%,#11100d_100%)]"
              : "bg-[radial-gradient(circle_at_center,#ffffff_0,#f7f1e8_68%,#eee3d3_100%)]"
          }`}
          style={{ touchAction: "none" }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          {/* Background dots layer */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="ws-dots"
                width={bgDotSize}
                height={bgDotSize}
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx={bgDotSize / 2}
                  cy={bgDotSize / 2}
                  r={dotRadius}
                  fill={darkMode ? "#3a3628" : "#d9d4ca"}
                />
              </pattern>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="url(#ws-dots)"
              opacity="0.6"
            />
          </svg>

          {/* Camera layer */}
          <div
            ref={cameraLayerRef}
            className="absolute"
            style={{
              transform: `translate(${-cam.x * z}px, ${-cam.y * z}px) scale(${z})`,
              transformOrigin: "0 0",
              willChange: "transform",
              transition: "transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1)",
            }}
          >
            {pageOffsets.map((off) => {
              const pageW = off.width;
              const pageH = off.height;
              const pageX = -pageW / 2 + worldW / 2;

              return (
                <div
                  key={off.pageId}
                  data-page-surface={off.pageId}
                  style={{
                    position: "absolute",
                    left: pageX,
                    top: off.y,
                    width: pageW,
                    height: pageH,
                  }}
                >
                  <Canvas
                    darkMode={darkMode}
                    pageId={off.pageId}
                    notebookId={notebookId}
                    onActivate={() => setActivePageId(off.pageId)}
                  />
                </div>
              );
            })}
          </div>

          <Toolbar darkMode={darkMode} />
        </div>
      </div>

      {exportSettings && (
        <ExportSettingsModal
          darkMode={darkMode}
          pageCount={pages?.length ?? 0}
          progress={exportProgress}
          settings={exportSettings}
          onCancel={() => {
            if (!exportProgress) setExportSettings(null);
          }}
          onChange={setExportSettings}
          onExport={runExport}
        />
      )}
    </div>
  );
}

function DocumentTabs({
  activeNotebookId,
  darkMode,
  notebooks,
  onActivate,
  onAddNotebook,
  onClose,
}: {
  activeNotebookId: string | null;
  darkMode: boolean;
  notebooks: Array<{
    id: string;
    name: string;
    kind?: "notebook" | "pdf";
  }>;
  onActivate: (id: string) => void;
  onAddNotebook: () => void | Promise<void>;
  onClose: (id: string) => void;
}) {
  return (
    <div
      className={`flex h-10 shrink-0 items-end gap-1 overflow-x-auto border-b px-2 pt-1 transition-colors duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
        darkMode
          ? "border-[#343025] bg-[#181713]"
          : "border-knote-border/60 bg-[#f4f0e8]"
      }`}
    >
      {notebooks.map((notebook) => {
        const active = notebook.id === activeNotebookId;
        const isPdf = notebook.kind === "pdf";

        return (
          <div
            key={notebook.id}
            className={`flex h-8 max-w-[210px] shrink-0 items-center gap-2 rounded-t-[10px] border px-2 text-sm transition-all ${
              active
                ? darkMode
                  ? "border-[#40392d] bg-[#201e19] text-[#f4efe7]"
                  : "border-knote-border/80 bg-knote-surface text-knote-text"
                : darkMode
                  ? "border-transparent bg-white/[0.04] text-[#f4efe7]/52 hover:bg-white/[0.07]"
                  : "border-transparent bg-black/[0.04] text-knote-text/55 hover:bg-black/[0.06]"
            }`}
          >
            <button
              type="button"
              onClick={() => onActivate(notebook.id)}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              {isPdf ? <FileText size={14} /> : <LayoutGrid size={14} />}
              <span className="truncate">{notebook.name}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${notebook.name}`}
              onClick={() => onClose(notebook.id)}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors ${
                darkMode
                  ? "text-[#f4efe7]/38 hover:bg-white/10 hover:text-[#f4efe7]"
                  : "text-knote-text/45 hover:bg-black/8 hover:text-knote-text"
              }`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        aria-label="New notebook tab"
        onClick={onAddNotebook}
        className={`mb-0.5 flex h-7 w-8 shrink-0 items-center justify-center rounded-[9px] transition-[background-color,transform,color] active:scale-95 ${
          darkMode
            ? "text-[#f4efe7]/55 hover:bg-white/8 hover:text-[#f4efe7]"
            : "text-knote-text/45 hover:bg-black/[0.06] hover:text-knote-text"
        }`}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function ExportSettingsModal({
  darkMode,
  pageCount,
  progress,
  settings,
  onCancel,
  onChange,
  onExport,
}: {
  darkMode: boolean;
  pageCount: number;
  progress: ExportProgress;
  settings: ExportSettings;
  onCancel: () => void;
  onChange: (settings: ExportSettings) => void;
  onExport: () => void | Promise<void>;
}) {
  const busy = Boolean(progress);
  const progressValue = progress
    ? Math.round((progress.current / Math.max(1, progress.total)) * 100)
    : 0;
  const modeLabel =
    settings.mode === "png"
      ? "PNG ZIP"
      : settings.mode === "pdf"
        ? "PDF"
        : "Share image";
  const customIndexes = settings.selectedPages.map(
    (pageNumber) => pageNumber - 1,
  );
  const canExport =
    !busy && (settings.scope !== "custom" || customIndexes.length > 0);
  const pageSummary =
    settings.selectedPages.length === pageCount
      ? "All pages"
      : `${settings.selectedPages.length} page${settings.selectedPages.length === 1 ? "" : "s"}`;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/24 px-4 py-4 backdrop-blur-sm">
      <div
        className={`flex max-h-[calc(100dvh-2rem)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border transition-colors ${
          darkMode
            ? "border-[#40392d] bg-[#201e19] text-[#f4efe7]"
            : "border-knote-border/80 bg-[#fffdf8] text-knote-text"
        }`}
      >
        <div
          className={`flex items-start justify-between border-b px-5 py-4 ${
            darkMode ? "border-white/10" : "border-knote-border/70"
          }`}
        >
          <div>
            <h2 className="text-base font-semibold">Export</h2>
            <p
              className={`mt-0.5 text-xs ${
                darkMode ? "text-[#f4efe7]/45" : "text-knote-text/45"
              }`}
            >
              {modeLabel} · {pageCount} page{pageCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close export"
            disabled={busy}
            onClick={onCancel}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all disabled:opacity-35 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/45 hover:bg-black/5"
            }`}
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 sm:grid-cols-[180px_1fr]">
          <div
            className={`flex aspect-[3/4] items-center justify-center rounded-xl border ${
              darkMode
                ? "border-white/10 bg-[#171611]"
                : "border-knote-border/70 bg-white"
            }`}
          >
            <div
              className={`flex h-[78%] w-[64%] flex-col items-center justify-center rounded-lg border ${
                darkMode
                  ? "border-[#4a4336] bg-[#f8f3ea] text-[#6f624d]"
                  : "border-knote-border/80 bg-[#fffdf8] text-knote-text/55"
              }`}
            >
              {settings.mode === "pdf" ? (
                <FileDown size={30} />
              ) : settings.mode === "share" ? (
                <Share2 size={30} />
              ) : (
                <FileImage size={30} />
              )}
              <span className="mt-3 text-xs font-semibold">{modeLabel}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div
                className={`text-xs font-semibold ${
                  darkMode ? "text-[#f4efe7]/50" : "text-knote-text/45"
                }`}
              >
                Pages
              </div>
              <div
                className={`mt-2 grid grid-cols-3 rounded-xl border p-1 ${
                  darkMode
                    ? "border-white/10 bg-white/[0.04]"
                    : "border-knote-border/70 bg-white"
                }`}
              >
                {(["current", "all", "custom"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    disabled={busy || settings.mode === "share"}
                    onClick={() => onChange({ ...settings, scope })}
                    className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all disabled:opacity-35 ${
                      settings.scope === scope
                        ? darkMode
                          ? "bg-[#f4efe7] text-[#201e19]"
                          : "bg-knote-text text-white"
                        : darkMode
                          ? "text-[#f4efe7]/55 hover:bg-white/8"
                          : "text-knote-text/55 hover:bg-black/5"
                    }`}
                  >
                    {scope}
                  </button>
                ))}
              </div>
              {settings.scope === "custom" && (
                <div className="mt-2">
                  <details className="group">
                    <summary
                      className={`flex h-10 cursor-pointer list-none items-center justify-between rounded-xl border px-3 text-sm font-medium transition-colors ${
                        darkMode
                          ? "border-white/10 bg-white/[0.04] text-[#f4efe7]/75 hover:bg-white/8"
                          : "border-knote-border/70 bg-white text-knote-text/65 hover:bg-black/5"
                      }`}
                    >
                      <span>{pageSummary}</span>
                      <ChevronRight
                        size={15}
                        className="transition-transform group-open:rotate-90"
                      />
                    </summary>
                    <div
                      className={`mt-2 max-h-40 overflow-y-auto rounded-xl border p-1 ${
                        darkMode
                          ? "border-white/10 bg-white/[0.04]"
                          : "border-knote-border/70 bg-white"
                      }`}
                    >
                      {Array.from({ length: pageCount }, (_, index) => {
                        const pageNumber = index + 1;
                        const selected =
                          settings.selectedPages.includes(pageNumber);

                        return (
                          <button
                            key={pageNumber}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              const next = selected
                                ? settings.selectedPages.filter(
                                    (page) => page !== pageNumber,
                                  )
                                : [...settings.selectedPages, pageNumber].sort(
                                    (a, b) => a - b,
                                  );
                              onChange({
                                ...settings,
                                selectedPages: next,
                                pageRange: next.join(","),
                              });
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors disabled:opacity-35 ${
                              selected
                                ? darkMode
                                  ? "bg-[#f4efe7] text-[#201e19]"
                                  : "bg-knote-text text-white"
                                : darkMode
                                  ? "text-[#f4efe7]/58 hover:bg-white/8"
                                  : "text-knote-text/58 hover:bg-black/5"
                            }`}
                          >
                            <span>Page {pageNumber}</span>
                            <span className="text-xs">
                              {selected ? "Selected" : ""}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                  <p
                    className={`mt-1.5 text-xs ${
                      darkMode ? "text-[#f4efe7]/35" : "text-knote-text/35"
                    }`}
                  >
                    {customIndexes.length > 0
                      ? `${customIndexes.length} page${customIndexes.length === 1 ? "" : "s"} selected`
                      : "Choose at least one page"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div
                className={`text-xs font-semibold ${
                  darkMode ? "text-[#f4efe7]/50" : "text-knote-text/45"
                }`}
              >
                Resolution
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    disabled={busy}
                    onClick={() => onChange({ ...settings, scale })}
                    className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all disabled:opacity-35 ${
                      settings.scale === scale
                        ? darkMode
                          ? "border-[#f4efe7] bg-[#f4efe7] text-[#201e19]"
                          : "border-knote-text bg-knote-text text-white"
                        : darkMode
                          ? "border-white/10 text-[#f4efe7]/55 hover:bg-white/8"
                          : "border-knote-border/70 text-knote-text/55 hover:bg-black/5"
                    }`}
                  >
                    {scale}x
                  </button>
                ))}
              </div>
              <p
                className={`mt-1.5 text-xs ${
                  darkMode ? "text-[#f4efe7]/35" : "text-knote-text/35"
                }`}
              >
                Large pages are automatically capped to prevent export crashes.
              </p>
            </div>

            {progress && (
              <div>
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span
                    className={
                      darkMode ? "text-[#f4efe7]/55" : "text-knote-text/55"
                    }
                  >
                    {progress.label}
                  </span>
                  <span
                    className={
                      darkMode ? "text-[#f4efe7]/40" : "text-knote-text/40"
                    }
                  >
                    {progressValue}%
                  </span>
                </div>
                <div
                  className={`h-2 overflow-hidden rounded-full ${
                    darkMode ? "bg-white/10" : "bg-knote-border/70"
                  }`}
                >
                  <div
                    className={
                      darkMode ? "h-full bg-[#f4efe7]" : "h-full bg-knote-text"
                    }
                    style={{ width: `${progressValue}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div
          className={`relative z-10 flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 ${
            darkMode
              ? "border-white/10 bg-[#201e19]"
              : "border-knote-border/70 bg-[#fffdf8]"
          }`}
        >
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all disabled:opacity-35 ${
              darkMode
                ? "text-[#f4efe7]/55 hover:bg-white/8"
                : "text-knote-text/55 hover:bg-black/5"
            }`}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canExport}
            onClick={onExport}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-45 ${
              darkMode
                ? "bg-[#f4efe7] text-[#201e19] hover:bg-white"
                : "bg-knote-text text-white hover:bg-knote-text/90"
            }`}
          >
            {busy ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
