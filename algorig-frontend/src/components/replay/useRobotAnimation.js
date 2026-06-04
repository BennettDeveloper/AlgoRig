import { useMemo } from 'react'

const BASE_DURATION = 600

export default function useRobotAnimation(currentEntry, speed) {
  return useMemo(() => {
    if (!currentEntry) return { attackerStyle: {}, defenderStyle: {} }

    const duration = Math.round(BASE_DURATION / speed)
    const isActorA = currentEntry.actor === 'A'
    const entryType = currentEntry.entryType
    const action = currentEntry.actionTaken

    if (entryType === 'BATTERY_DRAIN') {
      return {
        attackerStyle: { animation: `stallSag ${duration}ms ease-out forwards` },
        defenderStyle: {},
      }
    }

    if (entryType !== 'ACTION') return { attackerStyle: {}, defenderStyle: {} }

    if (currentEntry.stalledDueToInsufficientBattery) {
      return {
        attackerStyle: { animation: `stallSag ${duration}ms ease-out forwards` },
        defenderStyle: {},
      }
    }

    const damage = currentEntry.damageDealt ?? 0
    // More dramatic distances: lunge up to 65px, knockback up to 50px
    const lunge = Math.min(65, 28 + Math.round(damage / 3))
    const kb    = Math.min(50, 16 + Math.round(damage / 4))
    const vars  = { '--lunge-dist': `${lunge}px`, '--kb-dist': `${kb}px` }

    let attackerAnim = null
    let defenderAnim = null

    // Stack Overflow: much bigger knockback
    if (action === 'STACK_OVERFLOW') {
      const soKb = Math.min(100, 55 + Math.round(damage / 4))
      return {
        attackerStyle: { animation: `stackOverflowCharge ${duration}ms ease-out forwards` },
        defenderStyle: {
          '--kb-dist': `${soKb}px`,
          animation: `${isActorA ? 'knockbackRight' : 'knockbackLeft'} ${duration}ms ease-out forwards`,
        },
      }
    }

    switch (action) {
      case 'HARD_STRIKE':
        attackerAnim = isActorA ? 'lungeRight' : 'lungeLeft'
        defenderAnim = isActorA ? 'knockbackRight' : 'knockbackLeft'
        break
      case 'HEAVY_ATTACK':
        attackerAnim = isActorA ? 'heavyWindup' : 'heavyWindupLeft'
        defenderAnim = isActorA ? 'knockbackRight' : 'knockbackLeft'
        break
      case 'POWER_SURGE':
        attackerAnim = 'powerSurgeAttack'
        defenderAnim = 'electricShake'
        break
      case 'VIRUS_UPLOAD':
        attackerAnim = isActorA ? 'virusLean' : 'virusLeanLeft'
        defenderAnim = 'glitchWobble'
        break
      case 'HEAL':
      case 'PATCH':
      case 'RECHARGE':
        attackerAnim = 'healBounce'
        break
      case 'FIREWALL':
      case 'ARMOR_PLATE':
      case 'DEFENSIVE_STANCE':
      case 'OVERCLOCK':
        attackerAnim = 'puffUp'
        break
      case 'SYSTEM_SCAN':
        attackerAnim = 'scanPulse'
        break
      default:
        attackerAnim = 'stallSag'
    }

    const attackerStyle = attackerAnim
      ? { ...vars, animation: `${attackerAnim} ${duration}ms ease-out forwards` }
      : {}
    const defenderStyle = defenderAnim
      ? { '--kb-dist': vars['--kb-dist'], animation: `${defenderAnim} ${duration}ms ease-out forwards` }
      : {}

    return { attackerStyle, defenderStyle }
  }, [currentEntry, speed])
}
