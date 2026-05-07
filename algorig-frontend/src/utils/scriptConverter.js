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

const KNOWN_ACTIONS = new Set([
  'HardStrike', 'HeavyAttack', 'PowerSurge', 'Patch', 'Firewall',
  'ArmorPlate', 'VirusUpload', 'SystemScan', 'CpuStall'
])

const ACTION_COLORS = {
  HardStrike: '#f97316', HeavyAttack: '#f97316', PowerSurge: '#a855f7',
  Patch: '#22c55e', Firewall: '#3b82f6', ArmorPlate: '#3b82f6',
  VirusUpload: '#a855f7', SystemScan: '#8888aa', CpuStall: '#444466'
}

export function scriptToBlocks(text) {
  const lines = text.split('\n').map(l => l.trimEnd())
  const blocks = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    if (line.startsWith('IF ')) {
      const condition = line.slice(3).trim()
      const result = parseIfBlock(lines, i + 1, condition)
      blocks.push(result.block)
      i = result.nextIndex
    } else if (KNOWN_ACTIONS.has(line)) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'action',
        action: line,
        color: ACTION_COLORS[line] || '#8888aa'
      })
      i++
    } else {
      i++
    }
  }

  return blocks
}

function parseIfBlock(lines, startIndex, condition) {
  const ifChildren = []
  const elseChildren = []
  let isElse = false
  let i = startIndex

  while (i < lines.length) {
    const line = lines[i].trim()
    if (line === 'END IF') {
      break
    }
    if (line === 'ELSE') {
      isElse = true
      i++
      continue
    }
    if (line) {
      const actionBlock = {
        id: crypto.randomUUID(),
        type: 'action',
        action: line,
        color: ACTION_COLORS[line] || '#8888aa'
      }
      if (isElse) elseChildren.push(actionBlock)
      else ifChildren.push(actionBlock)
    }
    i++
  }

  const nextIndex = i + 1

  if (isElse) {
    return {
      block: {
        id: crypto.randomUUID(),
        type: 'ifelse',
        condition,
        ifChildren,
        elseChildren
      },
      nextIndex
    }
  }

  return {
    block: {
      id: crypto.randomUUID(),
      type: 'if',
      condition,
      children: ifChildren
    },
    nextIndex
  }
}
