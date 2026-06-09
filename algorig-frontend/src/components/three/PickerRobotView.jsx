import { useRef } from 'react'
import { View, PerspectiveCamera } from '@react-three/drei'
import { getTierColors } from './tierColors'
import RobotModel from './RobotModel'

export default function PickerRobotView({ robot, width = 120, height = 130 }) {
  const trackRef = useRef()

  if (!robot) return <div style={{ width, height }} />

  const colors = getTierColors(robot.tier || 'TIER_1')

  return (
    <div
      ref={trackRef}
      style={{
        width,
        height,
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <View track={trackRef} style={{ width, height }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />
        <pointLight
          position={[0, 2, 1]}
          intensity={0.4}
          color={colors.glow}
        />
        <PerspectiveCamera makeDefault position={[0, 0.1, 2.2]} fov={42} />
        <RobotModel
          robot={robot}
          animationState="idle"
          side="left"
        />
      </View>
    </div>
  )
}
