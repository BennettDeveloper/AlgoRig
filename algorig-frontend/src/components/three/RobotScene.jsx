import { useRef } from 'react'
import { View, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { getTierColors } from './tierColors'
import RobotModel from './RobotModel'

export default function RobotScene({
  robot,
  animationState = 'idle',
  side = 'left',
  width = 200,
  height = 240,
  interactive = false,
  disabled = false,
}) {
  const trackRef = useRef()
  const colors = getTierColors(robot?.tier || 'TIER_1')

  if (disabled) {
    return (
      <div style={{
        width, height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.3,
      }}>
        <span style={{ color: '#666', fontSize: 32 }}>⬡</span>
      </div>
    )
  }

  if (!robot) return <div style={{ width, height }} />

  const cameraZ = width <= 220 ? 2.2 : width <= 300 ? 2.6 : 3.2
  const cameraY = width <= 220 ? 0.1 : 0.15

  return (
    <div
      ref={trackRef}
      style={{ width, height, position: 'relative', display: 'inline-block' }}
    >
      <View track={trackRef} style={{ width, height }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />
        <pointLight
          position={[0, 2, 1]}
          intensity={0.4}
          color={colors.glow}
        />
        <PerspectiveCamera makeDefault position={[0, cameraY, cameraZ]} fov={42} />
        {robot && (
          <RobotModel
            robot={robot}
            animationState={animationState}
            side={side}
          />
        )}
        {interactive && (
          <OrbitControls enableZoom={false} enablePan={false} />
        )}
      </View>
    </div>
  )
}
