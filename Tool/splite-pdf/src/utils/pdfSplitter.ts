import { PDFDocument } from 'pdf-lib'
import type { SplitBlock } from '../types'

export async function splitPdfByBlock(
  sourceFile: File,
  block: SplitBlock,
): Promise<Uint8Array> {
  const arrayBuffer = await sourceFile.arrayBuffer()
  const srcDoc = await PDFDocument.load(arrayBuffer)
  const newDoc = await PDFDocument.create()

  const pageIndices: number[] = []
  for (let i = block.fromPage; i <= block.toPage; i++) {
    pageIndices.push(i - 1) // pdf-lib is 0-indexed
  }

  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
  copiedPages.forEach((page) => newDoc.addPage(page))

  return newDoc.save()
}

export function downloadBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
