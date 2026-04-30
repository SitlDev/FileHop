'use client'
import { useEditor } from '@/store/editorStore'
import type { Tool } from '@/store/editorStore'

interface Props {
  selectedObj: unknown
  onApplyProp: (prop: string, val: unknown) => void
  onDelete: () => void
  onDuplicate: () => void
  onBringForward: () => void
  onSendBackward: () => void
  onRotatePage: () => void
  elementCount: number
  currentPage: number
  totalPages: number
}

type FabricLike = {
  type?: unknown
  fill?: unknown
  stroke?: unknown
  strokeWidth?: unknown
  fontSize?: unknown
  fontWeight?: unknown
  fontStyle?: unknown
  fontFamily?: unknown
  text?: unknown
  opacity?: unknown
  msg?: unknown
}

const FONTS = [
  'Georgia, serif',
  'Times New Roman, Times, serif',
  'Garamond, serif',
  'Palatino, serif',
  'Arial, sans-serif',
  'Helvetica, Arial, sans-serif',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
  'Gill Sans, sans-serif',
  'Courier New, Courier, monospace',
  'Lucida Console, monospace',
  'Impact, fantasy',
  'Comic Sans MS, cursive',
]

const FONT_SIZES = [8, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72, 96]

const TOOLS: { id: Tool; label: string }[] = [
  { id: 'select',   label: 'Select' },
  { id: 'text',     label: 'Text' },
  { id: 'rect',     label: 'Rect' },
  { id: 'ellipse',  label: 'Ellipse' },
  { id: 'line',     label: 'Line' },
  { id: 'mask',     label: 'Mask' },
  { id: 'eraser',   label: 'Eraser' },
  { id: 'cut-rect', label: 'Cut Rect' },
  { id: 'cut-free', label: 'Cut Free' },
]

