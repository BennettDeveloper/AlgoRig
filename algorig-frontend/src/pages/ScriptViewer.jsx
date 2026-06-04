import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getScripts, deleteScript } from '../api/scripts'
import { pinScript, unpinScript } from '../api/users'
import { useToast } from '../context/ToastContext'

const ITEMS_PER_PAGE = 8

// ── Sub-components ─────────────────────────────────────────────────────────

function ScriptCard({ script, isSelected, onSelect, onDelete, onPin, onUnpin, pinningId }) {
  const [pendingOrder, setPendingOrder] = useState(1)
  const isPinned  = script.featuredOrder != null
  const isPinning = pinningId === script.id
  const date = new Date(script.updatedAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div
      onClick={() => onSelect(script)}
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        margin: '4px 8px',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(249,115,22,0.06))'
          : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isSelected ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.06)'}`,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: isSelected ? '#f97316' : '#f0f0ff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: 6,
          }}>
            {script.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: '#555577',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 4,
              padding: '2px 6px',
            }}>
              v{script.version}
            </span>
            <span style={{
              fontSize: 10,
              fontFamily: 'JetBrains Mono, monospace',
              color: script.isPublic ? '#22c55e' : '#555577',
              background: script.isPublic ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${script.isPublic ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 4,
              padding: '2px 6px',
            }}>
              {script.isPublic ? 'Public' : 'Private'}
            </span>
            {isPinned && (
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: '#f97316', background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.25)', borderRadius: 4, padding: '2px 6px',
              }}>
                📌 #{script.featuredOrder}
              </span>
            )}
            <span style={{ fontSize: 11, color: '#444466' }}>{date}</span>
          </div>

          {/* Pin / Unpin controls */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            {isPinned ? (
              <button
                onClick={() => onUnpin(script.id)}
                disabled={isPinning}
                style={{
                  fontSize: 10, padding: '3px 9px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 4, color: '#555577',
                  cursor: isPinning ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ff6b6b'; e.currentTarget.style.borderColor = 'rgba(255,68,68,0.3)' }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555577'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              >
                {isPinning ? '…' : 'Unpin'}
              </button>
            ) : script.isPublic ? (
              <>
                <select
                  value={pendingOrder}
                  onChange={e => setPendingOrder(Number(e.target.value))}
                  style={{
                    fontSize: 10, padding: '3px 6px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 4, color: '#8888aa',
                    cursor: 'pointer', outline: 'none',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                >
                  <option value={1}>#1</option>
                  <option value={2}>#2</option>
                  <option value={3}>#3</option>
                </select>
                <button
                  onClick={() => onPin(script.id, pendingOrder)}
                  disabled={isPinning}
                  style={{
                    fontSize: 10, padding: '3px 9px',
                    background: 'rgba(249,115,22,0.08)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    borderRadius: 4, color: '#f97316',
                    cursor: isPinning ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.16)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.08)'}
                >
                  {isPinning ? '…' : '📌 Pin'}
                </button>
              </>
            ) : (
              <span
                title="Make script public to pin it"
                style={{ fontSize: 10, color: '#333355', cursor: 'help', fontFamily: 'JetBrains Mono, monospace' }}
              >
                🔒 Private — cannot pin
              </span>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(script) }}
          style={{
            background: 'none', border: 'none', color: '#333355',
            cursor: 'pointer', fontSize: 14, padding: '2px 6px',
            borderRadius: 4, transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ff4444'
            e.currentTarget.style.background = 'rgba(255,68,68,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#333355'
            e.currentTarget.style.background = 'none'
          }}
        >
          🗑
        </button>
      </div>
    </div>
  )
}

function ScriptPreview({ script, onEdit }) {
  if (!script) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#333355', gap: 12,
      }}>
        <div style={{ fontSize: 48, opacity: 0.3 }}>📋</div>
        <div style={{ fontSize: 14 }}>Select a script to preview it</div>
      </div>
    )
  }

  const lines = (script.content || '').split('\n')
  const date = new Date(script.updatedAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const ACTION_NAMES = new Set([
    'HARD_STRIKE', 'HEAVY_ATTACK', 'POWER_SURGE', 'PATCH', 'FIREWALL',
    'ARMOR_PLATE', 'VIRUS_UPLOAD', 'SYSTEM_SCAN', 'CPU_STALL',
    'HardStrike', 'HeavyAttack', 'PowerSurge', 'Patch', 'Firewall',
    'ArmorPlate', 'VirusUpload', 'SystemScan', 'CpuStall',
  ])

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>
            {script.name}
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              color: '#f97316', background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4, padding: '2px 8px',
            }}>
              v{script.version}
            </span>
            <span style={{ fontSize: 12, color: '#444466' }}>Last updated {date}</span>
            {script.hasRequirements && (
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                color: '#f97316', background: 'rgba(249,115,22,0.08)',
                border: '1px solid rgba(249,115,22,0.25)',
                borderRadius: 4, padding: '2px 8px',
              }}>
                ⚙️ {script.requiredRobotIds?.length ?? 0} robot{(script.requiredRobotIds?.length ?? 0) !== 1 ? 's' : ''} required
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onEdit(script)}
          style={{
            padding: '9px 20px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(249,115,22,0.3)', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 24px rgba(249,115,22,0.5)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(249,115,22,0.3)'}
        >
          ✏️ Edit Script
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {/* Code window chrome */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.02)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: '#444466', fontFamily: 'JetBrains Mono, monospace' }}>
              {script.name}.algorig
            </span>
          </div>

          {/* Line numbers + code */}
          <div style={{ display: 'flex', overflow: 'auto' }}>
            <div style={{
              padding: '16px 12px',
              background: 'rgba(0,0,0,0.2)',
              borderRight: '1px solid rgba(255,255,255,0.04)',
              color: '#333355',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
              lineHeight: '1.8', textAlign: 'right',
              userSelect: 'none', minWidth: 40, flexShrink: 0,
            }}>
              {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
            </div>
            <div style={{
              padding: '16px 20px',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
              lineHeight: '1.8', flex: 1, whiteSpace: 'pre', overflowX: 'auto',
            }}>
              {lines.map((line, i) => {
                const trimmed = line.trim()
                let color = '#e0e0ff'
                if (trimmed === 'ELSE' || trimmed === 'END IF') {
                  color = '#f59e0b'
                } else if (trimmed.startsWith('REPEAT ') || trimmed === 'END REPEAT') {
                  color = '#22d3ee'
                } else if (ACTION_NAMES.has(trimmed)) {
                  color = '#f97316'
                }

                if (trimmed.startsWith('IF ') || trimmed === 'IF') {
                  const parts = line.split(/\b(AND|OR|NOT)\b/)
                  return (
                    <div key={i}>
                      {parts.map((part, pi) => (
                        <span key={pi} style={{
                          color: ['AND', 'OR', 'NOT'].includes(part)
                            ? '#f97316'
                            : part.trim().startsWith('IF') || part.trim() === 'ELSE' || part.trim() === 'END IF'
                            ? '#f59e0b'
                            : '#c084fc',
                        }}>
                          {part}
                        </span>
                      ))}
                    </div>
                  )
                }

                return <div key={i} style={{ color }}>{line || ' '}</div>
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'LINES', value: lines.filter(l => l.trim()).length },
            { label: 'VERSION', value: `v${script.version}` },
            { label: 'CREATED', value: new Date(script.createdAt).toLocaleDateString() },
          ].map(stat => (
            <div key={stat.label} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 8, padding: '12px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f97316', fontFamily: 'JetBrains Mono, monospace' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: 10, color: '#444466', letterSpacing: '0.1em', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DeleteConfirmModal({ script, onConfirm, onCancel, deleting }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)', zIndex: 300,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f1a', border: '1px solid rgba(255,68,68,0.3)',
          borderRadius: 16, padding: 32, width: 400,
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 12, textAlign: 'center' }}>🗑️</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', textAlign: 'center', marginBottom: 8 }}>
          Delete Script?
        </div>
        <div style={{ fontSize: 14, color: '#8888aa', textAlign: 'center', marginBottom: 24 }}>
          Are you sure you want to delete{' '}
          <span style={{ color: '#f97316', fontWeight: 600 }}>"{script.name}"</span>?
          {' '}This action cannot be undone.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: 10,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#8888aa', fontSize: 14, cursor: 'pointer', fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1, padding: 10,
              background: 'rgba(255,68,68,0.15)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 8, color: '#ff4444', fontSize: 14,
              cursor: deleting ? 'not-allowed' : 'pointer', fontWeight: 600,
            }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function ScriptViewer() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedScript, setSelectedScript] = useState(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [pinningId, setPinningId] = useState(null)

  useEffect(() => { fetchScripts() }, [])
  useEffect(() => { setPage(1) }, [search])

  function fetchScripts() {
    setLoading(true)
    getScripts()
      .then(data => {
        setScripts(data)
        if (data.length > 0) {
          setSelectedScript(prev => prev ?? data[0])
        }
      })
      .finally(() => setLoading(false))
  }

  async function handlePin(scriptId, order) {
    setPinningId(scriptId)
    try {
      const result = await pinScript(scriptId, order)
      setScripts(prev => prev.map(s =>
        s.id === result.id ? { ...s, featuredOrder: result.featuredOrder } : s
      ))
    } catch (err) {
      showToast('error', 'Pin failed',
        err?.response?.data?.message || 'Could not pin script')
    } finally {
      setPinningId(null)
    }
  }

  async function handleUnpin(scriptId) {
    setPinningId(scriptId)
    try {
      await unpinScript(scriptId)
      setScripts(prev => prev.map(s =>
        s.id === scriptId ? { ...s, featuredOrder: null } : s
      ))
    } catch (err) {
      showToast('error', 'Unpin failed',
        err?.response?.data?.message || 'Could not unpin script')
    } finally {
      setPinningId(null)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteScript(deleteCandidate.id)
      setScripts(prev => {
        const next = prev.filter(s => s.id !== deleteCandidate.id)
        if (selectedScript?.id === deleteCandidate.id) {
          setSelectedScript(next[0] ?? null)
        }
        return next
      })
      setDeleteCandidate(null)
    } finally {
      setDeleting(false)
    }
  }

  const filtered = scripts.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* Left panel */}
      <div style={{
        width: 320, minWidth: 320,
        background: 'rgba(0,0,0,0.3)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{
              fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.2em', color: '#f97316',
            }}>
              SCRIPTS
            </div>
            <span style={{ fontSize: 11, color: '#444466' }}>{filtered.length} total</span>
          </div>

          <button
            onClick={() => navigate('/scripts/new')}
            style={{
              width: '100%', padding: 9, marginBottom: 10,
              background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.08))',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 8, color: '#f97316', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.08))'}
          >
            + New Script
          </button>

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search scripts..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '8px 12px',
              color: '#f0f0ff', fontSize: 13, outline: 'none',
              fontFamily: 'inherit', transition: 'border-color 0.15s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.3)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
          />
        </div>

        {/* Script list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{
                margin: '4px 8px', height: 64, borderRadius: 10,
                background: 'rgba(255,255,255,0.02)',
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`,
              }} />
            ))
          ) : paginated.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#444466', fontSize: 13 }}>
              {search ? `No scripts matching "${search}"` : 'No scripts yet'}
            </div>
          ) : (
            paginated.map(script => (
              <ScriptCard
                key={script.id}
                script={script}
                isSelected={selectedScript?.id === script.id}
                onSelect={setSelectedScript}
                onDelete={setDeleteCandidate}
                onPin={handlePin}
                onUnpin={handleUnpin}
                pinningId={pinningId}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '6px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: page === 1 ? '#333355' : '#8888aa',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 12, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '6px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: page === totalPages ? '#333355' : '#8888aa',
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Right panel — preview */}
      <ScriptPreview script={selectedScript} onEdit={s => navigate(`/scripts/${s.id}`)} />

      {/* Delete modal */}
      {deleteCandidate && (
        <DeleteConfirmModal
          script={deleteCandidate}
          onConfirm={handleDelete}
          onCancel={() => setDeleteCandidate(null)}
          deleting={deleting}
        />
      )}
    </div>
  )
}
