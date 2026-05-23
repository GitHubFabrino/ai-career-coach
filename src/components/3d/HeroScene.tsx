'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import NeuralNetwork from './NeuralNetwork'
import ParticleField from './ParticleField'

type Props = {
  isAnalyzing?: boolean
  dataPointCount?: number
  compact?: boolean
}

export default function HeroScene({
  isAnalyzing = false,
  dataPointCount = 5,
  compact = false,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 60 }}
      style={{ background: 'transparent' }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#7c3aed" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#3b82f6" />

        <Stars
          radius={50}
          depth={30}
          count={compact ? 500 : 1000}
          factor={2}
          fade
          speed={0.5}
        />

        <ParticleField count={compact ? 100 : 200} color="#7c3aed" />

        <NeuralNetwork
          nodeCount={compact ? 20 : 35}
          isAnalyzing={isAnalyzing}
          dataPointCount={dataPointCount}
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
      </Suspense>
    </Canvas>
  )
}
