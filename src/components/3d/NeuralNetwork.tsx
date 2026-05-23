'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type NodeData = {
  position: THREE.Vector3
  phase: number
  active: boolean
}

type Props = {
  nodeCount?: number
  isAnalyzing?: boolean
  dataPointCount?: number
}

export default function NeuralNetwork({
  nodeCount = 30,
  isAnalyzing = false,
  dataPointCount = 0,
}: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const linesRef = useRef<THREE.LineSegments>(null)
  const timeRef = useRef(0)

  const nodes = useMemo<NodeData[]>(() => {
    return Array.from({ length: nodeCount }, (_, i) => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 4
      ),
      phase: Math.random() * Math.PI * 2,
      active: i < dataPointCount,
    }))
  }, [nodeCount, dataPointCount])

  const { linePositions, lineColors } = useMemo(() => {
    const positions: number[] = []
    const colors: number[] = []
    const maxDist = 3.5

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = nodes[i].position.distanceTo(nodes[j].position)
        if (dist < maxDist) {
          positions.push(
            nodes[i].position.x, nodes[i].position.y, nodes[i].position.z,
            nodes[j].position.x, nodes[j].position.y, nodes[j].position.z
          )
          const alpha = 1 - dist / maxDist
          colors.push(0.4, 0.3, 1, 0.3, 0.6, 1)
          void alpha
        }
      }
    }
    return { linePositions: new Float32Array(positions), lineColors: new Float32Array(colors) }
  }, [nodes])

  const sphereRefs = useRef<THREE.Mesh[]>([])

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current

    if (groupRef.current) {
      groupRef.current.rotation.y += delta * (isAnalyzing ? 0.4 : 0.1)
      groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.1
    }

    sphereRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      const node = nodes[i]
      const pulse = Math.sin(t * 2 + node.phase) * 0.5 + 0.5
      const isActive = i < dataPointCount

      const mat = mesh.material as THREE.MeshStandardMaterial
      if (isActive) {
        mat.emissiveIntensity = isAnalyzing ? pulse * 2 : pulse * 0.8
        mat.color.setRGB(0.4 + pulse * 0.3, 0.3, 1)
        mat.emissive.setRGB(0.4 + pulse * 0.3, 0.2, 1)
      } else {
        mat.emissiveIntensity = pulse * 0.2
        mat.color.setRGB(0.2, 0.2, 0.4)
        mat.emissive.setRGB(0.1, 0.1, 0.3)
      }

      const baseScale = isActive ? 0.12 : 0.06
      const scaleBoost = isAnalyzing && isActive ? pulse * 0.08 : 0
      mesh.scale.setScalar(baseScale + scaleBoost)
    })

    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial
      mat.opacity = isAnalyzing ? 0.5 + Math.sin(t * 3) * 0.2 : 0.15
    }
  })

  return (
    <group ref={groupRef}>
      {nodes.map((node, i) => (
        <mesh
          key={i}
          position={node.position}
          ref={(el) => { if (el) sphereRefs.current[i] = el }}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial
            color={i < dataPointCount ? '#6644ff' : '#222244'}
            emissive={i < dataPointCount ? '#4422ff' : '#111133'}
            emissiveIntensity={0.3}
            transparent
            opacity={i < dataPointCount ? 0.9 : 0.4}
          />
        </mesh>
      ))}

      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[linePositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[lineColors, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
