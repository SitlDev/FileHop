'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onFindReplace: (find: string, replace: string, allPages: boolean, caseSensitive: boolean, selectionOnly: boolean) => number
}

export default function FindReplaceDialog({ isOpen, onClose, onFindReplace }: Props) {
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [allPages, setAllPages] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [selectionOnly, setSelectionOnly] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const findRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setResult(null)
      setTimeout(() => findRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && find) doReplace()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, find, replace, allPages, caseSensitive])

  function doReplace() {
    if (!find) { setResult('Enter a search term first.'); return }
    const count = onFindReplace(find, replace, allPages, caseSensitive, selectionOnly)
    const scope = selectionOnly ? 'in selection' : allPages ? 'across all pages' : 'on this page'
    if (count === 0) setResult('No matches found.')
    else setResult(`✓ Replaced ${count} instance${count !== 1 ? 's' : ''} ${scope}.`)
  }

  if (!isOpen) return null

  return (
    <div className="dialog-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dialog-box" style={{maxWidth: 420}}>

        <div className="dialog-header">
          <div>
            <div className="dialog-title">Find &amp; Replace</div>
            <div className="dialog-subtitle">Search text across Textbox objects</div>
          </div>
          <button className="dialog-close" onClick={onClose}>✕</button>
        </div>

        <div className="dialog-body" style={{gap: 12}}>

          {/* Find */}
          <label style={{display:'flex', flexDirection:'column', gap:5}}>
            <span style={{fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Find</span>
            <input
              ref={findRef}
              value={find}
              onChange={e => { setFind(e.target.value); setResult(null) }}
              placeholder="Search term…"
              style={{
                background:'var(--bg-input,var(--bg-app))', border:'1px solid var(--border)',
                borderRadius:6, padding:'7px 10px', color:'var(--text-primary)',
                fontSize:13, outline:'none', width:'100%', boxSizing:'border-box',
              }}
            />
          </label>

          {/* Replace */}
          <label style={{display:'flex', flexDirection:'column', gap:5}}>
            <span style={{fontSize:11, fontWeight:600, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.06em'}}>Replace with</span>
            <input
              value={replace}
              onChange={e => { setReplace(e.target.value); setResult(null) }}
              placeholder="Replacement text (leave blank to delete)"
              style={{
                background:'var(--bg-input,var(--bg-app))', border:'1px solid var(--border)',
                borderRadius:6, padding:'7px 10px', color:'var(--text-primary)',
                fontSize:13, outline:'none', width:'100%', boxSizing:'border-box',
              }}
            />
          </label>

          {/* Multi-term hint */}
          <div style={{fontSize:11, color:'var(--text-secondary)', background:'var(--bg-panel)', borderRadius:6, padding:'7px 10px', lineHeight:1.5}}>
            💡 <strong>Batch terms:</strong> separate multiple pairs with <code style={{background:'var(--bg-app)', padding:'1px 4px', borderRadius:3, fontSize:11}}>;</code>
            {' '}e.g. <code style={{background:'var(--bg-app)', padding:'1px 4px', borderRadius:3, fontSize:11}}>foo:bar; old:new</code>
          </div>

          {/* Options */}
          <div style={{display:'flex', gap:16}}>
            {([
              { label: 'Case-sensitive', val: caseSensitive, set: setCaseSensitive, disabled: false },
              { label: 'Selection only', val: selectionOnly, set: (v: boolean) => { setSelectionOnly(v); if (v) setAllPages(false) }, disabled: false },
              { label: 'All pages',     val: allPages,       set: setAllPages,      disabled: selectionOnly },
            ] as {label:string; val:boolean; set:(v:boolean)=>void; disabled:boolean}[]).map(opt => (
              <label key={opt.label} style={{display:'flex', alignItems:'center', gap:6, cursor: opt.disabled ? 'not-allowed' : 'pointer', fontSize:12, color: opt.disabled ? 'var(--text-dim)' : 'var(--text-secondary)', opacity: opt.disabled ? 0.5 : 1}}>
                <span style={{
                  width:15, height:15, borderRadius:3,
                  border:`1.5px solid ${opt.val && !opt.disabled ? 'var(--accent)' : 'var(--border)'}`,
                  background: opt.val && !opt.disabled ? 'var(--accent)' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s',
                  pointerEvents: opt.disabled ? 'none' : 'auto',
                }} onClick={() => !opt.disabled && opt.set(!opt.val)}>
                  {opt.val && !opt.disabled && <span style={{color:'white', fontSize:10, lineHeight:1}}>✓</span>}
                </span>
                {opt.label}
              </label>
            ))}
          </div>

          {result && (
            <div style={{
              fontSize:12, padding:'7px 10px', borderRadius:6,
              background: result.startsWith('✓') ? 'rgba(34,197,94,0.12)' : 'rgba(251,191,36,0.12)',
              color: result.startsWith('✓') ? '#4ade80' : '#fbbf24',
              border: `1px solid ${result.startsWith('✓') ? 'rgba(34,197,94,0.25)' : 'rgba(251,191,36,0.25)'}`,
            }}>
              {result}
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <div style={{fontSize:11, color:'var(--text-secondary)'}}>
            Press <kbd style={{padding:'1px 5px', borderRadius:3, background:'var(--bg-panel)', border:'1px solid var(--border)', fontSize:10}}>Enter</kbd> to replace
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="dialog-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="dialog-btn-export"
              onClick={doReplace}
              disabled={!find}
            >
              Replace {selectionOnly ? 'in Selection' : allPages ? 'in Document' : 'on Page'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
