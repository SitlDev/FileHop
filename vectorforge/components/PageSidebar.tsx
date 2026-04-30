'use client'
import { useEffect, useState } from 'react'

interface Props {
  pdfBytes: Uint8Array | null
  totalPages: number
  currentPage: number
  onPageSelect: (n: number) => void
}

export default function PageSidebar({ pdfBytes, totalPages, currentPage, onPageSelect }: Props) {
  const [thumbs, setThumbs] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!pdfBytes) {
        await Promise.resolve()
        if (!cancelled) setThumbs([])
        return
      }
      // Use pdf.js legacy build for Next/Turbopack compatibility
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      // Keep worker version in sync with installed pdfjs-dist (legacy worker)
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString()
      // pdf.js may transfer (detach) the ArrayBuffer to the worker; pass a copy.
      const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice() }).promise
      const results: string[] = []
      for (let i = 1; i <= Math.min(pdf.numPages, totalPages || pdf.numPages, 20); i++) {
        const page = await pdf.getPage(i)
        const vp = page.getViewport({ scale: 0.22 })
        const c = document.createElement('canvas')
        c.width = vp.width; c.height = vp.height
        await (page.render as unknown as (args: { canvasContext: CanvasRenderingContext2D; viewport: unknown }) => { promise: Promise<void> })({
          canvasContext: c.getContext('2d')!,
          viewport: vp,
        }).promise
        results.push(c.toDataURL('image/png'))
      }
      if (!cancelled) setThumbs(results)
    })()
    return () => { cancelled = true }
  }, [pdfBytes, totalPages])

  return (
    <div className="sidebar">
      <div className="panel-header">Pages</div>
      <div className="page-list">
        {thumbs.length > 0 ? thumbs.map((src, i) => (
          <div
            key={i}
            className={`page-thumb ${i + 1 === currentPage ? 'active' : ''}`}
            onClick={() => onPageSelect(i + 1)}
          >
            <img src={src} alt={`Page ${i + 1}`} style={{width:'100%', display:'block'}} />
            <div className="page-num">{i + 1}</div>
          </div>
        )) : (
          <div
            className={`page-thumb active`}
            onClick={() => onPageSelect(1)}
            style={{minHeight:100, display:'flex', alignItems:'center', justifyContent:'center'}}
          >
            <div style={{textAlign:'center', color:'var(--text-dim)'}}>
              1
            </div>
          </div>
        )}
      </div>
      
      {/* Sidebar Ad Placement */}
      <div className="sidebar-ad" style={{
        marginTop: 'auto',
        padding: '16px',
        borderTop: '1px solid var(--border)',
        minHeight: '200px'
      }}>
        <div style={{
          height: '100%',
          backgroundColor: '#0d0d1a',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#475569',
          fontSize: '11px',
          textAlign: 'center',
          overflow: 'hidden'
        }}>
          {/* INSERT GOOGLE ADSENSE CODE HERE */}
          <span>Sponsored Ad Component</span>
        </div>
      </div>
    </div>
  )
}
