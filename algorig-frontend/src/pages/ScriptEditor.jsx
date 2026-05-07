import { useState } from 'react'
import { useParams } from 'react-router-dom'
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

export default function ScriptEditor() {
  const { id: scriptId } = useParams()

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
            scriptName={scriptName}
            scriptId={scriptId}
            validationResult={validationResult}
            setValidationResult={setValidationResult}
            isValidating={isValidating}
            setIsValidating={setIsValidating}
            isSaving={isSaving}
            setIsSaving={setIsSaving}
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
    </div>
  )
}
