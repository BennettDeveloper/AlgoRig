import { Canvas } from '@react-three/fiber'
import { getTierColors } from './tierColors'
import RobotModel from './RobotModel'
import AttackEffects from './AttackEffects'

export default function BattleScene({
  robotA, robotB,
  animStateA = 'idle', animStateB = 'idle',
  width = 700, height = 300
}) {
  return (
    <div style={{ width, height, position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0.2, 6.5], fov: 44 }}
        gl={{ alpha: true, antialias: true }}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[0, 5, 3]} intensity={0.7} />
        <pointLight
          position={[-2, 2, 2]} intensity={0.3}
          color={getTierColors(robotA?.tier || 'TIER_1').glow}
        />
        <pointLight
          position={[2, 2, 2]} intensity={0.3}
          color={getTierColors(robotB?.tier || 'TIER_1').glow}
        />
        {robotA && (
          <group position={[-2.4, 0, 0]}>
            <RobotModel
              robot={robotA}
              animationState={['shieldEffect','patchEffect'].includes(animStateA) ? 'statusEffect' : animStateA}
              side="left"
            />
          </group>
        )}
        {robotB && (
          <group position={[2.4, 0, 0]}>
            <RobotModel
              robot={robotB}
              animationState={['shieldEffect','patchEffect'].includes(animStateB) ? 'statusEffect' : animStateB}
              side="right"
            />
          </group>
        )}
        <AttackEffects
          animStateA={animStateA}
          animStateB={animStateB}
          tierA={robotA?.tier || 'TIER_1'}
          tierB={robotB?.tier || 'TIER_1'}
        />
      </Canvas>
    </div>
  )
}
