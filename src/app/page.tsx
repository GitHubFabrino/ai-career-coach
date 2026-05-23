'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Zap, Target, Sparkles, FileText, Mic, Shield } from 'lucide-react'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
})

const features = [
  {
    icon: Brain,
    color: '#a78bfa',
    glow: 'rgba(124,58,237,0.25)',
    title: 'Analyse IA profonde',
    desc: 'Un agent ReAct analyse ton profil avec une précision chirurgicale pour te révéler tes vraies forces.',
  },
  {
    icon: Target,
    color: '#60a5fa',
    glow: 'rgba(59,130,246,0.25)',
    title: 'Métiers sur mesure',
    desc: '3 parcours personnalisés avec un score de compatibilité basé sur tes compétences et objectifs.',
  },
  {
    icon: FileText,
    color: '#fbbf24',
    glow: 'rgba(245,158,11,0.25)',
    title: 'Analyse de CV',
    desc: 'Détection automatique de tes compétences et feedback personnalisé pour optimiser ton CV.',
  },
  {
    icon: Mic,
    color: '#34d399',
    glow: 'rgba(16,185,129,0.25)',
    title: 'Simulation vocale',
    desc: 'Entraîne-toi à l\'oral avec un entretien IA interactif et reçois un feedback en temps réel.',
  },
  {
    icon: Zap,
    color: '#f472b6',
    glow: 'rgba(236,72,153,0.25)',
    title: 'Plan d\'action',
    desc: 'Une feuille de route concrète étape par étape avec les ressources gratuites adaptées.',
  },
  {
    icon: Sparkles,
    color: '#818cf8',
    glow: 'rgba(99,102,241,0.25)',
    title: 'Coaching psychologique',
    desc: 'Identification des blocages et conseils pour surmonter la peur, le manque de confiance, le perfectionnisme.',
  },
]

const stats = [
  { value: '10+', label: 'Filières disponibles' },
  { value: '8', label: 'Rôles de coaching' },
  { value: '100%', label: 'Gratuit & sans inscription' },
  { value: '5 min', label: 'Pour un plan complet' },
]

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.4) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
        <div
          className="absolute top-1/3 -left-40 w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(59,130,246,0.5) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse, rgba(16,185,129,0.4) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* 3D scene */}
      <div className="absolute inset-0 pointer-events-none">
        <HeroScene dataPointCount={8} />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-10 py-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
            }}
          >
            <Brain size={17} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-tight">Coach Carrière</span>
            <span
              className="text-xs ml-1 px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa' }}
            >
              IA
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs"
            style={{
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.2)',
              color: '#34d399',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Propulsé par Claude AI
          </div>
          <button
            onClick={() => router.push('/coach')}
            className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.35)',
              color: '#a78bfa',
            }}
          >
            Commencer
          </button>
        </motion.div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 md:pt-24 pb-20">

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-10 text-xs font-semibold tracking-wide uppercase"
          style={{
            background: 'rgba(124,58,237,0.12)',
            border: '1px solid rgba(124,58,237,0.25)',
            color: '#c4b5fd',
            letterSpacing: '0.08em',
          }}
        >
          <Sparkles size={12} />
          Agent ReAct · Madagascar & Océan Indien
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-black leading-[1.05] tracking-tight mb-6"
          style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)', maxWidth: 900 }}
        >
          <span className="text-white block">Découvre ta</span>
          <span className="glow-text block">voie idéale</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-base md:text-xl mb-10 max-w-lg leading-relaxed"
          style={{ color: 'var(--text-2)' }}
        >
          Une IA de coaching qui comprend ton profil, détecte tes blocages,
          te propose les meilleurs parcours et construit ta feuille de route — en quelques minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.04, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/coach')}
            className="btn-primary flex items-center gap-3 px-8 py-4 rounded-2xl text-base"
          >
            Commencer mon parcours
            <ArrowRight size={18} />
          </motion.button>

          <div
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--text-3)' }}
          >
            <Shield size={14} style={{ color: 'var(--text-4)' }} />
            Gratuit · Sans inscription · 5 minutes
          </div>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 md:gap-10 mt-2"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{s.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Features grid */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 pb-28">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-10"
        >
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-3)' }}>
            Ce que fait ton coach
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            Tout ce dont tu as besoin, au même endroit
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 + i * 0.08 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="glass group p-6 rounded-2xl relative overflow-hidden cursor-default"
              style={{ transition: 'box-shadow 0.3s' }}
            >
              {/* Glow on hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 30% 30%, ${f.glow}, transparent 70%)` }}
              />

              <div
                className="relative w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${f.glow}`, border: `1px solid ${f.color}30` }}
              >
                <f.icon size={18} style={{ color: f.color }} />
              </div>

              <h3 className="relative font-semibold text-white mb-2">{f.title}</h3>
              <p className="relative text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="text-center mt-14"
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push('/coach')}
            className="btn-primary inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-base"
          >
            Commencer gratuitement
            <ArrowRight size={18} />
          </motion.button>
          <p className="text-xs mt-4" style={{ color: 'var(--text-4)' }}>
            Propulsé par Claude Sonnet — Anthropic
          </p>
        </motion.div>
      </div>
    </div>
  )
}
