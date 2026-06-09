import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getTierColors } from './tierColors'

// ── CLEANUP ───────────────────────────────────────────────────────────────────

function cleanupEffect(effect, scene) {
  for (const obj of effect.allMeshes) {
    scene.remove(obj)
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose())
        else child.material.dispose()
      }
    })
  }
}

// ── PHYSICAL ──────────────────────────────────────────────────────────────────

function spawnPhysical(attackerX, defenderX, colors, scene) {
  const dir = Math.sign(defenderX - attackerX)
  const startX = attackerX + dir * 0.6
  const endX = defenderX - dir * 0.3
  const allMeshes = []

  const chargeLight = new THREE.PointLight(colors.glow, 8, 4)
  chargeLight.position.set(attackerX, 0.5, 1.5)
  scene.add(chargeLight)
  allMeshes.push(chargeLight)

  const projGeo = new THREE.OctahedronGeometry(0.45)
  const projMat = new THREE.MeshBasicMaterial({ color: colors.primary })
  const projectile = new THREE.Mesh(projGeo, projMat)
  projectile.scale.set(0.35, 1.8, 0.35)
  projectile.position.set(startX, 0.1, 0.3)
  scene.add(projectile)
  allMeshes.push(projectile)

  const trailOpacities = [0.7, 0.5, 0.35, 0.2, 0.1]
  const trailMeshes = trailOpacities.map(op => {
    const geo = new THREE.OctahedronGeometry(0.45)
    const mat = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: op })
    const m = new THREE.Mesh(geo, mat)
    m.scale.set(0.35, 1.8, 0.35)
    m.position.copy(projectile.position)
    scene.add(m)
    allMeshes.push(m)
    return m
  })

  return {
    type: 'physical',
    progress: 0, duration: 1.0,
    attackerX, defenderX, dir, colors,
    startX, endX,
    chargeLight, projectile, trailMeshes,
    shockwaveRings: [], debrisShards: [], impactSpikes: [],
    impactFlash: null, impactLight: null, impactSpawned: false,
    allMeshes,
  }
}

function updatePhysical(effect, delta, scene) {
  const { progress, dir, startX, endX, defenderX, colors, chargeLight, projectile, trailMeshes } = effect

  chargeLight.intensity = progress < 0.25 ? 8 * (1 - progress / 0.25) : 0

  if (progress < 0.25) {
    const t = progress / 0.25
    const cx = startX + (endX - startX) * t
    projectile.position.x = cx
    projectile.rotation.z += delta * 20
    const offsets = [0.2, 0.4, 0.6, 0.8, 1.0]
    for (let i = 0; i < trailMeshes.length; i++) {
      trailMeshes[i].position.set(cx - dir * offsets[i], 0.1, 0.3)
      trailMeshes[i].rotation.z = projectile.rotation.z
    }
  }

  if (progress >= 0.25 && !effect.impactSpawned) {
    effect.impactSpawned = true
    projectile.visible = false
    for (const tm of trailMeshes) tm.visible = false

    const impactLight = new THREE.PointLight('#ffffff', 15, 8)
    impactLight.position.set(defenderX, 0.5, 2)
    scene.add(impactLight)
    effect.impactLight = impactLight
    effect.allMeshes.push(impactLight)

    const ringSpecs = [
      { maxScale: 5.5, delay: 0.0,  duration: 0.45 },
      { maxScale: 4.0, delay: 0.08, duration: 0.40 },
      { maxScale: 2.5, delay: 0.16, duration: 0.35 },
    ]
    for (const spec of ringSpecs) {
      const geo = new THREE.TorusGeometry(0.01, 0.012, 8, 32)
      const mat = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 1 })
      const ring = new THREE.Mesh(geo, mat)
      ring.position.set(defenderX, 0.1, 0.2)
      ring.scale.setScalar(0.1)
      scene.add(ring)
      effect.shockwaveRings.push({ mesh: ring, ...spec })
      effect.allMeshes.push(ring)
    }

    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2
      const spd = 1.2 + Math.random() * 1.2
      const geo = new THREE.BoxGeometry(0.07, 0.07, 0.07)
      const mat = new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 1 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(defenderX, 0.1, 0.2)
      scene.add(mesh)
      effect.debrisShards.push({
        mesh,
        vel: new THREE.Vector3(Math.cos(angle) * spd * 0.8, 0.8 + Math.random() * 1.2, Math.sin(angle) * spd * 0.4),
        spinSpeed: (Math.random() - 0.5) * 30,
        duration: 0.6,
      })
      effect.allMeshes.push(mesh)
    }

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const geo = new THREE.OctahedronGeometry(0.12)
      const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 })
      const spike = new THREE.Mesh(geo, mat)
      spike.scale.set(0.3, 2.5, 0.3)
      spike.position.set(defenderX + Math.cos(angle) * 0.2, 0.1 + Math.sin(angle) * 0.2, 0.2)
      spike.rotation.z = angle
      scene.add(spike)
      effect.impactSpikes.push({ mesh: spike, duration: 0.18 })
      effect.allMeshes.push(spike)
    }

    const flashGeo = new THREE.PlaneGeometry(2.5, 2.5)
    const flashMat = new THREE.MeshBasicMaterial({
      color: '#ffffff', transparent: true, opacity: 1.0,
      side: THREE.DoubleSide, depthWrite: false,
    })
    const flash = new THREE.Mesh(flashGeo, flashMat)
    flash.position.set(defenderX, 0.1, 0.25)
    scene.add(flash)
    effect.impactFlash = flash
    effect.allMeshes.push(flash)
  }

  const age = progress - 0.25

  if (effect.impactLight && age >= 0) {
    effect.impactLight.intensity = 15 * Math.max(0, 1 - age / 0.1)
  }

  for (const ring of effect.shockwaveRings) {
    const a = age - ring.delay
    if (a < 0) continue
    const t = Math.min(a / ring.duration, 1)
    ring.mesh.scale.setScalar(0.1 + t * ring.maxScale)
    ring.mesh.material.opacity = 1 - t
  }

  for (const shard of effect.debrisShards) {
    if (age < 0) continue
    const t = Math.min(age / shard.duration, 1)
    shard.vel.y -= delta * 4.5
    shard.mesh.position.x += shard.vel.x * delta
    shard.mesh.position.y += shard.vel.y * delta
    shard.mesh.position.z += shard.vel.z * delta
    shard.mesh.rotation.z += shard.spinSpeed * delta
    shard.mesh.material.opacity = 1 - t
  }

  for (const spike of effect.impactSpikes) {
    if (age < 0) continue
    const t = Math.min(age / spike.duration, 1)
    const s = 1 + t * 2
    spike.mesh.scale.set(0.3 * s, 2.5 * s, 0.3 * s)
    spike.mesh.material.opacity = 0.9 * (1 - t)
  }

  if (effect.impactFlash && age >= 0) {
    effect.impactFlash.material.opacity = 1.0 * Math.max(0, 1 - age / 0.08)
  }

  return progress >= effect.duration
}

