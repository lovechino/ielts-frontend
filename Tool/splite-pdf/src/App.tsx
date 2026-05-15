import { useState } from 'react'
import { useSplitStore } from './store/useSplitStore'
import { usePdfDocument } from './hooks/usePdfDocument'
import UploadZone from './components/UploadZone'
import Toolbar from './components/Toolbar'
import PdfThumbnailList from './components/PdfThumbnailList'
import SplitEditor from './components/SplitEditor'
import SplitPreviewPanel from './components/SplitPreviewPanel'

const ZOOM_MIN = 0
const ZOOM_MAX = 8
const ZOOM_DEFAULT = 2

export default function App() {
  const [zoom, setZoom] = useState(ZOOM_DEFAULT)
  const { pdf, setPdf, resetPdf, blocks, activeBlockId } = useSplitStore()
  const { pdfDoc, numPages, loading, error } = usePdfDocument(pdf.file)

  // Sync numPages into store
  if (numPages > 0 && pdf.numPages !== numPages) {
    setPdf({ ...pdf, numPages })
  }

  const baseName = pdf.fileName.replace(/\.pdf$/i, '')

  function handleLoad() {}

  function handleZoomIn() {
    setZoom((z) => Math.min(z + 1, ZOOM_MAX))
  }

  function handleZoomOut() {
    setZoom((z) => Math.max(z - 1, ZOOM_MIN))
  }

  function handleFitWidth() {
    setZoom(ZOOM_DEFAULT)
  }

  if (!pdf.file) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        padding: 32,
        gap: 24,
      }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6c63ff, #00d2ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            PDF Splitter
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>
            Cắt PDF thủ công với preview trực quan
          </p>
        </div>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <UploadZone onLoad={handleLoad} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Header Toolbar */}
      <Toolbar
        fileName={pdf.fileName}
        numPages={numPages}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitWidth={handleFitWidth}
        onReset={resetPdf}
      />

      {/* Main Layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Left — PDF Preview */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: 'var(--bg-primary)',
        }}>
          {loading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 200,
              color: 'var(--text-muted)',
            }}>
              ⏳ Đang tải PDF...
            </div>
          )}
          {error && (
            <div style={{
              padding: 24,
              color: 'var(--error)',
              fontSize: 14,
            }}>
              ❌ {error}
            </div>
          )}
          {pdfDoc && !loading && (
            <PdfThumbnailList
              doc={pdfDoc}
              numPages={numPages}
              blocks={blocks}
              activeBlockId={activeBlockId}
              zoom={zoom}
            />
          )}
        </div>

        {/* Right Panel */}
        <div style={{
          width: 340,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          borderLeft: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          overflow: 'hidden',
        }}>
          {/* Top: Split Config */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <SplitEditor numPages={numPages} />
          </div>

          {/* Bottom: Preview & Export */}
          {pdfDoc && blocks.length > 0 && (
            <div style={{ overflowY: 'auto', maxHeight: '45%' }}>
              <SplitPreviewPanel
                blocks={blocks}
                sourceFile={pdf.file!}
                pdfDoc={pdfDoc}
                baseName={baseName}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
