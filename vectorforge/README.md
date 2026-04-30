# VectorForge

Minimal PDF editor for annotations (text, shapes, images) with editable PDF export.

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev
```

Open http://localhost:3000

## Features

- **Open PDFs** — render all pages, page thumbnails, navigate between pages
- **Annotation tools** — Select, Text, Rectangle, Ellipse, Line, Image
- **Properties panel** — fill, stroke, opacity, font size/weight, content editing, z-order
- **Export** — editable PDF export (Ctrl+S)
- **Undo/Redo** — 50-step history (Ctrl+Z)

## Stack

- Next.js 16 (App Router)
- Fabric.js (canvas layer)
- pdf.js (PDF rendering)
- Zustand (state)
- pdf-lib (PDF writing)

## Architecture

```
app/
  page.tsx              — main orchestrator
  layout.tsx            — loads fabric.js CDN
    
components/
  CanvasEditor.tsx      — Fabric.js overlay + PDF export
  Toolbar.tsx
  PropertiesPanel.tsx
  PageSidebar.tsx

store/
  editorStore.ts        — Zustand store
```

## Roadmap

- [ ] Multi-page annotation state persistence
- [ ] More annotation types (freehand, highlight, redact)