// ── SOFTWARE ──────────────────────────────────────────────────────────────────

const SW_PURPLE_CORE  = '#e9d5ff'
const SW_PURPLE_MID   = '#9333ea'
const SW_PURPLE_OUTER = '#c084fc'
const SW_TENDRIL_PTS  = 20

function spawnSoftware(attackerX, defenderX, _colors, scene) {
  const allMeshes = []

  const beamDefs = [
    { color: SW_PURPLE_CORE,  baseOpacity: 1.0,  yOff:  0.0  },
    { color: SW_PURPLE_MID,   baseOpacity: 0.7,  yOff:  0.02 },
    { color: SW_PURPLE_OUTER, baseOpacity: 0.45, yOff: -0.02 },
  ]
  const beamLines = beamDefs.map(({ color, baseOpacity, yOff }) => {
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(attackerX, 0.1 + yOff, 0.2),
      new THREE.Vector3(attackerX, 0.1 + yOff, 0.2),
    ])
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: baseOpacity })
    const line = new THREE.Line(geo, mat)
    line.userData.yOff = yOff
    line.userData.baseOpacity = baseOpacity
    scene.add(line)
    allMeshes.push(line)
    return line
  })

  const tipGeo = new THREE.SphereGeometry(0.12, 8, 6)
  const tipMat = new THREE.MeshBasicMaterial({ color: SW_PURPLE_CORE, transparent: true, opacity: 1.0 })
  const beamTip = new THREE.Mesh(tipGeo, tipMat)
  beamTip.position.set(attackerX, 0.1, 0.2)
  scene.add(beamTip)
  allMeshes.push(beamTip)

  const beamLight = new THREE.PointLight(SW_PURPLE_MID, 3.0, 4)
  beamLight.position.set(attackerX, 0.1, 1.0)
  scene.add(beamLight)
  allMeshes.push(beamLight)

  return {
    type: 'software',
    progress: 0, duration: 1.3,
    attackerX, defenderX,
    beamLines, beamTip, beamLight,
    defenderLight: null,
    impactTriggered: false,
    shockwaveRings: [],
    particles: [],
    tendrils: [],
    impactFlashMesh: null,
    impactFlashLight: null,
    lingerLight: null,
    allMeshes,
  }
}

