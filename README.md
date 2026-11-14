# KNote

> A premium, touch-first digital notebook designed for iPad and Apple Pencil.

<p align="center">
  A calm, tactile writing experience built with Next.js and HTML Canvas.
</p>

<p align="center">
  iPad · Apple Pencil · Offline-first
</p>

---

## Overview

KNote is a digital notebook focused on making digital writing feel as natural and comfortable as writing on paper.

Rather than following the traditional productivity-app or file-manager approach, KNote is designed around the idea of a physical notebook:

- Notebooks feel like objects on a desk
- Writing is the primary interaction
- The canvas takes priority over the interface
- Controls stay out of the way
- Interactions are designed for touch
- Local storage keeps writing available offline

The primary target is **iPad with Apple Pencil**, while the application can also run as a PWA on desktop and Android tablets.

## Features

### Writing Experience

Writing is the core of KNote. The interface is intentionally minimal so the canvas remains the focus.

**Canvas tools and interactions:**
- Pen input
- Pencil
- Highlighter
- Eraser
- Lasso selection
- Undo and redo
- Zoom
- Pan
- Infinite scrolling

The canvas implementation lives under `src/features/canvas`.

### Designed for iPad

KNote is primarily designed around:

```text
iPad
  +
Apple Pencil
  +
Touch
  +
PWA
  =
Native-like writing experience
```

The product design prioritizes:

- Touch interaction
- Apple Pencil input
- Pressure-sensitive writing
- Palm rejection
- Large touch targets
- Smooth canvas interaction
- Fullscreen PWA usage
- Minimal navigation

The design brief specifies a minimum 48px touch target and treats iPad and Apple Pencil as the primary platform and input method.

### Notebook System

KNote uses notebooks as the primary organizational concept.

Instead of presenting users with a traditional file explorer, notebooks are designed to feel like physical objects.

```text
                    KNote
                      |
             +--------+--------+
             |                 |
         Notebooks           Canvas
             |                 |
             |            Writing Tools
             |                 |
             +--------+--------+
                      |
                  Local Data
```

Opening a notebook is intended to feel like picking up a physical notebook, while closing it should feel like putting it back on a desk.

Notebook pages are routed through:

```text
/notebooks/[notebookId]
```

### Local-First Storage

KNote uses browser-local storage rather than requiring a backend for its core writing experience.

The storage layer is built with:

- IndexedDB
- Dexie
- `dexie-react-hooks`

This provides a foundation for instant local saves and offline-first usage.

```text
                    KNote
                      |
                      v
                 Application
                      |
                      v
                    Dexie
                      |
                      v
                  IndexedDB
                      |
                      v
                 Local Device
```

The goal is to keep writing available even without an internet connection.

### Touch Interactions

KNote is built around direct manipulation.

The project uses:

- Pointer Events
- Gesture handling
- Canvas rendering
- Touch interactions
- Zoom and pan
- Pen input

The project specification specifically prioritizes canvas performance over decorative UI features.

## Interface Philosophy

KNote intentionally avoids the visual language of traditional productivity software.

**Avoid**
- Dashboard-heavy layouts
- Corporate SaaS aesthetics
- Complex navigation
- Cluttered interfaces
- Feature overload

**Prioritize**
- Simplicity
- Focus
- Comfort
- Delight
- Natural writing

The design direction is described as **Premium Minimalism**, combining digital interfaces with the feeling of premium stationery and paper products.

## Architecture

KNote follows a feature-oriented Next.js application structure.

```text
                        KNote
                          |
                   Next.js Application
                          |
             +------------+------------+
             |                         |
             v                         v
         Notebook UI                Canvas
             |                         |
             |                  Pointer Events
             |                         |
             v                         v
        Application State         Drawing Engine
             |                         |
             +------------+------------+
                          |
                        Dexie
                          |
                          v
                      IndexedDB
```

The repository separates the application into:

