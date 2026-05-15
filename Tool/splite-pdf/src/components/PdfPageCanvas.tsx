import { useEffect, useRef, memo } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { renderPageToCanvas } from '../utils/pdfRenderer'
import type { SplitBlock } from '../types'

interface PdfPageCanvasProps {
  doc: PDFDocumentProxy
  pageNum: number
  scale?: number
  blockColor?: string | null
  isActive?: boolean
  onClick?: () => void
}

const PdfPageCanvas = memo(function PdfPageCanvas({
  doc,
  pageNum,
  scale = 0.28,
  blockColor,
  isActive,
  onClick,
}: PdfPageCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    renderPageToCanvas(doc, pageNum, canvas, scale)
  }, [doc, pageNum, scale])

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        border: `2px solid ${blockColor ?? 'var(--border)'}`,
        boxShadow: isActive ? `0 0 12px ${blockColor}88` : 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}>
        {blockColor && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: blockColor,
            opacity: 0.12,
            pointerEvents: 'none',
          }} />
        )}
        <canvas ref={canvasRef} style={{ display: 'block' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {pageNum}
      </span>
    </div>
  )
})

export default PdfPageCanvas