function updateSoftware(effect, delta, scene) {
  const { progress, attackerX, defenderX, beamLines, beamTip, beamLight } = effect

  // ── Phases 1 & 2: beam alive (0 → 0.55s) ────────────────────────────────────

  if (progress <= 0.55) {
    const beamProgress = Math.min(progress / 0.35, 1.0)
    const currentEndX = attackerX + (defenderX - attackerX) * beamProgress

    for (const line of beamLines) {
      const pos = line.geometry.attributes.position
      pos.setXYZ(0, attackerX,    0.1 + line.userData.yOff, 0.2)
      pos.setXYZ(1, currentEndX,  0.1 + line.userData.yOff, 0.2)
      pos.needsUpdate = true
    }

    beamTip.position.set(currentEndX, 0.1, 0.2)
    beamTip.scale.setScalar(Math.sin(progress * 40) * 0.3 + 1.0)
    beamLight.position.set(currentEndX, 0.1, 1.0)

    if (progress < 0.35) {
      // Phase 1: draw — core flickers between 0.85-1.0
      beamLines[0].material.opacity = 0.85 + 0.15 * Math.abs(Math.sin(progress * 60))
      beamLight.intensity = 3.0
    } else {
      // Phase 2: hold — all lines pulse aggressively
      for (const line of beamLines) {
        line.material.opacity = Math.max(0.05, line.userData.baseOpacity + Math.sin(progress * 50) * 0.3)
      }
      beamLight.intensity = Math.sin(progress * 40) * 1.5 + 3.0

      if (!effect.defenderLight) {
        const dLight = new THREE.PointLight(SW_PURPLE_OUTER, 0, 6)
        dLight.position.set(defenderX, 0, 1.5)
        scene.add(dLight)
        effect.defenderLight = dLight
        effect.allMeshes.push(dLight)
      }
      effect.defenderLight.intensity = Math.min((progress - 0.35) / 0.2, 1) * 5
    }
  }

  // ── Phase 3: impact burst (0.55s+) ──────────────────────────────────────────

  if (progress >= 0.55 && !effect.impactTriggered) {
    effect.impactTriggered = true

    for (const line of beamLines) line.visible = false
    beamTip.visible = false
    beamLight.intensity = 0
    if (effect.defenderLight) effect.defenderLight.intensity = 0

    // Flash plane
    const flashGeo = new THREE.PlaneGeometry(3.5, 3.5)
    const flashMat = new THREE.MeshBasicMaterial({
      color: SW_PURPLE_CORE, transparent: true, opacity: 1.0,
      side: THREE.DoubleSide, depthWrite: false,
    })
    effect.impactFlashMesh = new THREE.Mesh(flashGeo, flashMat)
    effect.impactFlashMesh.position.set(defenderX, 0, 0.5)
    scene.add(effect.impactFlashMesh)
    effect.allMeshes.push(effect.impactFlashMesh)

    // Flash light
    effect.impactFlashLight = new THREE.PointLight(SW_PURPLE_CORE, 12, 8)
    effect.impactFlashLight.position.set(defenderX, 0, 2)
    scene.add(effect.impactFlashLight)
    effect.allMeshes.push(effect.impactFlashLight)

    // Primary / secondary / tertiary shockwave rings
    const ringSpecs = [
      { color: SW_PURPLE_CORE,  delay: 0.0,  maxScale: 6.0, duration: 0.5,  baseOp: 1.0 },
      { color: SW_PURPLE_MID,   delay: 0.03, maxScale: 4.5, duration: 0.45, baseOp: 0.9 },
      { color: SW_PURPLE_OUTER, delay: 0.07, maxScale: 3.0, duration: 0.4,  baseOp: 0.8 },
    ]
    for (const spec of ringSpecs) {
      const geo = new THREE.TorusGeometry(0.05, 0.05, 8, 48)
      const mat = new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: spec.baseOp })
      const ring = new THREE.Mesh(geo, mat)
      ring.position.set(defenderX, 0.1, 0.1)
      ring.scale.setScalar(0.1)
      scene.add(ring)
      effect.shockwaveRings.push({ mesh: ring, ...spec })
      effect.allMeshes.push(ring)
    }

    // 32 particle shrapnel — 60% biased away from attacker, 40% omnidirectional
    const dirFromAttacker = Math.sign(defenderX - attackerX)
    const colorBreaks = [0.4, 0.75] // 40% core, 35% outer, 25% mid
    for (let i = 0; i < 32; i++) {
      const speed = 2.5 + Math.random() * 3.5
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      let vx = Math.sin(phi) * Math.cos(theta)
      const vy = Math.sin(phi) * Math.sin(theta)
      const vz = Math.cos(phi)
      if (i < 19 && Math.sign(vx) !== dirFromAttacker) vx = -vx
      const vel = new THREE.Vector3(vx * speed, vy * speed, vz * speed * 0.35)

      const rand = Math.random()
      const col = rand < colorBreaks[0] ? SW_PURPLE_CORE
                : rand < colorBreaks[1] ? SW_PURPLE_OUTER
                : SW_PURPLE_MID

      const geo = new THREE.SphereGeometry(0.06, 6, 4)
      const mat = new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 1.0 })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(defenderX, 0.1, 0.2)
      scene.add(mesh)
      effect.particles.push({ mesh, velocity: vel, lifetime: 0.4 + Math.random() * 0.4 })
      effect.allMeshes.push(mesh)
    }

    // 8 curved energy tendrils drawing outward
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      const length = 1.0 + Math.random() * 1.0
      const midOff = (Math.random() - 0.5) * 0.6
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(defenderX, 0.1, 0.2),
        new THREE.Vector3(
          defenderX + Math.cos(angle) * length * 0.5 + midOff,
          0.1 + Math.sin(angle) * length * 0.5 + midOff,
          0.2
        ),
        new THREE.Vector3(
          defenderX + Math.cos(angle) * length,
          0.1 + Math.sin(angle) * length,
          0.2
        ),
      ])
      const fullPts = curve.getPoints(SW_TENDRIL_PTS - 1)
      const geo = new THREE.BufferGeometry().setFromPoints(fullPts)
      geo.setDrawRange(0, 2)
      const mat = new THREE.LineBasicMaterial({ color: SW_PURPLE_OUTER, transparent: true, opacity: 1.0 })
      const line = new THREE.Line(geo, mat)
      scene.add(line)
      effect.tendrils.push({ line, totalPts: SW_TENDRIL_PTS })
      effect.allMeshes.push(line)
    }

    // Lingering purple glow
    effect.lingerLight = new THREE.PointLight(SW_PURPLE_MID, 4, 6)
    effect.lingerLight.position.set(defenderX, 0, 1.5)
    scene.add(effect.lingerLight)
    effect.allMeshes.push(effect.lingerLight)
  }

  if (progress >= 0.55) {
    const age = progress - 0.55

    // Flash (0.1s)
    if (effect.impactFlashMesh) {
      effect.impactFlashMesh.material.opacity = Math.max(0, 1.0 - age / 0.1)
    }
    if (effect.impactFlashLight) {
      effect.impactFlashLight.intensity = 12 * Math.max(0, 1 - age / 0.12)
    }

    // Shockwave rings
    for (const ring of effect.shockwaveRings) {
      const a = age - ring.delay
      if (a < 0) continue
      const t = Math.min(a / ring.duration, 1)
      ring.mesh.scale.setScalar(0.1 + t * ring.maxScale)
      ring.mesh.material.opacity = ring.baseOp * (1 - t)
    }

    // Particles
    for (const p of effect.particles) {
      p.mesh.position.addScaledVector(p.velocity, delta)
      p.velocity.y -= 2.5 * delta
      p.mesh.material.opacity = Math.max(0, 1 - age / p.lifetime)
    }

    // Tendrils: draw 0-0.15s, hold 0.15-0.2s, fade 0.2-0.4s
    for (const td of effect.tendrils) {
      if (age < 0.15) {
        td.line.geometry.setDrawRange(0, Math.max(2, Math.ceil((age / 0.15) * td.totalPts)))
        td.line.material.opacity = 1.0
      } else if (age < 0.2) {
        td.line.geometry.setDrawRange(0, td.totalPts)
        td.line.material.opacity = 1.0
      } else {
        td.line.geometry.setDrawRange(0, td.totalPts)
        td.line.material.opacity = Math.max(0, 1.0 - (age - 0.2) / 0.2)
      }
    }

    // Lingering glow: 4 → 0 over 0.6s
    if (effect.lingerLight) {
      effect.lingerLight.intensity = 4 * Math.max(0, 1 - age / 0.6)
    }
  }

  return progress >= effect.duration
}

