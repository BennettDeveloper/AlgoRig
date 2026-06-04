export function blocksToScript(blocks) {
  return blocks.map(block => blockToLines(block)).join('\n')
}

function blockToLines(block) {
  if (block.type === 'action') {
    return block.action
  }
  if (block.type === 'set') {
    return `SET ${block.variableName || 'myVar'} = ${block.expression || '0'}`
  }
  if (block.type === 'update') {
    return `UPDATE ${block.variableName || 'myVar'} ${block.operator || '+='} ${block.expression || '1'}`
  }
  if (block.type === 'repeat') {
    const childLines = (block.children || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')
    return `REPEAT ${block.count || 1}\n${childLines}\nEND REPEAT`
  }
  if (block.type === 'if') {
    const childLines = (block.ifChildren || block.children || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')
    return `IF ${block.condition || ''}\n${childLines}\nEND IF`
  }
  if (block.type === 'ifelse') {
    const ifLines = (block.ifChildren || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')

    let result = `IF ${block.condition || ''}\n${ifLines}`

    for (const chain of (block.elseIfChains || [])) {
      const chainLines = (chain.children || [])
        .map(c => '    ' + blockToLines(c))
        .join('\n')
      result += `\nELSE IF ${chain.condition || ''}\n${chainLines}`
    }

    if ((block.elseChildren || []).length > 0) {
      const elseLines = block.elseChildren.map(c => '    ' + blockToLines(c)).join('\n')
      result += `\nELSE\n${elseLines}`
    }

    result += '\nEND IF'
    return result
  }
  return ''
}

const ACTION_MAP = {
  'HARDSTRIKE':   { action: 'HardStrike',  color: '#f97316' },
  'HEAVYATTACK':  { action: 'HeavyAttack', color: '#f97316' },
  'POWERSURGE':   { action: 'PowerSurge',  color: '#a855f7' },
  'PATCH':        { action: 'Patch',       color: '#22c55e' },
  'FIREWALL':     { action: 'Firewall',    color: '#3b82f6' },
  'ARMORPLATE':   { action: 'ArmorPlate',  color: '#3b82f6' },
  'VIRUSUPLOAD':  { action: 'VirusUpload', color: '#a855f7' },
  'SYSTEMSCAN':   { action: 'SystemScan',  color: '#8888aa' },
  'CPUSTALL':     { action: 'CpuStall',    color: '#444466' },
  // Backend UPPER_SNAKE_CASE variants
  'HARD_STRIKE':  { action: 'HardStrike',  color: '#f97316' },
  'HEAVY_ATTACK': { action: 'HeavyAttack', color: '#f97316' },
  'POWER_SURGE':  { action: 'PowerSurge',  color: '#a855f7' },
  'ARMOR_PLATE':  { action: 'ArmorPlate',  color: '#3b82f6' },
  'VIRUS_UPLOAD': { action: 'VirusUpload', color: '#a855f7' },
  'SYSTEM_SCAN':  { action: 'SystemScan',  color: '#8888aa' },
  'CPU_STALL':    { action: 'CpuStall',    color: '#444466' },
}

function resolveAction(line) {
  const stripped = line.toUpperCase().replace(/\s+/g, '')
  const withUnderscores = line.toUpperCase().replace(/\s+/g, '_')
  return ACTION_MAP[stripped] || ACTION_MAP[withUnderscores] || null
}

function addBlockToStack(stack, topLevel, newBlock) {
  if (stack.length > 0) {
    const top = stack[stack.length - 1]
    if (top.branch === 'else') {
      if (!top.block.elseChildren) top.block.elseChildren = []
      top.block.elseChildren.push(newBlock)
    } else if (top.branch?.startsWith('elseif-')) {
      const chainIdx = parseInt(top.branch.split('-')[1], 10)
      top.block.elseIfChains[chainIdx].children.push(newBlock)
    } else if (top.block.type === 'if' || top.block.type === 'ifelse') {
      if (!top.block.ifChildren) top.block.ifChildren = []
      top.block.ifChildren.push(newBlock)
    } else {
      if (!top.block.children) top.block.children = []
      top.block.children.push(newBlock)
    }
  } else {
    topLevel.push(newBlock)
  }
}

export function scriptToBlocks(text) {
  if (!text || !text.trim()) return []

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const topLevel = []
  const stack = [] // { block, branch }

  for (const line of lines) {
    const upper = line.toUpperCase().trim()

    if (upper.startsWith('UPDATE ')) {
      const rest = line.substring(7).trim()
      for (const op of ['+=', '-=', '*=', '/=', '%=']) {
        const idx = rest.indexOf(op)
        if (idx !== -1) {
          const varName = rest.substring(0, idx).trim()
          const expr = rest.substring(idx + op.length).trim()
          addBlockToStack(stack, topLevel, {
            id: crypto.randomUUID(),
            type: 'update',
            variableName: varName,
            operator: op,
            expression: expr,
          })
          break
        }
      }
      continue
    }

    if (upper.startsWith('SET ')) {
      const rest = line.substring(4).trim()
      const eqIdx = rest.indexOf('=')
      if (eqIdx !== -1) {
        const varName = rest.substring(0, eqIdx).trim()
        const expr = rest.substring(eqIdx + 1).trim()
        addBlockToStack(stack, topLevel, {
          id: crypto.randomUUID(),
          type: 'set',
          variableName: varName,
          expression: expr,
        })
      }
      continue
    }

    if (upper.startsWith('REPEAT ')) {
      const count = parseInt(line.substring(7).trim(), 10) || 1
      stack.push({ block: { id: crypto.randomUUID(), type: 'repeat', count, children: [] }, branch: 'repeat' })
      continue
    }

    if (upper === 'END REPEAT') {
      if (stack.length > 0) {
        const { block } = stack.pop()
        addBlockToStack(stack, topLevel, block)
      }
      continue
    }

    if (upper.startsWith('IF ') || upper === 'IF') {
      const condition = line.length > 3 ? line.substring(3).trim() : ''
      stack.push({ block: { id: crypto.randomUUID(), type: 'if', condition, ifChildren: [] }, branch: 'if' })
      continue
    }

    // ELSE IF must come before ELSE check
    if (upper.startsWith('ELSE IF')) {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        const condition = line.substring(7).trim()
        if (top.block.type !== 'ifelse') {
          top.block.type = 'ifelse'
          top.block.ifChildren = top.block.children || []
          delete top.block.children
        }
        if (!top.block.elseIfChains) top.block.elseIfChains = []
        const chainIdx = top.block.elseIfChains.length
        top.block.elseIfChains.push({ id: crypto.randomUUID(), condition, children: [] })
        top.branch = `elseif-${chainIdx}`
      }
      continue
    }

    if (upper === 'ELSE') {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (top.block.type !== 'ifelse') {
          top.block.type = 'ifelse'
          top.block.ifChildren = top.block.children || []
          delete top.block.children
        }
        if (!top.block.elseChildren) top.block.elseChildren = []
        top.branch = 'else'
      }
      continue
    }

    if (upper === 'END IF') {
      if (stack.length > 0) {
        const { block } = stack.pop()
        addBlockToStack(stack, topLevel, block)
      }
      continue
    }

    const actionData = resolveAction(upper)
    if (actionData) {
      addBlockToStack(stack, topLevel, {
        id: crypto.randomUUID(),
        type: 'action',
        action: actionData.action,
        color: actionData.color,
      })
    }
  }

  // Flush any unclosed IF blocks
  while (stack.length > 0) {
    topLevel.push(stack.pop().block)
  }

  return topLevel
}
