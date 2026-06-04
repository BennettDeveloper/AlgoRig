import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
import { createScript, updateScript as apiUpdateScript, getScriptDetail } from '../api/scripts'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import Modal from '../components/ui/Modal'
import RobotMultiSelectPicker from '../components/robots/RobotMultiSelectPicker'
import BlockPalette from '../components/editor/BlockPalette'
import { TooltipProvider } from '../components/editor/TooltipContext'
import BlockCanvas from '../components/editor/BlockCanvas'
import TextEditor from '../components/editor/TextEditor'
import ValidationPanel from '../components/editor/ValidationPanel'
import { blocksToScript, scriptToBlocks } from '../utils/scriptConverter'

const ModeButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    style={{
      padding: '7px 16px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 500,
      cursor: 'pointer',
      fontFamily: 'inherit',
      transition: 'all 0.15s',
      background: active ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.03)',
      border: active
        ? '1px solid rgba(249,115,22,0.3)'
        : '1px solid rgba(255,255,255,0.08)',
      color: active ? '#f97316' : '#8888aa',
    }}
  >
    {children}
  </button>
)

function branchKey(blockType, branch) {
  if (blockType === 'ifelse' || blockType === 'if') return branch === 'if' ? 'ifChildren' : 'elseChildren'
  return 'children'
}

function collectVarNames(blocks) {
  const vars = []
  for (const b of blocks) {
    if (b.type === 'set' && b.variableName && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(b.variableName)) {
      vars.push(b.variableName)
    }
    if (b.type === 'if' || b.type === 'ifelse') {
      vars.push(...collectVarNames(b.ifChildren || b.children || []))
      for (const chain of (b.elseIfChains || [])) vars.push(...collectVarNames(chain.children || []))
      vars.push(...collectVarNames(b.elseChildren || []))
    }
    if (b.type === 'repeat') {
      vars.push(...collectVarNames(b.children || []))
    }
  }
  return vars
}

function removeChildFromBranch(b, branch, childId) {
  if (branch?.startsWith('elseif-')) {
    const chainIdx = parseInt(branch.split('-')[1], 10)
    const chains = [...(b.elseIfChains || [])]
    chains[chainIdx] = { ...chains[chainIdx], children: (chains[chainIdx].children || []).filter(c => c.id !== childId) }
    return { ...b, elseIfChains: chains }
  }
  const key = branchKey(b.type, branch)
  return { ...b, [key]: (b[key] || []).filter(c => c.id !== childId) }
}

function addChildToBranch(b, branch, child) {
  if (branch?.startsWith('elseif-')) {
    const chainIdx = parseInt(branch.split('-')[1], 10)
    const chains = [...(b.elseIfChains || [])]
    chains[chainIdx] = { ...chains[chainIdx], children: [...(chains[chainIdx].children || []), child] }
    return { ...b, elseIfChains: chains }
  }
  const key = branchKey(b.type, branch)
  return { ...b, [key]: [...(b[key] || []), child] }
}

function SaveConfirmModal({ script, onKeepEditing, onBackToScripts }) {
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => navigate('/scripts'), 4000)
    return () => clearTimeout(timer)
  }, [navigate])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#0f0f1a',
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: 20, padding: 40, width: 420, textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(34,197,94,0.1)',
        animation: 'fadeInUp 0.3s ease',
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 28,
        }}>
          ✅
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#f0f0ff', marginBottom: 8 }}>
          Script Saved!
        </div>
        <div style={{ fontSize: 14, color: '#8888aa', marginBottom: 6 }}>
          <span style={{ color: '#f97316', fontWeight: 600 }}>"{script?.name}"</span>
          {' '}has been saved successfully.
        </div>
        <div style={{ fontSize: 12, color: '#444466', fontFamily: 'JetBrains Mono, monospace', marginBottom: 28 }}>
          Version {script?.version} · Redirecting in 4s...
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #22c55e, #16a34a)',
            borderRadius: 2,
            animation: 'shrink 4s linear forwards',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onKeepEditing}
            style={{
              flex: 1, padding: 11,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8, color: '#8888aa', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#f0f0ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#8888aa'}
          >
            Keep Editing
          </button>
          <button
            onClick={onBackToScripts}
            style={{
              flex: 1, padding: 11,
              background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))',
              border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, color: '#22c55e', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))'}
          >
            Back to Scripts →
          </button>
        </div>
      </div>
    </div>
  )
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