// ── HIT ───────────────────────────────────────────────────────────────────────

function spawnHit(targetX, colors, scene) {
  const allMeshes = []

  const light = new THREE.PointLight('#ff2200', 12, 5)
  light.position.set(targetX, 0.5, 2)
  scene.add(light)
  allMeshes.push(light)

  const fireColors = ['#ff2200', '#ff4400', '#ff6600', '#ff8800', '#ffaa00', '#ffffff']
  const sparks = Array.from({ length: 24 }, () => {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const len = 0.1 + Math.random() * 0.25
    const vel = new THREE.Vector3(
      Math.sin(phi) * Math.cos(theta) * len,
      Math.abs(Math.cos(phi)) * len + 0.06,
      Math.sin(phi) * Math.sin(theta) * len * 0.35,
    )
    const start = new THREE.Vector3(targetX, 0.1, 0.3)
    const end = start.clone().add(vel)
    const geo = new THREE.BufferGeometry().setFromPoints([start, end])
    const col = fireColors[Math.floor(Math.random() * fireColors.length)]
    const mat = new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: 1 })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    allMeshes.push(line)
    return { line, start: start.clone(), vel, duration: 0.4 }
  })

  const cracks = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2
    const len = 0.3 + Math.random() * 0.3
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(targetX, 0.1, 0.3),
      new THREE.Vector3(targetX + Math.cos(angle) * len, 0.1 + Math.sin(angle) * len * 0.5, 0.3),
    ])
    const mat = new THREE.LineBasicMaterial({ color: '#ff4444', transparent: true, opacity: 1 })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    allMeshes.push(line)
    return { line, duration: 0.3 }
  })

  const ringGeo = new THREE.TorusGeometry(0.01, 0.012, 8, 32)
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ff2200', transparent: true, opacity: 1 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.position.set(targetX, 0.1, 0.2)
  ring.scale.setScalar(0.1)
  scene.add(ring)
  allMeshes.push(ring)

  return {
    type: 'hit',
    progress: 0, duration: 0.5,
    targetX, colors,
    light, sparks, cracks,
    ring: { mesh: ring, duration: 0.35, maxScale: 2.8 },
    allMeshes,
  }
}

