import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createCustomRobot } from '../api/customRobotApi'
import RobotScene from '../components/three/RobotScene'
import { PARTS_LIBRARY, SLOT_LABELS, DEFAULT_PARTS } from '../components/three/partsLibrary'
import {
  TIER_ORDER, TIER_BUDGETS, STAT_FLOORS, FLOORS_TOTAL,
  STAT_CEILINGS, TIER_COLORS, STAT_KEYS, STAT_LABELS, getAvailablePassives,
} from '../constants/robotConstants'

// ── Style constants ────────────────────────────────────────────────────────────

const TIER_SHORT = { TIER_1: 'T1', TIER_2: 'T2', TIER_3: 'T3', TIER_4: 'T4', TIER_5: 'T5' }

const card = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 16,
  padding: '24px 28px',
  marginBottom: 20,
}

const sectionTitle = {
  fontSize: 12,
  fontFamily: 'JetBrains Mono, monospace',
  fontWeight: 700,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#8888aa',
}

// ── Component-level CSS ────────────────────────────────────────────────────────
const COMPONENT_CSS = `
  .tier-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    margin: 10px 0 6px;
  }
  .tier-slider::-webkit-slider-runnable-track {
    height: 6px;
    border-radius: 3px;
  }
  .tier-slider::-moz-range-track {
    height: 6px;
    border-radius: 3px;
    background: rgba(255,255,255,0.08);
  }
  .tier-slider::-moz-range-progress {
    background: var(--tc, #f97316);
    border-radius: 3px;
  }
  .tier-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--tc, #f97316);
    cursor: pointer;
    transition: box-shadow 0.15s ease;
  }
  .tier-slider::-webkit-slider-thumb:hover {
    box-shadow: 0 0 10px var(--tc, #f97316);
  }
  .tier-slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: var(--tc, #f97316);
    cursor: pointer;
  }
  @keyframes statGuideIn {
    from { opacity: 0; transform: scale(0.96) translateY(-10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0);     }
  }
  .stat-guide-modal {
    animation: statGuideIn 0.15s ease;
  }
`

// ── Stat guide data ────────────────────────────────────────────────────────────

const STAT_GUIDE = [
  { key: 'hp',              icon: '❤️', label: 'HP',            desc: "Your robot's total health. Reaching 0 means defeat." },
  { key: 'coreImpact',      icon: '⚔️', label: 'Core Impact',   desc: 'Determines physical attack damage (Hard Strike, Heavy Attack).' },
  { key: 'exploitPower',    icon: '⚡', label: 'Exploit Power', desc: 'Determines software attack damage (Power Surge, Virus Upload, Stack Overflow).' },
  { key: 'clockSpeed',      icon: '⚙️', label: 'Clock Speed',   desc: 'Affects turn priority and action speed scaling.' },
  { key: 'chassisArmor',    icon: '🛡️', label: 'Chassis Armor', desc: 'Reduces incoming physical damage. Restored by Armor Plate action.' },
  { key: 'firewallStrength',icon: '🔒', label: 'Firewall',      desc: 'Reduces incoming software damage. Restored by Firewall action.' },
  { key: 'battery',         icon: '🔋', label: 'Battery',       desc: 'Your energy pool. Every action costs battery. Depleting it causes CPU Stall.' },
]

// ── StatGuideModal ─────────────────────────────────────────────────────────────

