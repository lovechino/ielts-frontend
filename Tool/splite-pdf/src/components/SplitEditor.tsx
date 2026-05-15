import type { SplitBlock, ValidationError } from '../types'
import { useSplitStore } from '../store/useSplitStore'
import SplitBlockRow from './SplitBlockRow'

function validateBlocks(
  blocks: SplitBlock[],
  numPages: number,
): ValidationError[] {
  const errors: ValidationError[] = []
  blocks.forEach((b) => {
    if (b.fromPage < 1 || b.toPage > numPages) {
      errors.push({ blockId: b.id, message: `Vượt phạm vi (1 – ${numPages})` })
    } else if (b.fromPage > b.toPage) {
      errors.push({ blockId: b.id, message: 'Trang đầu phải nhỏ hơn trang cuối' })
    }
  })

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const bk = blocks[j]
      if (a.fromPage <= bk.toPage && bk.fromPage <= a.toPage) {
        errors.push({
          blockId: bk.id,
          message: `Trùng trang với "${a.name}"`,
        })
      }
    }
  }
  return errors
}

interface SplitEditorProps {
  numPages: number
}

export default function SplitEditor({ numPages }: SplitEditorProps) {
  const { blocks, addBlock, activeBlockId } = useSplitStore()
  const errors = validateBlocks(blocks, numPages)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
          Split Config
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {numPages} trang · {blocks.length} block
          {errors.length > 0 && (
            <span style={{ color: 'var(--error)', marginLeft: 8 }}>
              · {errors.length} lỗi
            </span>
          )}
        </p>
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {blocks.map((block, idx) => {
          const err = errors.find((e) => e.blockId === block.id)
          return (
            <SplitBlockRow
              key={block.id}
              block={block}
              index={idx}
              numPages={numPages}
              isActive={activeBlockId === block.id}
              hasError={!!err}
              errorMsg={err?.message ?? ''}
            />
          )
        })}

        {blocks.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
            padding: 32,
          }}>
            Chưa có block nào.<br />Nhấn "+ Thêm block" để bắt đầu.
          </div>
        )}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
        <button
          onClick={addBlock}
          disabled={numPages === 0}
          style={{
            width: '100%',
            padding: '10px 0',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 600,
            cursor: numPages > 0 ? 'pointer' : 'not-allowed',
            opacity: numPages > 0 ? 1 : 0.5,
            transition: 'opacity 0.2s, transform 0.1s',
          }}
        >
          + Thêm block
        </button>
      </div>
    </div>
  )
}