function updateHit(effect) {
  const { progress, sparks, cracks, light } = effect

  light.intensity = 12 * Math.max(0, 1 - progress / 0.15)

  for (const spark of sparks) {
    const t = Math.min(progress / spark.duration, 1)
    const endPos = spark.start.clone().add(spark.vel.clone().multiplyScalar(1 - t * 0.3))
    const pos = spark.line.geometry.attributes.position
    pos.setXYZ(0, spark.start.x, spark.start.y, spark.start.z)
    pos.setXYZ(1, endPos.x, endPos.y, endPos.z)
    pos.needsUpdate = true
    spark.line.material.opacity = 1 - t
  }

  for (const crack of cracks) {
    const t = Math.min(progress / crack.duration, 1)
    crack.line.material.opacity = 1 - t
  }

  const rt = Math.min(progress / effect.ring.duration, 1)
  effect.ring.mesh.scale.setScalar(0.1 + rt * effect.ring.maxScale)
  effect.ring.mesh.material.opacity = 1 - rt

  return progress >= effect.duration
}

// ── STATUS (fallback: CPU_STALL / SYSTEM_SCAN) ────────────────────────────────

function spawnStatus(targetX, colors, scene) {
  const allMeshes = []

  const pulseGeo = new THREE.TorusGeometry(0.4, 0.015, 6, 32)
  const pulseMat = new THREE.MeshBasicMaterial({ color: colors.glow, transparent: true, opacity: 0 })
  const pulse = new THREE.Mesh(pulseGeo, pulseMat)
  pulse.position.set(targetX, 0.1, 0.2)
  pulse.rotation.x = Math.PI / 2
  scene.add(pulse)
  allMeshes.push(pulse)

  return {
    type: 'status',
    progress: 0, duration: 0.6,
    targetX, colors, pulse, allMeshes,
  }
}

function updateStatus(effect) {
  const { progress, pulse } = effect
  const t = progress / effect.duration
  pulse.scale.setScalar(0.5 + t * 1.5)
  pulse.material.opacity = 0.5 * Math.sin(t * Math.PI)
  return progress >= effect.duration
}

// ── SHIELD ────────────────────────────────────────────────────────────────────

const SH_PRIMARY = '#3b82f6'
const SH_GLOW    = '#93c5fd'
const SH_BRIGHT  = '#dbeafe'

