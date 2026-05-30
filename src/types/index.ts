export type Folder = {
  id: string;
  name: string;
  color: string;
  icon: FolderIconName;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Notebook = {
  id: string;
  name: string;
  color: string;
  folderId: string | null;
  createdAt: number;
  updatedAt: number;
};

export type Page = {
  id: string;
  notebookId: string;
  order: number;
  createdAt: number;
};

export type Stroke = {
  id: string;
  pageId: string;
  tool: Tool;
  color: string;
  width: number;
  opacity: number;
  points: Point[];
};

export type Point = {
  x: number;
  y: number;
  pressure: number;
};

export type Tool = "pen" | "pencil" | "highlighter" | "eraser";

export type RedoStrokesByPage = Record<string, Stroke[]>;

export type FolderIconName = string;

// Notebook cover color presets
export const NOTEBOOK_COLORS = [
  "#7C6A46", // Warm brown (primary)
  "#8B6E5A", // Mocha
  "#6B7B6E", // Sage
  "#5C6B7E", // Slate blue
  "#7B6B8A", // Muted purple
  "#8A6B6B", // Dusty rose
  "#6B8A7B", // Teal
  "#8A7B5C", // Olive
] as const;

export const FOLDER_COLORS = [
  "#D9C7A3",
  "#C9B79A",
  "#B9C7B1",
  "#B7C1CF",
  "#C7B8CF",
  "#D2B6B1",
  "#B5CFC3",
  "#CEC29E",
] as const;

export const FOLDER_ICONS: FolderIconName[] = [
  "folder",
  "book",
  "pen",
  "sparkles",
  "archive",
  "heart",
];
