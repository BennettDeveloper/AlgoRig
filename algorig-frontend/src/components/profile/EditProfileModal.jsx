import { useState } from 'react'
import { updateProfile, changePassword } from '../../api/users'

export default function EditProfileModal({ isOpen, onClose, currentUser, onSaved }) {
  const [username, setUsername]                 = useState(currentUser?.username ?? '')
  const [tagline, setTagline]                   = useState(currentUser?.tagline  ?? '')
  const [passwordOpen, setPasswordOpen]         = useState(false)
  const [currentPassword, setCurrentPassword]   = useState('')
  const [newPassword, setNewPassword]           = useState('')
  const [confirmPassword, setConfirmPassword]   = useState('')
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState(null)

  if (!isOpen) return null

  const isLocal = currentUser?.provider === 'local'

  async function handleSave() {
    setError(null)

    if (passwordOpen) {
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match')
        return
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters')
        return
      }
    }

    setSaving(true)
    try {
      const updatedDto = await updateProfile({
        username: username !== currentUser.username ? username : null,
        tagline,
      })

      if (passwordOpen && currentPassword && newPassword) {
        await changePassword(currentPassword, newPassword)
      }

      onSaved(updatedDto)
      onClose()
    } catch (err) {
      const msg = err?.response?.data?.message
        || err?.response?.data?.error
        || 'Failed to save changes'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16,
          padding: 32,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div style={{
          fontSize: 18, fontWeight: 700, color: '#f0f0ff',
          marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          Edit Profile
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: '#444466',
              cursor: 'pointer', fontSize: 16, padding: '2px 6px',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#8888aa'}
            onMouseLeave={e => e.currentTarget.style.color = '#444466'}
          >
            ✕
          </button>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8888aa', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
            USERNAME
          </label>
          <input
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={30}
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        {/* Tagline */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8888aa', marginBottom: 6, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
            TAGLINE
          </label>
          <div style={{ position: 'relative' }}>
            <input
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              maxLength={160}
              placeholder="A short bio..."
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
            <span style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              fontSize: 10, color: tagline.length > 140 ? '#f97316' : '#444466',
              fontFamily: 'JetBrains Mono, monospace', pointerEvents: 'none',
            }}>
              {tagline.length}/160
            </span>
          </div>
        </div>

        {/* Password section — local accounts only */}
        {isLocal && (
          <div style={{ marginBottom: 20 }}>
            <button
              onClick={() => setPasswordOpen(p => !p)}
              style={{
                background: 'none', border: 'none',
                color: '#f97316', cursor: 'pointer',
                fontSize: 13, fontWeight: 600, padding: 0,
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: 'inherit',
              }}
            >
              {passwordOpen ? '▼' : '▶'} Change Password
            </button>

            {passwordOpen && (
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LabeledInput
                  label="CURRENT PASSWORD"
                  type="password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                />
                <LabeledInput
                  label="NEW PASSWORD (min 8)"
                  type="password"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <LabeledInput
                  label="CONFIRM NEW PASSWORD"
                  type="password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px',
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, fontSize: 13, color: '#f87171',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '11px 0',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#8888aa',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 2, padding: '11px 0',
              background: saving
                ? 'rgba(249,115,22,0.3)'
                : 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(249,115,22,0.3)',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LabeledInput({ label, type, value, onChange }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#8888aa', marginBottom: 5, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
      />
    </div>
  )
}

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  padding: '10px 12px',
  color: '#f0f0ff',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 0.15s',
}
