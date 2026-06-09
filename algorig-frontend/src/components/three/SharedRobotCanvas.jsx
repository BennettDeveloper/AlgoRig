import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'

export default function SharedRobotCanvas() {
  return (
    <Canvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      gl={{ alpha: true, antialias: true }}
      eventSource={document.getElementById('root')}
    >
      <View.Port />
    </Canvas>
  )
}
