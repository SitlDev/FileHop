'use client'
import { useState, useEffect, useRef } from 'react'

interface ToolbarProps {
  onOpenPdf: () => void
  onOpenImage: () => void
  onOpenDoc: () => void
  onOpenSheet: () => void
  onOpenWord: () => void
  onConvertToPdf: () => void
  onExportPdf: () => void
  onExportImage: (format: 'png' | 'jpeg' | 'webp') => void
  onExportSVG: () => void
  onMakeTextEditable: () => void
  onUndo: () => void
  onRedo: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onAddImage: () => void
  onNewDocument: () => void
  onPrint: () => void
  onFindReplace: () => void
  onSelectAll: () => void
  onDeselectAll: () => void
  onDeleteSelected: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onBringToFront: () => void
  onSendToBack: () => void
  onGroupSelected: () => void
  onUngroupSelected: () => void
  onLockSelected: () => void
}

const FILE_FORMATS = [
  { label: 'PDF',  ext: 'pdf',  desc: 'Portable Document Format' },
  { label: 'PNG',  ext: 'png',  desc: 'Lossless image with transparency' },
  { label: 'JPEG', ext: 'jpeg', desc: 'Compressed photo format' },
  { label: 'WebP', ext: 'webp', desc: 'Modern compressed format' },
  { label: 'SVG',  ext: 'svg',  desc: 'Scalable vector (canvas objects)' },
]

const HOTKEYS = [
  { section: 'Tools', items: [
    { label: 'Select',   kbd: 'Shift+V' },
    { label: 'Text',     kbd: 'Shift+T' },
    { label: 'Rectangle',kbd: 'Shift+R' },
    { label: 'Ellipse',  kbd: 'Shift+E' },
    { label: 'Line',     kbd: 'Shift+L' },
    { label: 'Mask',     kbd: 'Shift+M' },
    { label: 'Eraser',   kbd: 'Shift+X' },
    { label: 'Cut Rect', kbd: 'Shift+Q' },
    { label: 'Cut Free', kbd: 'Shift+F' },
  ]},
  { section: 'Actions', items: [
    { label: 'Undo',       kbd: '⌘Z' },
    { label: 'Redo',       kbd: '⌘⇧Z' },
    { label: 'Export PDF', kbd: '⌘S' },
    { label: 'Delete',     kbd: 'Del / ⌫' },
    { label: 'Zoom In',    kbd: '+' },
    { label: 'Zoom Out',   kbd: '−' },
  ]},
]

