import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getPublicProfile, uploadAvatar, unpinScript } from '../api/users'
import { getRepository } from '../api/scripts'
import EditProfileModal from '../components/profile/EditProfileModal'
import AchievementBadge from '../components/profile/AchievementBadge'
import ScriptRepositoryCard from '../components/repository/ScriptRepositoryCard'

const ALL_ACHIEVEMENTS = [
  { code: 'FIRST_BLOOD',     icon: '⚔️', displayName: 'First Blood',    description: 'Win your first battle' },
  { code: 'SCRIPTER',        icon: '📝', displayName: 'Scripter',        description: 'Create 3 scripts' },
  { code: 'VETERAN',         icon: '🎖️', displayName: 'Veteran',         description: 'Fight 25 battles' },
  { code: 'DOMINATOR',       icon: '👑', displayName: 'Dominator',       description: 'Win 5 battles in a row' },
  { code: 'APEX_CHALLENGER', icon: '🤖', displayName: 'Apex Challenger', description: 'Use a Tier 5 robot' },
  { code: 'VARIETY_PACK',    icon: '🎲', displayName: 'Variety Pack',    description: 'Use 5 different robots' },
]

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function StatBox({ label, value }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 10,
      padding: '14px 10px',
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: 24,
        fontWeight: 800,
        color: '#f97316',
        fontFamily: 'JetBrains Mono, monospace',
        lineHeight: 1,
      }}>
        {value ?? '—'}
      </div>
      <div style={{
        fontSize: 10,
        color: '#555577',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginTop: 6,
      }}>
        {label}
      </div>
    </div>
  )
}

