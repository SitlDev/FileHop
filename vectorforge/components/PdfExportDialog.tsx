'use client'
import { useState, useEffect, useRef } from 'react'

export interface ExportPage {
  id: string
  type: 'current' | 'image' | 'added-pdf'
  label: string
  pageNum?: number       // for 'current' (1-indexed)
  dataUrl?: string       // for 'image' → PNG data URI
  mimeType?: string
  pdfData?: Uint8Array   // for 'added-pdf'
  pdfPageIdx?: number
  converting?: boolean   // shows spinner while processing
}

interface Props {
  isOpen: boolean
  totalPages: number
  onClose: () => void
  onExport: (pages: ExportPage[]) => Promise<void>
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Render lines of text onto an A4-sized canvas and return a PNG data URL */
function textToDataUrl(lines: string[], bgColor = '#ffffff', textColor = '#1a1a2e', fontSize = 14): string {
  const PW = 794, PH = 1123 // A4 at 96 dpi
  const MARGIN = 60, LINE_H = fontSize * 1.5
  const c = document.createElement('canvas')
  c.width = PW; c.height = PH
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bgColor; ctx.fillRect(0, 0, PW, PH)
  ctx.fillStyle = textColor
  ctx.font = `${fontSize}px "Courier New", monospace`
  lines.forEach((line, i) => {
    if (MARGIN + i * LINE_H < PH - MARGIN)
      ctx.fillText(line, MARGIN, MARGIN + i * LINE_H)
  })
  return c.toDataURL('image/png')
}

/** Word-wrap raw text into display lines */
function wrapText(raw: string, ctx: CanvasRenderingContext2D, maxW: number): string[] {
  const out: string[] = []
  for (const rawLine of raw.split('\n')) {
    if (ctx.measureText(rawLine).width <= maxW) { out.push(rawLine); continue }
    const words = rawLine.split(' '); let cur = ''
    for (const w of words) {
      if (ctx.measureText(cur + ' ' + w).width > maxW) { out.push(cur); cur = w }
      else { cur = cur ? cur + ' ' + w : w }
    }
    if (cur) out.push(cur)
  }
  return out
}

/** Convert any image file to PNG data URL via an offscreen canvas */
function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.naturalWidth; c.height = img.naturalHeight
      c.getContext('2d')!.drawImage(img, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/** Render a 2D array of rows into a styled table canvas → PNG data URL */
function tableToDataUrl(rows: string[][]): string {
  const CELL_H = 24, FONT = '12px Inter, sans-serif'
  const c = document.createElement('canvas')
  c.width = 794
  const ctx = c.getContext('2d')!
  ctx.font = FONT
  const maxCols = Math.max(...rows.map(r => r.length))
  const colW = Math.floor(c.width / maxCols)
  c.height = Math.max(60, rows.length * CELL_H + 32)
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height)
  rows.forEach((row, ri) => {
    const isHeader = ri === 0
    const y = 16 + ri * CELL_H
    if (isHeader) { ctx.fillStyle = '#6366f1'; ctx.fillRect(0, y - CELL_H * 0.75, c.width, CELL_H) }
    else if (ri % 2 === 0) { ctx.fillStyle = '#f8f8ff'; ctx.fillRect(0, y - CELL_H * 0.75, c.width, CELL_H) }
    ctx.fillStyle = isHeader ? '#ffffff' : '#1a1a2e'
    ctx.font = isHeader ? `bold ${FONT}` : FONT
    row.forEach((cell, ci) => ctx.fillText(String(cell ?? '').slice(0, 40), 8 + ci * colW, y))
  })
  return c.toDataURL('image/png')
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PdfExportDialog({ isOpen, totalPages, onClose, onExport }: Props) {
  const [pages, setPages] = useState<ExportPage[]>([])
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [converting, setConverting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setPages(
        Array.from({ length: Math.max(1, totalPages) }, (_, i) => ({
          id: `pg-${i + 1}`, type: 'current' as const,
          label: `Page ${i + 1}`, pageNum: i + 1,
        }))
      )
      setExporting(false)
    }
  }, [isOpen, totalPages])

  function move(idx: number, dir: -1 | 1) {
    const t = idx + dir
    if (t < 0 || t >= pages.length) return
    const next = [...pages];
    [next[idx], next[t]] = [next[t], next[idx]]
    setPages(next)
  }

  function remove(idx: number) { setPages(p => p.filter((_, i) => i !== idx)) }

  async function handleAddFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    setConverting(true)
    const added: ExportPage[] = []

    for (const file of files) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      const id = `${ext}-${Date.now()}-${file.name}`

