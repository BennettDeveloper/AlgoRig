import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { startBattle } from '../api/battles'
import RobotCard from '../components/robots/RobotCard'

const tierColors = {
  1: '#6b7280',
  2: '#22c55e',
  3: '#3b82f6',
  4: '#a855f7',
  5: '#f97316',
}

function getSpecialization(robot) {
  if (!robot) return null
  const stats = {
    ATTACKER: robot.coreImpact,
    DEFENDER: robot.chassisArmor,
    SPEEDSTER: robot.clockSpeed,
    HACKER: robot.exploitPower,
    HEALER: robot.recovery,
  }
  return Object.entries(stats).sort((a, b) => b[1] - a[1])[0][0]
}

function StepIndicator({ current }) {
  const labels = ['PICK ROBOTS', 'ASSIGN SCRIPTS', 'CONFIRM & LAUNCH']
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 40 }}>
      {labels.map((label, i) => {
        const num = i + 1
        const done = current > num
        const active = current === num
        return (
          <Fragment key={label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: done ? '#f97316' : active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.05)',
                border: `2px solid ${active || done ? '#f97316' : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? '#fff' : active ? '#f97316' : '#444466',
                fontSize: done ? 14 : 13, fontWeight: 700,
                transition: 'all 0.2s ease',
              }}>
                {done ? '✓' : num}
              </div>
              <span style={{
                fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                letterSpacing: '0.08em', textAlign: 'center',
                color: active ? '#f97316' : done ? '#666688' : '#333355',
                transition: 'color 0.2s ease', whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div style={{
                flex: 1, height: 2, marginTop: 15,
                background: done ? '#f97316' : 'rgba(255,255,255,0.06)',
                transition: 'background 0.3s ease',
              }} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function ScriptColumn({ robot, scripts, selectedScript, onScriptChange, dimmed }) {
  const tierColor = tierColors[robot?.tier] || '#6b7280'
  const spec = getSpecialization(robot)
  const lines = (selectedScript?.content || '').split('\n')
  const preview = lines.slice(0, 8).join('\n') + (lines.length > 8 ? '\n...' : '')

  return (
    <div style={{ opacity: dimmed ? 0.4 : 1, transition: 'opacity 0.2s ease', pointerEvents: dimmed ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20 }}>🤖</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>{robot?.name}</span>
        {robot && (
          <span style={{
            background: `${tierColor}20`, border: `1px solid ${tierColor}50`,
            borderRadius: 4, padding: '2px 7px', color: tierColor,
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, letterSpacing: '0.08em',
          }}>
            TIER {robot.tier}
          </span>
        )}
        {spec && (
          <span style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 4, padding: '2px 7px', color: '#8888aa',
            fontSize: 10, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.06em',
          }}>
            {spec}
          </span>
        )}
      </div>

      <select
        value={selectedScript?.id ?? ''}
        onChange={e => {
          const found = scripts.find(s => s.id === Number(e.target.value))
          onScriptChange(found || null)
        }}
        style={{
          width: '100%',
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 8, padding: '10px 14px',
          color: selectedScript ? '#f0f0ff' : '#555577',
          fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', marginBottom: 12,
        }}
      >
        <option value="" disabled style={{ background: '#0f0f1a' }}>-- Select a script --</option>
        {scripts.map(s => (
          <option key={s.id} value={s.id} style={{ background: '#0f0f1a' }}>{s.name}</option>
        ))}
      </select>

      {selectedScript ? (
        <pre style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8, padding: '12px 14px',
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
          color: '#8888aa', lineHeight: 1.6, overflow: 'hidden',
          maxHeight: 140, whiteSpace: 'pre-wrap', margin: 0,
        }}>
          {preview}
        </pre>
      ) : (
        <div style={{
          height: 80, borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#333355', fontSize: 12, fontFamily: 'JetBrains Mono, monospace',
        }}>
          No script selected
        </div>
      )}

      <a
        href="/scripts/new"
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-block', marginTop: 10,
          fontSize: 12, color: '#f97316', textDecoration: 'none',
          fontFamily: 'JetBrains Mono, monospace',
        }}
        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
      >
        + Create New Script
      </a>
    </div>
  )
}

export default function BattleLauncher() {
  const navigate = useNavigate()

  const [robots, setRobots] = useState([])
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [launching, setLaunching] = useState(false)
  const [error, setError] = useState(null)

  const [robotA, setRobotA] = useState(null)
  const [robotB, setRobotB] = useState(null)
  const [scriptA, setScriptA] = useState(null)
  const [scriptB, setScriptB] = useState(null)
  const [sameScript, setSameScript] = useState(true)
  const [tierCap, setTierCap] = useState(5)

  const [step, setStep] = useState(1)
  const [pickingSlot, setPickingSlot] = useState(null)
  const [robotSearch, setRobotSearch] = useState('')

  useEffect(() => {
    Promise.all([
      client.get('/robots'),
      client.get('/scripts'),
    ]).then(([robotsRes, scriptsRes]) => {
      setRobots(robotsRes.data)
      setScripts(scriptsRes.data)
    }).finally(() => setLoading(false))
  }, [])

  const pickerRobots = robots
    .filter(r => r.tier <= tierCap)
    .filter(r => !robotSearch || r.name.toLowerCase().includes(robotSearch.toLowerCase()))

  function openPicker(slot) {
    setPickingSlot(slot)
    setRobotSearch('')
  }

  function closePicker() {
    setPickingSlot(null)
    setRobotSearch('')
  }

  function selectRobot(robot) {
    if (pickingSlot === 'A') setRobotA(robot)
    else if (pickingSlot === 'B') setRobotB(robot)
    closePicker()
  }

  async function handleLaunch() {
    setLaunching(true)
    setError(null)
    try {
      const payload = {
        robotAId: robotA.id,
        robotBId: robotB.id,
        scriptAId: scriptA.id,
        scriptBId: sameScript ? scriptA.id : scriptB.id,
        tierCap,
      }
      const res = await startBattle(payload)
      navigate(`/battles/${res.data.id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Battle failed to launch. Check your scripts and try again.')
    } finally {
      setLaunching(false)
    }
  }

  const canProceedStep1 = Boolean(robotA && robotB)
  const canProceedStep2 = Boolean(scriptA && (sameScript || scriptB))

  const backBtnStyle = {
    padding: '10px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#8888aa', cursor: 'pointer', transition: 'all 0.15s',
  }

  function nextBtnStyle(disabled) {
    return {
      padding: '10px 24px', borderRadius: 8, fontSize: 13, fontWeight: 600,
      fontFamily: 'inherit', letterSpacing: '0.05em',
      background: disabled ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg, #f97316, #ea580c)',
      border: disabled ? '1px solid rgba(255,255,255,0.08)' : 'none',
      color: disabled ? '#444466' : '#fff', cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 20px rgba(249,115,22,0.3)',
      transition: 'all 0.15s',
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 920, margin: '0 auto' }}>
        <div style={{ height: 72, background: 'rgba(255,255,255,0.02)', borderRadius: 12, marginBottom: 40, animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ height: 240, background: 'rgba(255,255,255,0.02)', borderRadius: 14, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      </div>
    )
  }

  // Robot slot panel (called as a function, not a component, to avoid remount)
  function renderSlotPanel(slot) {
    const robot = slot === 'A' ? robotA : robotB
    const accentColor = slot === 'A' ? '#f97316' : '#a855f7'

    if (robot) {
      const color = tierColors[robot.tier] || '#6b7280'
      return (
        <div>
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -2, borderRadius: 16,
              border: `2px solid ${color}`,
              boxShadow: `0 0 20px ${color}40`,
              pointerEvents: 'none', zIndex: 1,
            }} />
            <RobotCard robot={robot} onClick={() => {}} />
          </div>
          <button
            onClick={() => openPicker(slot)}
            style={{
              width: '100%', marginTop: 10, padding: '9px 16px', borderRadius: 8, fontSize: 13,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#777799', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#777799'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            Change Robot
          </button>
        </div>
      )
    }

    return (
      <div
        onClick={() => openPicker(slot)}
        style={{
          height: 220, borderRadius: 14, cursor: 'pointer',
          border: '2px dashed rgba(255,255,255,0.1)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 10, background: 'rgba(255,255,255,0.01)', color: '#444466',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = `${accentColor}50`
          e.currentTarget.style.color = accentColor
          e.currentTarget.style.background = `${accentColor}05`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = '#444466'
          e.currentTarget.style.background = 'rgba(255,255,255,0.01)'
        }}
      >
        <div style={{ fontSize: 36 }}>🤖</div>
        <div style={{ fontSize: 14, fontFamily: 'JetBrains Mono, monospace' }}>
          Click to select Robot {slot}
        </div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>Tap to browse robots</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 920, margin: '0 auto' }}>
      <StepIndicator current={step} />

      {/* ── STEP 1: PICK ROBOTS ────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700,
            color: '#f97316', letterSpacing: '0.1em', marginBottom: 24,
            textShadow: '0 0 24px rgba(249,115,22,0.3)',
          }}>
            SELECT YOUR COMBATANTS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#f97316', marginBottom: 12 }}>
                ROBOT A
              </div>
              {renderSlotPanel('A')}
            </div>
            <div>
              <div style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.15em', color: '#a855f7', marginBottom: 12 }}>
                ROBOT B
              </div>
              {renderSlotPanel('B')}
            </div>
          </div>

          {/* Tier cap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', color: '#555577' }}>
              TIER CAP
            </span>
            {[1, 2, 3, 4, 5].map(t => {
              const active = tierCap === t
              const tc = tierColors[t]
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTierCap(t)
                    if (robotA?.tier > t) setRobotA(null)
                    if (robotB?.tier > t) setRobotB(null)
                  }}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: active ? `${tc}20` : 'rgba(255,255,255,0.03)',
                    border: `2px solid ${active ? tc : 'rgba(255,255,255,0.08)'}`,
                    color: active ? tc : '#555577',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              )
            })}
          </div>

          {/* Robot picker panel */}
          {pickingSlot && (
            <div style={{
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 14, padding: 20, marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{
                  fontSize: 11, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em',
                  color: pickingSlot === 'A' ? '#f97316' : '#a855f7', flexShrink: 0,
                }}>
                  SELECTING ROBOT {pickingSlot}
                </span>
                <input
                  autoFocus
                  placeholder="Search by name..."
                  value={robotSearch}
                  onChange={e => setRobotSearch(e.target.value)}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8, padding: '8px 14px', color: '#f0f0ff',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                />
                <button
                  onClick={closePicker}
                  style={{
                    padding: '8px 14px', borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#8888aa', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Cancel
                </button>
              </div>

              {pickerRobots.length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '32px 0',
                  color: '#333355', fontFamily: 'JetBrains Mono, monospace', fontSize: 13,
                }}>
                  No robots match your search.
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 16, maxHeight: 480, overflowY: 'auto',
                }}>
                  {pickerRobots.map(robot => {
                    const isOther = (pickingSlot === 'A' ? robotB : robotA)?.id === robot.id
                    return (
                      <div key={robot.id} style={{ opacity: isOther ? 0.25 : 1, pointerEvents: isOther ? 'none' : 'auto' }}>
                        <RobotCard robot={robot} onClick={() => selectRobot(robot)} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setStep(2); closePicker() }}
              disabled={!canProceedStep1}
              style={nextBtnStyle(!canProceedStep1)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: ASSIGN SCRIPTS ─────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700,
            color: '#f97316', letterSpacing: '0.1em', marginBottom: 24,
            textShadow: '0 0 24px rgba(249,115,22,0.3)',
          }}>
            ASSIGN BATTLE SCRIPTS
          </div>

          {scripts.length === 0 ? (
            <div style={{
              background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.2)',
              borderRadius: 12, padding: '28px 32px', marginBottom: 24,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center',
            }}>
              <div style={{ fontSize: 28 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#f0f0ff' }}>No scripts saved yet.</div>
              <div style={{ fontSize: 13, color: '#777799', maxWidth: 360 }}>
                Create a script in the Script Editor before launching a battle.
              </div>
              <a
                href="/scripts/new"
                target="_blank"
                rel="noreferrer"
                style={{
                  marginTop: 4, padding: '9px 20px', borderRadius: 8,
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  letterSpacing: '0.05em',
                }}
              >
                Open Script Editor
              </a>
            </div>
          ) : (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24,
                padding: '10px 14px',
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 8, width: 'fit-content',
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sameScript}
                    onChange={e => setSameScript(e.target.checked)}
                    style={{ width: 14, height: 14, accentColor: '#f97316', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 13, color: '#9090bb' }}>Same script as Robot A</span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
                <ScriptColumn
                  robot={robotA}
                  scripts={scripts}
                  selectedScript={scriptA}
                  onScriptChange={setScriptA}
                  dimmed={false}
                />
                <ScriptColumn
                  robot={robotB}
                  scripts={scripts}
                  selectedScript={sameScript ? scriptA : scriptB}
                  onScriptChange={sameScript ? () => {} : setScriptB}
                  dimmed={sameScript}
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32 }}>
            <button
              onClick={() => setStep(1)}
              style={backBtnStyle}
              onMouseEnter={e => { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              style={nextBtnStyle(!canProceedStep2)}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: CONFIRM & LAUNCH ───────────────────────────────────── */}
      {step === 3 && (
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700,
            color: '#f97316', letterSpacing: '0.1em', marginBottom: 28,
            textShadow: '0 0 24px rgba(249,115,22,0.3)',
          }}>
            READY TO BATTLE
          </div>

          {/* Summary card */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(249,115,22,0.05), rgba(168,85,247,0.05))',
            border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 20, padding: 40, marginBottom: 28, textAlign: 'center',
          }}>
            {/* VS row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 24, marginBottom: 28 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 10, filter: `drop-shadow(0 0 14px ${tierColors[robotA?.tier] || '#f97316'}80)` }}>🤖</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>{robotA?.name}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${tierColors[robotA?.tier] || '#6b7280'}20`,
                    border: `1px solid ${tierColors[robotA?.tier] || '#6b7280'}50`,
                    borderRadius: 4, padding: '2px 8px',
                    color: tierColors[robotA?.tier] || '#6b7280',
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                  }}>
                    TIER {robotA?.tier}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 8px',
                    color: '#8888aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {getSpecialization(robotA)}
                  </span>
                </div>
              </div>

              <div style={{
                fontSize: 36, fontWeight: 900, letterSpacing: '0.05em',
                background: 'linear-gradient(135deg, #f97316, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                VS
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 44, marginBottom: 10, filter: `drop-shadow(0 0 14px ${tierColors[robotB?.tier] || '#a855f7'}80)` }}>🤖</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>{robotB?.name}</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <span style={{
                    background: `${tierColors[robotB?.tier] || '#6b7280'}20`,
                    border: `1px solid ${tierColors[robotB?.tier] || '#6b7280'}50`,
                    borderRadius: 4, padding: '2px 8px',
                    color: tierColors[robotB?.tier] || '#6b7280',
                    fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                  }}>
                    TIER {robotB?.tier}
                  </span>
                  <span style={{
                    background: 'rgba(255,255,255,0.05)', borderRadius: 4, padding: '2px 8px',
                    color: '#8888aa', fontSize: 11, fontFamily: 'JetBrains Mono, monospace',
                  }}>
                    {getSpecialization(robotB)}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', marginBottom: 24 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, textAlign: 'left', marginBottom: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: '#444466', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 4 }}>
                  SCRIPT A
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#f0f0ff' }}>{scriptA?.name || '—'}</div>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 10, color: '#444466', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em', marginBottom: 4 }}>
                  SCRIPT B
                </div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: sameScript ? '#555577' : '#f0f0ff',
                  fontStyle: sameScript ? 'italic' : 'normal',
                }}>
                  {sameScript ? `Same as A — ${scriptA?.name}` : (scriptB?.name || '—')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#555577', marginRight: 6 }}>Tier Cap</span>
                <span style={{ color: tierColors[tierCap], fontWeight: 700 }}>{tierCap}</span>
              </div>
              <div style={{ fontSize: 13 }}>
                <span style={{ color: '#555577', marginRight: 6 }}>Max Turns</span>
                <span style={{ color: '#f0f0ff', fontWeight: 700 }}>200</span>
              </div>
            </div>
          </div>

          {/* Launch button */}
          <button
            onClick={handleLaunch}
            disabled={launching}
            className="animate-pulse-orange"
            style={{
              width: '100%', padding: 18, fontSize: 18, fontWeight: 800,
              letterSpacing: '0.15em', fontFamily: 'inherit',
              background: launching ? 'rgba(249,115,22,0.4)' : 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', borderRadius: 12, color: '#fff',
              cursor: launching ? 'not-allowed' : 'pointer',
              boxShadow: '0 0 40px rgba(249,115,22,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
              transition: 'background 0.2s ease',
              marginBottom: 16,
            }}
          >
            {launching ? (
              <>
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
                  animation: 'spin 0.8s linear infinite', flexShrink: 0,
                }} />
                SIMULATING BATTLE...
              </>
            ) : (
              '⚔️  LAUNCH BATTLE'
            )}
          </button>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '14px 18px', marginBottom: 16,
              color: '#fca5a5', fontSize: 13, lineHeight: 1.5,
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={() => { setStep(2); setError(null) }}
            disabled={launching}
            style={{ ...backBtnStyle, opacity: launching ? 0.5 : 1 }}
            onMouseEnter={e => { if (!launching) { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' } }}
            onMouseLeave={e => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
          >
            ← Back
          </button>
        </div>
      )}
    </div>
  )
}
