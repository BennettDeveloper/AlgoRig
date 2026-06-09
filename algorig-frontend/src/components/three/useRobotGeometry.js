import { useMemo } from 'react'
import { getRobotVariant } from './robotVariants'
import { getPartConfig } from './partsLibrary'

export default function useRobotGeometry(robot) {
  const { name, tier, hp, coreImpact, exploitPower, clockSpeed, chassisArmor, firewallStrength, battery, partsConfig } = robot

  return useMemo(() => {
    // ── HEAD ──────────────────────────────────────────────────────────────────
    const headSize = 0.28 + (clockSpeed / 90) * 0.12

    // ── TORSO ─────────────────────────────────────────────────────────────────
    const torsoWidth  = 0.45 + (chassisArmor / 80) * 0.25
    const torsoHeight = 0.55 + (hp / 200) * 0.20
    const torsoDepth  = 0.30 + (chassisArmor / 80) * 0.10

    // ── ARMS ──────────────────────────────────────────────────────────────────
    let armWidth  = 0.10 + (coreImpact / 80) * 0.08
    let armHeight = 0.38 + (coreImpact / 80) * 0.12
    const armDepth = 0.10

    // ── LEGS ──────────────────────────────────────────────────────────────────
    const legWidth = 0.13 + (chassisArmor / 80) * 0.07
    let legHeight  = 0.40 + (clockSpeed / 90) * 0.10
    const legDepth = 0.13
    let legSpread  = 0.14 + (chassisArmor / 80) * 0.06

    // ── OVERALL SCALE ─────────────────────────────────────────────────────────
    const baseScale = 1.0 + (hp / 200) * 0.3

    // ── VERTICAL POSITIONS ────────────────────────────────────────────────────
    // legCenterY and shoulderOffset computed after overrides (those values may change)
    const torsoCenterY = 0
    const headCenterY  = torsoHeight / 2 + headSize / 2 + 0.04
    const armCenterY   = torsoHeight / 4

    // ── SHAPE ARCHETYPES (stat-driven defaults) ───────────────────────────────
    let headShape
    if      (clockSpeed >= 60)        headShape = 'dome'
    else if (exploitPower >= 50)      headShape = 'angular'
    else if (chassisArmor >= 55)      headShape = 'visor'
    else                              headShape = 'box'

    let torsoShape
    if      ((exploitPower - coreImpact) >= 20)            torsoShape = 'diamond'
    else if (Math.abs(coreImpact - exploitPower) < 10)     torsoShape = 'hex'
    else                                                   torsoShape = 'box'

    let legShape = clockSpeed >= 55 ? 'tapered' : 'box'

    // ── NAMED VARIANT OVERRIDES ───────────────────────────────────────────────
    const variant = getRobotVariant(name)
    if (variant) {
      headShape  = variant.headShape
      torsoShape = variant.torsoShape
      legShape   = variant.legShape
    }

    // ── PARTS OVERRIDE (custom robots with selected parts) ────────────────────
    if (partsConfig) {
      const parts = typeof partsConfig === 'string'
        ? JSON.parse(partsConfig)
        : partsConfig

      if (parts.head) {
        const headPart = getPartConfig('head', parts.head)
        if (headPart) headShape = headPart.shape
      }

      if (parts.torso) {
        const torsoPart = getPartConfig('torso', parts.torso)
        if (torsoPart) torsoShape = torsoPart.shape
      }

      if (parts.arms) {
        const armPart = getPartConfig('arms', parts.arms)
        if (armPart) {
          armWidth  = armWidth * armPart.width
          armHeight = armHeight * armPart.length
        }
      }

      if (parts.legs) {
        const legPart = getPartConfig('legs', parts.legs)
        if (legPart) {
          legShape = legPart.shape
          if (legPart.spreadMultiplier) legSpread = legSpread * legPart.spreadMultiplier
          if (legPart.heightMultiplier) legHeight = legHeight * legPart.heightMultiplier
        }
      }
    }

    // ── POST-OVERRIDE DERIVED VALUES ──────────────────────────────────────────
    const shoulderOffset = torsoWidth / 2 + armWidth / 2 + 0.04
    const legCenterY     = -(torsoHeight / 2) - (legHeight / 2) - 0.02

    // ── EXTRA PARTS ───────────────────────────────────────────────────────────
    const hasShoulderPads = ['TIER_3', 'TIER_4', 'TIER_5'].includes(tier)
    const hasAntenna      = ['TIER_4', 'TIER_5'].includes(tier)
    const hasCoreOrb      = tier === 'TIER_5'

    const shoulderPadWidth  = torsoWidth * 0.45
    const shoulderPadHeight = 0.07
    const shoulderPadDepth  = torsoDepth * 0.75
    const shoulderPadY      = torsoHeight / 2 + 0.05
    const shoulderPadX      = shoulderOffset

    const antennaHeight = 0.18 + (clockSpeed / 90) * 0.08
    const antennaWidth  = 0.04
    const antennaY      = headCenterY + headSize / 2 + antennaHeight / 2 + 0.01

    const coreOrbRadius = 0.10 + (exploitPower / 80) * 0.06

    return {
      headSize,
      torsoWidth, torsoHeight, torsoDepth,
      armWidth, armHeight, armDepth, shoulderOffset,
      legWidth, legHeight, legDepth, legSpread,
      baseScale,
      torsoCenterY, headCenterY, armCenterY, legCenterY,
      headShape, torsoShape, legShape,
      hasShoulderPads, hasAntenna, hasCoreOrb,
      shoulderPadWidth, shoulderPadHeight, shoulderPadDepth, shoulderPadY, shoulderPadX,
      antennaHeight, antennaWidth, antennaY,
      coreOrbRadius,
    }
  }, [name, tier, hp, coreImpact, exploitPower, clockSpeed, chassisArmor, firewallStrength, battery, partsConfig])
}
