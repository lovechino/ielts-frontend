interface ToolbarProps {
  fileName: string
  numPages: number
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFitWidth: () => void
  onReset: () => void
}

export default function Toolbar({
  fileName,
  numPages,
  zoom,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onReset,
}: ToolbarProps) {
  const zoomPct = Math.round((0.2 + zoom * 0.08) / 0.28 * 100)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 16px',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 18 }}>📄</span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <p style={{
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {fileName}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{numPages} trang</p>
      </div>

      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <ToolBtn onClick={onZoomOut} title="Thu nhỏ">−</ToolBtn>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}>
          {zoomPct}%
        </span>
        <ToolBtn onClick={onZoomIn} title="Phóng to">+</ToolBtn>
        <ToolBtn onClick={onFitWidth} title="Vừa màn hình">⊡</ToolBtn>
      </div>

      <button
        onClick={onReset}
        title="Mở file khác"
        style={{
          padding: '6px 12px',
          background: 'transparent',
          border: '1px solid var(--border)',
          borderRadius: 8,
          color: 'var(--text-secondary)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Đổi file
      </button>
    </div>
  )
}

function ToolBtn({
  children,
  onClick,
  title,
}: {
  children: React.ReactNode
  onClick: () => void
  title?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        color: 'var(--text-secondary)',
        fontSize: 16,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}
