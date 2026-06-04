import { Fragment, useState, useEffect, useCallback } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import ConditionBuilder from './ConditionBuilder'
import SetBlockItem from './SetBlockItem'
import UpdateBlockItem from './UpdateBlockItem'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function hexToRgb(hex) {
  if (!hex || hex.length < 7) return '136, 136, 170'
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r}, ${g}, ${b}`
}

const ACTION_OPTIONS = [
  { action: 'HardStrike', label: 'Hard Strike', color: '#f97316' },
  { action: 'HeavyAttack', label: 'Heavy Attack', color: '#f97316' },
  { action: 'PowerSurge', label: 'Power Surge', color: '#a855f7' },
  { action: 'Patch', label: 'Patch', color: '#22c55e' },
  { action: 'Firewall', label: 'Firewall', color: '#3b82f6' },
  { action: 'ArmorPlate', label: 'Armor Plate', color: '#3b82f6' },
  { action: 'VirusUpload', label: 'Virus Upload', color: '#a855f7' },
  { action: 'SystemScan', label: 'System Scan', color: '#8888aa' },
  { action: 'CpuStall', label: 'CPU Stall', color: '#444466' },
]

function GapZone({ index, isOver: isOverProp }) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: `gap-${index}`,
    data: { type: 'gap', index },
  })

  const active = isOverProp || dndIsOver

  return (
    <div
      ref={setNodeRef}
      style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div style={{
        height: active ? 3 : 1,
        width: '100%',
        borderRadius: 2,
        background: active
          ? 'linear-gradient(90deg, transparent, #f97316, transparent)'
          : 'transparent',
        boxShadow: active ? '0 0 12px rgba(249,115,22,0.6)' : 'none',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}>
        {active && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#f97316',
            boxShadow: '0 0 8px rgba(249,115,22,0.8)',
          }} />
        )}
      </div>
    </div>
  )
}

function EmptyDropZone({ isOver }) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: 'gap-0',
    data: { type: 'gap', index: 0 },
  })

  const active = isOver || dndIsOver

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: 1,
        minHeight: 300,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: `1px dashed ${active ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 12,
        margin: '8px 4px',
        color: active ? '#f97316' : '#333355',
        fontSize: 14,
        gap: 8,
        background: active ? 'rgba(249,115,22,0.04)' : 'transparent',
        boxShadow: active ? '0 0 20px rgba(249,115,22,0.1)' : 'none',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontSize: 32, opacity: active ? 0.8 : 0.3 }}>⠿</div>
      <div>{active ? 'Release to add block' : 'Drag blocks here'}</div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        {active ? '' : 'or click from the palette'}
      </div>
    </div>
  )
}

function BranchDropZone({ blockId, branch, children, isOver: isOverProp }) {
  const { setNodeRef, isOver: dndIsOver } = useDroppable({
    id: `branch-${blockId}-${branch}`,
    data: { type: 'branch', blockId, branch },
  })

  const active = isOverProp || dndIsOver

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: 48,
        borderRadius: 8,
        border: `1px dashed ${active ? '#f97316' : 'rgba(255,255,255,0.08)'}`,
        background: active ? 'rgba(249,115,22,0.06)' : 'rgba(0,0,0,0.2)',
        padding: 8,
        transition: 'all 0.15s ease',
        boxShadow: active ? '0 0 16px rgba(249,115,22,0.1)' : 'none',
      }}
    >
      {children}
      {active && (
        <div style={{
          textAlign: 'center',
          color: '#f97316',
          fontSize: 12,
          padding: 6,
          fontFamily: 'JetBrains Mono, monospace',
          opacity: 0.8,
        }}>
          + Drop here
        </div>
      )}
    </div>
  )
}

