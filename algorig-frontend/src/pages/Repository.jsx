import { useEffect, useRef, useState } from 'react'
import { getRepository } from '../api/scripts'
import ScriptRepositoryCard from '../components/repository/ScriptRepositoryCard'

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, padding: '9px 14px',
  color: '#f0f0ff', fontSize: 13,
  outline: 'none', fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}

function Skeleton() {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 14, height: 280,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

function PaginationBar({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 32 }}>
      <button
        onClick={onPrev} disabled={page === 0}
        style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          color: page === 0 ? '#333355' : '#8888aa',
          cursor: page === 0 ? 'not-allowed' : 'pointer',
        }}
      >
        ← Previous
      </button>
      <span style={{ fontSize: 13, color: '#555577', fontFamily: 'JetBrains Mono, monospace' }}>
        Page {page + 1} of {totalPages}
      </span>
      <button
        onClick={onNext} disabled={page >= totalPages - 1}
        style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          color: page >= totalPages - 1 ? '#333355' : '#8888aa',
          cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
        }}
      >
        Next →
      </button>
    </div>
  )
}

export default function Repository() {
  const [scripts, setScripts]           = useState([])
  const [pagination, setPagination]     = useState({ page: 0, totalPages: 0, totalElements: 0 })
  const [isLoading, setIsLoading]       = useState(true)
  const [search, setSearch]             = useState('')
  const [debouncedSearch, setDebounced] = useState('')
  const [sort, setSort]                 = useState('mostUsed')
  const [currentPage, setCurrentPage]   = useState(0)
  const [filters, setFilters]           = useState({ minBattles: 0, authorUsername: '', hasRequirements: false })
  const [appliedFilters, setApplied]    = useState({ minBattles: 0, authorUsername: '', hasRequirements: false })

  const gridRef = useRef(null)

  // Debounce search → reset page
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search)
      setCurrentPage(0)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  // Reset page when sort changes
  useEffect(() => { setCurrentPage(0) }, [sort])

  // Main fetch
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getRepository({
      page:             currentPage,
      size:             12,
      sort,
      search:           debouncedSearch.trim() || undefined,
      minBattles:       appliedFilters.minBattles || undefined,
      authorUsername:   appliedFilters.authorUsername.trim() || undefined,
      requirementsOnly: appliedFilters.hasRequirements || undefined,
    }).then(data => {
      if (cancelled) return
      setScripts(data.content)
      setPagination({ page: data.number, totalPages: data.totalPages, totalElements: data.totalElements })
    }).catch(() => {
      if (!cancelled) setScripts([])
    }).finally(() => {
      if (!cancelled) setIsLoading(false)
    })
    return () => { cancelled = true }
  }, [currentPage, debouncedSearch, sort, appliedFilters])

  function handleApply() {
    setApplied({ ...filters })
    setCurrentPage(0)
  }

  function handleClear() {
    const empty = { minBattles: 0, authorUsername: '', hasRequirements: false }
    setFilters(empty)
    setApplied(empty)
    setCurrentPage(0)
  }

  function handlePage(dir) {
    setCurrentPage(p => p + dir)
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const hasActiveFilters = appliedFilters.minBattles > 0 || appliedFilters.authorUsername.trim() || appliedFilters.hasRequirements

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
        .repo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          align-items: stretch;
          width: 100%;
        }
        @media (max-width: 1279px) { .repo-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 899px)  { .repo-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 599px)  { .repo-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#f0f0ff' }}>⚙️ Script Repository</span>
        </div>
        <div style={{ fontSize: 13, color: '#555577', marginBottom: 4 }}>
          Browse and discover public battle scripts
        </div>
        {!isLoading && (
          <div style={{
            fontSize: 11, color: '#444466',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
          }}>
            {pagination.totalElements} script{pagination.totalElements !== 1 ? 's' : ''} found
          </div>
        )}
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search scripts or authors..."
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{
            ...inputStyle, cursor: 'pointer', flexShrink: 0,
            minWidth: 170,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        >
          <option value="mostUsed">Most Used</option>
          <option value="winRate">Highest Win Rate</option>
          <option value="newest">Newest</option>
          <option value="mostCopied">Most Copied</option>
        </select>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={filters.minBattles}
          onChange={e => setFilters(f => ({ ...f, minBattles: Number(e.target.value) }))}
          style={{ ...inputStyle, cursor: 'pointer', flexShrink: 0 }}
        >
          <option value={0}>Any battles</option>
          <option value={1}>1+ battles</option>
          <option value={5}>5+ battles</option>
          <option value={10}>10+ battles</option>
          <option value={25}>25+ battles</option>
          <option value={50}>50+ battles</option>
        </select>
        <input
          value={filters.authorUsername}
          onChange={e => setFilters(f => ({ ...f, authorUsername: e.target.value }))}
          placeholder="Author username..."
          style={{ ...inputStyle, minWidth: 160 }}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <label style={{
          display: 'flex', alignItems: 'center', gap: 6,
          cursor: 'pointer', fontSize: 12, color: '#8888aa', flexShrink: 0,
        }}>
          <input
            type="checkbox"
            checked={filters.hasRequirements}
            onChange={e => setFilters(f => ({ ...f, hasRequirements: e.target.checked }))}
            style={{ accentColor: '#f97316', cursor: 'pointer' }}
          />
          Has Requirements
        </label>
        <button
          onClick={handleApply}
          style={{
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
          }}
        >
          Apply
        </button>
        {hasActiveFilters && (
          <button
            onClick={handleClear}
            style={{
              background: 'none', border: 'none',
              color: '#8888aa', fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              textDecoration: 'underline', padding: 0, flexShrink: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid */}
      <div ref={gridRef}>
        {isLoading ? (
          <div className="repo-grid">
            {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
          </div>
        ) : scripts.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.01)',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: 14, padding: '56px 24px',
            textAlign: 'center', color: '#444466', fontSize: 14,
          }}>
            No scripts found. Try adjusting your filters.
          </div>
        ) : (
          <div className="repo-grid">
            {scripts.map((script, index) => index === 0 ? (
              <div key={script.id} data-tour="repo-card-first" style={{ display: 'flex', flexDirection: 'column' }}>
                <ScriptRepositoryCard script={script} />
              </div>
            ) : (
              <ScriptRepositoryCard key={script.id} script={script} />
            ))}
          </div>
        )}

        <PaginationBar
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPrev={() => handlePage(-1)}
          onNext={() => handlePage(1)}
        />
      </div>
    </div>
  )
}