function StatGuideModal({ onClose }) {
  const modalRef = useRef(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return

    const focusable = el.querySelectorAll('button, [tabindex]:not([tabindex="-1"])')
    const first = focusable[0]
    const last  = focusable[focusable.length - 1]

    first?.focus()

    function onKey(e) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last)  { e.preventDefault(); first?.focus() }
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.65)',
        zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stat-guide-title"
        className="stat-guide-modal"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#131326',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14,
          padding: '24px 28px',
          maxWidth: 480, width: '100%',
          maxHeight: '80vh', overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: 20,
        }}>
          <h2
            id="stat-guide-title"
            style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f0ff' }}
          >
            Stat Guide
          </h2>
          <button
            onClick={onClose}
            aria-label="Close stat guide"
            style={{
              background: 'none', border: 'none',
              color: '#555577', cursor: 'pointer',
              fontSize: 22, lineHeight: 1, padding: '0 4px',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#555577'}
          >
            ×
          </button>
        </div>

        {STAT_GUIDE.map((stat, i) => (
          <div
            key={stat.key}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 14,
              padding: '12px 0',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>
              {stat.icon}
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff', marginBottom: 3 }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 12, color: '#8888aa', lineHeight: 1.5 }}>
                {stat.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── StatRow ────────────────────────────────────────────────────────────────────

function StatRow({ statKey, value, floor, ceiling, tierColor, remainingPoints, onChange }) {
  const fillPct = Math.round(((value - floor) / Math.max(ceiling - floor, 1)) * 100)
  const trackBg = `linear-gradient(to right, ${tierColor} ${fillPct}%, rgba(255,255,255,0.08) ${fillPct}%)`
  const barPct  = Math.round((value / ceiling) * 100)

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
        <span style={{ fontSize: 12, color: '#8888aa', letterSpacing: '0.06em' }}>
          {STAT_LABELS[statKey]}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: tierColor, fontFamily: 'JetBrains Mono, monospace' }}>
          {value}
          <span style={{ fontSize: 10, color: '#444466', marginLeft: 4 }}>/ {ceiling}</span>
        </span>
      </div>

      <input
        type="range"
        className="tier-slider"
        min={floor}
        max={ceiling}
        step={1}
        value={value}
        onChange={e => onChange(statKey, e.target.value)}
        style={{ background: trackBg }}
      />

      <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${barPct}%`,
          background: tierColor + '66',
          borderRadius: 2, transition: 'width 0.15s ease',
        }} />
      </div>
    </div>
  )
}

// ── PassiveCard ────────────────────────────────────────────────────────────────

function PassiveCard({ passive, selected, tierColor, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? `${tierColor}18` : 'rgba(255,255,255,0.02)',
        border: selected ? `2px solid ${tierColor}` : '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '12px 14px',
        cursor: 'pointer', transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!selected) e.currentTarget.style.borderColor = `${tierColor}60`
      }}
      onMouseLeave={e => {
        if (!selected) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff', marginBottom: 4 }}>
        {passive.name}
      </div>
      <div style={{ fontSize: 11, color: '#666688', lineHeight: 1.45 }}>
        {passive.desc}
      </div>
    </div>
  )
}

// ── RobotBuilder ───────────────────────────────────────────────────────────────

export default function RobotBuilder() {
  const navigate = useNavigate()

  const [name, setName]                       = useState('')
  const [selectedTier, setSelectedTier]       = useState('TIER_1')
  const [stats, setStats]                     = useState({ ...STAT_FLOORS })
  const [selectedPassive, setSelectedPassive] = useState(null)
  const [selectedParts, setSelectedParts]     = useState({ ...DEFAULT_PARTS })
  const [isSubmitting, setIsSubmitting]       = useState(false)
  const [errorMessage, setErrorMessage]       = useState(null)
  const [successMessage, setSuccessMessage]   = useState(null)
  const [showStatGuide, setShowStatGuide]     = useState(false)

  // ── Derived ────────────────────────────────────────────────────────────────

  const tierColor         = TIER_COLORS[selectedTier]
  const tierBudget        = TIER_BUDGETS[selectedTier]
  const freeBudget        = tierBudget - FLOORS_TOTAL
  const spentPoints       = Object.values(stats).reduce((a, b) => a + b, 0) - FLOORS_TOTAL
  const remainingPoints   = freeBudget - spentPoints
  const ceilings          = STAT_CEILINGS[selectedTier]
  const availablePassives = getAvailablePassives(selectedTier)
  const canSubmit         = name.trim().length > 0 && selectedPassive !== null && !isSubmitting

  // Live preview robot — name: null prevents robotVariants lookup so parts config takes effect
  const previewRobot = {
    name:             null,
    tier:             selectedTier,
    hp:               stats.hp,
    coreImpact:       stats.coreImpact,
    exploitPower:     stats.exploitPower,
    clockSpeed:       stats.clockSpeed,
    chassisArmor:     stats.chassisArmor,
    firewallStrength: stats.firewallStrength,
    battery:          stats.battery,
    partsConfig:      selectedParts,
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleTierChange(tier) {
    setSelectedTier(tier)
    setStats({ ...STAT_FLOORS })
    setSelectedPassive(null)
    setErrorMessage(null)
    // selectedParts intentionally not reset — parts are aesthetic, not tier-dependent
  }

  function handleStatChange(statKey, rawValue) {
    const newVal        = parseInt(rawValue, 10)
    const ceiling       = ceilings[statKey]
    const floor         = STAT_FLOORS[statKey]
    const maxFromBudget = stats[statKey] + remainingPoints
    const clamped       = Math.max(floor, Math.min(newVal, Math.min(maxFromBudget, ceiling)))
    setStats(prev => ({ ...prev, [statKey]: clamped }))
  }

  async function handleSubmit() {
    if (!canSubmit) return
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await createCustomRobot({
        name: name.trim(),
        tier: selectedTier,
        ...stats,
        passiveAbility: selectedPassive,
        partsConfig: JSON.stringify(selectedParts),
      })
      setSuccessMessage('Robot created successfully!')
      setTimeout(() => navigate('/robots'), 1200)
    } catch (e) {
      setErrorMessage(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const budgetPct = Math.max(0, Math.round((remainingPoints / freeBudget) * 100))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 64px' }}>

      <style>{COMPONENT_CSS}</style>

      {showStatGuide && <StatGuideModal onClose={() => setShowStatGuide(false)} />}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <Link
          to="/robots"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: '#555577', textDecoration: 'none',
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
            marginBottom: 16, transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#f97316'}
          onMouseLeave={e => e.currentTarget.style.color = '#555577'}
        >
          ← Back to Robots
        </Link>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#f0f0ff' }}>
          Robot Builder
        </h1>
        <p style={{
          margin: '6px 0 0', fontSize: 13, color: '#555577',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          Design your custom robot
        </p>
      </div>

      {/* ── Identity Card ─────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 16 }}>Identity</div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 12, color: '#8888aa', marginBottom: 8, letterSpacing: '0.06em' }}>
            Robot Name
          </label>
          <div style={{ position: 'relative' }}>
            <input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 24))}
              placeholder="Enter robot name…"
              maxLength={24}
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${name.trim() ? tierColor + '60' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 8,
                padding: '10px 14px', paddingRight: 60,
                color: '#f0f0ff', fontSize: 15, fontFamily: 'inherit',
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = tierColor + '90'}
              onBlur={e => e.target.style.borderColor = name.trim() ? tierColor + '60' : 'rgba(255,255,255,0.1)'}
            />
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 11, color: '#444466', fontFamily: 'JetBrains Mono, monospace',
              pointerEvents: 'none',
            }}>
              {name.length} / 24
            </span>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8888aa', marginBottom: 10, letterSpacing: '0.06em' }}>
            Tier
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {TIER_ORDER.map(tier => {
              const active = tier === selectedTier
              const tc     = TIER_COLORS[tier]
              return (
                <button
                  key={tier}
                  onClick={() => handleTierChange(tier)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8, fontSize: 13, fontWeight: 700,
                    fontFamily: 'JetBrains Mono, monospace', cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    background: active ? tc : 'rgba(255,255,255,0.04)',
                    border: active ? `1px solid ${tc}` : '1px solid rgba(255,255,255,0.1)',
                    color: active ? '#111' : '#8888aa',
                  }}
                >
                  {TIER_SHORT[tier]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Robot Preview ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        marginBottom: 20,
      }}>
        <RobotScene
          robot={previewRobot}
          animationState="idle"
          side="left"
          width={200}
          height={260}
          interactive={true}
        />
        <div style={{
          fontSize: 11, color: '#444466',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.06em',
        }}>
          Rotate to inspect
        </div>
      </div>

      {/* ── Part Configuration Card ───────────────────────────────────────── */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 6 }}>Part Configuration</div>
        <p style={{ fontSize: 12, color: '#555577', marginBottom: 20, marginTop: 6 }}>
          Customize your robot's appearance. Parts are purely aesthetic.
        </p>

        {Object.entries(SLOT_LABELS).map(([slot, slotLabel]) => (
          <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{
              width: 52, flexShrink: 0,
              fontSize: 12, fontWeight: 600, color: '#f0f0ff',
              letterSpacing: '0.04em',
            }}>
              {slotLabel}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PARTS_LIBRARY[slot].map(part => {
                const isSelected = selectedParts[slot] === part.key
                return (
                  <button
                    key={part.key}
                    onClick={() => setSelectedParts(prev => ({ ...prev, [slot]: part.key }))}
                    title={part.description}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: isSelected ? `2px solid ${tierColor}` : '2px solid #333',
                      background: isSelected ? `${tierColor}18` : '#1a1a1a',
                      color: isSelected ? tierColor : '#888',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {part.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Stat Allocation Card ───────────────────────────────────────────── */}
      <div style={{ ...card, '--tc': tierColor }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <span style={sectionTitle}>Stat Allocation</span>
          <button
            onClick={() => setShowStatGuide(true)}
            title="What do stats do?"
            style={{
              background: 'none', border: 'none',
              color: '#555577', cursor: 'pointer',
              fontSize: 14, padding: 0, lineHeight: 1,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#555577'}
          >
            ⓘ
          </button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#8888aa' }}>Points remaining</span>
            <span style={{
              fontSize: 13, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace',
              color: remainingPoints === 0 ? '#f97316' : remainingPoints < 0 ? '#ef4444' : '#f0f0ff',
            }}>
              {remainingPoints} / {freeBudget}
            </span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${budgetPct}%`,
              background: remainingPoints < 0 ? '#ef4444' : tierColor,
              borderRadius: 3, transition: 'width 0.15s ease, background 0.15s ease',
            }} />
          </div>
          {remainingPoints === 0 && (
            <p style={{
              fontSize: 11, color: '#f97316', opacity: 0.8,
              margin: '6px 0 0', fontFamily: 'JetBrains Mono, monospace',
            }}>
              Budget full — decrease a stat to reallocate
            </p>
          )}
        </div>

        {STAT_KEYS.map(statKey => (
          <StatRow
            key={statKey}
            statKey={statKey}
            value={stats[statKey]}
            floor={STAT_FLOORS[statKey]}
            ceiling={ceilings[statKey]}
            tierColor={tierColor}
            remainingPoints={remainingPoints}
            onChange={handleStatChange}
          />
        ))}
      </div>

      {/* ── Passive Selection Card ─────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ ...sectionTitle, marginBottom: 6 }}>Passive Ability</div>
        <p style={{ fontSize: 12, color: '#555577', marginBottom: 18, marginTop: 6 }}>
          Select one passive. Higher tier robots unlock more options.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
          gap: 10,
        }}>
          {availablePassives.map(passive => (
            <PassiveCard
              key={passive.key}
              passive={passive}
              selected={selectedPassive === passive.key}
              tierColor={tierColor}
              onClick={() => setSelectedPassive(prev => prev === passive.key ? null : passive.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Save Section ──────────────────────────────────────────────────── */}
      <div>
        {errorMessage && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 8, padding: '12px 16px',
            color: '#fca5a5', fontSize: 13, marginBottom: 14, lineHeight: 1.5,
          }}>
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div style={{
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: 8, padding: '12px 16px',
            color: '#86efac', fontSize: 13, marginBottom: 14,
          }}>
            {successMessage}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          style={{
            width: '100%', padding: '14px 0',
            borderRadius: 10, border: 'none',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.1em',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            background: canSubmit ? tierColor : 'rgba(255,255,255,0.06)',
            color: canSubmit ? '#111' : '#444466',
            opacity: canSubmit ? 1 : 0.6,
            boxShadow: canSubmit ? `0 4px 20px ${tierColor}50` : 'none',
          }}
        >
          {isSubmitting ? 'CREATING...' : 'CREATE ROBOT'}
        </button>
      </div>
    </div>
  )
}