function ChildBlock({ block, parentId, branch, onDelete, onUpdate, userVars, parentColor }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `child-${block.id}`,
    data: { type: 'child-action', block, parentId, branch },
  })

  const dragHandleProps = { ...attributes, ...listeners }

  if (block.type === 'set') {
    return (
      <div ref={setNodeRef} style={{ opacity: isDragging ? 0.3 : 1, marginBottom: 6, transition: 'opacity 0.15s' }}>
        <SetBlockItem
          block={block}
          onDelete={() => onDelete(parentId, branch, block.id)}
          onUpdate={(_id, patch) => onUpdate(parentId, branch, block.id, patch)}
          dragHandleProps={dragHandleProps}
          userVars={userVars}
          parentColor={parentColor}
        />
      </div>
    )
  }

  if (block.type === 'update') {
    return (
      <div ref={setNodeRef} style={{ opacity: isDragging ? 0.3 : 1, marginBottom: 6, transition: 'opacity 0.15s' }}>
        <UpdateBlockItem
          block={block}
          onDelete={() => onDelete(parentId, branch, block.id)}
          onUpdate={(_id, patch) => onUpdate(parentId, branch, block.id, patch)}
          dragHandleProps={dragHandleProps}
          userVars={userVars}
          parentColor={parentColor}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        marginBottom: 6,
        background: `rgba(${hexToRgb(block.color)}, 0.08)`,
        border: `1px solid rgba(${hexToRgb(block.color)}, 0.2)`,
        borderLeft: `3px solid ${block.color}`,
        borderRadius: 8,
        opacity: isDragging ? 0.3 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      <span
        style={{ color: '#444466', cursor: 'grab', fontSize: 14, userSelect: 'none' }}
        {...attributes}
        {...listeners}
      >
        ⠿
      </span>
      <span style={{
        flex: 1,
        color: block.color,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 13,
      }}>
        {block.action}
      </span>
      <button
        onClick={() => onDelete(parentId, branch, block.id)}
        style={{
          background: 'none', border: 'none', color: '#444466',
          cursor: 'pointer', fontSize: 14, padding: '0 4px', transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff4444'}
        onMouseLeave={e => e.currentTarget.style.color = '#444466'}
      >
        ×
      </button>
    </div>
  )
}

function InlineActionPicker({ onSelect }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handler = () => setOpen(false)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const sectionLabel = (text, color) => (
    <div style={{
      padding: '4px 12px 2px',
      fontSize: 9,
      fontFamily: 'JetBrains Mono, monospace',
      fontWeight: 700,
      letterSpacing: '0.12em',
      color,
      opacity: 0.7,
      textTransform: 'uppercase',
    }}>
      {text}
    </div>
  )

  const row = (label, color, onClick) => (
    <div
      onClick={onClick}
      style={{
        padding: '7px 12px',
        borderRadius: 6,
        color,
        fontSize: 12,
        cursor: 'pointer',
        fontFamily: 'JetBrains Mono, monospace',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {label}
    </div>
  )

  return (
    <div style={{ position: 'relative' }} onMouseDown={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.12)',
          borderRadius: 8,
          color: '#555577',
          fontSize: 13,
          cursor: 'pointer',
          textAlign: 'left',
          fontFamily: 'inherit',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.color = '#8888aa'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
          e.currentTarget.style.color = '#555577'
        }}
      >
        + Add block
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: '#0f0f1a',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 10,
          padding: '6px 0',
          marginTop: 4,
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          maxHeight: 280,
          overflowY: 'auto',
        }}>
          {sectionLabel('Actions', '#f97316')}
          {ACTION_OPTIONS.map(opt => (
            <Fragment key={opt.action}>
              {row(opt.label, opt.color, () => {
                onSelect({ id: crypto.randomUUID(), type: 'action', action: opt.action, color: opt.color })
                setOpen(false)
              })}
            </Fragment>
          ))}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 6px' }} />
          {sectionLabel('Memory', '#22d3ee')}
          {row('SET variable', '#22d3ee', () => {
            onSelect({ id: crypto.randomUUID(), type: 'set', variableName: '', expression: '0' })
            setOpen(false)
          })}
          {row('UPDATE variable', '#22d3ee', () => {
            onSelect({ id: crypto.randomUUID(), type: 'update', variableName: '', operator: '+=', expression: '1' })
            setOpen(false)
          })}
        </div>
      )}
    </div>
  )
}