function ToolIcon({ id }: { id: Tool }) {
  const sw = { stroke: 'currentColor', fill: 'none', strokeWidth: 2 }
  switch (id) {
    case 'select':   return <svg viewBox="0 0 24 24" {...sw}><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
    case 'text':     return <svg viewBox="0 0 24 24" {...sw}><path d="M4 7V4h16v3M9 20h6M12 4v16"/></svg>
    case 'rect':     return <svg viewBox="0 0 24 24" {...sw}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>
    case 'ellipse':  return <svg viewBox="0 0 24 24" {...sw}><ellipse cx="12" cy="12" rx="9" ry="7"/></svg>
    case 'line':     return <svg viewBox="0 0 24 24" {...sw}><line x1="5" y1="19" x2="19" y2="5"/></svg>
    case 'mask':     return (
      <svg viewBox="0 0 24 24" {...sw}>
        <path d="M4.5 10C4.5 6.41 7.41 3.5 11 3.5c3.59 0 6.5 2.91 6.5 6.5 0 2.5-1.4 4.67-3.46 5.82L12 20l-2.04-4.18C7.9 14.67 4.5 12.59 4.5 10z" strokeLinejoin="round"/>
        <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/>
      </svg>
    )
    case 'eraser':   return (
      <svg viewBox="0 0 24 24" {...sw}>
        <path d="M20 20H7L3 16l10-10 7 7-2.5 2.5" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M6.5 17.5l4-4" strokeLinecap="round"/>
      </svg>
    )
    case 'cut-rect': return (
      <svg viewBox="0 0 24 24" {...sw}>
        <circle cx="6" cy="7" r="2"/><circle cx="6" cy="17" r="2"/>
        <path d="M8.5 7.5L20 12M8.5 16.5L20 12" strokeLinecap="round"/>
        <rect x="13" y="5" width="8" height="6" rx="1" strokeDasharray="2 1.5" strokeWidth="1.5"/>
      </svg>
    )
    case 'cut-free': return (
      <svg viewBox="0 0 24 24" {...sw}>
        <circle cx="6" cy="7" r="2"/><circle cx="6" cy="17" r="2"/>
        <path d="M8.5 7.5L20 12M8.5 16.5L20 12" strokeLinecap="round"/>
        <path d="M13 5.5 Q15 7 17 5.5 Q19 4 21 5.5" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
    default:         return <svg viewBox="0 0 24 24" {...sw}/>
  }
}

export default function PropertiesPanel({
  selectedObj, onApplyProp, onDelete, onDuplicate,
  onBringForward, onSendBackward, onRotatePage,
  elementCount, currentPage, totalPages
}: Props) {
  const { activeTool, setTool } = useEditor()
  const obj = (selectedObj && typeof selectedObj === 'object') ? (selectedObj as FabricLike) : null
  const objType = typeof obj?.type === 'string' ? obj.type : ''
  const isText = objType === 'i-text' || objType === 'text' || objType === 'textbox'

  const safeColor = (v: unknown) => {
    if (typeof v === 'string' && v.startsWith('#') && v.length === 7) return v
    return '#000000'
  }

  return (
    <div className="props-panel">

      {/* ── Page Management ── */}
      <div className="props-section">
        <div className="panel-header">Page Management</div>
        <div className="props-body" style={{paddingTop:12}}>
          <div className="props-row">
            <button className="tb-btn" style={{gridColumn: 'span 2'}} onClick={onRotatePage}>Rotate 90°</button>
          </div>
        </div>
      </div>

      {/* ── Tools ── */}
      <div className="props-section">
        <div className="panel-header">Tools</div>
        <div className="tool-grid">
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`tool-cell${activeTool === t.id ? ' active' : ''}`}
              onClick={() => setTool(t.id)}
              title={`${t.label} (Shift+${t.id === 'cut-rect' ? 'Q' : t.id === 'cut-free' ? 'F' : t.id === 'ellipse' ? 'E' : t.id === 'eraser' ? 'X' : t.id === 'mask' ? 'M' : t.id === 'line' ? 'L' : t.id === 'rect' ? 'R' : t.id === 'text' ? 'T' : 'V'})`}
            >
              <ToolIcon id={t.id} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {objType === 'processing-hint' ? (
        <div className="props-section">
          <div className="panel-header">Info</div>
          <div className="props-body" style={{alignItems:'center', padding:24, textAlign:'center'}}>
            <div style={{fontSize:11, color:'var(--text-secondary)'}}>{String(obj?.msg ?? '')}</div>
          </div>
        </div>
      ) : objType === 'error-hint' ? (
        <div className="props-section">
          <div className="panel-header">Error</div>
          <div className="no-selection" style={{color:'var(--danger)', borderColor:'var(--danger)'}}>
            ✕ {String(obj?.msg ?? '')}
          </div>
        </div>
      ) : obj ? (
        <div className="props-section">
          <div className="panel-header">Properties</div>
          <div className="props-body">
            <div className="prop-row">
              <div className="prop-label">Selection</div>
              <div style={{fontSize:11, color:'var(--text-secondary)', fontWeight:500, textTransform:'capitalize'}}>{objType || 'object'}</div>
            </div>

            {isText ? (
              <>
                {/* ── Font Family ── */}
                <div className="prop-row">
                  <div className="prop-label">Font</div>
                  <select className="prop-input" style={{fontFamily: typeof obj.fontFamily === 'string' ? obj.fontFamily : 'inherit'}}
                    value={typeof obj.fontFamily === 'string' ? obj.fontFamily : ''}
                    onChange={e => onApplyProp('fontFamily', e.target.value)}>
                    {FONTS.map(f => (
                      <option key={f} value={f} style={{fontFamily: f}}>{f.split(',')[0]}</option>
                    ))}
                  </select>
                </div>

                {/* ── Font Size ── */}
                <div className="prop-row">
                  <div className="prop-label">Size</div>
                  <div style={{display:'flex', gap:4, alignItems:'center', flex:1}}>
                    <select className="prop-input" style={{flex:'0 0 70px'}}
                      value={typeof obj.fontSize === 'number' ? obj.fontSize : 16}
                      onChange={e => onApplyProp('fontSize', parseInt(e.target.value))}>
                      {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" className="prop-input" min={1} max={400}
                      style={{flex:1}}
                      value={typeof obj.fontSize === 'number' ? obj.fontSize : 16}
                      onChange={e => onApplyProp('fontSize', parseInt(e.target.value))} />
                  </div>
                </div>

                {/* ── Text Color ── */}
                <div className="prop-row">
                  <div className="prop-label">Color</div>
                  <input type="color" className="prop-input" value={safeColor(obj.fill)}
                    onChange={e => onApplyProp('fill', e.target.value)} />
                </div>

                {/* ── Bold / Italic ── */}
                <div className="prop-row">
                  <div className="prop-label">Style</div>
                  <div style={{display:'flex', gap:6}}>
                    <button className={`tb-btn${obj.fontWeight === 'bold' ? ' active' : ''}`}
                      style={{fontWeight:'bold', minWidth:32, padding:'2px 8px'}}
                      onClick={() => onApplyProp('fontWeight', obj.fontWeight === 'bold' ? 'normal' : 'bold')}>B</button>
                    <button className={`tb-btn${obj.fontStyle === 'italic' ? ' active' : ''}`}
                      style={{fontStyle:'italic', minWidth:32, padding:'2px 8px'}}
                      onClick={() => onApplyProp('fontStyle', obj.fontStyle === 'italic' ? 'normal' : 'italic')}>I</button>
                  </div>
                </div>

                {/* ── Content ── */}
                <div className="prop-row">
                  <div className="prop-label">Content</div>
                  <input type="text" className="prop-input" defaultValue={(typeof obj.text === 'string' ? obj.text : '')}
                    onBlur={e => onApplyProp('text', e.target.value)} />
                </div>
              </>
            ) : (
              /* ── Non-text shape properties ── */
              <div className="prop-grid">
                <div className="prop-row">
                  <div className="prop-label">Fill</div>
                  <input type="color" className="prop-input" value={safeColor(obj.fill)}
                    onChange={e => onApplyProp('fill', e.target.value)} />
                </div>
                <div className="prop-row">
                  <div className="prop-label">Stroke</div>
                  <input type="color" className="prop-input" value={safeColor(obj.stroke)}
                    onChange={e => onApplyProp('stroke', e.target.value)} />
                </div>
              </div>
            )}

            {/* ── Stroke width & opacity (all objects) ── */}
            {!isText && (
              <div className="prop-row">
                <div className="prop-label">Stroke Width</div>
                <input type="number" className="prop-input" min={0} max={20}
                  defaultValue={(typeof obj.strokeWidth === 'number' ? obj.strokeWidth : 1)}
                  onChange={e => onApplyProp('strokeWidth', parseFloat(e.target.value))} />
              </div>
            )}

            <div className="prop-row">
              <div className="prop-label">Opacity</div>
              <input type="range" min={0} max={1} step={0.05}
                defaultValue={(typeof obj.opacity === 'number' ? obj.opacity : 1)}
                onChange={e => onApplyProp('opacity', parseFloat(e.target.value))}
                style={{width:'100%', accentColor:'var(--accent)'}} />
            </div>

            <div className="props-row" style={{marginTop:8, display: 'grid', gridTemplateColumns: '1fr 1fr'}}>
              <button className="tb-btn" onClick={onBringForward}>Bring Fwd</button>
              <button className="tb-btn" onClick={onSendBackward}>Send Back</button>
              <button className="tb-btn" onClick={onDuplicate}>Duplicate</button>
              <button className="tb-btn" style={{color:'var(--danger)'}} onClick={onDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : (
        <div className="props-section">
          <div className="panel-header">Properties</div>
          <div className="no-selection">
            Select an object on the canvas to edit its properties
          </div>
        </div>
      )}

    </div>
  )
}

