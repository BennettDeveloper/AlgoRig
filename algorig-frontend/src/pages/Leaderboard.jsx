import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getLeaderboardByWins, getLeaderboardByWinRate, getLeaderboardByStreak } from '../api/leaderboardApi'

const TABS = [
  { id: 'wins',    label: '🏆 Total Wins',  fetch: getLeaderboardByWins },
  { id: 'winrate', label: '📈 Win Rate',    fetch: getLeaderboardByWinRate },
  { id: 'streak',  label: '🔥 Best Streak', fetch: getLeaderboardByStreak },
]

const RANK_STYLE = {
  1: { color: '#f59e0b', label: '🥇' },
  2: { color: '#9ca3af', label: '🥈' },
  3: { color: '#b45309', label: '🥉' },
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '80px 0', gap: 12 }}>
      <div style={{
        width: 20, height: 20,
        border: '2px solid rgba(249,115,22,0.2)',
        borderTopColor: '#f97316',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <span style={{ color: '#555577', fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>
        Loading…
      </span>
    </div>
  )
}

function Avatar({ avatarUrl, username }) {
  const initial = username?.charAt(0).toUpperCase() ?? '?'
  return (
    <div style={{
      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f97316, #ea580c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 12, fontWeight: 700, color: '#fff',
    }}>
      {avatarUrl
        ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : initial}
    </div>
  )
}

function RankCell({ rank }) {
  const ranked = RANK_STYLE[rank]
  if (ranked) {
    return (
      <span style={{
        fontSize: 18, lineHeight: 1, display: 'inline-flex', alignItems: 'center',
      }}>
        {ranked.label}
      </span>
    )
  }
  return (
    <span style={{
      fontSize: 13, fontWeight: 700, color: '#444466',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      #{rank}
    </span>
  )
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('wins')
  const [page, setPage]           = useState(0)
  const [data, setData]           = useState(null)
  const [loading, setLoading]     = useState(true)

  const tab = TABS.find(t => t.id === activeTab)

  useEffect(() => {
    setLoading(true)
    setData(null)
    tab.fetch(page)
      .then(setData)
      .catch(() => setData({ content: [], last: true, totalPages: 0 }))
      .finally(() => setLoading(false))
  }, [activeTab, page])

  function switchTab(id) {
    setActiveTab(id)
    setPage(0)
  }

  const entries = data?.content ?? []
  const isLast  = data?.last ?? true
  const totalPages = data?.totalPages ?? 1

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 800, color: '#f0f0ff',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          🏆 Leaderboard
        </h1>
        <p style={{
          margin: '8px 0 0', fontSize: 13, color: '#555577',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          Rankings based on public script performance
        </p>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: 'flex', gap: 2, marginBottom: 24,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => switchTab(t.id)}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? '#f97316' : 'transparent'}`,
              color: activeTab === t.id ? '#f0f0ff' : '#555577',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              letterSpacing: '0.03em', transition: 'color 0.15s',
              marginBottom: -1, fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#f97316' }}
            onMouseLeave={e => { if (activeTab !== t.id) e.currentTarget.style.color = '#555577' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Win Rate info badge */}
      {activeTab === 'winrate' && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(249,115,22,0.06)',
          border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 8, padding: '6px 14px',
          fontSize: 12, color: '#f97316',
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 16,
        }}>
          ℹ️ Requires 10+ battles to qualify
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <Spinner />
      ) : entries.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          color: '#444466', fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          No players ranked yet.
        </div>
      ) : (
        <>
          {/* Table */}
          <div data-tour="leaderboard-table" style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14,
            overflow: 'hidden',
          }}>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '48px 1fr 100px 100px 90px 110px',
              padding: '10px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              {['#', 'Player', 'Script Wins', 'Win Rate', 'Streak', 'Fav Robot'].map((h, i) => (
                <span key={i} style={{
                  fontSize: 10, fontWeight: 700, color: '#444466',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'JetBrains Mono, monospace',
                  textAlign: i > 1 ? 'center' : 'left',
                }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {entries.map((entry, idx) => {
              const winRate = entry.totalPublicScriptBattles > 0
                ? `${(entry.publicWinRate * 100).toFixed(1)}%`
                : 'N/A'

              return (
                <div
                  key={entry.username + entry.rank}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr 100px 100px 90px 110px',
                    padding: '13px 20px',
                    borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Rank */}
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <RankCell rank={entry.rank} />
                  </div>

                  {/* Player */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <Avatar avatarUrl={entry.avatarUrl} username={entry.username} />
                    <Link
                      to={`/profile/${entry.username}`}
                      style={{
                        fontSize: 14, fontWeight: 600, color: '#f0f0ff',
                        textDecoration: 'none', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
                      onMouseLeave={e => e.currentTarget.style.color = '#f0f0ff'}
                    >
                      {entry.username}
                    </Link>
                  </div>

                  {/* Script Wins */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: '#f97316',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {entry.totalPublicScriptWins.toLocaleString()}
                    </span>
                  </div>

                  {/* Win Rate */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      fontFamily: 'JetBrains Mono, monospace',
                      color: entry.totalPublicScriptBattles > 0 ? '#22c55e' : '#444466',
                    }}>
                      {winRate}
                    </span>
                  </div>

                  {/* Streak */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600, color: '#f0f0ff',
                      fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {entry.bestStreak}
                    </span>
                  </div>

                  {/* Favorite Robot */}
                  <div style={{ textAlign: 'center' }}>
                    <span style={{
                      fontSize: 12, color: entry.favoriteRobotName ? '#8888aa' : '#333355',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'block',
                    }}>
                      {entry.favoriteRobotName ?? '—'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Pagination ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 16, marginTop: 28,
          }}>
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: page === 0 ? '#333355' : '#8888aa',
                cursor: page === 0 ? 'not-allowed' : 'pointer',
                transition: 'color 0.15s',
              }}
            >
              ← Previous
            </button>
            <span style={{
              fontSize: 13, color: '#555577',
              fontFamily: 'JetBrains Mono, monospace',
            }}>
              Page {page + 1}{totalPages > 1 ? ` of ${totalPages}` : ''}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={isLast}
              style={{
                padding: '8px 18px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                color: isLast ? '#333355' : '#8888aa',
                cursor: isLast ? 'not-allowed' : 'pointer',
                transition: 'color 0.15s',
              }}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