export default function Toolbar({
  onOpenPdf, onOpenImage, onOpenDoc, onOpenSheet, onOpenWord, onConvertToPdf,
  onExportPdf, onExportImage, onExportSVG,
  onMakeTextEditable, onUndo, onRedo, onCopy, onCut, onPaste, onAddImage,
  onNewDocument, onPrint, onFindReplace,
  onSelectAll, onDeselectAll, onDeleteSelected, onDuplicate,
  onBringForward, onSendBackward, onBringToFront, onSendToBack,
  onGroupSelected, onUngroupSelected, onLockSelected,
}: ToolbarProps) {
  const [fileOpen, setFileOpen]       = useState(false)
  const [openOpen, setOpenOpen]       = useState(false)
  const [exportOpen, setExportOpen]   = useState(false)
  const [editOpen, setEditOpen]       = useState(false)
  const [toolsOpen, setToolsOpen]     = useState(false)
  const [arrangeOpen, setArrangeOpen] = useState(false)
  const [hotkeysOpen, setHotkeysOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [exportQuality, setExportQuality] = useState('300')
  const [showGrid,   setShowGrid]   = useState(false)
  const [snapGrid,   setSnapGrid]   = useState(false)
  const [showRulers, setShowRulers] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  const [antiAlias,  setAntiAlias]  = useState(true)
  const [canvasBg,   setCanvasBg]   = useState('white')

  const fileRef     = useRef<HTMLDivElement>(null)
  const editRef     = useRef<HTMLDivElement>(null)
  const toolsRef    = useRef<HTMLDivElement>(null)
  const hotkeysRef  = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (fileRef.current     && !fileRef.current.contains(e.target as Node))     { setFileOpen(false); setOpenOpen(false); setExportOpen(false) }
      if (editRef.current     && !editRef.current.contains(e.target as Node))     { setEditOpen(false) }
      if (toolsRef.current    && !toolsRef.current.contains(e.target as Node))    { setToolsOpen(false); setArrangeOpen(false) }
      if (hotkeysRef.current  && !hotkeysRef.current.contains(e.target as Node))  { setHotkeysOpen(false) }
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) { setSettingsOpen(false) }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function closeAll() {
    setFileOpen(false); setOpenOpen(false); setExportOpen(false)
    setEditOpen(false); setToolsOpen(false); setArrangeOpen(false)
    setHotkeysOpen(false); setSettingsOpen(false)
  }

  function openOnly(which: 'file' | 'edit' | 'tools' | 'hotkeys' | 'settings') {
    setFileOpen(which === 'file'); setEditOpen(which === 'edit')
    setToolsOpen(which === 'tools')
    setHotkeysOpen(which === 'hotkeys'); setSettingsOpen(which === 'settings')
    if (which !== 'file') { setOpenOpen(false); setExportOpen(false) }
    if (which !== 'tools') { setArrangeOpen(false) }
  }

  return (
    <div className="toolbar">

      {/* ── LEFT: File + Edit menus ── */}
      <div className="toolbar-left">

        {/* File */}
        <div className="dropdown-root" ref={fileRef}>
          <div
            className={`menu-item${fileOpen ? ' active' : ''}`}
            onClick={() => fileOpen ? closeAll() : openOnly('file')}
          >File</div>
          {fileOpen && (
            <div className="dropdown-menu">
              {/* New Document */}
              <button className="dropdown-item" onClick={() => { closeAll(); onNewDocument() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                New Document <span className="dropdown-kbd">⌘N</span>
              </button>

              {/* Open submenu */}
              <div
                className="dropdown-item dropdown-has-sub"
                onMouseEnter={() => setOpenOpen(true)}
                onMouseLeave={() => setOpenOpen(false)}
                onClick={() => setOpenOpen(o => !o)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
                Open
                <svg viewBox="0 0 6 10" fill="currentColor" style={{width:6,height:10,marginLeft:'auto',opacity:0.5}}><path d="M0 0l6 5-6 5z"/></svg>
                {openOpen && (
                  <div className="dropdown-submenu">
                    {[
                      { label: 'PDF',         desc: 'Portable Document Format',      fn: onOpenPdf },
                      { label: 'Image',       desc: 'PNG, JPEG, WEBP, GIF, BMP',     fn: onOpenImage },
                      { label: 'Document',    desc: '.txt • .docx • .doc • .odt',    fn: onOpenDoc },
                      { label: 'Spreadsheet', desc: '.csv • .xlsx • .xls • .ods',    fn: onOpenSheet },
                      { label: 'Word',        desc: '.docx — converts to editable',  fn: onOpenWord },
                    ].map(f => (
                      <button key={f.label} className="dropdown-item" onClick={(e) => { e.stopPropagation(); f.fn(); closeAll() }}>
                        <span className="dropdown-format-badge">{f.label}</span>
                        <span style={{color:'var(--text-secondary)',fontSize:10}}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown-sep" />

              {/* Print */}
              <button className="dropdown-item" onClick={() => { closeAll(); onPrint() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                Print… <span className="dropdown-kbd">⌘P</span>
              </button>

              <div className="dropdown-sep" />

              {/* Page Setup */}
              <button className="dropdown-item" onClick={() => { closeAll(); alert('Page Setup: A4, Letter, A3, Legal — coming soon') }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>
                Page Setup…
              </button>

              {/* Convert any file to PDF */}
              <button className="dropdown-item" onClick={() => { closeAll(); onConvertToPdf() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                  <polyline points="17 3 21 3 21 7"/>
                </svg>
                Convert Files to PDF…
              </button>

              <div className="dropdown-sep" />

              {/* Export As submenu */}
              <div
                className="dropdown-item dropdown-has-sub"
                onMouseEnter={() => setExportOpen(true)}
                onMouseLeave={() => setExportOpen(false)}
                onClick={() => setExportOpen(o => !o)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export As…
                <svg viewBox="0 0 6 10" fill="currentColor" style={{width:6,height:10,marginLeft:'auto',opacity:0.5}}><path d="M0 0l6 5-6 5z"/></svg>
                {exportOpen && (
                  <div className="dropdown-submenu">
                    {FILE_FORMATS.map(f => (
                      <button key={f.ext} className="dropdown-item" onClick={(e) => {
                        e.stopPropagation()
                        if (f.ext === 'pdf') onExportPdf()
                        else if (f.ext === 'svg') onExportSVG()
                        else onExportImage(f.ext as 'png' | 'jpeg' | 'webp')
                        closeAll()
                      }}>
                        <span className="dropdown-format-badge">{f.label}</span>
                        <span style={{color:'var(--text-secondary)',fontSize:10}}>{f.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit */}
        <div className="dropdown-root" ref={editRef}>
          <div
            className={`menu-item${editOpen ? ' active' : ''}`}
            onClick={() => editOpen ? closeAll() : openOnly('edit')}
          >Edit</div>
          {editOpen && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => { onUndo(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 00-4-4H4"/></svg>
                Undo <span className="dropdown-kbd">⌘Z</span>
              </button>
              <button className="dropdown-item" onClick={() => { onRedo(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 014-4h12"/></svg>
                Redo <span className="dropdown-kbd">⌘⇧Z</span>
              </button>
              <div className="dropdown-sep" />
              <button className="dropdown-item" onClick={() => { onCopy(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Copy <span className="dropdown-kbd">⌘C</span>
              </button>
              <button className="dropdown-item" onClick={() => { onCut(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><circle cx="6" cy="20" r="3"/><circle cx="6" cy="4" r="3"/><line x1="6" y1="7" x2="6" y2="17"/><line x1="6" y1="7" x2="21" y2="22"/><line x1="6" y1="17" x2="21" y2="2"/></svg>
                Cut <span className="dropdown-kbd">⌘X</span>
              </button>
              <button className="dropdown-item" onClick={() => { onPaste(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
                Paste <span className="dropdown-kbd">⌘V</span>
              </button>
              <div className="dropdown-sep" />
              <button className="dropdown-item" onClick={() => { onMakeTextEditable(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M4 6h16M8 6v12M16 6v12M6 18h12"/></svg>
                Make Text Editable
              </button>
              <div className="dropdown-sep" />
              <button className="dropdown-item" onClick={() => { onAddImage(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-6-6-4 4-2-2-6 6"/></svg>
                Insert Image
              </button>
              <div className="dropdown-sep" />
              <button className="dropdown-item" onClick={() => { onFindReplace(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
                Find &amp; Replace… <span className="dropdown-kbd">⌘F</span>
              </button>
            </div>
          )}
        </div>
        {/* Tools */}
        <div className="dropdown-root" ref={toolsRef}>
          <div
            className={`menu-item${toolsOpen ? ' active' : ''}`}
            onClick={() => toolsOpen ? closeAll() : openOnly('tools')}
          >Tools</div>
          {toolsOpen && (
            <div className="dropdown-menu">
              {/* ── Selection ── */}
              <div style={{padding:'4px 10px 2px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Selection</div>
              <button className="dropdown-item" onClick={() => { onSelectAll(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2"/></svg>
                Select All <span className="dropdown-kbd">⌘A</span>
              </button>
              <button className="dropdown-item" onClick={() => { onDeselectAll(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M3 3l18 18M9 3h6M3 9v6M15 3h6v6M21 15v6H15M3 15v6h6"/></svg>
                Deselect All <span className="dropdown-kbd">Esc</span>
              </button>
              <div className="dropdown-sep" />

              {/* ── Object ── */}
              <div style={{padding:'4px 10px 2px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Object</div>
              <button className="dropdown-item" onClick={() => { onDuplicate(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="8" y="8" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                Duplicate <span className="dropdown-kbd">⌘D</span>
              </button>
              <button className="dropdown-item" onClick={() => { onDeleteSelected(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                Delete <span className="dropdown-kbd">⌫</span>
              </button>
              <div className="dropdown-sep" />

              {/* ── Arrange submenu ── */}
              <div style={{padding:'4px 10px 2px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Arrange</div>
              <button className="dropdown-item" onClick={() => { onBringToFront(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="9" y="9" width="12" height="12" rx="1" fill="currentColor" fillOpacity="0.15"/><rect x="3" y="3" width="12" height="12" rx="1"/><polyline points="12 6 12 2 16 2"/><polyline points="18 4 22 4 22 8"/></svg>
                Bring to Front <span className="dropdown-kbd">⌘⇧]</span>
              </button>
              <button className="dropdown-item" onClick={() => { onBringForward(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="9" y="9" width="12" height="12" rx="1"/><rect x="3" y="3" width="12" height="12" rx="1"/><polyline points="15 9 15 3 19 3"/></svg>
                Bring Forward <span className="dropdown-kbd">⌘]</span>
              </button>
              <button className="dropdown-item" onClick={() => { onSendBackward(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="3" width="12" height="12" rx="1"/><rect x="9" y="9" width="12" height="12" rx="1"/><polyline points="9 15 9 21 5 21"/></svg>
                Send Backward <span className="dropdown-kbd">⌘[</span>
              </button>
              <button className="dropdown-item" onClick={() => { onSendToBack(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="3" width="12" height="12" rx="1"/><rect x="9" y="9" width="12" height="12" rx="1" fill="currentColor" fillOpacity="0.15"/><polyline points="9 21 9 17 5 17"/></svg>
                Send to Back <span className="dropdown-kbd">⌘⇧[</span>
              </button>
              <div className="dropdown-sep" />

              {/* ── Group ── */}
              <div style={{padding:'4px 10px 2px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Group</div>
              <button className="dropdown-item" onClick={() => { onGroupSelected(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/></svg>
                Group <span className="dropdown-kbd">⌘G</span>
              </button>
              <button className="dropdown-item" onClick={() => { onUngroupSelected(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="2" y="2" width="8" height="8" rx="1" strokeDasharray="3 2"/><rect x="14" y="2" width="8" height="8" rx="1" strokeDasharray="3 2"/><rect x="2" y="14" width="8" height="8" rx="1" strokeDasharray="3 2"/><rect x="14" y="14" width="8" height="8" rx="1" strokeDasharray="3 2"/></svg>
                Ungroup <span className="dropdown-kbd">⌘⇧G</span>
              </button>
              <div className="dropdown-sep" />

              {/* ── Lock ── */}
              <button className="dropdown-item" onClick={() => { onLockSelected(); closeAll() }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Lock / Unlock <span className="dropdown-kbd">⌘L</span>
              </button>
            </div>
          )}
        </div>
        {/* HotKeys */}
        <div className="dropdown-root" ref={hotkeysRef}>
          <div
            className={`menu-item${hotkeysOpen ? ' active' : ''}`}
            onClick={() => hotkeysOpen ? closeAll() : openOnly('hotkeys')}
          >HotKeys</div>
          {hotkeysOpen && (
            <div className="dropdown-menu" style={{minWidth:260}}>
              {HOTKEYS.map(section => (
                <div key={section.section}>
                  <div style={{padding:'5px 10px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>
                    {section.section}
                  </div>
                  {section.items.map(item => (
                    <div key={item.label} className="dropdown-item" style={{justifyContent:'space-between', cursor:'default'}}>
                      <span style={{color:'var(--text-secondary)', fontSize:12}}>{item.label}</span>
                      <span className="dropdown-kbd">{item.kbd}</span>
                    </div>
                  ))}
                  <div className="dropdown-sep" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="dropdown-root" ref={settingsRef}>
          <div
            className={`menu-item${settingsOpen ? ' active' : ''}`}
            onClick={() => settingsOpen ? closeAll() : openOnly('settings')}
          >Settings</div>
          {settingsOpen && (
            <div className="dropdown-menu" style={{minWidth:248}}>
              <div style={{padding:'5px 10px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Canvas</div>
              {([
                { label: 'Show Grid',          kbd: 'G',  val: showGrid,   set: setShowGrid,   icon: <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18"/> },
                { label: 'Snap to Grid',       kbd: '',   val: snapGrid,   set: setSnapGrid,   icon: <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></> },
                { label: 'Show Rulers',        kbd: 'R',  val: showRulers, set: setShowRulers, icon: <><rect x="2" y="6" width="20" height="4" rx="1"/><line x1="6" y1="6" x2="6" y2="10"/><line x1="10" y1="6" x2="10" y2="10"/><line x1="14" y1="6" x2="14" y2="10"/><line x1="18" y1="6" x2="18" y2="10"/><rect x="6" y="10" width="4" height="8" rx="1"/></> },
                { label: 'Alignment Guides',   kbd: '',   val: showGuides, set: setShowGuides, icon: <><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/></> },
                { label: 'Anti-aliasing',      kbd: '',   val: antiAlias,  set: setAntiAlias,  icon: <><circle cx="8" cy="12" r="3" opacity="0.4"/><circle cx="12" cy="12" r="3"/><circle cx="16" cy="12" r="3" opacity="0.4"/></> },
              ] as { label:string; kbd:string; val:boolean; set:(v:boolean)=>void; icon:React.ReactNode }[]).map(item => (
                <button key={item.label} className="dropdown-item" onClick={() => item.set(!item.val)} style={{justifyContent:'space-between'}}>
                  <span style={{display:'flex', alignItems:'center', gap:8}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}>{item.icon}</svg>
                    <span style={{fontSize:12}}>{item.label}</span>
                    {item.kbd && <span className="dropdown-kbd" style={{marginLeft:0}}>{item.kbd}</span>}
                  </span>
                  {/* Toggle pill */}
                  <span style={{
                    width:28, height:15, borderRadius:8, flexShrink:0,
                    background: item.val ? 'var(--accent)' : 'var(--border)',
                    position:'relative', display:'inline-block', transition:'background 0.2s'
                  }}>
                    <span style={{
                      position:'absolute', top:2, left: item.val ? 15 : 2,
                      width:11, height:11, borderRadius:'50%',
                      background:'white', transition:'left 0.2s'
                    }} />
                  </span>
                </button>
              ))}
              <div className="dropdown-sep" />
              <div style={{padding:'5px 10px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Background</div>
              <div style={{display:'flex', gap:8, padding:'6px 12px'}}>
                {[
                  { id:'white',       color:'#ffffff', label:'White',       border:'#d1d5db' },
                  { id:'light',       color:'#f3f4f6', label:'Light',       border:'#d1d5db' },
                  { id:'dark',        color:'#1e1e2e', label:'Dark',        border:'#374151' },
                  { id:'transparent', color:'repeating-conic-gradient(#ccc 0% 25%,#fff 0% 50%) 0 0 / 12px 12px', label:'None', border:'#d1d5db' },
                ].map(bg => (
                  <button key={bg.id} onClick={() => setCanvasBg(bg.id)} title={bg.label} style={{
                    width:28, height:28, borderRadius:6, border: `2px solid ${canvasBg === bg.id ? 'var(--accent)' : bg.border}`,
                    background: bg.color, cursor:'pointer', flexShrink:0,
                    boxShadow: canvasBg === bg.id ? '0 0 0 1px var(--accent)' : 'none'
                  }} />
                ))}
              </div>
              <div className="dropdown-sep" />
              <div style={{padding:'5px 10px 3px', fontSize:9, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-dim)'}}>Export Quality</div>
              {[
                { dpi: '72',  label: 'Draft',      desc: '72 DPI — quick preview' },
                { dpi: '96',  label: 'Screen',     desc: '96 DPI — web & screen' },
                { dpi: '150', label: 'Standard',   desc: '150 DPI — general use' },
                { dpi: '300', label: 'High',       desc: '300 DPI — print quality' },
                { dpi: '600', label: 'Ultra',      desc: '600 DPI — professional print' },
              ].map(q => (
                <button
                  key={q.dpi}
                  className="dropdown-item"
                  style={{gap:8}}
                  onClick={() => { setExportQuality(q.dpi) }}
                >
                  <span style={{
                    width: 14, height: 14, borderRadius: '50%',
                    border: `2px solid ${exportQuality === q.dpi ? 'var(--accent)' : 'var(--border)'}`,
                    background: exportQuality === q.dpi ? 'var(--accent)' : 'transparent',
                    flexShrink: 0, display:'inline-block'
                  }} />
                  <span style={{display:'flex', flexDirection:'column', gap:1}}>
                    <span style={{fontSize:12, color:'var(--text-primary)', fontWeight: exportQuality === q.dpi ? 600 : 400}}>{q.label}</span>
                    <span style={{fontSize:10, color:'var(--text-secondary)'}}>{q.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: App title ── */}
      <div className="toolbar-center">
        <div className="logo-icon" />
        <span>VectorForge PDF Editor</span>
      </div>
    </div>
  )
}
