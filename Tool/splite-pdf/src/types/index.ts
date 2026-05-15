// Type definitions for PDF Splitter Tool

export type SplitBlock = {
  id: string
  name: string
  fromPage: number // 1-indexed
  toPage: number   // 1-indexed, inclusive
  color: string    // CSS color string
}

export type PdfState = {
  file: File | null
  numPages: number
  fileName: string
}

export type ValidationError = {
  blockId: string
  message: string
}

export const BLOCK_COLORS = [
  '#6c63ff',
  '#ff6584',
  '#43e97b',
  '#f5a623',
  '#00d2ff',
  '#fa8231',
  '#e040fb',
  '#ff5722',
]