function spawnShield(robotX, scene) {
  const allMeshes = []

  const bubbleGeo = new THREE.SphereGeometry(0.95, 16, 12)
  const bubbleMat = new THREE.MeshBasicMaterial({ color: SH_GLOW, wireframe: true, transparent: true, opacity: 0 })
  const bubble = new THREE.Mesh(bubbleGeo, bubbleMat)
  bubble.position.set(robotX, 0.1, 0)
  scene.add(bubble)
  allMeshes.push(bubble)

  const shellGeo = new THREE.SphereGeometry(1.15, 8, 6)
  const shellMat = new THREE.MeshBasicMaterial({ color: SH_PRIMARY, wireframe: true, transparent: true, opacity: 0 })
  const shell = new THREE.Mesh(shellGeo, shellMat)
  shell.position.set(robotX, 0.1, 0)
  scene.add(shell)
  allMeshes.push(shell)

  const shieldLight = new THREE.PointLight(SH_PRIMARY, 0, 5)
  shieldLight.position.set(robotX, 0.2, 1.5)
  scene.add(shieldLight)
  allMeshes.push(shieldLight)

  const assemblySparks = Array.from({ length: 12 }, () => {
    const theta = Math.random() * Math.PI * 2
    const phi   = Math.acos(2 * Math.random() - 1)
    const r = 2.0
    const geo = new THREE.SphereGeometry(0.05, 4, 3)
    const mat = new THREE.MeshBasicMaterial({ color: SH_BRIGHT, transparent: true, opacity: 0.9 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(
      robotX + r * Math.sin(phi) * Math.cos(theta),
      0.1  + r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
    const vel = new THREE.Vector3(
      robotX - mesh.position.x,
      0.1    - mesh.position.y,
      0      - mesh.position.z,
    ).normalize().multiplyScalar(3.5)
    scene.add(mesh)
    allMeshes.push(mesh)
    return { mesh, vel }
  })

  // Orbit rings — created now, faded in during Phase 2
  const ringDefs = [
    { color: SH_PRIMARY, baseOp: 0.7, rotAxis: 'y', speed: 1.8, rx: 0 },
    { color: SH_GLOW,    baseOp: 0.5, rotAxis: 'z', speed: 1.4, rx: Math.PI / 2 },
    { color: SH_BRIGHT,  baseOp: 0.4, rotAxis: 'x', speed: 1.1, rx: Math.PI / 3 },
  ]
  const orbitRings = ringDefs.map(def => {
    const geo = new THREE.TorusGeometry(0.95, 0.025, 6, 48)
    const mat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0 })
    const ring = new THREE.Mesh(geo, mat)
    ring.position.set(robotX, 0.1, 0)
    ring.rotation.x = def.rx
    scene.add(ring)
    allMeshes.push(ring)
    return { mesh: ring, ...def }
  })

  return {
    type: 'shield',
    progress: 0, duration: 1.6,
    robotX,
    bubble, shell, shieldLight,
    assemblySparks,
    orbitRings,
    pulseWaves: [],
    dissolveParticles: [],
    finalRing: null,
    dissolveTriggered: false,
    allMeshes,
  }
}

function updateShield(effect, delta, scene) {
  const { progress, robotX, bubble, shell, shieldLight, assemblySparks, orbitRings } = effect

  // ── Phase 1: Materialize (0 → 0.4s) ──────────────────────────────────────
  if (progress < 0.4) {
    const t = progress / 0.4
    const eased = Math.pow(t, 0.5)
    bubble.scale.setScalar(eased)
    bubble.material.opacity = t * 0.55
    shell.scale.setScalar(t * 0.9 + 0.1)
    shell.material.opacity = t * 0.25
    shieldLight.intensity = t * 4

    for (const sp of assemblySparks) {
      sp.mesh.position.addScaledVector(sp.vel, delta)
      const dist = sp.mesh.position.distanceTo(new THREE.Vector3(robotX, 0.1, 0))
      sp.mesh.material.opacity = Math.max(0, Math.min(0.9, (dist - 0.2) / 1.8 * 0.9))
    }
  }

  // ── Phase 2: Pulse (0.4s → 1.1s) ─────────────────────────────────────────
  if (progress >= 0.4 && progress < 1.1) {
    bubble.material.opacity = Math.sin(progress * 8) * 0.15 + 0.45
    bubble.rotation.y += delta * 0.6

    shell.rotation.y -= delta * 0.4
    shell.rotation.x += delta * 0.2
    shell.material.opacity = 0.2

    shieldLight.intensity = Math.sin(progress * 7) * 1.5 + 3.0

    const phase2Age = progress - 0.4
    for (const ring of orbitRings) {
      const fadeIn = Math.min(phase2Age / 0.2, 1)
      ring.mesh.material.opacity = ring.baseOp * fadeIn
      ring.mesh.rotation[ring.rotAxis] += ring.speed * delta
    }

    // Spawn pulse waves at 0.4, 0.65, 0.9
    const waveTimes = [0.4, 0.65, 0.9]
    for (const wt of waveTimes) {
      if (progress >= wt && progress - delta < wt) {
        const geo = new THREE.TorusGeometry(0.05, 0.04, 6, 32)
        const mat = new THREE.MeshBasicMaterial({ color: SH_GLOW, transparent: true, opacity: 0.6 })
        const wave = new THREE.Mesh(geo, mat)
        wave.position.set(robotX, 0.1, 0)
        wave.scale.setScalar(1.0)
        scene.add(wave)
        effect.pulseWaves.push({ mesh: wave, born: progress })
        effect.allMeshes.push(wave)
      }
    }

    for (const pw of effect.pulseWaves) {
      const age = progress - pw.born
      const wt = Math.min(age / 0.25, 1)
      pw.mesh.scale.setScalar(1.0 + wt * 1.8)
      pw.mesh.material.opacity = 0.6 * (1 - wt)
    }
  }

  // ── Phase 3: Dissolve (1.1s → 1.6s) ─────────────────────────────────────
  if (progress >= 1.1 && !effect.dissolveTriggered) {
    effect.dissolveTriggered = true

    const disColors = [SH_PRIMARY, SH_GLOW, SH_BRIGHT]
    for (let i = 0; i < 20; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      const spd = 1.2 + Math.random() * 1.3
      const geo = new THREE.SphereGeometry(0.05, 4, 3)
      const mat = new THREE.MeshBasicMaterial({
        color: disColors[Math.floor(Math.random() * 3)],
        transparent: true, opacity: 0.9,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(
        robotX + 0.95 * Math.sin(phi) * Math.cos(theta),
        0.1   + 0.95 * Math.sin(phi) * Math.sin(theta),
        0.95  * Math.cos(phi)
      )
      const vel = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * spd,
        Math.sin(phi) * Math.sin(theta) * spd,
        Math.cos(phi) * spd,
      )
      scene.add(mesh)
      effect.dissolveParticles.push({ mesh, vel })
      effect.allMeshes.push(mesh)
    }

    const fGeo = new THREE.TorusGeometry(0.05, 0.04, 6, 32)
    const fMat = new THREE.MeshBasicMaterial({ color: SH_BRIGHT, transparent: true, opacity: 0.7 })
    const finalRing = new THREE.Mesh(fGeo, fMat)
    finalRing.position.set(robotX, 0.1, 0)
    finalRing.scale.setScalar(1.0)
    scene.add(finalRing)
    effect.finalRing = finalRing
    effect.allMeshes.push(finalRing)
  }

  if (progress >= 1.1) {
    const dAge = progress - 1.1
    const dt   = dAge / 0.5

    bubble.material.opacity = Math.max(0, 0.45 * (1 - dt))
    bubble.scale.setScalar(1.0 + dt * 0.35)
    shell.material.opacity  = Math.max(0, 0.2 * (1 - dt))
    shell.scale.setScalar(1.0 + dt * 0.35)
    shieldLight.intensity = Math.max(0, 3.0 * (1 - dt))
    for (const ring of orbitRings) ring.mesh.material.opacity = 0

    for (const dp of effect.dissolveParticles) {
      dp.mesh.position.addScaledVector(dp.vel, delta)
      dp.vel.y -= 0.4 * delta
      dp.mesh.material.opacity = Math.max(0, 0.9 * (1 - dAge / 0.4))
    }

    if (effect.finalRing) {
      const ft = Math.min(dAge / 0.35, 1)
      effect.finalRing.scale.setScalar(1.0 + ft * 2.5)
      effect.finalRing.material.opacity = 0.7 * (1 - ft)
    }
  }

  return progress >= effect.duration
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const PT_PRIMARY = '#22c55e'
const PT_GLOW    = '#4ade80'
const PT_BRIGHT  = '#bbf7d0'

function makePlusGroup(size, color, scene) {
  const group = new THREE.Group()
  const mat1 = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1.0 })
  const mat2 = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 1.0 })
  const hGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-size, 0, 0), new THREE.Vector3(size, 0, 0),
  ])
  const vGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, -size, 0), new THREE.Vector3(0, size, 0),
  ])
  const hLine = new THREE.Line(hGeo, mat1)
  const vLine = new THREE.Line(vGeo, mat2)
  group.add(hLine)
  group.add(vLine)
  scene.add(group)
  return { group, lines: [hLine, vLine] }
}

