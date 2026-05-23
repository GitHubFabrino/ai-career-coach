'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

type Props = {
  count?: number
  color?: string
}

export default function ParticleField({ count = 200, color = '#7c3aed' }: Props) {
  const meshRef = useRef<THREE.Points>(null)
  const { mouse } = useThree()
  const timeRef = useRef(0)

  const { positions, velocities, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      velocities[i * 3] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.01
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005
      phases[i] = Math.random() * Math.PI * 2
    }
    return { positions, velocities, phases }
  }, [count])

  const posRef = useRef(positions.slice())

  useFrame((_, delta) => {
    timeRef.current += delta
    const t = timeRef.current
    const geo = meshRef.current?.geometry

    if (!geo) return

    const pos = posRef.current
    const mx = mouse.x * 5
    const my = mouse.y * 3

    for (let i = 0; i < count; i++) {
      const ix = i * 3
      const iy = i * 3 + 1
      const iz = i * 3 + 2

      pos[ix] += velocities[ix] + Math.sin(t * 0.5 + phases[i]) * 0.002
      pos[iy] += velocities[iy] + Math.cos(t * 0.3 + phases[i]) * 0.002
      pos[iz] += velocities[iz]

      const dx = mx - pos[ix]
      const dy = my - pos[iy]
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 3) {
        pos[ix] -= dx * 0.003
        pos[iy] -= dy * 0.003
      }

      if (Math.abs(pos[ix]) > 10) velocities[ix] *= -1
      if (Math.abs(pos[iy]) > 6) velocities[iy] *= -1
      if (Math.abs(pos[iz]) > 4) velocities[iz] *= -1
    }

    const attr = geo.attributes.position as THREE.BufferAttribute
    attr.array.set(pos)
    attr.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color={color}
        size={0.04}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}
