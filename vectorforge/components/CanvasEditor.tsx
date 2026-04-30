'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useEditor } from '@/store/editorStore'
import * as fabric from 'fabric'

type FabricEventHandler = (evt: unknown) => void

type FabricObject = {
  type?: unknown
  left?: unknown
  top?: unknown
  width?: unknown
  height?: unknown
  opacity?: unknown
  fill?: unknown
  stroke?: unknown
  strokeWidth?: unknown
  fontSize?: unknown
  fontWeight?: unknown
  text?: unknown
  rx?: unknown
  ry?: unknown
  scaleX?: unknown
  scaleY?: unknown
  angle?: unknown
  points?: unknown
  data?: unknown
  getScaledWidth?: () => number
  getScaledHeight?: () => number
  set: (keyOrProps: any, value?: any) => void
  rotate: (angle: number) => void
  get: (prop: string) => any
  clone: (cb: (cloned: FabricObject) => void) => void
  enterEditing: () => void
  scaleToWidth: (w: number) => void
}

type FabricCanvas = {
  on: (eventName: string, handler: FabricEventHandler) => void
  dispose: () => void
  setZoom: (z: number) => void
  setWidth: (w: number) => void
  setHeight: (h: number) => void
  renderAll: () => void
  clear: () => void
  loadFromJSON: (json: unknown) => Promise<unknown>
  toJSON: () => unknown
  add: (obj: FabricObject) => void
  remove: (obj: FabricObject) => void
  bringForward: (obj: FabricObject) => void
  sendBackwards: (obj: FabricObject) => void
  setActiveObject: (obj: FabricObject) => void
  getActiveObject: () => FabricObject | null
  getObjects: () => FabricObject[]
  getWidth: () => number
  getHeight: () => number
  getPointer: (e: unknown) => { x: number; y: number }
  findTarget: (e: MouseEvent) => FabricObject | null
  getActiveObjects: () => FabricObject[]
  discardActiveObject: () => void
  requestRenderAll: () => void
  bringObjectToFront: (obj: FabricObject) => void
  sendObjectToBack: (obj: FabricObject) => void
  selection: boolean
  isDrawingMode: boolean
  freeDrawingBrush?: { color: string; width: number }
  upperCanvasEl?: HTMLCanvasElement
}

type FabricStaticCanvas = {
  loadFromJSON: (json: unknown) => Promise<unknown>
  getWidth: () => number
  getHeight: () => number
  getObjects: () => FabricObject[]
  dispose: () => void
}

type FabricModule = {
  Canvas: new (el: HTMLCanvasElement | null, opts: { selection: boolean; preserveObjectStacking: boolean; width: number; height: number }) => FabricCanvas
  StaticCanvas: new (el: unknown, opts: { width: number; height: number }) => FabricStaticCanvas
  IText: new (text: string, opts: Record<string, unknown>) => FabricObject
  Textbox: new (text: string, opts: Record<string, unknown>) => FabricObject
  Rect: new (opts: Record<string, unknown>) => FabricObject
  Ellipse: new (opts: Record<string, unknown>) => FabricObject
  Line: new (points: number[], opts: Record<string, unknown>) => FabricObject
  Image: {
    fromURL: (url: string, cb: (img: FabricObject) => void, opts?: { crossOrigin?: string }) => void
  }
  Path: new (pathData: string, opts: Record<string, unknown>) => FabricObject
}

type PdfJsPageViewport = { width: number; height: number }
type PdfJsTextItem = {
  str: string
  transform: number[]
  width?: number
  height?: number
  fontName?: string
}
type PdfJsPage = {
  getViewport: (opts: { scale: number }) => PdfJsPageViewport
  render: (args: { canvasContext: CanvasRenderingContext2D; viewport: PdfJsPageViewport }) => { promise: Promise<void>; cancel: () => void }
  getTextContent: () => Promise<{ items: PdfJsTextItem[] }>
}
type PdfJsDoc = { getPage: (pageNum: number) => Promise<PdfJsPage> }
type PdfRotation = { type: 'degrees'; angle: number }

function degrees(angle: number): PdfRotation {
  return { type: 'degrees', angle }
}

interface Props {
  onSelectionChange: (obj: unknown) => void
  onElementCountChange: (n: number) => void
  editorRef: React.MutableRefObject<EditorHandle | null>
}

export interface EditorHandle {
  applyProp: (prop: string, val: unknown) => void
  deleteSelected: () => void
  duplicateSelected: () => void
  bringForward: () => void
  sendBackward: () => void
  bringToFront: () => void
  sendToBack: () => void
  selectAll: () => void
  deselectAll: () => void
  groupSelected: () => void
  ungroupSelected: () => void
  lockSelected: () => void
  findReplace: (find: string, replace: string, allPages: boolean, caseSensitive: boolean, selectionOnly: boolean) => number
  rotatePage: () => void
  exportPDF: () => Promise<void>
  exportPDFWithOrder: (pages: import('./PdfExportDialog').ExportPage[]) => Promise<void>
  exportImage: (format: 'png' | 'jpeg' | 'webp') => void
  exportSVG: () => void
  openImageAsPage: (dataUrl: string) => void
  addImage: (dataUrl: string) => void
  extractPageText: () => Promise<void>
  undo: () => void
  redo: () => void
  copy: () => Promise<void>
  cut: () => Promise<void>
  paste: () => Promise<void>
  toggleGrid: () => void
}

