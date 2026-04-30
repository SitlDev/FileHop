'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useEditor } from '@/store/editorStore'
import Toolbar from '@/components/Toolbar'
import PropertiesPanel from '@/components/PropertiesPanel'
import PageSidebar from '@/components/PageSidebar'
import PdfExportDialog, { type ExportPage } from '@/components/PdfExportDialog'
import FindReplaceDialog from '@/components/FindReplaceDialog'
import type { EditorHandle } from '@/components/CanvasEditor'

const CanvasEditor = dynamic(() => import('@/components/CanvasEditor'), { ssr: false })

interface Toast { id: number; msg: string; type: string }

export default function VectorForgePage() {
  const { zoom, setZoom, pdfBytes, totalPages, currentPage, setPdfBytes, setCurrentPage, activeTool, setTool } = useEditor()
  
  useEffect(() => {
    // Log visit
    fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify({ toolName: 'pdfeditor', action: 'visit' })
    }).catch(() => {});
  }, []);
  const editorRef = useRef<EditorHandle | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)      // PDF open
  const imageOpenRef = useRef<HTMLInputElement>(null)      // Image open as page
  const imageInputRef = useRef<HTMLInputElement>(null)     // Insert image annotation
  const docOpenRef = useRef<HTMLInputElement>(null)        // Document open
  const sheetOpenRef = useRef<HTMLInputElement>(null)      // Spreadsheet open
  const convertImagesRef = useRef<HTMLInputElement>(null)  // Convert images → PDF

  const [selectedObj, setSelectedObj] = useState<unknown>(null)
  const [elementCount, setElementCount] = useState(0)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [status, setStatus] = useState('Ready')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [propsOpen, setPropsOpen] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const toastId = useRef(0)

  const toast = useCallback((msg: string, type = '') => {
    const id = toastId.current++
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const handleExport = useCallback(async () => {
    setStatus('Exporting PDF...')
    try {
      await editorRef.current?.exportPDF()
      toast('PDF exported', 'success')
      setStatus('Ready')
      
      // Log simple export usage
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: 'pdfeditor', action: 'export' })
      }).catch(() => {});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast('Export failed: ' + msg, 'error')
      setStatus('Error')
    }
  }, [toast])

  const handleMakeTextEditable = useCallback(async () => {
    setStatus('Extracting text...')
    try {
      await editorRef.current?.extractPageText()
      toast('Text extracted (editable overlay)', 'success')
      setStatus('Ready')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      toast('Text extract failed: ' + msg, 'error')
      setStatus('Error')
    }
  }, [toast])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const k = e.key.toLowerCase()
      if (e.metaKey || e.ctrlKey) {
        if (k === 'z' && !e.shiftKey) { e.preventDefault(); editorRef.current?.undo() }
        if (k === 'z' && e.shiftKey)  { e.preventDefault(); editorRef.current?.redo() }
        if (k === 's') { e.preventDefault(); handleExport() }
        if (k === 'c') { e.preventDefault(); editorRef.current?.copy() }
        if (k === 'x') { e.preventDefault(); editorRef.current?.cut() }
        if (k === 'v') { e.preventDefault(); editorRef.current?.paste() }
        if (k === 'a') { e.preventDefault(); editorRef.current?.selectAll() }
        if (k === 'd') { e.preventDefault(); editorRef.current?.duplicateSelected() }
        if (k === 'l') { e.preventDefault(); editorRef.current?.lockSelected() }
        if (k === 'f' || k === 'h') { e.preventDefault(); setShowFindReplace(true) }
        if (k === 'n') { e.preventDefault(); if (confirm('New document? Unsaved changes will be lost.')) { useEditor.getState().setPdfBytes(null, 0); useEditor.getState().setCurrentPage(1) } }
        if (k === 'p') { e.preventDefault(); window.print() }
        if (k === 'g' && !e.shiftKey) { e.preventDefault(); editorRef.current?.groupSelected() }
        if (k === 'g' && e.shiftKey)  { e.preventDefault(); editorRef.current?.ungroupSelected() }
        if (k === ']' && !e.shiftKey) { e.preventDefault(); editorRef.current?.bringForward() }
        if (k === '[' && !e.shiftKey) { e.preventDefault(); editorRef.current?.sendBackward() }
        if (k === ']' && e.shiftKey)  { e.preventDefault(); editorRef.current?.bringToFront() }
        if (k === '[' && e.shiftKey)  { e.preventDefault(); editorRef.current?.sendToBack() }
        return
      }
      if (k === 'escape') editorRef.current?.deselectAll()
      if (k === 'delete' || k === 'backspace') editorRef.current?.deleteSelected()
      if (k === '+' || k === '=') setZoom(Math.min(4, zoom + 0.25))
      if (k === '-') setZoom(Math.max(0.25, zoom - 0.25))
      // Shift+Key tool shortcuts
      if (e.shiftKey) {
        if (k === 'v') setTool('select')
        if (k === 't') setTool('text')
        if (k === 'r') setTool('rect')
        if (k === 'e') setTool('ellipse')
        if (k === 'l') setTool('line')
        if (k === 'm') setTool('mask')
        if (k === 'x') setTool('eraser')
        if (k === 'q') setTool('cut-rect')
        if (k === 'f') setTool('cut-free')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleExport, setZoom, setTool, zoom])

  async function handleFileOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'pdf') {
      try {
        setStatus('Loading PDF...')
        const bytes = new Uint8Array(await file.arrayBuffer())
        // Use pdf.js legacy build for Next/Turbopack compatibility
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
        // Keep worker version in sync with installed pdfjs-dist (legacy worker)
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
        // pdf.js may transfer (detach) the ArrayBuffer to the worker, so never pass
        // the same Uint8Array instance we want to keep in state.
        const pdfDoc = await pdfjsLib.getDocument({ data: bytes.slice() }).promise
        setPdfBytes(bytes, pdfDoc.numPages)
        setStatus('PDF loaded — ' + pdfDoc.numPages + ' pages')
        toast('PDF loaded', 'success')
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        toast('Failed: ' + msg, 'error')
        setStatus('Error')
      }
    } else {
      toast('Please select a PDF file', 'error')
      setStatus('Ready')
    }
    e.target.value = ''
  }

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    editorRef.current?.addImage(dataUrl)
    e.target.value = ''
  }

  async function handleImageOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setStatus('Loading image...')
    try {
      const dataUrl = await fileToDataUrl(file)
      editorRef.current?.openImageAsPage(dataUrl)
      toast(`Opened ${file.name}`, 'success')
    } catch (err) {
      toast('Failed to open image: ' + String(err), 'error')
    }
    setStatus('Ready')
    e.target.value = ''
  }

  function handleWordOpen() {
    toast('Word import is coming soon — export from Word as PDF for now', 'info')
  }

  async function handleDocOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'txt') {
      const text = await file.text()
      const pageW = 816
      const lines: string[] = []
      const tmpC = document.createElement('canvas')
      const tmpCtx = tmpC.getContext('2d')!
      tmpCtx.font = '15px "Courier New", monospace'
      for (const rawLine of text.split('\n')) {
        if (tmpCtx.measureText(rawLine).width <= pageW - 120) { lines.push(rawLine) }
        else {
          const words = rawLine.split(' '); let cur = ''
          for (const w of words) {
            if (tmpCtx.measureText(cur + ' ' + w).width > pageW - 120) { lines.push(cur); cur = w }
            else { cur = cur ? cur + ' ' + w : w }
          }
          if (cur) lines.push(cur)
        }
      }
      const pageH = Math.max(1056, lines.length * 22 + 120)
      const canvasEl = document.createElement('canvas')
      canvasEl.width = pageW; canvasEl.height = pageH
      const ctx = canvasEl.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pageW, pageH)
      ctx.fillStyle = '#1a1a2e'; ctx.font = '15px "Courier New", monospace'
      lines.forEach((line, i) => ctx.fillText(line, 60, 60 + i * 22))
      editorRef.current?.openImageAsPage(canvasEl.toDataURL('image/png'))
      toast(`Opened ${file.name}`, 'success')
    } else if (['docx', 'doc', 'odt'].includes(ext)) {
      // Use mammoth to extract text from Word/ODT documents
      setStatus(`Opening ${file.name}…`)
      try {
        const mammoth = await import('mammoth')
        const ab = await file.arrayBuffer()
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab })
        // Strip HTML tags, normalise whitespace
        const text = html
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/<\/p>/gi, '\n\n')
          .replace(/<\/h[1-6]>/gi, '\n\n')
          .replace(/<[^>]+>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()

        const PAGE_W = 816, PAGE_H = 1056, MARGIN = 60, FS = 14, LINE_H = FS * 1.6
        const MAX_LINES = Math.floor((PAGE_H - MARGIN * 2) / LINE_H)

        // Word-wrap all text into lines
        const tmpC = document.createElement('canvas')
        const tmpCtx = tmpC.getContext('2d')!
        tmpCtx.font = `${FS}px Inter, Georgia, serif`
        const allLines: string[] = []
        for (const rawLine of text.split('\n')) {
          if (!rawLine.trim()) { allLines.push(''); continue }
          if (tmpCtx.measureText(rawLine).width <= PAGE_W - MARGIN * 2) { allLines.push(rawLine); continue }
          const words = rawLine.split(' '); let cur = ''
          for (const w of words) {
            if (tmpCtx.measureText(cur + ' ' + w).width > PAGE_W - MARGIN * 2) { allLines.push(cur); cur = w }
            else { cur = cur ? cur + ' ' + w : w }
          }
          if (cur) allLines.push(cur)
        }

        // Chunk into page-sized groups and open each as a canvas page
        const chunks: string[][] = []
        for (let i = 0; i < allLines.length; i += MAX_LINES) chunks.push(allLines.slice(i, i + MAX_LINES))
        if (chunks.length === 0) chunks.push([])

        for (const chunk of chunks) {
          const el = document.createElement('canvas')
          el.width = PAGE_W; el.height = PAGE_H
          const ctx = el.getContext('2d')!
          ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PAGE_W, PAGE_H)
          ctx.fillStyle = '#1a1a2e'; ctx.font = `${FS}px Inter, Georgia, serif`
          chunk.forEach((line, i) => ctx.fillText(line, MARGIN, MARGIN + i * LINE_H))
          editorRef.current?.openImageAsPage(el.toDataURL('image/png'))
        }

        toast(`Opened ${file.name} (${chunks.length} page${chunks.length !== 1 ? 's' : ''})`, 'success')
      } catch (err) {
        toast(`Could not open ${file.name}: ${String(err)}`, 'error')
      }
      setStatus('Ready')
    } else if (ext === 'rtf') {
      // RTF: strip control words and render as plain text
      const raw = await file.text()
      const text = raw
        .replace(/\{[^{}]*\}/g, '')
        .replace(/\\[a-z]+[-\d]* ?/gi, ' ')
        .replace(/[\\{}]/g, '')
        .trim()
      const PAGE_W = 816, MARGIN = 60, FS = 14, LINE_H = FS * 1.6
      const PAGE_H = Math.max(1056, text.split('\n').length * LINE_H + MARGIN * 2)
      const el = document.createElement('canvas'); el.width = PAGE_W; el.height = PAGE_H
      const ctx = el.getContext('2d')!
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PAGE_W, PAGE_H)
      ctx.fillStyle = '#1a1a2e'; ctx.font = `${FS}px "Courier New", monospace`
      text.split('\n').forEach((line, i) => ctx.fillText(line.slice(0, 100), MARGIN, MARGIN + i * LINE_H))
      editorRef.current?.openImageAsPage(el.toDataURL('image/png'))
      toast(`Opened ${file.name}`, 'success')
    } else {
      toast(`Unsupported format: .${ext}`, 'info')
    }
    e.target.value = ''
  }

  async function handleSheetOpen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (ext === 'csv') {
      const text = await file.text()
      const rows = text.trim().split('\n').map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()))
      // Render CSV as an image-like table on canvas
      const colW = 120, rowH = 28, pad = 8
      const cols = Math.max(...rows.map(r => r.length))
      const canvasEl = document.createElement('canvas')
      canvasEl.width = cols * colW + pad * 2
      canvasEl.height = rows.length * rowH + pad * 2
      const ctx = canvasEl.getContext('2d')!
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvasEl.width, canvasEl.height)
      rows.forEach((row, ri) => {
        row.forEach((cell, ci) => {
          const x = ci * colW + pad, y = ri * rowH + pad
          // Header row
          if (ri === 0) { ctx.fillStyle = '#1e1e2e'; ctx.fillRect(x, y, colW - 2, rowH - 2) }
          else { ctx.fillStyle = ri % 2 === 0 ? '#f4f4f8' : '#ffffff'; ctx.fillRect(x, y, colW - 2, rowH - 2) }
          ctx.strokeStyle = '#d1d5db'; ctx.lineWidth = 0.5
          ctx.strokeRect(x, y, colW - 2, rowH - 2)
          ctx.font = ri === 0 ? 'bold 11px system-ui' : '11px system-ui'
          ctx.fillStyle = ri === 0 ? '#ffffff' : '#1e1e2e'
          ctx.fillText(cell.substring(0, 16), x + 6, y + rowH / 2 + 4)
        })
      })
      const dataUrl = canvasEl.toDataURL('image/png')
      editorRef.current?.openImageAsPage(dataUrl)
      toast(`Opened ${file.name} (${rows.length} rows × ${cols} columns)`, 'success')
    } else {
      toast(`Export ${file.name} as CSV or PDF from your spreadsheet app, then open it here`, 'info')
    }
    e.target.value = ''
  }

  return (
    <div className="app">
      <Toolbar
         onOpenPdf={() => fileInputRef.current?.click()}
         onOpenImage={() => imageOpenRef.current?.click()}
         onOpenDoc={() => docOpenRef.current?.click()}
         onOpenSheet={() => sheetOpenRef.current?.click()}
         onOpenWord={handleWordOpen}
         onConvertToPdf={() => setShowExportDialog(true)}
         onExportPdf={() => setShowExportDialog(true)}
         onExportImage={(fmt) => editorRef.current?.exportImage(fmt)}
         onExportSVG={() => editorRef.current?.exportSVG()}
         onMakeTextEditable={handleMakeTextEditable}
         onUndo={() => editorRef.current?.undo()}
         onRedo={() => editorRef.current?.redo()}
         onCopy={() => editorRef.current?.copy()}
         onCut={() => editorRef.current?.cut()}
         onPaste={() => editorRef.current?.paste()}
         onAddImage={() => imageInputRef.current?.click()}
         onNewDocument={() => { useEditor.getState().setPdfBytes(null, 0); useEditor.getState().setCurrentPage(1) }}
         onPrint={() => window.print()}
         onFindReplace={() => setShowFindReplace(true)}
         onSelectAll={() => editorRef.current?.selectAll()}
         onDeselectAll={() => editorRef.current?.deselectAll()}
         onDeleteSelected={() => editorRef.current?.deleteSelected()}
         onDuplicate={() => editorRef.current?.duplicateSelected()}
         onBringForward={() => editorRef.current?.bringForward()}
         onSendBackward={() => editorRef.current?.sendBackward()}
         onBringToFront={() => editorRef.current?.bringToFront()}
         onSendToBack={() => editorRef.current?.sendToBack()}
         onGroupSelected={() => editorRef.current?.groupSelected()}
         onUngroupSelected={() => editorRef.current?.ungroupSelected()}
         onLockSelected={() => editorRef.current?.lockSelected()}
       />
      
      <div className="main">
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <PageSidebar
            pdfBytes={pdfBytes}
            totalPages={totalPages}
            currentPage={currentPage}
            onPageSelect={n => { setCurrentPage(n); setSidebarOpen(false) }}
          />
        </div>

        <div className="canvas-area" onClick={() => { setSidebarOpen(false); setPropsOpen(false) }}>
          <CanvasEditor
            editorRef={editorRef}
            onSelectionChange={(obj) => {
              setSelectedObj(obj)
              if (obj && window.innerWidth < 1024) setPropsOpen(true)
            }}
            onElementCountChange={setElementCount}
          />
        </div>

        <div className={`props-panel ${propsOpen ? 'open' : ''}`}>
          <PropertiesPanel
            selectedObj={selectedObj}
            onApplyProp={(p, v) => editorRef.current?.applyProp(p, v)}
            onDelete={() => editorRef.current?.deleteSelected()}
            onDuplicate={() => editorRef.current?.duplicateSelected()}
            onBringForward={() => editorRef.current?.bringForward()}
            onSendBackward={() => editorRef.current?.sendBackward()}
            onRotatePage={() => editorRef.current?.rotatePage()}
            elementCount={elementCount}
            currentPage={currentPage}
            totalPages={totalPages || 1}
          />
        </div>
      </div>

      <div className="status-bar" style={{position:'relative'}}>
        <button className="tb-tool-btn mobile-only" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div className="status-item"><div className="status-dot" /><span>{status}</span></div>
        <span className="status-pipe mobile-hidden">|</span>
        <div className="status-item mobile-hidden">Pg <strong>{currentPage}</strong>&thinsp;/&thinsp;{totalPages || 1}</div>
        <span className="status-pipe mobile-hidden">|</span>
        <div className="status-item mobile-hidden">Tool <strong style={{textTransform:'capitalize'}}>{activeTool}</strong></div>
        <span className="status-pipe mobile-hidden">|</span>
        <div className="status-item mobile-hidden"><strong>{elementCount}</strong> objects</div>

        {/* Zoom — absolutely centered */}
        <div className="status-item mobile-hidden" style={{
          position:'absolute', left:'50%', transform:'translateX(-50%)',
          display:'flex', alignItems:'center', gap:6
        }}>
          <button className="tb-tool-btn" style={{width:22,height:22,padding:0}} onClick={() => setZoom(Math.max(0.25, zoom - 0.25))} title="Zoom out (−)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
          <strong style={{minWidth:36, textAlign:'center'}}>{Math.round(zoom * 100)}%</strong>
          <button className="tb-tool-btn" style={{width:22,height:22,padding:0}} onClick={() => setZoom(Math.min(4, zoom + 0.25))} title="Zoom in (+)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        <div style={{flex:1}} />
        <button className="tb-tool-btn mobile-only" style={{marginLeft:'auto'}} onClick={() => setPropsOpen(!propsOpen)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 01-2.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </div>
      <div className="toast-container">
        {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>)}
      </div>
      <PdfExportDialog
        isOpen={showExportDialog}
        totalPages={totalPages || 1}
        onClose={() => setShowExportDialog(false)}
        onExport={async (pages: ExportPage[]) => {
          setStatus('Building PDF…')
          try {
            await editorRef.current?.exportPDFWithOrder(pages)
            toast(`Exported ${pages.length} page${pages.length !== 1 ? 's' : ''} as PDF`, 'success')
            setShowExportDialog(false)
            
            // Log ordered export usage
            fetch('/api/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                toolName: 'pdfeditor', 
                action: 'export',
                metadata: { pageCount: pages.length }
              })
            }).catch(() => {});
          } catch (err) {
            toast('Export failed: ' + String(err), 'error')
          }
          setStatus('Ready')
        }}
      />
      <FindReplaceDialog
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onFindReplace={(findStr, replaceStr, allPages, caseSensitive, selectionOnly) => {
          // Batch mode: "foo:bar; old:new" — split on ; then on first :
          const hasBatch = findStr.includes(';')
          const pairs = hasBatch
            ? findStr.split(';').map(p => p.trim()).filter(Boolean).map(p => {
                const ci = p.indexOf(':')
                return ci > 0 ? { find: p.slice(0, ci).trim(), replace: p.slice(ci + 1).trim() } : { find: p, replace: replaceStr }
              })
            : [{ find: findStr, replace: replaceStr }]
          let total = 0
          for (const pair of pairs) {
            if (pair.find) total += editorRef.current?.findReplace(pair.find, pair.replace, allPages, caseSensitive, selectionOnly) ?? 0
          }
          return total
        }}
      />
      <input ref={fileInputRef}   type="file" style={{display:'none'}} accept=".pdf,application/pdf" onChange={handleFileOpen} />
      <input ref={imageOpenRef}   type="file" style={{display:'none'}} accept="image/*" onChange={handleImageOpen} />
      <input ref={imageInputRef}  type="file" style={{display:'none'}} accept="image/*" onChange={handleImageFile} />
      <input ref={docOpenRef}     type="file" style={{display:'none'}} accept=".txt,.doc,.docx,.odt,.rtf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleDocOpen} />
      <input ref={sheetOpenRef}   type="file" style={{display:'none'}} accept=".csv,.xls,.xlsx,.ods,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleSheetOpen} />
    </div>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  const ab = await file.arrayBuffer()
  const b64 = btoa(String.fromCharCode(...new Uint8Array(ab)))
  return `data:${file.type || 'application/octet-stream'};base64,${b64}`
}
