import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { getTierColors } from './tierColors'
import RobotModel from './RobotModel'

export default function StandaloneRobotScene({
  robot,
  animationState = 'idle',
  side = 'left',
  width = 200,
  height = 240,
  interactive = false,
}) {
  if (!robot) return <div style={{ width, height }} />

  const colors = getTierColors(robot.tier || 'TIER_1')
  const cameraZ = width <= 220 ? 2.8 : width <= 300 ? 3.2 : 3.8
  const cameraY = 0.15

  return (
    <div style={{ width, height, display: 'inline-block', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, cameraY, cameraZ], fov: 38 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 4, 2]} intensity={0.8} />
        <pointLight position={[0, 2, 1]} intensity={0.4} color={colors.glow} />
        <RobotModel
          robot={robot}
          animationState={animationState}
          side={side}
        />
        {interactive && <OrbitControls enableZoom={false} enablePan={false} />}
      </Canvas>
    </div>
  )
}