export default function CanvasEditor({ onSelectionChange, onElementCountChange, editorRef }: Props) {
  const { zoom, activeTool, setTool, pushHistory, undo: storeUndo, redo: storeRedo, pdfBytes, currentPage } = useEditor()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const fcRef = useRef<FabricCanvas | null>(null)
  const pdfDocRef = useRef<unknown>(null)
  const lastPageRef = useRef(currentPage)
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null)
  const clipboardRef = useRef<unknown[]>([])   // stores cloned fabric objects for paste
  const { savePageEdits } = useEditor()

  // Keep latest prop/callback values in refs so Fabric event handlers never go stale
  // without needing to re-register them (which would recreate the canvas).
  const cbRef = useRef({ onSelectionChange, onElementCountChange, pushHistory, savePageEdits, setTool })
  useEffect(() => { cbRef.current = { onSelectionChange, onElementCountChange, pushHistory, savePageEdits, setTool } })

  // Always-current refs for zoom and page, readable inside stable callbacks without re-creating them
  const zoomRef = useRef(zoom)
  const currentPageRef = useRef(currentPage)
  useEffect(() => { zoomRef.current = zoom }, [zoom])
  useEffect(() => { currentPageRef.current = currentPage }, [currentPage])

  const updateCount = useCallback(() => {
    if (fcRef.current) cbRef.current.onElementCountChange(fcRef.current.getObjects().length)
  }, [])

  const saveHistory = useCallback(() => {
    if (fcRef.current) cbRef.current.pushHistory(JSON.stringify(fcRef.current.toJSON()))
  }, [])

  const [gridEnabled] = useState(false)
  const grid_size = 20

  const renderBlankPage = useCallback(() => {
    if (!pdfCanvasRef.current) return
    const c = pdfCanvasRef.current
    const z = zoomRef.current
    c.width = 816 * z; c.height = 1056 * z
    const ctx = c.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, c.width, c.height)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // stable — reads zoom via zoomRef


  const renderPDFPage = useCallback(async (pageNum: number) => {
    const pdfDoc = pdfDocRef.current as PdfJsDoc | null
    if (!pdfDoc || !pdfCanvasRef.current) return

    // Cancel any in-progress render before starting a new one
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch (_) {/* ignore */}
      renderTaskRef.current = null
    }

    const page = await pdfDoc.getPage(pageNum)
    const scale = zoomRef.current
    const viewport = page.getViewport({ scale })
    const canvas = pdfCanvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = viewport.width + 'px'
    canvas.style.height = viewport.height + 'px'
    if (wrapperRef.current) {
      wrapperRef.current.style.width = viewport.width + 'px'
      wrapperRef.current.style.height = viewport.height + 'px'
    }
    if (fcRef.current) {
      fcRef.current?.setWidth(viewport.width)
      fcRef.current?.setHeight(viewport.height)
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    try {
      const task = page.render({ canvasContext: ctx, viewport })
      renderTaskRef.current = task
      await task.promise
      renderTaskRef.current = null
    } catch (err: unknown) {
      // RenderingCancelledException is expected when we cancel — ignore it
      const name = (err as { name?: string })?.name
      if (name !== 'RenderingCancelledException') throw err
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // stable — reads zoom via zoomRef

  const extractPageText = useCallback(async () => {
    const pdfDoc = pdfDocRef.current as PdfJsDoc | null
    const fc = fcRef.current
    if (!pdfDoc || !fc) throw new Error('PDF not loaded')
    // @ts-ignore
    if (fc.__disposed) throw new Error('Canvas disposed')

    const page = await pdfDoc.getPage(currentPageRef.current)
    const scale = zoomRef.current
    const viewport = page.getViewport({ scale })

    // pdfjs v5: bypass getTextContent() which uses `for await...of` on a ReadableStream
    // (requires Symbol.asyncIterator — missing in some browsers). Use getReader() instead.
    type FontStyle = { fontFamily: string; ascent: number; descent: number; vertical: boolean }
    type TextItem = {
      str?: string; transform?: number[]; width?: number; height?: number
      fontName?: string; color?: number[]  // color is [r,g,b] in 0–1 range
    }
    type TextChunk = { items: TextItem[]; styles: Record<string, FontStyle> }

    // @ts-ignore — streamTextContent exists in pdfjs v5
    const stream: ReadableStream<TextChunk> = (page as unknown as {
      streamTextContent: (o: unknown) => ReadableStream<TextChunk>
    }).streamTextContent({ includeMarkedContent: false })

    const allItems: TextItem[] = []
    const allStyles: Record<string, FontStyle> = {}
    const reader = stream.getReader()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value?.items) allItems.push(...value.items)
      if (value?.styles) Object.assign(allStyles, value.styles)
    }

    // ── Pass 1: compute positions for all items ──────────────────────────────
    const yShift = scale * 0.30  // baseline→Fabric-top offset (font-size-independent avg)
    type Placed = {
      str: string; vx: number; vy: number; w: number
      fontSizePx: number; ascent: number; descent: number
      fontFamily: string; isBold: boolean; isItalic: boolean; fillColor: string
    }
    const placed: Placed[] = []

    for (const item of allItems) {
      const str = (item?.str ?? '').toString()
      if (!str.trim()) continue

      const t = Array.isArray(item.transform) ? item.transform : [1, 0, 0, 1, 0, 0]
      const xPdf = Number(t[4] ?? 0)
      const yPdf = Number(t[5] ?? 0)
      const fontSizePdf = Math.abs(Number(t[3] ?? 0)) || 12
      const vx = xPdf * scale
      const vy = viewport.height - (yPdf * scale)
      const fontSizePx = fontSizePdf * scale

      const fontName = item.fontName ?? ''
      const styleEntry = allStyles[fontName]
      const normAscent  = (typeof styleEntry?.ascent  === 'number') ? styleEntry.ascent  : 0.85
      const normDescent = (typeof styleEntry?.descent === 'number') ? Math.abs(styleEntry.descent) : 0.50

      let fontFamily = styleEntry?.fontFamily ?? ''
      const nl = fontName.toLowerCase()
      if (!fontFamily || fontFamily === 'sans-serif' || fontFamily === 'serif' || fontFamily === 'monospace') {
        if (nl.includes('helvetica') || nl.includes('arial') || nl.includes('sans')) fontFamily = 'Helvetica, Arial, sans-serif'
        else if (nl.includes('courier') || nl.includes('mono')) fontFamily = 'Courier New, Courier, monospace'
        else fontFamily = styleEntry?.fontFamily ?? 'Times New Roman, Times, serif'
      }
      const isBold   = nl.includes('bold') || nl.includes('-bd') || nl.includes('heavy') || nl.includes('black')
      const isItalic = nl.includes('italic') || nl.includes('oblique') || nl.includes('-it')

      let fillColor = '#000000'
      if (Array.isArray(item.color) && item.color.length >= 3) {
        const r = Math.round((item.color[0] ?? 0) * 255)
        const g = Math.round((item.color[1] ?? 0) * 255)
        const b = Math.round((item.color[2] ?? 0) * 255)
        fillColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
      }

      placed.push({
        str, vx, vy,
        w: (typeof item.width === 'number' ? item.width * scale : str.length * fontSizePdf * 0.6 * scale),
        fontSizePx,
        ascent:  fontSizePx * normAscent,
        descent: fontSizePx * normDescent,
        fontFamily, isBold, isItalic, fillColor,
      })
    }

    // ── Pass 2: group items into lines by baseline Y ──────────────────────────
    placed.sort((a, b) => a.vy - b.vy)
    type Line = { items: Placed[]; x0: number; x1: number; y0: number; y1: number }
    const lines: Line[] = []
    for (const p of placed) {
      const last = lines[lines.length - 1]
      // Items within half a font-size of the current line belong to the same line
      if (last && Math.abs(p.vy - last.items[0].vy) < p.fontSizePx * 0.6) {
        last.items.push(p)
        last.x0 = Math.min(last.x0, p.vx)
        last.x1 = Math.max(last.x1, p.vx + p.w)
        last.y0 = Math.min(last.y0, p.vy - p.ascent)
        last.y1 = Math.max(last.y1, p.vy + p.descent)
      } else {
        lines.push({ items: [p], x0: p.vx, x1: p.vx + p.w, y0: p.vy - p.ascent, y1: p.vy + p.descent })
      }
    }

    // ── Pass 3: white blanket rect per line, then editable text on top ────────
    for (const line of lines) {
      const pad = 4
      const rectTop = line.y0 - yShift - pad
      fc.add(new fabric.Rect({
        left: line.x0 - pad, top: rectTop,
        width: line.x1 - line.x0 + pad * 2,
        height: line.y1 - line.y0 + yShift + pad * 2,
        fill: '#ffffff', strokeWidth: 0, opacity: 1,
        selectable: false, evented: false,
      }))
      for (const p of line.items) {
        // Textbox (not IText) so text wraps within the original paragraph width during editing
        fc.add(new fabric.Textbox(p.str, {
          left: p.vx, top: p.vy - p.ascent - yShift,
          width: Math.max(p.w, 20),
          fontSize: Math.max(6, p.fontSizePx),
          fontFamily: p.fontFamily,
          fontWeight: p.isBold ? 'bold' : 'normal',
          fontStyle: p.isItalic ? 'italic' : 'normal',
          fill: p.fillColor,
          splitByGrapheme: false,
          lineHeight: 1.3,   // extra room for descenders (g p q y j)
          padding: 1,         // prevents bbox from clipping the last line's descenders
        }))
      }
    }

    // @ts-ignore
    if (!fc.__disposed) fc.renderAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // stable — reads zoom/page via zoomRef/currentPageRef

  // Init Fabric — runs ONCE on mount. All event handlers use refs so they never go stale.
  useEffect(() => {
    if (!canvasRef.current) return
    const fc = new fabric.Canvas(canvasRef.current, {
      selection: true,
      preserveObjectStacking: true,
      width: 816,
      height: 1056,
    })
    fcRef.current = fc

    fc.on('object:moving', (evt) => {
      const target = (evt as { target?: FabricObject } | null)?.target
      const left = typeof target?.left === 'number' ? target.left : 0
      const top = typeof target?.top === 'number' ? target.top : 0
      target?.set?.({
        left: Math.round(left / grid_size) * grid_size,
        top: Math.round(top / grid_size) * grid_size,
      })
    })

    fc.on('object:modified', saveHistory)
    fc.on('object:added', () => { saveHistory(); updateCount() })
    fc.on('object:removed', () => { saveHistory(); updateCount() })
    fc.on('selection:created', () => cbRef.current.onSelectionChange(fc.getActiveObject()))
    fc.on('selection:updated', () => cbRef.current.onSelectionChange(fc.getActiveObject()))
    fc.on('selection:cleared', () => cbRef.current.onSelectionChange(null))

    // Cut tool shared state — declared before mouse:down so the 'cut-rect' case can reference it
    const cutState = { active: false, startX: 0, startY: 0, selRect: null as FabricObject | null }

    fc.on('mouse:down', (opt) => {
      const e = (opt as { e?: unknown } | null)?.e
      const p = fc.getPointer(e)
      const tool = useEditor.getState().activeTool
      switch (tool) {
        case 'text': {
          // Textbox so newly typed text wraps within a paragraph column
          const obj = new fabric.Textbox('Click to edit', {
            left: p.x, top: p.y, width: 320, fontSize: 20,
            fill: '#000000', fontFamily: 'Georgia, serif',
            lineHeight: 1.3,  // descender room for g p q y j
            padding: 1,
          })
          fc.add(obj); fc.setActiveObject(obj); obj.enterEditing?.()
          cbRef.current.setTool('select')
          break
        }
        case 'rect': {
          const obj = new fabric.Rect({ left: p.x, top: p.y, width: 120, height: 80, fill: 'rgba(108,99,255,0.12)', stroke: '#6c63ff', strokeWidth: 1.5 })
          fc.add(obj); fc.setActiveObject(obj); cbRef.current.setTool('select')
          break
        }
        case 'ellipse': {
          const obj = new fabric.Ellipse({ left: p.x, top: p.y, rx: 60, ry: 40, fill: 'rgba(108,99,255,0.12)', stroke: '#6c63ff', strokeWidth: 1.5 })
          fc.add(obj); fc.setActiveObject(obj); cbRef.current.setTool('select')
          break
        }
        case 'line': {
          const obj = new fabric.Line([p.x, p.y, p.x + 100, p.y], { stroke: '#000000', strokeWidth: 2 })
          fc.add(obj); fc.setActiveObject(obj); cbRef.current.setTool('select')
          break
        }
        case 'cut-rect': {
          // Start selection rect preview
          cutState.active = true
          cutState.startX = p.x; cutState.startY = p.y
          cutState.selRect = new fabric.Rect({
            left: p.x, top: p.y, width: 1, height: 1,
            fill: 'rgba(99,102,241,0.06)', stroke: '#6366f1',
            strokeDashArray: [5, 5], strokeWidth: 1.5,
            selectable: false, evented: false,
          })
          fc.add(cutState.selRect)
          break
        }
      }
    })

    // Eraser tool: erase on click AND while dragging
    const erasingRef = { active: false }
    fc.on('mouse:down', (opt) => {
      if (useEditor.getState().activeTool !== 'eraser') return
      erasingRef.active = true
      const target = (opt as { target?: FabricObject }).target
      if (target) { fc.remove(target); fc.renderAll() }
    })
    fc.on('mouse:move', (opt) => {
      const tool = useEditor.getState().activeTool
      if (tool === 'eraser' && erasingRef.active) {
        const e = (opt as { e?: MouseEvent }).e
        if (!e) return
        const target = fc.findTarget(e)
        if (target) { fc.remove(target); fc.discardActiveObject(); fc.renderAll() }
      } else if (tool === 'cut-rect' && cutState.active && cutState.selRect) {
        // Resize the dashed selection rect as the user drags
        const e = (opt as { e?: MouseEvent }).e
        if (!e) return
        const p = fc.getPointer(e)
        const sr = cutState.selRect
        sr.set({
          left:   Math.min(cutState.startX, p.x),
          top:    Math.min(cutState.startY, p.y),
          width:  Math.abs(p.x - cutState.startX),
          height: Math.abs(p.y - cutState.startY),
        })
        fc.renderAll()
      }
    })
    fc.on('mouse:up', (opt) => {
      erasingRef.active = false
      // Finalize rectangular cut
      if (useEditor.getState().activeTool === 'cut-rect' && cutState.active && cutState.selRect) {
        const sr = cutState.selRect
        const left   = typeof sr.left   === 'number' ? sr.left   : 0
        const top    = typeof sr.top    === 'number' ? sr.top    : 0
        const width  = typeof sr.width  === 'number' ? sr.width  : 0
        const height = typeof sr.height === 'number' ? sr.height : 0
        fc.remove(sr)
        cutState.selRect = null
        cutState.active  = false
        if (width > 5 && height > 5) {
          performRectCut({ left, top, width, height })
        }
        cbRef.current.setTool('select')
      }
    })

    // ── performRectCut: capture PDF canvas region → white mask + moveable Fabric Image ──
    function performRectCut(bounds: { left: number; top: number; width: number; height: number }) {
      const pdfCanvas = pdfCanvasRef.current
      const fcc = fcRef.current
      if (!pdfCanvas || !fcc) return
      const { left, top, width, height } = bounds
      // Draw the PDF region to a temp canvas
      const tmp = document.createElement('canvas')
      tmp.width  = Math.max(1, Math.ceil(width))
      tmp.height = Math.max(1, Math.ceil(height))
      tmp.getContext('2d')!.drawImage(pdfCanvas, left, top, width, height, 0, 0, tmp.width, tmp.height)
      const dataUrl = tmp.toDataURL('image/png')
      // White cover over the original area
      fcc.add(new fabric.Rect({ left, top, width, height, fill: '#ffffff', strokeWidth: 0, opacity: 1, selectable: false, evented: false }))
      // Floating image the user can drag around
      fabric.Image.fromURL(dataUrl, (img: FabricObject) => {
        img.set?.({ left, top })
        fcc.add(img); fcc.setActiveObject(img); fcc.renderAll()
      }, { crossOrigin: 'anonymous' })
    }

    // Mask & Cut-free: freehand-drawn path handler
    fc.on('path:created', (evt) => {
      const tool = useEditor.getState().activeTool
      const path = (evt as { path?: FabricObject }).path
      if (!path) return

      if (tool === 'mask') {
        // Close and fill white → opaque cover shape
        path.set({
          fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, opacity: 1,
          selectable: true, evented: true,
          // @ts-ignore
          ...(path.path ? { path: [...(path.path as unknown[]), ['Z']] } : {}),
        })
        fc.isDrawingMode = false
        fc.renderAll()
        cbRef.current.setTool('select')
        cbRef.current.pushHistory(JSON.stringify(fc.toJSON()))

      } else if (tool === 'cut-free') {
        // Freehand cut: capture the drawn region from the PDF canvas, then replace
        // the path with a white mask and place a moveable image over it.
        const pdfCanvas = pdfCanvasRef.current
        const fcc = fcRef.current
        if (!pdfCanvas || !fcc) return

        // Get screen bounding box of the drawn path
        const bbFn = (path as unknown as { getBoundingRect: () => { left:number; top:number; width:number; height:number } }).getBoundingRect
        const bb = typeof bbFn === 'function' ? bbFn.call(path) : { left: 0, top: 0, width: 100, height: 100 }

        // Build a Path2D from the Fabric path commands for clipping
        const pathCmds = (path as unknown as { path: Array<(string|number)[]> }).path
        let dataUrl = ''
        if (pathCmds && pdfCanvas.width > 0) {
          const svgD = pathCmds.map((cmd: (string|number)[]) => cmd.join(' ')).join(' ') + ' Z'
          const clip = document.createElement('canvas')
          clip.width  = pdfCanvas.width
          clip.height = pdfCanvas.height
          const ctx = clip.getContext('2d')!
          ctx.save()
          ctx.clip(new Path2D(svgD))
          ctx.drawImage(pdfCanvas, 0, 0)
          ctx.restore()
          // Crop to bounding box
          const cropped = document.createElement('canvas')
          cropped.width  = Math.max(1, Math.ceil(bb.width))
          cropped.height = Math.max(1, Math.ceil(bb.height))
          cropped.getContext('2d')!.drawImage(clip, bb.left, bb.top, bb.width, bb.height, 0, 0, cropped.width, cropped.height)
          dataUrl = cropped.toDataURL('image/png')
        }

        // Replace drawn path with a white cover mask
        path.set({
          fill: '#ffffff', stroke: 'transparent', strokeWidth: 0, opacity: 1,
          selectable: false, evented: false,
          // @ts-ignore
          ...(pathCmds ? { path: [...pathCmds, ['Z']] } : {}),
        })

        // Place the captured image as a floating, moveable object
        if (dataUrl) {
          fabric.Image.fromURL(dataUrl, (img: FabricObject) => {
            img.set?.({ left: bb.left, top: bb.top })
            fcc.add(img); fcc.setActiveObject(img)
            fcc.isDrawingMode = false
            fcc.renderAll()
            cbRef.current.setTool('select')
          }, { crossOrigin: 'anonymous' })
        } else {
          fcc.isDrawingMode = false
          fcc.renderAll()
          cbRef.current.setTool('select')
        }
      }
    })

    renderBlankPage()
    return () => {
      // @ts-ignore
      fc.__disposed = true
      fc.dispose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // intentionally empty — runs once on mount

  // Tool changes
  useEffect(() => {
    const fc = fcRef.current
    if (!fc) return
    if (activeTool === 'mask' || activeTool === 'cut-free') {
      // Both mask and cut-free use free-drawing mode
      fc.isDrawingMode = true
      fc.selection = false
      if (fc.freeDrawingBrush) {
        fc.freeDrawingBrush.color = activeTool === 'cut-free' ? 'rgba(239,68,68,0.7)' : 'rgba(99,102,241,0.7)'
        fc.freeDrawingBrush.width = 2
      }
      if (fc.upperCanvasEl) fc.upperCanvasEl.style.cursor = 'crosshair'
    } else if (activeTool === 'eraser') {
      fc.isDrawingMode = false
      fc.selection = false
      if (fc.upperCanvasEl) fc.upperCanvasEl.style.cursor =
        'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\'%3E%3Crect x=\'3\' y=\'12\' width=\'12\' height=\'9\' rx=\'1\' fill=\'%23fff\' stroke=\'%23999\' stroke-width=\'1.5\'/%3E%3Cpath d=\'M9 12 L19 2\' stroke=\'%23666\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E") 3 21, cell'
    } else if (activeTool === 'cut-rect') {
      fc.isDrawingMode = false
      fc.selection = false
      if (fc.upperCanvasEl) fc.upperCanvasEl.style.cursor = 'crosshair'
    } else {
      fc.isDrawingMode = false
      fc.selection = activeTool === 'select'
      if (fc.upperCanvasEl) fc.upperCanvasEl.style.cursor = ''
    }
  }, [activeTool])

  // Zoom changes — only resizes canvas, never re-creates it
  useEffect(() => {
    const fc = fcRef.current
    if (!fc) return
    fc.setZoom(zoom)
    fc.setWidth(816 * zoom)
    fc.setHeight(1056 * zoom)
    if (wrapperRef.current) {
      wrapperRef.current.style.width = 816 * zoom + 'px'
      wrapperRef.current.style.height = 1056 * zoom + 'px'
    }
    if (pdfCanvasRef.current) {
      pdfCanvasRef.current.style.width = 816 * zoom + 'px'
      pdfCanvasRef.current.style.height = 1056 * zoom + 'px'
    }
    fc.renderAll()
    // Re-render PDF at new zoom if a doc is loaded (renderPDFPage reads zoomRef internally)
    if (pdfDocRef.current) void renderPDFPage(currentPageRef.current)
  }, [zoom, renderPDFPage])

  // PDF loading — only runs when pdfBytes changes (new file opened)
  useEffect(() => {
    if (!pdfBytes) return
    ;(async () => {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
      pdfDocRef.current = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise
      await renderPDFPage(1)
    })()
  }, [pdfBytes, renderPDFPage])

  // Page changes — only runs when currentPage changes, NOT on zoom or pdfBytes reload
  useEffect(() => {
    const fc = fcRef.current
    if (!fc) return

    const prevPage = lastPageRef.current
    if (prevPage !== currentPage) {
      // Save edits for the page we're leaving
      cbRef.current.savePageEdits(prevPage, JSON.stringify(fc.toJSON()))

      // Load saved edits for the new page (or clear)
      const saved = useEditor.getState().pageEdits[currentPage]
      fc.clear()
      const afterLoad = () => { fc.renderAll(); updateCount() }
      if (saved) {
        // Promise.resolve handles both fabric v7 (returns Promise) and older (returns void)
        void Promise.resolve(fc.loadFromJSON(JSON.parse(saved))).then(afterLoad)
      } else {
        afterLoad()
      }
      lastPageRef.current = currentPage

      // Render PDF page for the new page
      if (pdfDocRef.current) void renderPDFPage(currentPage)
    }
  }, [currentPage, renderPDFPage, updateCount])

  // Expose handle
  useEffect(() => {
    editorRef.current = {
      applyProp(prop: string, val: unknown) {
        const obj = fcRef.current?.getActiveObject()
        if (!obj) return
        if (prop === 'text' && (obj.type === 'i-text' || obj.type === 'text')) {
          obj.set({ text: String(val ?? '') })
        } else {
          obj.set({ [prop]: val })
        }
        fcRef.current?.renderAll()
      },
      deleteSelected() {
        const obj = fcRef.current?.getActiveObject()
        if (obj) fcRef.current?.remove(obj)
      },
      duplicateSelected() {
        const fc = fcRef.current
        const obj = fc?.getActiveObject()
        if (!obj || !fc) return
        obj.clone((cloned) => {
          const left = typeof obj.left === 'number' ? obj.left : 0
          const top = typeof obj.top === 'number' ? obj.top : 0
          cloned.set({ left: left + 20, top: top + 20 })
          fc.add(cloned); fc.setActiveObject(cloned)
        })
      },
      bringForward() { const o = fcRef.current?.getActiveObject(); if (o) fcRef.current?.bringForward(o) },
      sendBackward() { const o = fcRef.current?.getActiveObject(); if (o) fcRef.current?.sendBackwards(o) },
      bringToFront() { const o = fcRef.current?.getActiveObject(); if (o) { fcRef.current?.bringObjectToFront(o); fcRef.current?.requestRenderAll() } },
      sendToBack() { const o = fcRef.current?.getActiveObject(); if (o) { fcRef.current?.sendObjectToBack(o); fcRef.current?.requestRenderAll() } },
      selectAll() {
        const fc = fcRef.current; if (!fc) return
        const objs = fc.getObjects().filter((o: FabricObject) => (o as any).selectable !== false)
        if (!objs.length) return
        void import('fabric').then(({ ActiveSelection }) => {
          fc.discardActiveObject()
          const sel = new ActiveSelection(objs as never, { canvas: fc } as never)
          fc.setActiveObject(sel as unknown as FabricObject)
          fc.requestRenderAll()
        })
      },
      deselectAll() { fcRef.current?.discardActiveObject(); fcRef.current?.requestRenderAll() },
      groupSelected() {
        const fc = fcRef.current; if (!fc) return
        const objs = fc.getActiveObjects(); if (objs.length < 2) return
        fc.discardActiveObject()
        import('fabric').then(({ Group }) => {
          const group = new Group(objs as never, { canvas: fc } as never)
          objs.forEach((o: FabricObject) => fc.remove(o))
          fc.add(group as unknown as FabricObject)
          fc.setActiveObject(group as unknown as FabricObject)
          fc.requestRenderAll()
        })
      },
      ungroupSelected() {
        const fc = fcRef.current; if (!fc) return
        const obj = fc.getActiveObject() as any
        if (!obj || obj.type !== 'group') return
        const group = obj as unknown as { toActiveSelection: () => FabricObject }
        const sel = group.toActiveSelection()
        fc.setActiveObject(sel); fc.requestRenderAll()
      },
      lockSelected() {
        const fc = fcRef.current; if (!fc) return
        fc.getActiveObjects().forEach((o: FabricObject) => {
          const locked = (o as any).lockMovementX === true
          o.set({ lockMovementX: !locked, lockMovementY: !locked, lockScalingX: !locked, lockScalingY: !locked, lockRotation: !locked, hasControls: locked, selectable: true })
        })
        fc.requestRenderAll()
      },
      findReplace(find: string, replace: string, allPages: boolean, caseSensitive: boolean, selectionOnly: boolean): number {
        if (!find) return 0
        const flags = caseSensitive ? 'g' : 'gi'
        const re = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
        let count = 0

        const fc = fcRef.current
        if (fc) {
          // When selectionOnly, restrict to active objects; otherwise all canvas objects
          const targets: FabricObject[] = selectionOnly
            ? fc.getActiveObjects()
            : fc.getObjects()
          targets.forEach((o: FabricObject) => {
            const ot = (o as any).type as string
            if (ot === 'textbox' || ot === 'text' || ot === 'i-text') {
              const text = (o as any).text as string || ''
              const newText = text.replace(re, replace)
              if (newText !== text) {
                o.set('text', newText)
                count++
              }
            }
          })
          if (count > 0) fc.requestRenderAll()
        }

        // Replace in stored page edits for other pages (only when not scoped to selection)
        if (allPages && !selectionOnly) {
          const store = useEditor.getState()
          const edits: Record<number, string> = { ...store.pageEdits }
          Object.keys(edits).forEach(pg => {
            const pageNum = Number(pg)
            if (pageNum === store.currentPage) return
            try {
              const json = JSON.parse(edits[pageNum])
              let altered = false
              json.objects?.forEach((obj: any) => {
                const ot = obj.type as string
                if (ot === 'textbox' || ot === 'text' || ot === 'i-text') {
                  const t = obj.text as string ?? ''
                  const nt = t.replace(re, replace)
                  if (nt !== t) { obj.text = nt; count++; altered = true }
                }
              })
              if (altered) edits[pageNum] = JSON.stringify(json)
            } catch { /* malformed JSON — skip */ }
          })
          if (Object.keys(edits).length) store.setPageEdits?.(edits)
        }

        return count
      },
      rotatePage() {
        fcRef.current?.getObjects().forEach((o) => {
          const angle = (o as { angle?: unknown })?.angle
          const a = typeof angle === 'number' ? angle : 0
          o.rotate?.(a + 90)
        })
        fcRef.current?.renderAll()
      },
      async exportPDFWithOrder(orderedPages) {
        const { pdfBytes: srcBytes, pageEdits } = useEditor.getState()
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        let srcDoc = null
        if (srcBytes) srcDoc = await PDFDocument.load(srcBytes)

        const outputDoc = await PDFDocument.create()

        for (const entry of orderedPages) {
          if (entry.type === 'current' && entry.pageNum != null) {
            if (srcDoc) {
              const [copied] = await outputDoc.copyPages(srcDoc, [entry.pageNum - 1])
              const outPage = outputDoc.addPage(copied)
              const { width, height } = outPage.getSize()
              const json = entry.pageNum === currentPageRef.current
                ? JSON.stringify(fcRef.current?.toJSON())
                : pageEdits[entry.pageNum]
              if (json) {
                const offscreen = document.createElement('canvas')
                const tempCanvas = new fabric.StaticCanvas(offscreen, { width: 100, height: 100 })
                await tempCanvas.loadFromJSON(JSON.parse(json))
                const cw = tempCanvas.getWidth() || 1, ch = tempCanvas.getHeight() || 1
                const sx = width / cw, sy = height / ch
                const parseClr = (v: unknown) => { if (typeof v !== 'string') return { r:0,g:0,b:0 }; const n = parseInt(v.replace('#',''),16); return { r:((n>>16)&255)/255, g:((n>>8)&255)/255, b:(n&255)/255 } }
                for (const obj of tempCanvas.getObjects()) {
                  const o = obj as any
                  const ox = ((o.left as number)??0)*sx
                  const oy = height - (((o.top as number)??0)+((o.height as number)??0)*((o.scaleY as number)??1))*sy
                  if (o.type === 'textbox' || o.type === 'text' || o.type === 'i-text') {
                    const font = o.fontWeight==='bold'
                      ? await outputDoc.embedFont(StandardFonts.TimesRomanBold)
                      : await outputDoc.embedFont(StandardFonts.TimesRoman)
                    const c = parseClr(o.fill)
                    const fs = ((o.fontSize as number)??14)*sy
                    String(o.text??'').split('\n').forEach((line, li) =>
                      outPage.drawText(line, { x: ox, y: oy - li*fs*1.2, size: fs, font, color: rgb(c.r,c.g,c.b) }))
                  }
                }
              }
            } else {
              // Image-open mode: embed canvas background
              const bgCanvas = pdfCanvasRef.current
              if (bgCanvas) {
                const b64 = bgCanvas.toDataURL('image/png').split(',')[1]
                const bgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
                const bgImg = await outputDoc.embedPng(bgBytes)
                const p = outputDoc.addPage([bgCanvas.width, bgCanvas.height])
                p.drawImage(bgImg, { x:0, y:0, width:bgCanvas.width, height:bgCanvas.height })
              }
            }
          } else if (entry.type === 'image' && entry.dataUrl) {
            const b64 = entry.dataUrl.split(',')[1]
            const imgBytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
            const embedded = await outputDoc.embedPng(imgBytes)
            const { width, height } = embedded
            const p = outputDoc.addPage([width, height])
            p.drawImage(embedded, { x:0, y:0, width, height })
          } else if (entry.type === 'added-pdf' && entry.pdfData) {
            const addedDoc = await PDFDocument.load(entry.pdfData)
            const [copied] = await outputDoc.copyPages(addedDoc, [entry.pdfPageIdx ?? 0])
            outputDoc.addPage(copied)
          }
        }

        const finalBytes = await outputDoc.save()
        const blob = new Blob([finalBytes as any], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = 'vectorforge-export.pdf'; a.click()
        URL.revokeObjectURL(url)
      },
      async exportPDF() {
        const { pdfBytes, pageEdits, totalPages } = useEditor.getState()
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')
        
        let pdfDoc
        if (pdfBytes) {
          pdfDoc = await PDFDocument.load(pdfBytes)
        } else {
          // No source PDF — build one from the canvas background (image-open mode)
          pdfDoc = await PDFDocument.create()
          const bgCanvas = pdfCanvasRef.current
          if (bgCanvas && bgCanvas.width > 0) {
            const bgDataUrl = bgCanvas.toDataURL('image/png')
            const bgBase64 = bgDataUrl.split(',')[1]
            const bgBytes = Uint8Array.from(atob(bgBase64), c => c.charCodeAt(0))
            const bgImg = await pdfDoc.embedPng(bgBytes)
            const p = pdfDoc.addPage([bgCanvas.width, bgCanvas.height])
            p.drawImage(bgImg, { x: 0, y: 0, width: bgCanvas.width, height: bgCanvas.height })
          } else {
            pdfDoc.addPage([612, 792])
          }
        }

        for (let i = 1; i <= (totalPages || 1); i++) {
          let page
          if (pdfBytes) {
            page = pdfDoc.getPage(i - 1)
          } else {
            // Image mode: page already added above; always use page 0
            page = pdfDoc.getPage(0)
          }

          const { width, height } = page.getSize()

          // Get edits for this page
          const json = i === currentPage ? JSON.stringify(fcRef.current?.toJSON()) : pageEdits[i]
          if (!json) continue

          const offscreen = document.createElement('canvas')
          const tempCanvas = new fabric.StaticCanvas(offscreen, { width: 100, height: 100 })
          await tempCanvas.loadFromJSON(JSON.parse(json))
          const canvasW = tempCanvas.getWidth() || 1
          const canvasH = tempCanvas.getHeight() || 1
          const sx = width / canvasW
          const sy = height / canvasH

          const fontRegular = await pdfDoc.embedFont(StandardFonts.TimesRoman)
          const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

          for (const obj of tempCanvas.getObjects()) {
            if (!obj) continue
            const opacity = typeof obj.opacity === 'number' ? obj.opacity : 1
            const angle = typeof obj.angle === 'number' ? obj.angle : 0
            const rotate = angle ? degrees(angle) : undefined
            const scaleX = typeof obj.scaleX === 'number' ? obj.scaleX : 1
            const scaleY = typeof obj.scaleY === 'number' ? obj.scaleY : 1

            if (obj.type === 'i-text' || obj.type === 'text') {
              const text = (obj.text ?? '').toString()
              if (!text) continue
              const fontSizePx = Number(obj.fontSize || 16)
              const fontSize = Math.max(6, (fontSizePx * scaleY / canvasH) * height)
              const color = parseFabricColor(obj.fill) || { r: 0, g: 0, b: 0 }

              const x = (Number(obj.left || 0)) * sx
              const yTop = (Number(obj.top || 0))
              const yBase = height - (yTop * sy) - fontSize

              const weight = (obj.fontWeight ?? 'normal').toString().toLowerCase()
              const font = weight.includes('bold') || weight === '700' || weight === '600' ? fontBold : fontRegular

              const lines = text.split(/\r?\n/)
              const lineHeight = fontSize * 1.2
              for (let li = 0; li < lines.length; li++) {
                const line = lines[li]
                if (!line) continue
                page.drawText(line, {
                  x,
                  y: yBase - li * lineHeight,
                  size: fontSize,
                  font,
                  color: rgb(color.r, color.g, color.b),
                  opacity,
                  rotate,
                } as unknown as Record<string, unknown>)
              }
              continue
            }

            if (obj.type === 'rect') {
              const fill = parseFabricColor(obj.fill)
              const stroke = parseFabricColor(obj.stroke)
              const x = (Number(obj.left || 0)) * sx
              const w = (Number(obj.getScaledWidth?.() ?? obj.width ?? 0) * scaleX) * sx
              const h = (Number(obj.getScaledHeight?.() ?? obj.height ?? 0) * scaleY) * sy
              const y = height - (Number(obj.top || 0) * sy) - h

              page.drawRectangle({
                x,
                y,
                width: w,
                height: h,
                color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
                borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
                borderWidth: Number(obj.strokeWidth || 0) * Math.max(sx, sy),
                opacity,
                rotate,
              } as unknown as Record<string, unknown>)
              continue
            }

            if (obj.type === 'ellipse') {
              const fill = parseFabricColor(obj.fill)
              const stroke = parseFabricColor(obj.stroke)
              const rx = Number(obj.rx || 0) * (Number(obj.scaleX || 1)) * sx
              const ry = Number(obj.ry || 0) * (Number(obj.scaleY || 1)) * sy
              const cx = (Number(obj.left || 0) + Number(obj.rx || 0) * Number(obj.scaleX || 1)) * sx
              const cyTop = (Number(obj.top || 0) + Number(obj.ry || 0) * Number(obj.scaleY || 1))
              const cy = height - (cyTop * sy)

              page.drawEllipse({
                x: cx,
                y: cy,
                xScale: rx,
                yScale: ry,
                color: fill ? rgb(fill.r, fill.g, fill.b) : undefined,
                borderColor: stroke ? rgb(stroke.r, stroke.g, stroke.b) : undefined,
                borderWidth: Number(obj.strokeWidth || 0) * Math.max(sx, sy),
                opacity,
                rotate,
              } as unknown as Record<string, unknown>)
              continue
            }

            if (obj.type === 'line') {
              const stroke = parseFabricColor(obj.stroke) || { r: 0, g: 0, b: 0 }
              const pts = (Array.isArray(obj.points) ? obj.points : [0, 0, 0, 0]) as unknown as number[]
              const x1 = Number(pts[0] ?? 0) * sx
              const y1 = height - (Number(pts[1] ?? 0) * sy)
              const x2 = Number(pts[2] ?? 0) * sx
              const y2 = height - (Number(pts[3] ?? 0) * sy)
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: Number(obj.strokeWidth || 1) * Math.max(sx, sy),
                color: rgb(stroke.r, stroke.g, stroke.b),
                opacity,
                rotate,
              } as unknown as Record<string, unknown>)
              continue
            }

            if (obj.type === 'image') {
              const data = (obj.data && typeof obj.data === 'object') ? (obj.data as { src?: unknown }) : undefined
              const dataUrl = typeof data?.src === 'string' ? data.src : undefined
              if (!dataUrl?.startsWith('data:')) continue
              const { mime, bytes } = dataUrlToBytes(dataUrl)
              const img = mime === 'image/jpeg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes)

              const x = (Number(obj.left || 0)) * sx
              const w = (Number(obj.getScaledWidth?.() ?? obj.width ?? 0) * scaleX) * sx
              const h = (Number(obj.getScaledHeight?.() ?? obj.height ?? 0) * scaleY) * sy
              const y = height - (Number(obj.top || 0) * sy) - h

              page.drawImage(img, { x, y, width: w, height: h, opacity, rotate } as unknown as Record<string, unknown>)
              continue
            }
          }

          tempCanvas.dispose()
        }

        const pdfData = await pdfDoc.save()
        const blob = new Blob([pdfData], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'vectorforge-export.pdf'
        a.click()
        URL.revokeObjectURL(url)
      },
      exportImage(format: 'png' | 'jpeg' | 'webp') {
        const pdfCanvas = pdfCanvasRef.current
        const fabricCanvas = canvasRef.current
        if (!pdfCanvas) return
        const composite = document.createElement('canvas')
        composite.width  = pdfCanvas.width
        composite.height = pdfCanvas.height
        const ctx = composite.getContext('2d')!
        ctx.drawImage(pdfCanvas, 0, 0)
        if (fabricCanvas) ctx.drawImage(fabricCanvas, 0, 0)
        const mime = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png'
        const dataUrl = composite.toDataURL(mime, format === 'png' ? undefined : 0.92)
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `vectorforge-export.${format}`
        a.click()
      },
      exportSVG() {
        const fc = fcRef.current
        if (!fc) return
        const svg = (fc as unknown as { toSVG: () => string }).toSVG()
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url
        a.download = 'vectorforge-export.svg'; a.click()
        URL.revokeObjectURL(url)
      },
      openImageAsPage(dataUrl: string) {
        const pdfCanvas = pdfCanvasRef.current
        const fc = fcRef.current
        if (!pdfCanvas || !fc) return
        const img = new window.Image()
        img.onload = () => {
          const w = img.naturalWidth
          const h = img.naturalHeight
          pdfCanvas.width = w
          pdfCanvas.height = h
          const ctx = pdfCanvas.getContext('2d')
          if (ctx) { ctx.clearRect(0, 0, w, h); ctx.drawImage(img, 0, 0) }
          fc.setWidth(w)
          fc.setHeight(h)
          fc.clear()
          fc.renderAll()
        }
        img.src = dataUrl
      },
      addImage(dataUrl: string) {
        const fc = fcRef.current
        if (!fc) return
        fabric.Image.fromURL(dataUrl, (img) => {
          const prev = (img.data && typeof img.data === 'object') ? (img.data as Record<string, unknown>) : {}
          img.data = { ...prev, src: dataUrl }
          img.scaleToWidth(Math.min(380, (fc.getWidth() ?? 816) - 40))
          img.set({ left: 20, top: 20 })
          fc.add(img)
          fc.setActiveObject(img)
          fc.renderAll()
        }, { crossOrigin: 'anonymous' })
      },
      async extractPageText() {
        await extractPageText()
      },
      undo() {
        const json = storeUndo()
        if (json && fcRef.current) {
          const fc = fcRef.current
          void Promise.resolve(fc.loadFromJSON(JSON.parse(json))).then(() => fc.renderAll())
        }
      },
      redo() {
        const json = storeRedo()
        if (json && fcRef.current) {
          const fc = fcRef.current
          void Promise.resolve(fc.loadFromJSON(JSON.parse(json))).then(() => fc.renderAll())
        }
      },
      async copy() {
        const fc = fcRef.current
        if (!fc) return
        const active = fc.getActiveObjects()
        if (active.length === 0) return
        clipboardRef.current = active.map(o => o.toJSON())
      },
      async cut() {
        const fc = fcRef.current
        if (!fc) return
        const active = fc.getActiveObjects()
        if (active.length === 0) return
        clipboardRef.current = active.map(o => o.toJSON())
        fc.remove(...active)
        fc.discardActiveObject()
        fc.requestRenderAll()
      },
      async paste() {
        const fc = fcRef.current
        if (!fc || clipboardRef.current.length === 0) return        
        const OFFSET = 12
        fc.discardActiveObject()
        const added: FabricObject[] = []
        for (const json of clipboardRef.current) {
          const obj = await fabric.util.enlivenObjects([json])
          const o = (obj as FabricObject[])[0]
          if (!o) continue
          o.set({ left: ((o as any).left as number ?? 0) + OFFSET, top: ((o as any).top as number ?? 0) + OFFSET, evented: true, selectable: true })
          fc.add(o)
          added.push(o)
          // Shift clipboard origin so repeated pastes cascade
          ;(json as any).left = ((json as any).left as number ?? 0) + OFFSET
          ;(json as any).top  = ((json as any).top  as number ?? 0) + OFFSET
        }
        if (added.length === 1) fc.setActiveObject(added[0])
        else if (added.length > 1) {
          const sel = new fabric.ActiveSelection(added, { canvas: fc })
          fc.setActiveObject(sel as unknown as FabricObject)
        }
        fc.requestRenderAll()
      },
      toggleGrid() {
        // Grid removed
      },
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef, extractPageText, storeRedo, storeUndo])

  return (
    <div className="canvas-area">
      <div className="canvas-area-inner">
        <div ref={wrapperRef} className={`canvas-wrapper ${gridEnabled ? 'grid-visible' : ''}`}>
          <canvas ref={pdfCanvasRef} className="pdf-canvas" />
          <canvas ref={canvasRef} className="fabric-canvas" />
        </div>
      </div>
    </div>
  )
}

function parseFabricColor(input: unknown): { r: number; g: number; b: number } | null {
  if (!input || typeof input !== 'string') return null
  const s = input.trim().toLowerCase()
  if (s === 'transparent' || s === 'none') return null

  if (s.startsWith('#') && (s.length === 7)) {
    const r = parseInt(s.slice(1, 3), 16) / 255
    const g = parseInt(s.slice(3, 5), 16) / 255
    const b = parseInt(s.slice(5, 7), 16) / 255
    return { r, g, b }
  }

  const m = s.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const parts = m[1].split(',').map(p => p.trim())
    const r = Math.max(0, Math.min(255, Number(parts[0] ?? 0))) / 255
    const g = Math.max(0, Math.min(255, Number(parts[1] ?? 0))) / 255
    const b = Math.max(0, Math.min(255, Number(parts[2] ?? 0))) / 255
    return { r, g, b }
  }

  return null
}

function dataUrlToBytes(dataUrl: string): { mime: string; bytes: Uint8Array } {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) throw new Error('Invalid data URL')
  const mime = m[1]
  const b64 = m[2]
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return { mime, bytes }
}
