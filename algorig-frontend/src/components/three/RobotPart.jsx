import { useMemo, useRef, useEffect } from 'react'
import { EdgesGeometry } from 'three'

export default function RobotPart({ geometry, color, position, rotation = [0, 0, 0] }) {
  const matRef = useRef()
  const edges  = useMemo(() => new EdgesGeometry(geometry), [geometry])

  useEffect(() => {
    if (matRef.current) matRef.current.color.set(color)
  }, [color])

  useEffect(() => {
    return () => edges.dispose()
  }, [edges])

  return (
    <lineSegments position={position} rotation={rotation}>
      <primitive object={edges} />
      <lineBasicMaterial ref={matRef} color={color} />
    </lineSegments>
  )
}
