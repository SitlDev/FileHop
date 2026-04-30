import { create } from 'zustand'

export type Tool = 'select' | 'text' | 'rect' | 'ellipse' | 'line' | 'mask' | 'eraser' | 'cut-rect' | 'cut-free'

export interface PageElement {
  id: string
  type: string
  x: number; y: number; width: number; height: number
  content?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  color?: string
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  zIndex?: number
  pathData?: string
  confidence?: number
  notes?: string
}

export interface ReconstructionPlan {
  pageWidth: number
  pageHeight: number
  backgroundColor: string
  pageType?: string
  elements: PageElement[]
  overallConfidence: number
  reconstructionNotes?: string
}

interface EditorState {
  // Document
  pdfBytes: Uint8Array | null
  totalPages: number
  currentPage: number
  zoom: number
  // Tool
  activeTool: Tool
  // History
  historyStack: string[]
  historyIndex: number
  // Page State
  pageEdits: Record<number, string>
  // Actions
  setPdfBytes: (b: Uint8Array | null, pages: number) => void
  setCurrentPage: (n: number) => void
  setZoom: (z: number) => void
  setTool: (t: Tool) => void
  pushHistory: (json: string) => void
  undo: () => string | null
  redo: () => string | null
  savePageEdits: (pageNum: number, json: string) => void
  setPageEdits: (edits: Record<number, string>) => void
}

export const useEditor = create<EditorState>((set, get) => ({
  pdfBytes: null,
  totalPages: 0,
  currentPage: 1,
  zoom: 1,
  activeTool: 'select',
  historyStack: [],
  historyIndex: -1,
  pageEdits: {},

  setPdfBytes: (b, pages) => set({ pdfBytes: b, totalPages: pages, currentPage: 1, pageEdits: {} }),
  setCurrentPage: (n) => set({ currentPage: n }),
  setZoom: (z) => set({ zoom: z }),
  setTool: (t) => set({ activeTool: t }),

  pushHistory: (json) => {
    const { historyStack, historyIndex } = get()
    const next = historyStack.slice(0, historyIndex + 1)
    next.push(json)
    if (next.length > 50) next.shift()
    set({ historyStack: next, historyIndex: next.length - 1 })
  },

  undo: () => {
    const { historyStack, historyIndex } = get()
    if (historyIndex <= 0) return null
    const newIndex = historyIndex - 1
    set({ historyIndex: newIndex })
    return historyStack[newIndex]
  },

  redo: () => {
    const { historyStack, historyIndex } = get()
    if (historyIndex >= historyStack.length - 1) return null
    const newIndex = historyIndex + 1
    set({ historyIndex: newIndex })
    return historyStack[newIndex]
  },

  savePageEdits: (pageNum, json) => set((state) => ({
    pageEdits: { ...state.pageEdits, [pageNum]: json }
  })),
  setPageEdits: (edits) => set({ pageEdits: edits }),
}))
