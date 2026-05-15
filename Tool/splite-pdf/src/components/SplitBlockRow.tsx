import type { SplitBlock } from '../types'
import { useSplitStore } from '../store/useSplitStore'

interface SplitBlockRowProps {
  block: SplitBlock
  index: number
  numPages: number
  isActive: boolean
  hasError: boolean
  errorMsg: string
}

export default function SplitBlockRow({
  block,
  index,
  numPages,
  isActive,
  hasError,
  errorMsg,
}: SplitBlockRowProps) {
  const { updateBlock, removeBlock, setActiveBlock } = useSplitStore()

  return (
    <div
      onClick={() => setActiveBlock(isActive ? null : block.id)}
      style={{
        borderRadius: 12,
        padding: '12px 14px',
        background: isActive ? 'var(--bg-hover)' : 'var(--bg-card)',
        border: `1.5px solid ${isActive ? block.color : 'var(--border)'}`,
        cursor: 'pointer',
        boxShadow: isActive ? `0 0 10px ${block.color}44` : 'none',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: block.color,
          flexShrink: 0,
        }} />

        <input
          value={block.name}
          onChange={(e) => updateBlock(block.id, { name: e.target.value })}
          onClick={(e) => e.stopPropagation()}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: 14,
            fontWeight: 600,
          }}
        />

        <button
          onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
          title="Xoá block"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            padding: '2px 6px',
            borderRadius: 4,
          }}
        >
          ×
        </button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Từ trang</label>
        <input
          type="number"
          min={1}
          max={numPages}
          value={block.fromPage}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            updateBlock(block.id, { fromPage: Number(e.target.value) })
          }
          style={inputStyle}
        />
        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>→</label>
        <input
          type="number"
          min={1}
          max={numPages}
          value={block.toPage}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            updateBlock(block.id, { toPage: Number(e.target.value) })
          }
          style={inputStyle}
        />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {block.toPage - block.fromPage + 1} trang
        </span>
      </div>

      {hasError && (
        <p style={{ fontSize: 11, color: 'var(--error)', marginTop: 6 }}>
          ⚠ {errorMsg}
        </p>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: 56,
  padding: '4px 8px',
  background: 'var(--bg-primary)',
  border: '1px solid var(--border)',
  borderRadius: 6,
  color: 'var(--text-primary)',
  fontSize: 13,
  textAlign: 'center',
}