function ActionBlockItem({ block, onDelete, dragHandleProps }) {
  const rgb = hexToRgb(block.color)

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: `rgba(${rgb}, 0.08)`,
      border: `1px solid rgba(${rgb}, 0.2)`,
      borderLeft: `4px solid ${block.color}`,
      borderRadius: 10,
      padding: '12px 16px',
    }}>
      <span
        style={{ cursor: 'grab', color: '#444466', fontSize: 18, padding: '0 8px', userSelect: 'none' }}
        {...dragHandleProps}
      >
        ⠿
      </span>
      <span style={{ color: '#555577', fontSize: 12, fontFamily: 'JetBrains Mono, monospace', marginRight: 2 }}>●</span>
      <span style={{ color: block.color, fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 500, flex: 1 }}>
        {block.action}
      </span>
      <button
        onClick={() => onDelete(block.id)}
        style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 4px', transition: 'color 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff4455'}
        onMouseLeave={e => e.currentTarget.style.color = '#444466'}
      >✕</button>
    </div>
  )
}

function RepeatBlockItem({ block, onDelete, onUpdate, dragHandleProps, overBranch, onDeleteChild, onUpdateChild, userVars }) {
  const amber = '#f59e0b'
  const amberRgb = '245,158,11'
  const children = block.children || []

  return (
    <div style={{
      background: `rgba(${amberRgb}, 0.06)`,
      border: `1px solid rgba(${amberRgb}, 0.2)`,
      borderLeft: `4px solid ${amber}`,
      borderRadius: 10,
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span
          style={{ cursor: 'grab', color: '#444466', fontSize: 18, padding: '0 8px', userSelect: 'none' }}
          {...dragHandleProps}
        >
          ⠿
        </span>
        <span style={{ color: amber, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700 }}>
          REPEAT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => onUpdate(block.id, { count: n })}
              style={{
                width: 26, height: 26,
                borderRadius: 6,
                border: `1px solid ${block.count === n ? 'rgba(245,158,11,0.5)' : 'rgba(255,255,255,0.08)'}`,
                background: block.count === n ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.03)',
                color: block.count === n ? amber : '#555577',
                fontSize: 12, fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
          <span style={{ color: `rgba(${amberRgb}, 0.5)`, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, marginLeft: 2 }}>
            ×
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onDelete(block.id)}
          style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 16, padding: '0 4px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff4455'}
          onMouseLeave={e => e.currentTarget.style.color = '#444466'}
        >✕</button>
      </div>

      <div style={{ marginLeft: 20, marginBottom: 8 }}>
        <BranchDropZone
          blockId={block.id}
          branch="if"
          isOver={overBranch?.blockId === block.id && overBranch?.branch === 'if'}
        >
          {children.map(child => (
            <ChildBlock
              key={child.id}
              block={child}
              parentId={block.id}
              branch="if"
              onDelete={onDeleteChild}
              onUpdate={onUpdateChild}
              userVars={userVars}
              parentColor={amber}
            />
          ))}
        </BranchDropZone>
        <div style={{ marginTop: 6 }}>
          <InlineActionPicker onSelect={newBlock => onUpdate(block.id, { children: [...children, newBlock] })} />
        </div>
      </div>

      <div style={{ marginTop: 10, color: `rgba(${amberRgb}, 0.4)`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        END REPEAT
      </div>
    </div>
  )
}

function IfBlockItem({ block, onDelete, onUpdate, dragHandleProps, overBranch, onDeleteChild, onUpdateChild, userVars }) {
  const isIfElse = block.type === 'ifelse'
  const amber = '#f59e0b'
  const amberRgb = '245,158,11'
  const elseIfChains = block.elseIfChains || []

  const addChild = (branch, newBlock) => {
    if (branch.startsWith('elseif-')) {
      const chainIdx = parseInt(branch.split('-')[1], 10)
      const chains = [...elseIfChains]
      chains[chainIdx] = { ...chains[chainIdx], children: [...(chains[chainIdx].children || []), newBlock] }
      onUpdate(block.id, { elseIfChains: chains })
    } else if (branch === 'if') {
      onUpdate(block.id, { ifChildren: [...(block.ifChildren || block.children || []), newBlock] })
    } else {
      onUpdate(block.id, { elseChildren: [...(block.elseChildren || []), newBlock] })
    }
  }

  const addElseIfChain = () => {
    const newChain = { id: crypto.randomUUID(), condition: '', children: [] }
    if (!isIfElse) {
      onUpdate(block.id, {
        type: 'ifelse',
        ifChildren: block.children || [],
        elseIfChains: [newChain],
        elseChildren: [],
      })
    } else {
      onUpdate(block.id, { elseIfChains: [...elseIfChains, newChain] })
    }
  }

  const deleteElseIfChain = (chainIdx) => {
    onUpdate(block.id, { elseIfChains: elseIfChains.filter((_, i) => i !== chainIdx) })
  }

  const updateChainCondition = (chainIdx, condition) => {
    const chains = [...elseIfChains]
    chains[chainIdx] = { ...chains[chainIdx], condition }
    onUpdate(block.id, { elseIfChains: chains })
  }

  const ifChildren = block.ifChildren || block.children || []
  const elseChildren = block.elseChildren || []

  return (
    <div style={{
      background: `rgba(${amberRgb}, 0.06)`,
      border: `1px solid rgba(${amberRgb}, 0.2)`,
      borderLeft: `4px solid ${amber}`,
      borderRadius: 10,
      padding: '12px 16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <span
          style={{ cursor: 'grab', color: '#444466', fontSize: 18, padding: '0 8px', userSelect: 'none' }}
          {...dragHandleProps}
        >
          ⠿
        </span>
        <span style={{ color: amber, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 700, marginRight: 6 }}>
          IF
        </span>
        <ConditionBuilder
          condition={block.condition || ''}
          onChange={condition => onUpdate(block.id, { condition })}
          userVars={userVars || []}
        />
        <div style={{ flex: 1 }} />
        <button
          onClick={addElseIfChain}
          title="Add ELSE IF chain"
          style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 6, color: '#f59e0b', cursor: 'pointer', fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
            padding: '4px 8px', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.08)' }}
        >
          + ELSE IF
        </button>
        <button
          onClick={() => onDelete(block.id)}
          style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 16, padding: '0 4px', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff4455'}
          onMouseLeave={e => e.currentTarget.style.color = '#444466'}
        >✕</button>
      </div>

      <div style={{ marginLeft: 20, marginBottom: 8 }}>
        <BranchDropZone
          blockId={block.id}
          branch="if"
          isOver={overBranch?.blockId === block.id && overBranch?.branch === 'if'}
        >
          {ifChildren.map(child => (
            <ChildBlock
              key={child.id}
              block={child}
              parentId={block.id}
              branch="if"
              onDelete={onDeleteChild}
              onUpdate={onUpdateChild}
              userVars={userVars}
              parentColor={amber}
            />
          ))}
        </BranchDropZone>
        <div style={{ marginTop: 6 }}>
          <InlineActionPicker onSelect={newBlock => addChild('if', newBlock)} />
        </div>
      </div>

      {elseIfChains.map((chain, chainIdx) => (
        <Fragment key={chain.id}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            margin: '10px 0', padding: '4px 8px 4px 12px',
            background: `rgba(${amberRgb}, 0.1)`, border: `1px solid rgba(${amberRgb}, 0.2)`,
            borderRadius: 6,
          }}>
            <span style={{ color: amber, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              ELSE IF
            </span>
            <ConditionBuilder
              condition={chain.condition || ''}
              onChange={condition => updateChainCondition(chainIdx, condition)}
              userVars={userVars || []}
            />
            <div style={{ flex: 1 }} />
            <button
              onClick={() => deleteElseIfChain(chainIdx)}
              style={{ background: 'none', border: 'none', color: '#444466', cursor: 'pointer', fontSize: 13, padding: '0 4px', transition: 'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff4455'}
              onMouseLeave={e => e.currentTarget.style.color = '#444466'}
            >✕</button>
          </div>
          <div style={{ marginLeft: 20, marginBottom: 8 }}>
            <BranchDropZone
              blockId={block.id}
              branch={`elseif-${chainIdx}`}
              isOver={overBranch?.blockId === block.id && overBranch?.branch === `elseif-${chainIdx}`}
            >
              {(chain.children || []).map(child => (
                <ChildBlock
                  key={child.id}
                  block={child}
                  parentId={block.id}
                  branch={`elseif-${chainIdx}`}
                  onDelete={onDeleteChild}
                  onUpdate={onUpdateChild}
                  userVars={userVars}
                  parentColor={amber}
                />
              ))}
            </BranchDropZone>
            <div style={{ marginTop: 6 }}>
              <InlineActionPicker onSelect={newBlock => addChild(`elseif-${chainIdx}`, newBlock)} />
            </div>
          </div>
        </Fragment>
      ))}

      {isIfElse && (
        <>
          <div style={{
            margin: '10px 0', padding: '4px 12px',
            background: `rgba(${amberRgb}, 0.1)`, border: `1px solid rgba(${amberRgb}, 0.2)`,
            borderRadius: 6, color: amber, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: 700,
          }}>
            ELSE
          </div>
          <div style={{ marginLeft: 20, marginBottom: 8 }}>
            <BranchDropZone
              blockId={block.id}
              branch="else"
              isOver={overBranch?.blockId === block.id && overBranch?.branch === 'else'}
            >
              {elseChildren.map(child => (
                <ChildBlock
                  key={child.id}
                  block={child}
                  parentId={block.id}
                  branch="else"
                  onDelete={onDeleteChild}
                  onUpdate={onUpdateChild}
                  userVars={userVars}
                  parentColor={amber}
                />
              ))}
            </BranchDropZone>
            <div style={{ marginTop: 6 }}>
              <InlineActionPicker onSelect={newBlock => addChild('else', newBlock)} />
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 10, color: `rgba(${amberRgb}, 0.4)`, fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
        END IF
      </div>
    </div>
  )
}

function SortableBlock({ block, onDelete, onUpdate, overBranch, onDeleteChild, onUpdateChild, userVars }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const dragHandleProps = { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style}>
      {block.type === 'action' ? (
        <ActionBlockItem block={block} onDelete={onDelete} dragHandleProps={dragHandleProps} />
      ) : block.type === 'set' ? (
        <SetBlockItem block={block} onDelete={onDelete} onUpdate={onUpdate} dragHandleProps={dragHandleProps} userVars={userVars} />
      ) : block.type === 'update' ? (
        <UpdateBlockItem block={block} onDelete={onDelete} onUpdate={onUpdate} dragHandleProps={dragHandleProps} userVars={userVars} />
      ) : block.type === 'repeat' ? (
        <RepeatBlockItem
          block={block}
          onDelete={onDelete}
          onUpdate={onUpdate}
          dragHandleProps={dragHandleProps}
          overBranch={overBranch}
          onDeleteChild={onDeleteChild}
          onUpdateChild={onUpdateChild}
          userVars={userVars}
        />
      ) : (
        <IfBlockItem
          block={block}
          onDelete={onDelete}
          onUpdate={onUpdate}
          dragHandleProps={dragHandleProps}
          overBranch={overBranch}
          onDeleteChild={onDeleteChild}
          onUpdateChild={onUpdateChild}
          userVars={userVars}
        />
      )}
    </div>
  )
}

export default function BlockCanvas({ blocks, onChange, overGapIndex, overBranch, onDeleteChild, onUpdateChild, userVars: userVarsProp }) {
  const handleDelete = (id) => onChange(blocks.filter(b => b.id !== id))
  const handleUpdate = (id, patch) => onChange(blocks.map(b => b.id === id ? { ...b, ...patch } : b))

  const computedVars = [...new Set(
    blocks
      .filter(b => b.type === 'set' && b.variableName && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(b.variableName))
      .map(b => b.variableName)
  )]
  const userVars = userVarsProp ?? computedVars

  if (blocks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16 }}>
        <EmptyDropZone isOver={overGapIndex === 0} />
      </div>
    )
  }

  return (
    <div style={{ background: 'rgba(0,0,0,0.2)', flex: 1, padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <GapZone index={0} isOver={overGapIndex === 0} />
          {blocks.map((block, i) => (
            <Fragment key={block.id}>
              <SortableBlock
                block={block}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
                overBranch={overBranch}
                onDeleteChild={onDeleteChild}
                onUpdateChild={onUpdateChild}
                userVars={userVars}
              />
              <GapZone index={i + 1} isOver={overGapIndex === i + 1} />
            </Fragment>
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
