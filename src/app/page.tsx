'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Zap, Target, Sparkles } from 'lucide-react'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    desc: 'ReAct agent analyzes your profile with deep insight',
  },
  {
    icon: Target,
    title: 'Career Matching',
    desc: 'Get 3 personalized career paths with match scores',
  },
  {
    icon: Zap,
    title: 'Instant Roadmap',
    desc: 'Receive a step-by-step action plan tailored to you',
  },
  {
    icon: Sparkles,
    title: 'Skill Gap Analysis',
    desc: 'Know exactly what to learn and where to start',
  },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#050510' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
        }}
      />

      <div className="absolute inset-0 pointer-events-none">
        <HeroScene dataPointCount={8} />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #3b82f6)' }}
          >
            <Brain size={16} className="text-white" />
          </div>
          <span className="font-semibold text-white">AI Career Coach</span>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => router.push('/coach')}
          className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
          style={{
            color: '#a78bfa',
            border: '1px solid rgba(124,58,237,0.4)',
          }}
        >
          Get Started
        </motion.button>
      </nav>

      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <Sparkles size={14} />
          Powered by Claude AI — ReAct Agent
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-6xl md:text-8xl font-bold leading-none tracking-tight mb-6"
          style={{ maxWidth: 900 }}
        >
          <span className="text-white">Discover your</span>
          <br />
          <span className="glow-text">ideal career</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl mb-12 max-w-xl leading-relaxed"
          style={{ color: '#94a3b8' }}
        >
          An immersive AI experience that understands your unique profile,
          suggests the perfect career paths, and builds your personal roadmap —
          in minutes.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05, y: -4 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push('/coach')}
          className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            border: '1px solid rgba(167,139,250,0.3)',
            boxShadow: '0 0 40px rgba(124,58,237,0.4)',
          }}
        >
          Start your journey
          <ArrowRight size={20} />
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-4 text-sm"
          style={{ color: '#475569' }}
        >
          Free · No signup required · Takes 5 minutes
        </motion.p>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              className="glass p-5 rounded-2xl"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              >
                <f.icon size={18} style={{ color: '#a78bfa' }} />
              </div>
              <h3 className="font-semibold text-sm text-white mb-1">{f.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: '#64748b' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