```text
src/
├── app/
├── components/
├── db/
├── features/
│   └── canvas/
├── lib/
├── stores/
└── types/
```

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Application framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS 4 | Styling |
| Zustand | Application state |
| Dexie | IndexedDB abstraction |
| IndexedDB | Local persistence |
| HTML Canvas | Writing surface |
| Pointer Events | Pen and touch input |
| Framer Motion | Motion and transitions |
| Lucide React | Icons |
| `@use-gesture/react` | Gesture handling |
| `perfect-freehand` | Freehand stroke rendering |
| `next-pwa` | Progressive Web App |
| `html-to-image` | Image export |
| jsPDF | PDF generation |
| pdfjs-dist | PDF rendering |

These dependencies are currently defined in the repository's `package.json`.

## Project Structure

```text
KNote/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── design-system/
│   │   └── notebooks/
│   │       └── [notebookId]/
│   │
│   ├── components/
│   │
│   ├── db/
│   │   └── index.ts
│   │
│   ├── features/
│   │   └── canvas/
│   │       └── Canvas.tsx
│   │
│   ├── lib/
│   │
│   ├── stores/
│   │   └── useAppStore.ts
│   │
│   └── types/
│
├── PROJECT.md
├── package.json
├── next.config.ts
├── tsconfig.json
├── biome.json
└── postcss.config.mjs
```

The repository currently follows this feature-oriented structure, with the canvas isolated under `features/canvas` and persistence under `db`.

## Performance

KNote is designed around a smooth writing experience.

Performance priorities include:

- 60 FPS target
- Fast canvas rendering
- Optimized pen input
- Instant local saving
- Smooth zooming
- Smooth panning
- Large notebook support
- Offline-first interaction

Canvas performance is considered more important than decorative features.

## Motion Design

Animations are intended to feel physical rather than like traditional web animations.

The design language is based on the idea of moving paper:

- Soft
- Natural
- Responsive
- Purposeful

Typical transitions are designed around 150–250ms.

Examples include:

- Notebook opening
- Notebook closing
- Page switching
- Tool selection
- Zoom transitions

Large bounces and excessive motion are intentionally avoided.

## Export

The project includes libraries for exporting and processing notebook content:

- Image generation
- PDF generation
- PDF rendering

Relevant packages include:

- `html-to-image`
- `jspdf`
- `pdfjs-dist`

## Getting Started

### Requirements

- Node.js
- npm, pnpm, Yarn, or Bun

### Clone the Repository

```bash
git clone https://github.com/PUKAN223/KNote.git
cd KNote
```

### Install Dependencies

Using Bun:

```bash
bun install
```

Or npm:

```bash
npm install
```

### Start Development Server

Using Bun:

```bash
bun run dev
```

Or npm:

```bash
npm run dev
```

Open the application at:

```text
http://localhost:3000
```

The repository currently uses the standard Next.js development workflow.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start development server |
| `bun run build` | Build production application |
| `bun run start` | Start production server |
| `bun run lint` | Run Biome checks |
| `bun run format` | Format the codebase |

These scripts are defined in the current `package.json`.

## Target Platforms

**Primary platforms**
- iPad
- Apple Pencil
- PWA

**Secondary platforms**
- Desktop
- Android tablets

Mobile phones are not the primary design target because the writing experience is designed around a larger canvas and stylus interaction.

## Offline First

KNote is designed so that the core writing experience does not depend on a network connection.

```text
             User
               |
               v
             KNote
               |
               v
           Local State
               |
               v
             Dexie
               |
               v
           IndexedDB
               |
               v
         Device Storage
```

This allows notes to be written and saved locally before any future synchronization layer is introduced.

## Roadmap

The project brief identifies several potential future capabilities:

- [ ] Cloud synchronization
- [ ] Firebase integration
- [ ] Real-time collaboration
- [ ] OCR
- [ ] PDF annotation
- [ ] Advanced Apple Pencil support
- [ ] More advanced notebook management
- [ ] Improved export workflows

These are future directions described in the project's design brief rather than features that are all currently implemented.

## Design Goal

The goal of KNote is simple:

> Make digital writing feel like writing on paper.

The application should feel:

- Premium
- Warm
- Focused
- Elegant
- Natural
- Fast

Most importantly, KNote is designed to feel like a **real writing application rather than a website**.

## Repository

[PUKAN223/KNote](https://github.com/PUKAN223/KNote)

## License

No license has currently been specified in the repository.
