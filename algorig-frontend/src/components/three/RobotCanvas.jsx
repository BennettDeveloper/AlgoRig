import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

function SpinningCube() {
  const meshRef = useRef(null)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x += delta * 0.5
    meshRef.current.rotation.y += delta * 0.5
  })

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshBasicMaterial color="#ff6600" wireframe />
    </mesh>
  )
}

export default function RobotCanvas() {
  return (
    <div style={{ width: 400, height: 400, background: '#111', borderRadius: 12 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <SpinningCube />
      </Canvas>
    </div>
  )
}
