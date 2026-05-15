import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { SplitBlock } from '../types'
import PdfPageCanvas from './PdfPageCanvas'

interface PdfThumbnailListProps {
  doc: PDFDocumentProxy
  numPages: number
  blocks: SplitBlock[]
  activeBlockId: string | null
  zoom: number
}

function getBlockForPage(
  page: number,
  blocks: SplitBlock[],
): SplitBlock | null {
  return blocks.find((b) => page >= b.fromPage && page <= b.toPage) ?? null
}

export default function PdfThumbnailList({
  doc,
  numPages,
  blocks,
  activeBlockId,
  zoom,
}: PdfThumbnailListProps) {
  const scale = 0.2 + zoom * 0.08

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 10,
      padding: 16,
      alignContent: 'flex-start',
    }}>
      {Array.from({ length: numPages }, (_, i) => {
        const pageNum = i + 1
        const block = getBlockForPage(pageNum, blocks)
        const isActive = block?.id === activeBlockId
        return (
          <PdfPageCanvas
            key={pageNum}
            doc={doc}
            pageNum={pageNum}
            scale={scale}
            blockColor={block?.color ?? null}
            isActive={isActive}
          />
        )
      })}
    </div>
  )
}
