export function blocksToScript(blocks) {
  return blocks.map(block => blockToLines(block)).join('\n')
}

function blockToLines(block) {
  if (block.type === 'action') {
    return block.action
  }
  if (block.type === 'if') {
    const childLines = (block.children || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')
    return `IF ${block.condition || ''}\n${childLines}\nEND IF`
  }
  if (block.type === 'ifelse') {
    const ifLines = (block.ifChildren || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')
    const elseLines = (block.elseChildren || [])
      .map(c => '    ' + blockToLines(c))
      .join('\n')
    return `IF ${block.condition || ''}\n${ifLines}\nELSE\n${elseLines}\nEND IF`
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

export function scriptToBlocks(text) {
  if (!text || !text.trim()) return []

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)
  const topLevel = []
  const stack = [] // { block, branch }

  for (const line of lines) {
    const upper = line.toUpperCase().trim()

    if (upper.startsWith('IF ') || upper === 'IF') {
      const condition = line.length > 3 ? line.substring(3).trim() : ''
      const newBlock = {
        id: crypto.randomUUID(),
        type: 'if',
        condition,
        children: [],
      }
      stack.push({ block: newBlock, branch: 'if' })
      continue
    }

    if (upper === 'ELSE') {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        top.block.type = 'ifelse'
        top.block.ifChildren = top.block.children || []
        top.block.elseChildren = []
        delete top.block.children
        top.branch = 'else'
      }
      continue
    }

    if (upper === 'END IF') {
      if (stack.length > 0) {
        const { block } = stack.pop()
        if (stack.length > 0) {
          const parent = stack[stack.length - 1]
          const key = parent.branch === 'else'
            ? 'elseChildren'
            : parent.block.type === 'ifelse' ? 'ifChildren' : 'children'
          if (!parent.block[key]) parent.block[key] = []
          parent.block[key].push(block)
        } else {
          topLevel.push(block)
        }
      }
      continue
    }

    const actionData = resolveAction(upper)
    if (actionData) {
      const actionBlock = {
        id: crypto.randomUUID(),
        type: 'action',
        action: actionData.action,
        color: actionData.color,
      }
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (top.branch === 'else') {
          if (!top.block.elseChildren) top.block.elseChildren = []
          top.block.elseChildren.push(actionBlock)
        } else {
          const key = top.block.type === 'ifelse' ? 'ifChildren' : 'children'
          if (!top.block[key]) top.block[key] = []
          top.block[key].push(actionBlock)
        }
      } else {
        topLevel.push(actionBlock)
      }
    }
  }

  // Flush any unclosed IF blocks
  while (stack.length > 0) {
    topLevel.push(stack.pop().block)
  }

  return topLevel
}
