import { useState } from 'react'
import apiClient from '../../api/client'

const KNOWN_ACTIONS = [
  'HardStrike', 'HeavyAttack', 'PowerSurge', 'Patch', 'Firewall',
  'ArmorPlate', 'VirusUpload', 'SystemScan', 'CpuStall'
]

function computeStats(scriptContent) {
  const lines = (scriptContent || '').split('\n').map(l => l.trim()).filter(Boolean)
  const actions = lines.filter(l => KNOWN_ACTIONS.includes(l)).length
  const ifBlocks = lines.filter(l => l.startsWith('IF ')).length
  const estTurns = actions + ifBlocks * 2
  return { actions, ifBlocks, estTurns }
}

export default function ValidationPanel({
  scriptContent,
  scriptName,
  scriptId,
  validationResult,
  setValidationResult,
  isValidating,
  setIsValidating,
  isSaving,
  setIsSaving,
}) {
  const stats = computeStats(scriptContent)

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const res = await apiClient.post('/scripts/validate', { content: scriptContent })
      setValidationResult(res.data)
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: [err?.response?.data?.message || 'Validation request failed']
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      if (scriptId) {
        await apiClient.put(`/scripts/${scriptId}`, { name: scriptName, content: scriptContent })
      } else {
        await apiClient.post('/scripts', { name: scriptName, content: scriptContent })
      }
    } catch (err) {
      console.error('Save failed', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: 'rgba(0,0,0,0.25)',
      borderLeft: '1px solid rgba(255,255,255,0.06)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      overflowY: 'auto',
    }}>
      <div style={{
        color: '#f97316',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: 4,
      }}>
        Validation
      </div>

      <button
        onClick={handleValidate}
        disabled={isValidating}
        style={{
          width: '100%',
          background: 'rgba(249,115,22,0.1)',
          border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 8,
          padding: '10px',
          color: '#f97316',
          fontWeight: 600,
          fontSize: 13,
          cursor: isValidating ? 'default' : 'pointer',
          transition: 'background 0.15s',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          opacity: isValidating ? 0.7 : 1,
        }}
        onMouseEnter={e => { if (!isValidating) e.currentTarget.style.background = 'rgba(249,115,22,0.2)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.1)' }}
      >
        {isValidating ? (
          <>
            <Spinner /> Validating...
          </>
        ) : 'Run Validation'}
      </button>

      <ValidationResult result={validationResult} />

      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: 12,
        marginTop: 4,
      }}>
        <div style={{
          color: '#8888aa',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}>
          Script Stats
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 8,
        }} />
        <StatRow label="Actions found" value={stats.actions || '—'} />
        <StatRow label="IF blocks" value={stats.ifBlocks || '—'} />
        <StatRow label="Est. turns/cycle" value={stats.estTurns || '—'} />
      </div>

      <div style={{ flex: 1 }} />

      <button
        onClick={handleSave}
        disabled={isSaving || validationResult?.valid !== true}
        style={{
          width: '100%',
          background: validationResult?.valid
            ? 'linear-gradient(135deg, #f97316, #ea580c)'
            : 'rgba(255,255,255,0.05)',
          border: 'none',
          borderRadius: 8,
          padding: '12px',
          color: validationResult?.valid ? '#fff' : '#444466',
          fontWeight: 700,
          fontSize: 14,
          cursor: validationResult?.valid && !isSaving ? 'pointer' : 'not-allowed',
          boxShadow: validationResult?.valid ? '0 4px 20px rgba(249,115,22,0.3)' : 'none',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
      >
        {isSaving ? 'Saving...' : 'Save Script'}
      </button>
    </div>
  )
}

function ValidationResult({ result }) {
  if (!result) {
    return (
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '12px 14px',
        color: '#555577',
        fontSize: 12,
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        Run validation to check your script
      </div>
    )
  }

  if (result.valid) {
    return (
      <div style={{
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.25)',
        borderRadius: 8,
        padding: '12px 14px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#22c55e',
          fontSize: 13,
          fontWeight: 700,
          fontFamily: 'JetBrains Mono, monospace',
          marginBottom: 6,
        }}>
          <span>✓</span> SCRIPT VALID
        </div>
        <div style={{
          borderTop: '1px solid rgba(34,197,94,0.15)',
          marginBottom: 6,
        }} />
        <div style={{ color: '#22c55e', fontSize: 12, opacity: 0.75 }}>
          Ready to save and use in battle.
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(239,68,68,0.06)',
      border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 8,
      padding: '12px 14px',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        color: '#ef4444',
        fontSize: 13,
        fontWeight: 700,
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: 6,
      }}>
        <span>✗</span> VALIDATION FAILED
      </div>
      <div style={{
        borderTop: '1px solid rgba(239,68,68,0.15)',
        marginBottom: 8,
      }} />
      <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {(result.errors || []).map((err, i) => (
          <li key={i} style={{ color: '#ef4444', fontSize: 12, opacity: 0.85 }}>{err}</li>
        ))}
      </ul>
    </div>
  )
}

function StatRow({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '4px 0',
      color: '#555577',
      fontSize: 12,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <span>{label}</span>
      <span style={{ color: '#8888aa' }}>{value}</span>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{
      display: 'inline-block',
      width: 12,
      height: 12,
      border: '2px solid rgba(249,115,22,0.3)',
      borderTopColor: '#f97316',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
    }} />
  )
}