      try {
        // ── Images ─────────────────────────────────────────────────────────
        if (['png','jpg','jpeg','webp','gif','bmp','tiff','tif','svg'].includes(ext)) {
          const dataUrl = await imageFileToDataUrl(file)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        // ── PDF ─────────────────────────────────────────────────────────────
        } else if (ext === 'pdf') {
          const pdfData = new Uint8Array(await file.arrayBuffer())
          const { PDFDocument } = await import('pdf-lib')
          const doc = await PDFDocument.load(pdfData)
          const count = doc.getPageCount()
          for (let i = 0; i < count; i++) {
            added.push({
              id: `${id}-p${i}`, type: 'added-pdf',
              label: count > 1 ? `${file.name} — p.${i + 1}` : file.name,
              pdfData, pdfPageIdx: i,
            })
          }

        // ── Plain text ─────────────────────────────────────────────────────
        } else if (ext === 'txt' || ext === 'rtf' || file.type.startsWith('text/')) {
          const raw = await file.text()
          const tmpC = document.createElement('canvas')
          const tmpCtx = tmpC.getContext('2d')!
          tmpCtx.font = '14px "Courier New", monospace'
          const lines = wrapText(raw, tmpCtx, 794 - 120)
          const dataUrl = textToDataUrl(lines)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        // ── CSV / TSV ──────────────────────────────────────────────────────
        } else if (ext === 'csv' || ext === 'tsv') {
          const { default: Papa } = await import('papaparse')
          const result = Papa.parse<string[]>(await file.text(), { skipEmptyLines: true })
          const dataUrl = tableToDataUrl(result.data)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        // ── Word / DOCX ────────────────────────────────────────────────────
        } else if (['docx','doc','odt'].includes(ext)) {
          const mammoth = await import('mammoth')
          const ab = await file.arrayBuffer()
          const { value: html } = await mammoth.convertToHtml({ arrayBuffer: ab })
          // Strip tags, get plain text
          const text = html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
          const tmpC = document.createElement('canvas')
          const tmpCtx = tmpC.getContext('2d')!
          tmpCtx.font = '13px Inter, sans-serif'
          const lines = wrapText(text, tmpCtx, 794 - 120)
          const dataUrl = textToDataUrl(lines, '#ffffff', '#1a1a2e', 13)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        // ── Spreadsheets (XLSX) ────────────────────────────────────────────
        } else if (ext === 'xlsx') {
          // Parse XLSX (OOXML zip format) without external library
          try {
            const { default: JSZip } = await import('jszip').catch(() => null as never)
            if (!JSZip) throw new Error('jszip not available')
            const zip = await JSZip.loadAsync(await file.arrayBuffer())
            // Read shared strings
            const ssXml = await zip.file('xl/sharedStrings.xml')?.async('text') ?? ''
            const sharedStrings: string[] = []
            const siMatches = ssXml.matchAll(/<si>[\s\S]*?<\/si>/g)
            for (const sm of siMatches) {
              const text = sm[0].replace(/<[^>]+>/g, '').trim()
              sharedStrings.push(text)
            }
            // Read first sheet
            const sheetXml = await zip.file('xl/worksheets/sheet1.xml')?.async('text') ?? ''
            const rows: string[][] = []
            for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
              const cells: string[] = []
              for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*t="([^"]*)"[^>]*>[\s\S]*?<v>([\s\S]*?)<\/v>/g)) {
                cells.push(cellMatch[1] === 's' ? (sharedStrings[parseInt(cellMatch[2])] ?? '') : cellMatch[2])
              }
              // Also handle cells without t attribute (numbers)
              if (cells.length === 0) {
                for (const cellMatch of rowMatch[1].matchAll(/<c[^>]*><v>([\s\S]*?)<\/v>/g)) {
                  cells.push(cellMatch[1])
                }
              }
              if (cells.length > 0) rows.push(cells)
            }
            const dataUrl = rows.length > 0
              ? tableToDataUrl(rows)
              : textToDataUrl(['Empty spreadsheet'], '#ffffff', '#6b7280', 13)
            added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })
          } catch {
            added.push({ id, type: 'image', label: `${file.name} — export as CSV for best results`,
              dataUrl: textToDataUrl(['To convert Excel files:', '  1. Open in Excel / Numbers / LibreOffice', '  2. Save As → CSV', '  3. Add the CSV file here'], '#fff8eb', '#92400e', 13),
              mimeType: 'image/png' })
          }

        } else if (['xls','ods'].includes(ext)) {
          // Legacy binary formats – guide user to export as CSV
          added.push({ id, type: 'image', label: `${file.name} ⚠ save as CSV first`,
            dataUrl: textToDataUrl(['To convert this spreadsheet:', '  1. Open in Excel / Numbers / LibreOffice', '  2. File → Save As → CSV (.csv)', '  3. Add the CSV file here'], '#fff8eb', '#92400e', 13),
            mimeType: 'image/png' })

        // ── Markdown ──────────────────────────────────────────────────────
        } else if (ext === 'md' || ext === 'markdown') {
          const { marked } = await import('marked')
          const html = await marked(await file.text())
          const text = html.replace(/<[^>]+>/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
          const tmpC = document.createElement('canvas')
          const tmpCtx = tmpC.getContext('2d')!
          tmpCtx.font = '13px Inter, sans-serif'
          const lines = wrapText(text, tmpCtx, 794 - 120)
          const dataUrl = textToDataUrl(lines, '#ffffff', '#1a1a2e', 13)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        // ── JSON / XML / other text ────────────────────────────────────────
        } else if (['json','xml','html','htm','yaml','yml','log'].includes(ext)) {
          const raw = await file.text()
          const tmpC = document.createElement('canvas')
          const tmpCtx = tmpC.getContext('2d')!
          tmpCtx.font = '12px "Courier New", monospace'
          const lines = wrapText(raw, tmpCtx, 794 - 120)
          const dataUrl = textToDataUrl(lines, '#0d0d1a', '#a5f3fc', 12)
          added.push({ id, type: 'image', label: file.name, dataUrl, mimeType: 'image/png' })

        } else {
          // Unsupported — skip with a placeholder entry showing the filename grayed out
          added.push({
            id, type: 'image', label: `${file.name} ⚠ unsupported format`,
            dataUrl: textToDataUrl([`Cannot convert: ${file.name}`, `Format .${ext} is not supported`], '#fff8ebff', '#92400eff', 13),
            mimeType: 'image/png'
          })
        }
      } catch (err) {
        console.error('File conversion error:', err)
        added.push({
          id, type: 'image', label: `${file.name} ✕ conversion failed`,
          dataUrl: textToDataUrl([`Conversion failed: ${file.name}`, String(err)], '#fff8ebff', '#92400eff', 12),
          mimeType: 'image/png'
        })
      }
    }

    setPages(p => [...p, ...added])
    setConverting(false)
    e.target.value = ''
  }

  // Drag-and-drop
  function onDragStart(idx: number) { setDragIdx(idx) }
  function onDragOver(e: React.DragEvent, idx: number) { e.preventDefault(); setDragOverIdx(idx) }
  function onDrop(toIdx: number) {
    if (dragIdx === null || dragIdx === toIdx) { setDragIdx(null); setDragOverIdx(null); return }
    const next = [...pages]
    const [moved] = next.splice(dragIdx, 1); next.splice(toIdx, 0, moved)
    setPages(next); setDragIdx(null); setDragOverIdx(null)
  }

  async function doExport() {
    if (pages.length === 0) return
    setExporting(true)
    try { await onExport(pages) } finally { setExporting(false) }
  }

  if (!isOpen) return null

  const BADGE: Record<string, string> = { current: 'Document', image: 'Converted', 'added-pdf': 'PDF' }

  return (
    <div className="dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog-box">

        <div className="dialog-header">
          <div>
            <div className="dialog-title">Export PDF</div>
            <div className="dialog-subtitle">
              Drag to reorder · Add any file to convert &amp; merge · Remove unwanted pages
            </div>
          </div>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="dialog-body">
          {pages.length === 0 && (
            <div className="dialog-empty">No pages — add files below to convert them, or keep all document pages</div>
          )}
          <div className="export-page-list">
            {pages.map((page, idx) => (
              <div
                key={page.id}
                className={`export-page-row${dragOverIdx === idx && dragIdx !== idx ? ' drag-over' : ''}${dragIdx === idx ? ' dragging' : ''}`}
                draggable
                onDragStart={() => onDragStart(idx)}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={() => onDrop(idx)}
                onDragEnd={() => { setDragIdx(null); setDragOverIdx(null) }}
              >
                <span className="drag-handle" title="Drag to reorder">⠿</span>
                <span className="page-icon">
                  {page.type === 'image' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:15,height:15}}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  )}
                </span>
                <span className="page-label">{page.label}</span>
                <span className={`page-badge badge-${page.type}`}>{BADGE[page.type]}</span>
                <div className="page-row-actions">
                  <button onClick={() => move(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
                  <button onClick={() => move(idx, 1)} disabled={idx === pages.length - 1} title="Move down">↓</button>
                  <button onClick={() => remove(idx)} className="page-row-del" title="Remove">✕</button>
                </div>
              </div>
            ))}
          </div>

          <button className="add-files-btn" onClick={() => fileRef.current?.click()} disabled={converting}>
            {converting ? (
              <><span className="spin">◌</span> Converting files…</>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width:13,height:13}}>
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add &amp; Convert Files&nbsp;
                <span style={{opacity:.5, fontSize:10}}>PDF · Images · Word · Excel · CSV · TXT · MD · JSON…</span>
              </>
            )}
          </button>
          <input
            ref={fileRef} type="file" multiple style={{display:'none'}}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.bmp,.tiff,.tif,.svg,.txt,.rtf,.csv,.tsv,.docx,.doc,.odt,.xlsx,.xls,.ods,.md,.markdown,.json,.xml,.html,.htm,.yaml,.yml,.log,image/*,application/pdf,text/*"
            onChange={handleAddFiles}
          />
        </div>

        <div className="dialog-footer">
          <div style={{fontSize:11, color:'var(--text-secondary)'}}>
            {pages.length} page{pages.length !== 1 ? 's' : ''} in output
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="dialog-btn-cancel" onClick={onClose} disabled={exporting || converting}>Cancel</button>
            <button className="dialog-btn-export" onClick={doExport} disabled={exporting || converting || pages.length === 0}>
              {exporting
                ? <><span className="spin">◌</span> Building PDF…</>
                : <>Export PDF ({pages.length})</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
