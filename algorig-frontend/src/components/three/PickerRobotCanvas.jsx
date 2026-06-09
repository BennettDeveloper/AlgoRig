import { Canvas } from '@react-three/fiber'
import { View } from '@react-three/drei'

export default function PickerRobotCanvas() {
  return (
    <Canvas
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
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
