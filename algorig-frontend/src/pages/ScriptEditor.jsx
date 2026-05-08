import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import client from '../api/client'
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

// Resolve the correct array key for a block's branch given block.type
function branchKey(blockType, branch) {
  if (blockType === 'ifelse') return branch === 'if' ? 'ifChildren' : 'elseChildren'
  return 'children'
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

  useEffect(() => {
    if (!scriptId) return
    client.get(`/scripts/${scriptId}`)
      .then(res => {
        const script = res.data
        setScriptName(script.name)
        setBlocks(scriptToBlocks(script.content || ''))
        setTextContent(script.content || '')
        setMode('blocks')
      })
      .catch(err => console.error('Failed to load script:', err))
  }, [scriptId])

  async function handleSave() {
    setIsSaving(true)
    try {
      const payload = { name: scriptName, content: currentScriptContent }
      const res = scriptId
        ? await client.put(`/scripts/${scriptId}`, payload)
        : await client.post('/scripts', payload)
      setSavedScript(res.data)
      setShowSaveModal(true)
    } catch (err) {
      console.error('Failed to save:', err)
    } finally {
      setIsSaving(false)
    }
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
      ...(template.type === 'if' ? { condition: '', children: [] } : {}),
      ...(template.type === 'ifelse' ? { condition: '', ifChildren: [], elseChildren: [] } : {}),
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
    setBlocks(prev => prev.map(b => {
      if (b.id !== parentId) return b
      const key = branchKey(b.type, branch)
      return { ...b, [key]: (b[key] || []).filter(c => c.id !== childId) }
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
          newChild = {
            id: crypto.randomUUID(),
            type: 'action',
            action: activeData.action,
            color: activeData.color,
          }
        } else if (isFromBranch) {
          // Remove from old branch
          updated = updated.map(b => {
            if (b.id !== activeData.parentId) return b
            const key = branchKey(b.type, activeData.branch)
            return { ...b, [key]: (b[key] || []).filter(c => c.id !== activeData.block.id) }
          })
          newChild = { ...activeData.block, id: crypto.randomUUID() }
        } else {
          // Top-level action block dragged into a branch — only move action blocks
          const sourceBlock = updated.find(b => b.id === active.id)
          if (!sourceBlock || sourceBlock.type !== 'action') return prev
          updated = updated.filter(b => b.id !== active.id)
          newChild = { ...sourceBlock, id: crypto.randomUUID() }
        }

        // Insert into target branch
        updated = updated.map(b => {
          if (b.id !== blockId) return b
          const key = branchKey(b.type, branch)
          return { ...b, [key]: [...(b[key] || []), newChild] }
        })

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
          // Remove from old branch first
          updated = updated.map(b => {
            if (b.id !== activeData.parentId) return b
            const key = branchKey(b.type, activeData.branch)
            return { ...b, [key]: (b[key] || []).filter(c => c.id !== activeData.block.id) }
          })
          const newBlock = { ...activeData.block, id: crypto.randomUUID() }
          updated.splice(insertIndex, 0, newBlock)
          return updated
        }

        if (isFromPalette) {
          const template = activeData
          const newBlock = {
            id: crypto.randomUUID(),
            ...template,
            ...(template.type === 'if' ? { condition: '', children: [] } : {}),
            ...(template.type === 'ifelse' ? { condition: '', ifChildren: [], elseChildren: [] } : {}),
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
      // Drag out of branch to end of canvas
      setBlocks(prev => {
        const updated = prev.map(b => {
          if (b.id !== activeData.parentId) return b
          const key = branchKey(b.type, activeData.branch)
          return { ...b, [key]: (b[key] || []).filter(c => c.id !== activeData.block.id) }
        })
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

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {mode === 'blocks' && (
            <BlockPalette onAddBlock={handleAddBlock} />
          )}

          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {mode === 'blocks' ? (
              <BlockCanvas
                blocks={blocks}
                onChange={setBlocks}
                overGapIndex={overGapIndex}
                overBranch={overBranch}
                onDeleteChild={handleDeleteChild}
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
    </div>
    </TooltipProvider>
  )
}