export default function Profile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: authUser, updateUser, isAuthenticated } = useAuth()

  const [profile, setProfile]               = useState(null)
  const [isLoading, setIsLoading]           = useState(true)
  const [error, setError]                   = useState(null)
  const [activeTab, setActiveTab]           = useState('scripts')
  const [isEditing, setIsEditing]           = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [unpinningId, setUnpinningId]       = useState(null)

  const { showToast } = useToast()
  const fileInputRef = useRef(null)

  const isOwnProfile = isAuthenticated && authUser?.username === username

  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setProfile(null)
    getPublicProfile(username)
      .then(setProfile)
      .catch(err => {
        const status = err?.response?.status
        setError(status === 404 ? 'User not found' : 'Failed to load profile')
      })
      .finally(() => setIsLoading(false))
  }, [username])

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    try {
      const updated = await uploadAvatar(file)
      setProfile(p => ({ ...p, avatarUrl: updated.avatarUrl }))
      updateUser({ ...authUser, avatarUrl: updated.avatarUrl })
    } catch (err) {
      showToast(
        'error',
        'Upload failed',
        err?.response?.data?.message || 'Please try a valid image file under 5MB'
      )
    } finally {
      setAvatarUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleProfileSaved(updatedDto) {
    setProfile(p => ({ ...p, username: updatedDto.username, tagline: updatedDto.tagline }))
    updateUser({ ...authUser, username: updatedDto.username, avatarUrl: updatedDto.avatarUrl })
    if (updatedDto.username !== username) {
      navigate(`/profile/${updatedDto.username}`, { replace: true })
    }
  }

  async function handleUnpin(scriptId) {
    setUnpinningId(scriptId)
    try {
      await unpinScript(scriptId)
      setProfile(p => ({
        ...p,
        featuredScripts: p.featuredScripts.filter(s => s.id !== scriptId),
      }))
    } catch {
      // silent
    } finally {
      setUnpinningId(null)
    }
  }

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', color: '#555577',
        fontFamily: 'JetBrains Mono, monospace', fontSize: 14,
      }}>
        Loading profile…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', gap: 16,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div style={{ fontSize: 48 }}>👤</div>
        <div style={{ color: '#ff6b6b', fontSize: 16 }}>{error}</div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '9px 22px', borderRadius: 8,
            border: '1px solid rgba(249,115,22,0.3)',
            background: 'none', color: '#f97316',
            cursor: 'pointer', fontSize: 13, fontFamily: 'inherit',
          }}
        >
          ← Go Back
        </button>
      </div>
    )
  }

  const stats = profile.stats ?? {}
  const earnedCodes = new Set((profile.achievements ?? []).map(a => a.code))
  const earnedMap = {}
  ;(profile.achievements ?? []).forEach(a => { earnedMap[a.code] = a })

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

      {/* ── Header ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 24,
        marginBottom: 20,
      }}>
        {/* Avatar */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            onClick={isOwnProfile ? () => fileInputRef.current?.click() : undefined}
            style={{
              width: 88, height: 88,
              borderRadius: '50%',
              overflow: 'hidden',
              cursor: isOwnProfile ? 'pointer' : 'default',
              position: 'relative',
              border: '2px solid rgba(249,115,22,0.3)',
              flexShrink: 0,
            }}
          >
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.username}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, fontWeight: 700, color: '#fff',
              }}>
                {profile.username?.charAt(0).toUpperCase() ?? '?'}
              </div>
            )}
            {/* Camera overlay on hover — own profile */}
            {isOwnProfile && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: avatarUploading ? 1 : 0,
                transition: 'opacity 0.2s',
                fontSize: 22,
              }}
                onMouseEnter={e => { if (!avatarUploading) e.currentTarget.style.opacity = '1' }}
                onMouseLeave={e => { if (!avatarUploading) e.currentTarget.style.opacity = '0' }}
              >
                {avatarUploading ? '…' : '📷'}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>
            {profile.username}
          </div>
          <div style={{ fontSize: 12, color: '#555577', marginBottom: 8, fontFamily: 'JetBrains Mono, monospace' }}>
            @{profile.username}
            {profile.provider && profile.provider !== 'local' && (
              <span style={{ marginLeft: 8, color: '#444466' }}>
                · via {profile.provider}
              </span>
            )}
            <span style={{ marginLeft: 8, color: '#333355' }}>
              · joined {formatDate(profile.createdAt)}
            </span>
          </div>
          {profile.tagline ? (
            <div style={{ fontSize: 14, color: '#8888aa', marginBottom: 12, lineHeight: 1.5 }}>
              {profile.tagline}
            </div>
          ) : isOwnProfile ? (
            <div style={{ fontSize: 13, color: '#333355', marginBottom: 12, fontStyle: 'italic' }}>
              No tagline yet — add one by editing your profile
            </div>
          ) : null}

          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                padding: '7px 18px',
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 8, color: '#f97316',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.1)'}
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        <StatBox label="Wins"    value={stats.wins} />
        <StatBox label="Losses"  value={stats.losses} />
        <StatBox label="Draws"   value={stats.draws} />
        <StatBox label="Win %"   value={stats.totalBattles ? `${stats.winRate ?? 0}%` : '—'} />
        <StatBox label="Streak"  value={stats.currentStreak} />
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { id: 'scripts',      label: 'Featured' },
          { id: 'public',       label: 'Public Scripts' },
          { id: 'achievements', label: 'Achievements' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#f97316' : 'transparent'}`,
              color: activeTab === tab.id ? '#f97316' : '#555577',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              transition: 'color 0.15s',
              marginBottom: -1,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#f97316' }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = '#555577' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Scripts ── */}
      {activeTab === 'scripts' && (
        <div>
          {profile.featuredScripts?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.featuredScripts.map(script => (
                <FeaturedScriptCard
                  key={script.id}
                  script={script}
                  isOwn={isOwnProfile}
                  unpinning={unpinningId === script.id}
                  onUnpin={() => handleUnpin(script.id)}
                />
              ))}
            </div>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px dashed rgba(255,255,255,0.08)',
              borderRadius: 14,
              padding: '48px 24px',
              textAlign: 'center',
              color: '#444466',
              fontSize: 14,
            }}>
              {isOwnProfile
                ? <>No featured scripts yet.{' '}<a href="/scripts" style={{ color: '#f97316' }}>Pin one from Scripts →</a></>
                : 'No featured scripts yet.'}
            </div>
          )}

          {isOwnProfile && (profile.featuredScripts?.length ?? 0) < 3 && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <a
                href="/scripts"
                style={{
                  fontSize: 12, color: '#f97316', opacity: 0.7,
                  textDecoration: 'none', fontFamily: 'JetBrains Mono, monospace',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                onMouseLeave={e => e.currentTarget.style.opacity = '0.7'}
              >
                + Pin more scripts ({(profile.featuredScripts?.length ?? 0)}/3 used)
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Public Scripts ── */}
      {activeTab === 'public' && (
        <PublicScriptsTab username={username} />
      )}

      {/* ── Tab: Achievements ── */}
      {activeTab === 'achievements' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {ALL_ACHIEVEMENTS.map(a => (
            <AchievementBadge
              key={a.code}
              achievement={a}
              earned={earnedCodes.has(a.code)}
              awardedAt={earnedMap[a.code]?.awardedAt ?? null}
            />
          ))}
        </div>
      )}

      {/* ── Edit modal ── */}
      {isEditing && (
        <EditProfileModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          currentUser={{ ...profile, provider: profile.provider }}
          onSaved={handleProfileSaved}
        />
      )}
    </div>
  )
}