function spawnPatch(robotX, scene) {
  const allMeshes = []

  const glowLight = new THREE.PointLight(PT_PRIMARY, 0, 5)
  glowLight.position.set(robotX, 0.5, 1.5)
  scene.add(glowLight)
  allMeshes.push(glowLight)

  const auraGeo = new THREE.CylinderGeometry(0.15, 0.35, 2.5, 8, 1, true)
  const auraMat = new THREE.MeshBasicMaterial({ color: PT_PRIMARY, wireframe: true, transparent: true, opacity: 0 })
  const aura = new THREE.Mesh(auraGeo, auraMat)
  aura.position.set(robotX, 0.8, 0)
  scene.add(aura)
  allMeshes.push(aura)

  const ringGeo = new THREE.TorusGeometry(0.5, 0.03, 6, 32)
  const ringMat = new THREE.MeshBasicMaterial({ color: PT_GLOW, transparent: true, opacity: 0.8 })
  const baseRing = new THREE.Mesh(ringGeo, ringMat)
  baseRing.position.set(robotX, -0.4, 0)
  baseRing.rotation.x = Math.PI / 2
  baseRing.scale.setScalar(0.5)
  scene.add(baseRing)
  allMeshes.push(baseRing)

  return {
    type: 'patch',
    progress: 0, duration: 1.2,
    robotX,
    glowLight, aura, baseRing,
    plusParticles: [],
    nextSpawnTime: 0,
    allMeshes,
  }
}

