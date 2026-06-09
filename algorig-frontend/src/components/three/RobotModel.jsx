import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { BoxGeometry, SphereGeometry, CylinderGeometry, OctahedronGeometry } from 'three'
import RobotPart from './RobotPart'
import useRobotGeometry from './useRobotGeometry'
import { getTierColors } from './tierColors'

export default function RobotModel({
  robot,
  animationState = 'idle',
  side = 'left',
}) {
  const geo    = useRobotGeometry(robot)
  const colors = getTierColors(robot?.tier || 'TIER_1')
  const { primary: primaryColor, secondary: secondaryColor, glow: glowColor } = colors

  const {
    headSize, headCenterY, headShape,
    torsoWidth, torsoHeight, torsoDepth, torsoShape,
    armWidth, armHeight, armDepth, shoulderOffset, armCenterY,
    legWidth, legHeight, legDepth, legSpread, legCenterY, legShape,
    baseScale,
    hasShoulderPads, hasAntenna, hasCoreOrb,
    shoulderPadWidth, shoulderPadHeight, shoulderPadDepth, shoulderPadY, shoulderPadX,
    antennaHeight, antennaWidth, antennaY,
    coreOrbRadius,
  } = geo

  // ── Geometries ────────────────────────────────────────────────────────────

  const headGeo = useMemo(() => {
    switch (headShape) {
      case 'dome':    return new SphereGeometry(headSize * 0.55, 6, 5)
      case 'angular': return new OctahedronGeometry(headSize * 0.52)
      case 'visor':   return new BoxGeometry(headSize * 1.6, headSize * 0.55, headSize * 0.9)
      default:        return new BoxGeometry(headSize, headSize, headSize)
    }
  }, [headShape, headSize])

  const torsoGeo = useMemo(() => {
    switch (torsoShape) {
      case 'diamond': return new OctahedronGeometry(torsoWidth * 0.72)
      case 'hex':     return new CylinderGeometry(torsoWidth * 0.5, torsoWidth * 0.55, torsoHeight, 6)
      default:        return new BoxGeometry(torsoWidth, torsoHeight, torsoDepth)
    }
  }, [torsoShape, torsoWidth, torsoHeight, torsoDepth])

  const upperArmGeo = useMemo(
    () => new BoxGeometry(armWidth, armHeight * 0.55, armDepth),
    [armWidth, armHeight, armDepth]
  )
  const lowerArmGeo = useMemo(
    () => new BoxGeometry(armWidth * 0.9, armHeight * 0.45, armDepth * 0.9),
    [armWidth, armHeight, armDepth]
  )

  const legGeo = useMemo(() => {
    if (legShape === 'tapered') {
      return new CylinderGeometry(legWidth * 0.35, legWidth * 0.65, legHeight, 4)
    }
    return new BoxGeometry(legWidth, legHeight, legDepth)
  }, [legShape, legWidth, legHeight, legDepth])

  const shoulderPadGeo = useMemo(
    () => new BoxGeometry(shoulderPadWidth, shoulderPadHeight, shoulderPadDepth),
    [shoulderPadWidth, shoulderPadHeight, shoulderPadDepth]
  )

  const antennaGeo = useMemo(
    () => new CylinderGeometry(0.015, antennaWidth / 2, antennaHeight, 4),
    [antennaWidth, antennaHeight]
  )

  useEffect(() => () => headGeo.dispose(),        [headGeo])
  useEffect(() => () => torsoGeo.dispose(),       [torsoGeo])
  useEffect(() => () => upperArmGeo.dispose(),    [upperArmGeo])
  useEffect(() => () => lowerArmGeo.dispose(),    [lowerArmGeo])
  useEffect(() => () => legGeo.dispose(),         [legGeo])
  useEffect(() => () => shoulderPadGeo.dispose(), [shoulderPadGeo])
  useEffect(() => () => antennaGeo.dispose(),     [antennaGeo])

  // ── Refs ──────────────────────────────────────────────────────────────────

  const rootGroupRef = useRef()
  const headRef      = useRef()
  const torsoRef     = useRef()
  const leftArmRef   = useRef()
  const rightArmRef  = useRef()
  const coreOrbRef   = useRef()

  const animProgress   = useRef(0)
  const currentAnim    = useRef('idle')

  // Tracks the base Y scale of the torso group so animations multiply rather than override
  const torsoScaleYRef = useRef(1)
  useEffect(() => {
    torsoScaleYRef.current = torsoShape === 'diamond' ? torsoHeight / torsoWidth : 1
    if (torsoRef.current) {
      torsoRef.current.scale.set(1, torsoScaleYRef.current, 1)
    }
  }, [torsoShape, torsoHeight, torsoWidth])

  useEffect(() => {
    if (animationState !== 'idle' && animationState !== currentAnim.current) {
      currentAnim.current  = animationState
      animProgress.current = 0
    }
  }, [animationState])

  // ── Animation loop ────────────────────────────────────────────────────────

  useFrame(({ clock }, delta) => {
    if (!rootGroupRef.current) return

    const t    = clock.elapsedTime
    const anim = currentAnim.current

    // Idle bob on root unless hit is playing
    if (anim !== 'hit') {
      rootGroupRef.current.position.y = Math.sin(t * 1.2) * 0.03
    }

    // ── idle ────────────────────────────────────────────────────────────────
    if (anim === 'idle') {
      if (headRef.current)     headRef.current.rotation.z  = Math.sin(t * 0.8) * 0.04
      if (leftArmRef.current)  leftArmRef.current.position.z  = 0
      if (rightArmRef.current) rightArmRef.current.position.z = 0
      if (coreOrbRef.current) {
        const orbPulse = Math.sin(t * 2.5) * 0.15 + 1.0
        coreOrbRef.current.scale.set(orbPulse, orbPulse, orbPulse)
        coreOrbRef.current.material.opacity = 0.5 + Math.sin(t * 2.5) * 0.2
      }
      return
    }

    // ── physicalAttack ──────────────────────────────────────────────────────
    if (anim === 'physicalAttack') {
      animProgress.current += delta
      const p      = Math.min(animProgress.current / 0.4, 1.0)
      const thrust = p < 0.5 ? p * 2 : 2 - p * 2
      if (rightArmRef.current) rightArmRef.current.position.z =  thrust * 0.35
      if (leftArmRef.current)  leftArmRef.current.position.z  = -thrust * 0.08
      if (animProgress.current >= 0.4) {
        currentAnim.current  = 'idle'
        animProgress.current = 0
        if (rightArmRef.current) rightArmRef.current.position.z = 0
        if (leftArmRef.current)  leftArmRef.current.position.z  = 0
      }
      return
    }

    // ── softwareAttack ──────────────────────────────────────────────────────
    if (anim === 'softwareAttack') {
      animProgress.current += delta
      const p     = Math.min(animProgress.current / 0.5, 1.0)
      const raise = p < 0.4 ? p / 0.4 : p < 0.6 ? 1.0 : (1.0 - p) / 0.4
      if (leftArmRef.current)  leftArmRef.current.position.y  = raise * 0.25
      if (rightArmRef.current) rightArmRef.current.position.y = raise * 0.25
      if (torsoRef.current) {
        const s  = 1.0 + raise * 0.08
        const sy = s * torsoScaleYRef.current
        torsoRef.current.scale.set(s, sy, s)
      }
      if (animProgress.current >= 0.5) {
        currentAnim.current  = 'idle'
        animProgress.current = 0
        if (leftArmRef.current)  leftArmRef.current.position.y  = 0
        if (rightArmRef.current) rightArmRef.current.position.y = 0
        if (torsoRef.current)    torsoRef.current.scale.set(1, torsoScaleYRef.current, 1)
      }
      return
    }

    // ── statusEffect ────────────────────────────────────────────────────────
    if (anim === 'statusEffect') {
      animProgress.current += delta
      const pulse = Math.sin(animProgress.current * Math.PI * 5) * 0.07
      if (torsoRef.current) {
        const s = 1 + pulse
        torsoRef.current.scale.set(s, s * torsoScaleYRef.current, s)
      }
      if (headRef.current) headRef.current.rotation.z = Math.sin(animProgress.current * Math.PI * 8) * 0.12
      if (animProgress.current >= 0.6) {
        currentAnim.current  = 'idle'
        animProgress.current = 0
        if (torsoRef.current) torsoRef.current.scale.set(1, torsoScaleYRef.current, 1)
        if (headRef.current)  headRef.current.rotation.z = 0
      }
      return
    }

    // ── hit ─────────────────────────────────────────────────────────────────
    if (anim === 'hit') {
      animProgress.current += delta
      const shake = Math.sin(animProgress.current * Math.PI * 14) * 0.09
      rootGroupRef.current.position.y = -0.05 + shake
      if (animProgress.current >= 0.3) {
        currentAnim.current  = 'idle'
        animProgress.current = 0
        rootGroupRef.current.position.y = 0
      }
    }
  })

  // ── JSX ───────────────────────────────────────────────────────────────────

  if (!robot) return null

  const scaleX      = side === 'right' ? -1 : 1
  const torsoScaleY = torsoShape === 'diamond' ? torsoHeight / torsoWidth : 1

  return (
    <group scale={[scaleX, 1, 1]}>
      <group ref={rootGroupRef} scale={baseScale}>

        {/* Head */}
        <group ref={headRef}>
          <RobotPart
            geometry={headGeo}
            color={primaryColor}
            position={[0, headCenterY, 0]}
          />
        </group>

        {/* Torso — base Y scale baked in for diamond shape */}
        <group ref={torsoRef} scale={[1, torsoScaleY, 1]}>
          <RobotPart
            geometry={torsoGeo}
            color={primaryColor}
            position={[0, 0, 0]}
          />
        </group>

        {/* Left arm */}
        <group ref={leftArmRef}>
          <RobotPart
            geometry={upperArmGeo}
            color={primaryColor}
            position={[-shoulderOffset, armCenterY + armHeight * 0.15, 0]}
          />
          <RobotPart
            geometry={lowerArmGeo}
            color={secondaryColor}
            position={[-shoulderOffset, armCenterY - armHeight * 0.30, 0]}
          />
        </group>

        {/* Right arm */}
        <group ref={rightArmRef}>
          <RobotPart
            geometry={upperArmGeo}
            color={primaryColor}
            position={[shoulderOffset, armCenterY + armHeight * 0.15, 0]}
          />
          <RobotPart
            geometry={lowerArmGeo}
            color={secondaryColor}
            position={[shoulderOffset, armCenterY - armHeight * 0.30, 0]}
          />
        </group>

        {/* Legs */}
        <RobotPart
          geometry={legGeo}
          color={secondaryColor}
          position={[-legSpread, legCenterY, 0]}
        />
        <RobotPart
          geometry={legGeo}
          color={secondaryColor}
          position={[legSpread, legCenterY, 0]}
        />

        {/* Shoulder pads — TIER_3+ */}
        {hasShoulderPads && (
          <>
            <RobotPart
              geometry={shoulderPadGeo}
              color={secondaryColor}
              position={[-shoulderPadX, shoulderPadY, 0]}
            />
            <RobotPart
              geometry={shoulderPadGeo}
              color={secondaryColor}
              position={[shoulderPadX, shoulderPadY, 0]}
            />
          </>
        )}

        {/* Antenna — TIER_4+ */}
        {hasAntenna && (
          <RobotPart
            geometry={antennaGeo}
            color={glowColor}
            position={[0, antennaY, 0]}
          />
        )}

        {/* Core orb — TIER_5 only */}
        {hasCoreOrb && (
          <mesh ref={coreOrbRef} position={[0, 0, 0.01]}>
            <sphereGeometry args={[coreOrbRadius, 8, 6]} />
            <meshBasicMaterial color={glowColor} opacity={0.7} transparent />
          </mesh>
        )}

      </group>
    </group>
  )
}
