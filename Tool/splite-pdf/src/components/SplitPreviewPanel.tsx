import { useState } from 'react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { SplitBlock } from '../types'
import { splitPdfByBlock, downloadBytes } from '../utils/pdfSplitter'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import PdfPageCanvas from './PdfPageCanvas'

interface SplitPreviewPanelProps {
  blocks: SplitBlock[]
  sourceFile: File
  pdfDoc: PDFDocumentProxy
  baseName: string
}

export default function SplitPreviewPanel({
  blocks,
  sourceFile,
  pdfDoc,
  baseName,
}: SplitPreviewPanelProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [zipLoading, setZipLoading] = useState(false)

  async function handleDownload(block: SplitBlock) {
    setLoading(block.id)
    const bytes = await splitPdfByBlock(sourceFile, block)
    downloadBytes(bytes, block.name)
    setLoading(null)
  }

  async function handleDownloadAll() {
    setZipLoading(true)
    const zip = new JSZip()
    for (const block of blocks) {
      const bytes = await splitPdfByBlock(sourceFile, block)
      const filename = block.name.endsWith('.pdf') ? block.name : `${block.name}.pdf`
      zip.file(filename, bytes)
    }
    const content = await zip.generateAsync({ type: 'blob' })
    saveAs(content, `${baseName}-split.zip`)
    setZipLoading(false)
  }

  if (blocks.length === 0) return null

  return (
    <div style={{
      borderTop: '1px solid var(--border)',
      padding: 16,
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          Preview & Export
        </h3>
        <button
          onClick={handleDownloadAll}
          disabled={zipLoading}
          style={{
            padding: '7px 16px',
            background: 'var(--success)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            opacity: zipLoading ? 0.7 : 1,
          }}
        >
          {zipLoading ? '⏳ Đang nén...' : '⬇ Tải tất cả (ZIP)'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {blocks.map((block) => (
          <div
            key={block.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              background: 'var(--bg-card)',
              borderRadius: 10,
              border: `1px solid ${block.color}55`,
            }}
          >
            <div style={{
              width: 3,
              height: 48,
              background: block.color,
              borderRadius: 2,
              flexShrink: 0,
            }} />

            <PdfPageCanvas
              doc={pdfDoc}
              pageNum={block.fromPage}
              scale={0.15}
              blockColor={block.color}
            />

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {block.name}.pdf
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Trang {block.fromPage} → {block.toPage}
                &nbsp;·&nbsp;
                {block.toPage - block.fromPage + 1} trang
              </p>
            </div>

            <button
              onClick={() => handleDownload(block)}
              disabled={loading === block.id}
              style={{
                padding: '7px 14px',
                background: 'transparent',
                border: `1px solid ${block.color}`,
                color: block.color,
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {loading === block.id ? '⏳' : '⬇ Tải'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