export default function ScriptEditor() {
  const { id: scriptId } = useParams()
  const navigate = useNavigate()

  const [scriptName, setScriptName] = useState('Untitled Script')
  const [mode, setMode] = useState('blocks')
  const [blocks, setBlocks] = useState([])
  const [textContent, setTextContent] = useState('')
  const [validationResult, setValidationResult] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [activeDragItem, setActiveDragItem] = useState(null)
  const [overGapIndex, setOverGapIndex] = useState(null)
  const [overBranch, setOverBranch] = useState(null)
  const [savedScript, setSavedScript] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveError, setSaveError] = useState('')

  const [requiredRobotIds, setRequiredRobotIds]                   = useState([])
  const [showRobotPicker, setShowRobotPicker]                     = useState(false)
  const [showStatsResetWarning, setShowStatsResetWarning]         = useState(false)
  const [pendingSavePayload, setPendingSavePayload]               = useState(null)
  const [originalContent, setOriginalContent]                     = useState('')
  const [originalRequiredRobotIds, setOriginalRequiredRobotIds]   = useState([])
  const [hasExistingBattles, setHasExistingBattles]               = useState(false)

  useEffect(() => {
    if (!scriptId) return
    client.get(`/scripts/${scriptId}`)
      .then(res => {
        const script = res.data
        setScriptName(script.name)
        setBlocks(scriptToBlocks(script.content || ''))
        setTextContent(script.content || '')
        setMode('blocks')
        setRequiredRobotIds(script.requiredRobotIds || [])
        setOriginalContent(script.content || '')
        setOriginalRequiredRobotIds(script.requiredRobotIds || [])
      })
      .catch(err => console.error('Failed to load script:', err))
  }, [scriptId])

  useEffect(() => {
    if (!scriptId) return
    getScriptDetail(scriptId)
      .then(detail => setHasExistingBattles((detail.stats?.totalBattles ?? 0) > 0))
      .catch(() => setHasExistingBattles(false))
  }, [scriptId])

  async function performSave(payload) {
    setIsSaving(true)
    setSaveError('')
    try {
      const saved = scriptId
        ? await apiUpdateScript(scriptId, payload)
        : await createScript(payload)
      setSavedScript(saved)
      setShowSaveModal(true)
      setOriginalContent(payload.content)
      setOriginalRequiredRobotIds(payload.requiredRobotIds || [])
    } catch (err) {
      if (err.response?.status === 403) {
        setSaveError("You don't have permission to edit this script.")
      } else {
        setSaveError('Failed to save script. Please try again.')
      }
      console.error('Failed to save:', err)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSave() {
    const payload = {
      name: scriptName,
      content: currentScriptContent,
      requiredRobotIds,
    }

    if (scriptId && hasExistingBattles) {
      const contentChanged = payload.content !== originalContent
      const requirementsChanged = !arraysEqual(
        [...requiredRobotIds].sort((a, b) => a - b),
        [...originalRequiredRobotIds].sort((a, b) => a - b)
      )
      if (contentChanged || requirementsChanged) {
        setPendingSavePayload(payload)
        setShowStatsResetWarning(true)
        return
      }
    }

    await performSave(payload)
  }

  const dropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
      styles: { active: { opacity: '0' } },
    }),
    duration: 0,
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const switchMode = (next) => {
    if (next === mode) return
    if (mode === 'blocks' && next === 'text') {
      setTextContent(blocksToScript(blocks))
    } else if (mode === 'text' && next === 'blocks') {
      setBlocks(scriptToBlocks(textContent))
    }
    setMode(next)
    setValidationResult(null)
  }

  const handleAddBlock = (template, insertIndex = null) => {
    const newBlock = {
      id: crypto.randomUUID(),
      ...template,
      ...(template.type === 'if' ? { condition: '', ifChildren: [] } : {}),
      ...(template.type === 'ifelse' ? { condition: '', ifChildren: [], elseIfChains: [], elseChildren: [] } : {}),
      ...(template.type === 'repeat' ? { count: 3, children: [] } : {}),
      ...(template.type === 'set'    ? { variableName: '', expression: '0' } : {}),
      ...(template.type === 'update' ? { variableName: '', operator: '+=', expression: '1' } : {}),
    }
    if (insertIndex !== null) {
      setBlocks(prev => {
        const updated = [...prev]
        updated.splice(insertIndex, 0, newBlock)
        return updated
      })
    } else {
      setBlocks(prev => [...prev, newBlock])
    }
  }

  const handleDeleteChild = (parentId, branch, childId) => {
    setBlocks(prev => prev.map(b => b.id !== parentId ? b : removeChildFromBranch(b, branch, childId)))
  }

  const handleUpdateChild = (parentId, branch, childId, patch) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== parentId) return b
      if (branch?.startsWith('elseif-')) {
        const chainIdx = parseInt(branch.split('-')[1], 10)
        const chains = [...(b.elseIfChains || [])]
        chains[chainIdx] = {
          ...chains[chainIdx],
          children: (chains[chainIdx].children || []).map(c => c.id === childId ? { ...c, ...patch } : c),
        }
        return { ...b, elseIfChains: chains }
      }
      const key = branchKey(b.type, branch)
      return { ...b, [key]: (b[key] || []).map(c => c.id === childId ? { ...c, ...patch } : c) }
    }))
  }

  const handleDragStart = (event) => {
    setActiveDragItem(event.active.data.current ?? null)
  }

  const handleDragOver = (event) => {
    const { over } = event
    if (!over) {
      setOverGapIndex(null)
      setOverBranch(null)
      return
    }
    const overData = over.data.current
    if (overData?.type === 'gap') {
      setOverGapIndex(overData.index)
      setOverBranch(null)
    } else if (overData?.type === 'branch') {
      setOverBranch({ blockId: overData.blockId, branch: overData.branch })
      setOverGapIndex(null)
    } else {
      setOverGapIndex(null)
      setOverBranch(null)
    }
  }

  const handleDragEnd = (event) => {
    setActiveDragItem(null)
    setOverGapIndex(null)
    setOverBranch(null)

    const { active, over } = event
    if (!over) return

    const activeData = active.data.current
    const overData = over.data.current
    const isFromPalette = active.id.toString().startsWith('palette-')
    const isFromBranch = activeData?.type === 'child-action'

    // ── DROP INTO A BRANCH ──────────────────────────────────────────────
    if (overData?.type === 'branch') {
      const { blockId, branch } = overData

      setBlocks(prev => {
        let updated = [...prev]

        let newChild
        if (isFromPalette) {
          if (activeData.type === 'set') {
            newChild = { id: crypto.randomUUID(), type: 'set', variableName: '', expression: '0' }
          } else if (activeData.type === 'update') {
            newChild = { id: crypto.randomUUID(), type: 'update', variableName: '', operator: '+=', expression: '1' }
          } else {
            newChild = { id: crypto.randomUUID(), type: 'action', action: activeData.action, color: activeData.color }
          }
        } else if (isFromBranch) {
          updated = updated.map(b => b.id !== activeData.parentId ? b : removeChildFromBranch(b, activeData.branch, activeData.block.id))
          newChild = { ...activeData.block, id: crypto.randomUUID() }
        } else {
          const sourceBlock = updated.find(b => b.id === active.id)
          if (!sourceBlock || !['action', 'set', 'update'].includes(sourceBlock.type)) return prev
          updated = updated.filter(b => b.id !== active.id)
          newChild = { ...sourceBlock, id: crypto.randomUUID() }
        }

        updated = updated.map(b => b.id !== blockId ? b : addChildToBranch(b, branch, newChild))
        return updated
      })
      return
    }

    // ── DROP INTO A GAP (top-level canvas) ──────────────────────────────
    if (overData?.type === 'gap') {
      const insertIndex = overData.index

      setBlocks(prev => {
        let updated = [...prev]

        if (isFromBranch) {
          updated = updated.map(b => b.id !== activeData.parentId ? b : removeChildFromBranch(b, activeData.branch, activeData.block.id))
          const newBlock = { ...activeData.block, id: crypto.randomUUID() }
          updated.splice(insertIndex, 0, newBlock)
          return updated
        }

        if (isFromPalette) {
          const template = activeData
          const newBlock = {
            id: crypto.randomUUID(),
            ...template,
            ...(template.type === 'if' ? { condition: '', ifChildren: [] } : {}),
            ...(template.type === 'ifelse' ? { condition: '', ifChildren: [], elseIfChains: [], elseChildren: [] } : {}),
            ...(template.type === 'repeat' ? { count: 3, children: [] } : {}),
            ...(template.type === 'set'    ? { variableName: '', expression: '0' } : {}),
            ...(template.type === 'update' ? { variableName: '', operator: '+=', expression: '1' } : {}),
          }
          updated.splice(insertIndex, 0, newBlock)
          return updated
        }

        // Canvas reorder
        const oldIndex = updated.findIndex(b => b.id === active.id)
        if (oldIndex === -1) return prev
        const [removed] = updated.splice(oldIndex, 1)
        const adjustedIndex = insertIndex > oldIndex ? insertIndex - 1 : insertIndex
        updated.splice(adjustedIndex, 0, removed)
        return updated
      })
      return
    }

    // ── FALLBACK: pointer landed on a block body ─────────────────────────
    if (isFromBranch) {
      setBlocks(prev => {
        const updated = prev.map(b => b.id !== activeData.parentId ? b : removeChildFromBranch(b, activeData.branch, activeData.block.id))
        return [...updated, { ...activeData.block, id: crypto.randomUUID() }]
      })
      return
    }

    if (isFromPalette) {
      handleAddBlock(activeData)
      return
    }

    if (active.id !== over.id) {
      setBlocks(prev => {
        const oldIndex = prev.findIndex(b => b.id === active.id)
        const newIndex = prev.findIndex(b => b.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return prev
        return arrayMove(prev, oldIndex, newIndex)
      })
    }
  }

  const userVars = [...new Set(collectVarNames(blocks))]

  const currentScriptContent = mode === 'blocks' ? blocksToScript(blocks) : textContent

  const overlayColor = activeDragItem?.color ?? activeDragItem?.block?.color ?? '#f97316'
  const overlayLabel = activeDragItem?.label ?? activeDragItem?.action ?? activeDragItem?.block?.action

  return (
    <TooltipProvider>
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#080810',
      color: '#f0f0ff',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '14px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <button
          onClick={() => navigate('/scripts')}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, color: '#8888aa',
            padding: '7px 14px', cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f0f0ff'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#8888aa'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          ← Scripts
        </button>
        <input
          value={scriptName}
          onChange={e => setScriptName(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            padding: '7px 14px',
            color: '#f0f0ff',
            fontSize: 15,
            fontWeight: 600,
            fontFamily: 'inherit',
            outline: 'none',
            width: 260,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.4)'}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <ModeButton active={mode === 'blocks'} onClick={() => switchMode('blocks')}>
            🧩 Block Editor
          </ModeButton>
          <ModeButton active={mode === 'text'} onClick={() => switchMode('text')}>
            {'</>'} Text Editor
          </ModeButton>
        </div>
      </div>

      {/* Robot requirements strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '8px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(0,0,0,0.15)',
        flexShrink: 0,
      }}>
        <span style={{
          fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.12em', color: '#555577',
        }}>
          ROBOT REQUIREMENTS
        </span>
        {requiredRobotIds.length === 0 ? (
          <span style={{ fontSize: 12, color: '#444466' }}>All robots allowed</span>
        ) : (
          <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>
            ⚙️ {requiredRobotIds.length} robot{requiredRobotIds.length !== 1 ? 's' : ''} required
          </span>
        )}
        <button
          onClick={() => setShowRobotPicker(true)}
          style={{
            padding: '4px 12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, color: '#8888aa',
            fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f0f0ff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#8888aa'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        >
          {requiredRobotIds.length === 0 ? '+ Set Requirements' : '✏️ Edit Requirements'}
        </button>
      </div>

      {saveError && (
        <div style={{
          padding: '10px 24px',
          background: 'rgba(255,107,107,0.08)',
          borderBottom: '1px solid rgba(255,107,107,0.2)',
          color: '#ff6b6b',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          {saveError}
          <button
            onClick={() => setSaveError('')}
            style={{ background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: 16, padding: '0 4px' }}
          >
            ×
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {mode === 'blocks' && (
            <BlockPalette onAddBlock={handleAddBlock} userVars={userVars} />
          )}

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {mode === 'blocks' ? (
              <BlockCanvas
                blocks={blocks}
                onChange={setBlocks}
                overGapIndex={overGapIndex}
                overBranch={overBranch}
                onDeleteChild={handleDeleteChild}
                onUpdateChild={handleUpdateChild}
                userVars={userVars}
              />
            ) : (
              <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column' }}>
                <TextEditor value={textContent} onChange={setTextContent} />
              </div>
            )}
          </div>

          <ValidationPanel
            scriptContent={currentScriptContent}
            validationResult={validationResult}
            setValidationResult={setValidationResult}
            isValidating={isValidating}
            setIsValidating={setIsValidating}
            isSaving={isSaving}
            onSave={handleSave}
          />
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeDragItem && (
            <div style={{
              padding: '10px 16px',
              background: '#1a1a2e',
              border: `1px solid ${overlayColor}`,
              borderRadius: 10,
              color: overlayColor,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              opacity: 0.95,
              pointerEvents: 'none',
            }}>
              {overlayLabel}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {showSaveModal && savedScript && (
        <SaveConfirmModal
          script={savedScript}
          onKeepEditing={() => setShowSaveModal(false)}
          onBackToScripts={() => navigate('/scripts')}
        />
      )}

      <Modal
        isOpen={showStatsResetWarning}
        onClose={() => { setShowStatsResetWarning(false); setPendingSavePayload(null) }}
        title="⚠️ Save Will Reset Battle Stats"
        width="480px"
      >
        <p style={{ color: '#ccc', marginBottom: 16, fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>
          You've changed this script's content or robot requirements. Saving will reset its difficulty rating and battle statistics.
        </p>
        <p style={{ color: '#8888aa', fontSize: 13, marginBottom: 24, lineHeight: 1.5, margin: '0 0 24px' }}>
          Your battle history will be preserved but won't count toward the new difficulty rating.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={() => { setShowStatsResetWarning(false); setPendingSavePayload(null) }}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8888aa', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              setShowStatsResetWarning(false)
              await performSave(pendingSavePayload)
              setPendingSavePayload(null)
            }}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
            }}
          >
            Save & Reset Stats
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={showRobotPicker}
        onClose={() => setShowRobotPicker(false)}
        title="Set Robot Requirements"
        width="860px"
      >
        <p style={{ color: '#8888aa', marginBottom: 16, fontSize: 13, lineHeight: 1.5, margin: '0 0 16px' }}>
          Select which robots can be used when challenging this script. Leave empty to allow all robots.
        </p>
        <RobotMultiSelectPicker
          selectedRobotIds={requiredRobotIds}
          onChange={setRequiredRobotIds}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20, gap: 12 }}>
          <button
            onClick={() => setRequiredRobotIds([])}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#8888aa', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Clear All
          </button>
          <button
            onClick={() => setShowRobotPicker(false)}
            style={{
              padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(249,115,22,0.3)',
            }}
          >
            Done
          </button>
        </div>
      </Modal>
    </div>
    </TooltipProvider>
  )
}