// TODO: replace with server-side filtering once /api/scripts/public supports ?username=X
// Currently uses the /api/repository endpoint which already supports authorUsername filtering.
function PublicScriptsTab({ username }) {
  const [scripts, setScripts]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    setLoading(true)
    getRepository({ authorUsername: username, page: 0, size: 24, sort: 'mostUsed' })
      .then(data => setScripts(data.content ?? []))
      .catch(() => setScripts([]))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: '60px 0',
        color: '#555577', fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <div style={{
          width: 16, height: 16,
          border: '2px solid rgba(249,115,22,0.2)',
          borderTopColor: '#f97316',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
        Loading scripts…
      </div>
    )
  }

  if (scripts.length === 0) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.01)',
        border: '1px dashed rgba(255,255,255,0.08)',
        borderRadius: 14, padding: '48px 24px',
        textAlign: 'center', color: '#444466', fontSize: 14,
      }}>
        No public scripts yet.
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 16,
    }}>
      {scripts.map(script => (
        <ScriptRepositoryCard key={script.id} script={script} />
      ))}
    </div>
  )
}

function FeaturedScriptCard({ script, isOwn, unpinning, onUnpin }) {
  const previewLines = (script.content ?? '')
    .split('\n')
    .filter(l => l.trim())
    .slice(0, 3)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '16px 20px',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(249,115,22,0.2)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff' }}>{script.name}</span>
          <span style={{
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
            color: '#f97316',
            background: 'rgba(249,115,22,0.1)',
            border: '1px solid rgba(249,115,22,0.25)',
            borderRadius: 4, padding: '2px 7px',
          }}>
            📌 Featured #{script.featuredOrder}
          </span>
        </div>
        {isOwn && (
          <button
            onClick={onUnpin}
            disabled={unpinning}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, padding: '4px 12px',
              color: '#555577', fontSize: 12,
              cursor: unpinning ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,68,68,0.3)'; e.currentTarget.style.color = '#ff6b6b' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#555577' }}
          >
            {unpinning ? '…' : 'Unpin'}
          </button>
        )}
      </div>

      {previewLines.length > 0 && (
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, color: '#555577',
          lineHeight: 1.7,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: 6, padding: '8px 12px',
          overflow: 'hidden',
        }}>
          {previewLines.map((line, i) => <div key={i}>{line}</div>)}
          {(script.content ?? '').split('\n').filter(l => l.trim()).length > 3 && (
            <div style={{ color: '#333355', marginTop: 2 }}>…</div>
          )}
        </div>
      )}

      <div style={{ marginTop: 8, fontSize: 11, color: '#444466', textAlign: 'right' }}>
        Updated {formatDate(script.updatedAt)}
      </div>
    </div>
  )
}
