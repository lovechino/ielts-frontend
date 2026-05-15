import { useCallback } from 'react'
import { useSplitStore } from '../store/useSplitStore'

interface UploadZoneProps {
  onLoad: () => void
}

export default function UploadZone({ onLoad }: UploadZoneProps) {
  const setPdf = useSplitStore((s) => s.setPdf)

  const handleFile = useCallback((file: File) => {
    if (!file.type.includes('pdf')) return
    setPdf({ file, numPages: 0, fileName: file.name })
    onLoad()
  }, [setPdf, onLoad])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        height: '100%',
        minHeight: 360,
        border: '2px dashed var(--border)',
        borderRadius: 20,
        background: 'var(--bg-secondary)',
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
      }}
      onClick={() => document.getElementById('pdf-input')?.click()}
    >
      <input
        id="pdf-input"
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <div style={{ fontSize: 56 }}>📄</div>
      <p style={{ color: 'var(--text-primary)', fontSize: 18, fontWeight: 600 }}>
        Kéo thả PDF vào đây
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
        hoặc click để chọn file
      </p>
      <div style={{
        marginTop: 8,
        padding: '10px 28px',
        background: 'var(--accent)',
        color: '#fff',
        borderRadius: 100,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: '0 0 20px var(--accent-glow)',
      }}>
        Chọn file PDF
      </div>
    </div>
  )
}
