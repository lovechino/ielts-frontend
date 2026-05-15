import { create } from 'zustand'
import type { SplitBlock, PdfState } from '../types'
import { BLOCK_COLORS } from '../types'

interface SplitStore {
  pdf: PdfState
  blocks: SplitBlock[]
  activeBlockId: string | null

  setPdf: (state: PdfState) => void
  resetPdf: () => void

  addBlock: () => void
  updateBlock: (id: string, patch: Partial<SplitBlock>) => void
  removeBlock: (id: string) => void
  setActiveBlock: (id: string | null) => void
}

const defaultPdf: PdfState = { file: null, numPages: 0, fileName: '' }

function nextBlockName(blocks: SplitBlock[]): string {
  return `chapter-${blocks.length + 1}`
}

function nextFromPage(blocks: SplitBlock[], numPages: number): number {
  if (blocks.length === 0) return 1
  const lastTo = Math.max(...blocks.map((b) => b.toPage))
  return Math.min(lastTo + 1, numPages)
}

export const useSplitStore = create<SplitStore>((set, get) => ({
  pdf: defaultPdf,
  blocks: [],
  activeBlockId: null,

  setPdf: (state) => set({ pdf: state, blocks: [], activeBlockId: null }),
  resetPdf: () => set({ pdf: defaultPdf, blocks: [], activeBlockId: null }),

  addBlock: () => {
    const { blocks, pdf } = get()
    const from = nextFromPage(blocks, pdf.numPages)
    const to = pdf.numPages
    const colorIdx = blocks.length % BLOCK_COLORS.length
    const newBlock: SplitBlock = {
      id: crypto.randomUUID(),
      name: nextBlockName(blocks),
      fromPage: from,
      toPage: to,
      color: BLOCK_COLORS[colorIdx],
    }
    set({ blocks: [...blocks, newBlock], activeBlockId: newBlock.id })
  },

  updateBlock: (id, patch) =>
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),

  removeBlock: (id) =>
    set((s) => ({
      blocks: s.blocks.filter((b) => b.id !== id),
      activeBlockId: s.activeBlockId === id ? null : s.activeBlockId,
    })),

  setActiveBlock: (id) => set({ activeBlockId: id }),
}))