function updatePatch(effect, delta, scene) {
  const { progress, robotX, glowLight, aura, baseRing } = effect

  // Glow light: ramp up over 0.2s, hold, ramp down over 0.3s at end
  if (progress < 0.2) {
    glowLight.intensity = (progress / 0.2) * 3
  } else if (progress > effect.duration - 0.3) {
    glowLight.intensity = ((effect.duration - progress) / 0.3) * 3
  } else {
    glowLight.intensity = 3
  }

  // Aura: fade in/out over full duration
  const auraT = progress / effect.duration
  aura.material.opacity = 0.3 * Math.sin(auraT * Math.PI)
  aura.rotation.y += delta * 1.2

  // Base ring: scale 0.5 → 2.0 over 0.4s, then opacity → 0
  if (progress < 0.4) {
    const t = progress / 0.4
    baseRing.scale.setScalar(0.5 + t * 1.5)
    baseRing.material.opacity = 0.8 * (1 - t)
  } else {
    baseRing.material.opacity = 0
  }

  // Spawn plus particles every 0.05s while progress < 0.7
  while (progress >= effect.nextSpawnTime && effect.nextSpawnTime < 0.7) {
    const sizes  = [0.06, 0.10, 0.13]
    const colors = [PT_GLOW, PT_GLOW, PT_PRIMARY, PT_PRIMARY, PT_PRIMARY, PT_BRIGHT]
    for (let i = 0; i < 8; i++) {
      const size = sizes[Math.floor(Math.random() * sizes.length)]
      const col  = colors[Math.floor(Math.random() * colors.length)]
      const { group, lines } = makePlusGroup(size, col, scene)
      group.position.set(
        robotX + (Math.random() - 0.5) * 0.7,
        -0.4,
        (Math.random() - 0.5) * 0.4
      )
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.8,
        1.8 + Math.random() * 1.7,
        (Math.random() - 0.5) * 0.4
      )
      const lifetime = 0.6 + Math.random() * 0.4
      effect.plusParticles.push({
        group, lines, vel,
        rotSpeed: (Math.random() - 0.5) * 6,
        spawnTime: effect.nextSpawnTime,
        lifetime,
      })
      effect.allMeshes.push(group)
    }
    effect.nextSpawnTime += 0.05
  }

  // Update active plus particles
  const dead = []
  for (const p of effect.plusParticles) {
    const age = progress - p.spawnTime
    if (age >= p.lifetime) { dead.push(p); continue }

    p.group.position.addScaledVector(p.vel, delta)
    p.vel.y -= 0.3 * delta
    p.group.rotation.z += p.rotSpeed * delta

    let op
    if (age < 0.15)                       op = age / 0.15
    else if (age > p.lifetime - 0.2)      op = (p.lifetime - age) / 0.2
    else                                  op = 1.0
    op = Math.max(0, Math.min(1, op))
    for (const ln of p.lines) ln.material.opacity = op
  }
  for (const p of dead) {
    scene.remove(p.group)
    p.group.traverse(child => {
      if (child.geometry) child.geometry.dispose()
      if (child.material) child.material.dispose()
    })
    effect.plusParticles.splice(effect.plusParticles.indexOf(p), 1)
  }

  return progress >= effect.duration
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function AttackEffects({ animStateA, animStateB, tierA, tierB }) {
  const { scene } = useThree()
  const effectsRef = useRef([])
  const prevAnimA = useRef('idle')
  const prevAnimB = useRef('idle')

  function spawnEffect(type, attackerX, defenderX, tierKey) {
    const colors = getTierColors(tierKey)
    let effect = null
    if (type === 'physical') effect = spawnPhysical(attackerX, defenderX, colors, scene)
    else if (type === 'software') effect = spawnSoftware(attackerX, defenderX, colors, scene)
    else if (type === 'hit')     effect = spawnHit(attackerX, colors, scene)
    else if (type === 'status')  effect = spawnStatus(attackerX, colors, scene)
    else if (type === 'shield')  effect = spawnShield(attackerX, scene)
    else if (type === 'patch')   effect = spawnPatch(attackerX, scene)
    if (effect) effectsRef.current.push(effect)
  }

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05)

    if (animStateA !== prevAnimA.current) {
      if (animStateA === 'physicalAttack')      spawnEffect('physical', -2.4,  2.4, tierA)
      else if (animStateA === 'softwareAttack') spawnEffect('software', -2.4,  2.4, tierA)
      else if (animStateA === 'hit')            spawnEffect('hit',      -2.4, null, tierA)
      else if (animStateA === 'statusEffect')   spawnEffect('status',   -2.4, null, tierA)
      else if (animStateA === 'shieldEffect')   spawnEffect('shield',   -2.4, null, tierA)
      else if (animStateA === 'patchEffect')    spawnEffect('patch',    -2.4, null, tierA)
      prevAnimA.current = animStateA
    }

    if (animStateB !== prevAnimB.current) {
      if (animStateB === 'physicalAttack')      spawnEffect('physical',  2.4, -2.4, tierB)
      else if (animStateB === 'softwareAttack') spawnEffect('software',  2.4, -2.4, tierB)
      else if (animStateB === 'hit')            spawnEffect('hit',       2.4, null, tierB)
      else if (animStateB === 'statusEffect')   spawnEffect('status',    2.4, null, tierB)
      else if (animStateB === 'shieldEffect')   spawnEffect('shield',    2.4, null, tierB)
      else if (animStateB === 'patchEffect')    spawnEffect('patch',     2.4, null, tierB)
      prevAnimB.current = animStateB
    }

    const toRemove = []
    for (const effect of effectsRef.current) {
      effect.progress += delta
      let done = false
      if (effect.type === 'physical') done = updatePhysical(effect, delta, scene)
      else if (effect.type === 'software') done = updateSoftware(effect, delta, scene)
      else if (effect.type === 'hit')     done = updateHit(effect)
      else if (effect.type === 'status')  done = updateStatus(effect)
      else if (effect.type === 'shield')  done = updateShield(effect, delta, scene)
      else if (effect.type === 'patch')   done = updatePatch(effect, delta, scene)
      if (done) toRemove.push(effect)
    }
    for (const e of toRemove) {
      cleanupEffect(e, scene)
      effectsRef.current.splice(effectsRef.current.indexOf(e), 1)
    }
  })

  useEffect(() => () => {
    for (const e of effectsRef.current) cleanupEffect(e, scene)
    effectsRef.current = []
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
