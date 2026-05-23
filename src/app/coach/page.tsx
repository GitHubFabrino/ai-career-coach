'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Brain, FileText, Mic, Map, Briefcase, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCoachStore } from '@/store/coach-store'
import ChatMessage from '@/features/coach/ChatMessage'
import TypingIndicator from '@/features/coach/TypingIndicator'
import CareerCard from '@/features/coach/CareerCard'
import ActionPlanView from '@/features/coach/ActionPlanView'
import CVAnalyzer from '@/features/coach/CVAnalyzer'
import InterviewSimulator from '@/features/coach/InterviewSimulator'
import type { Message } from '@/types'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div />,
})

type AppPhase = 'chat' | 'careers' | 'plan' | 'cv' | 'entretien'

function makeInitialMessage(): Message {
  return {
    id: 'init-' + Math.random().toString(36).slice(2),
    role: 'assistant',
    content:
      "Bonjour ! Je suis ton Coach Carrière IA. Je suis là pour t'aider à découvrir le parcours professionnel qui te correspond vraiment.\n\nCommençons par quelque chose de simple — comment tu t'appelles ?",
    timestamp: new Date(),
  }
}

const phaseNavItems: { id: AppPhase; label: string; icon: typeof MessageSquare; color: string }[] = [
  { id: 'chat',      label: 'Discussion',      icon: MessageSquare, color: '#a78bfa' },
  { id: 'careers',   label: 'Métiers',         icon: Briefcase,     color: '#60a5fa' },
  { id: 'plan',      label: 'Plan',            icon: Map,           color: '#34d399' },
  { id: 'cv',        label: 'Analyse CV',      icon: FileText,      color: '#fbbf24' },
  { id: 'entretien', label: 'Entretien',       icon: Mic,           color: '#f87171' },
]

export default function CoachPage() {
  const router = useRouter()
  const {
    messages, careers, selectedCareer, actionPlan, isAnalyzing,
    addMessage, setCareers, selectCareer, setActionPlan,
    setBlockerAnalysis, setIsAnalyzing, reset,
  } = useCoachStore()

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<AppPhase>('chat')
  const [dataPoints, setDataPoints] = useState(2)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (!initializedRef.current && messages.length === 0) {
      initializedRef.current = true
      addMessage(makeInitialMessage())
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() }
    addMessage(userMsg)
    setInput('')
    setIsLoading(true)
    setDataPoints((d) => Math.min(d + 3, 28))
    try {
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.blockerAnalysis) setBlockerAnalysis(data.blockerAnalysis)
      if (data.careers) {
        setIsAnalyzing(true)
        await new Promise((r) => setTimeout(r, 2000))
        setIsAnalyzing(false)
        setCareers(data.careers)
        setPhase('careers')
      }
      if (data.actionPlan) { setActionPlan(data.actionPlan); setPhase('plan') }
      if (data.reply) {
        addMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: data.reply, timestamp: new Date() })
      }
    } catch {
      addMessage({
        id: (Date.now() + 1).toString(), role: 'assistant',
        content: "J'ai rencontré un problème de connexion. Vérifie ta clé API dans .env.local et réessaie.",
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSelectCareer = async (career: Parameters<typeof selectCareer>[0]) => {
    selectCareer(career)
    setIsLoading(true)
    const selectionMsg: Message = {
      id: Date.now().toString(), role: 'user',
      content: `Je veux poursuivre la carrière de ${career.title}. Génère mon plan d'action personnalisé.`,
      timestamp: new Date(),
    }
    try {
      const allMessages = [...messages, selectionMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })
      const data = await res.json()
      if (data.actionPlan) setActionPlan(data.actionPlan)
      setPhase('plan')
    } catch {
      setPhase('plan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestart = () => {
    reset()
    setPhase('chat')
    setDataPoints(2)
    setInput('')
    initializedRef.current = false
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const hasResults = phase !== 'chat' && phase !== 'careers'
  const hasCareer = !!selectedCareer || !!actionPlan

  // Which nav tabs to show
  const visibleTabs = phaseNavItems.filter((item) => {
    if (item.id === 'chat') return true
    if (item.id === 'careers') return careers.length > 0 || phase === 'careers'
    if (item.id === 'plan') return !!actionPlan
    if (item.id === 'cv' || item.id === 'entretien') return hasCareer
    return false
  })

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Left sidebar ── */}
      <div className="hidden lg:flex flex-col w-80 flex-shrink-0 relative" style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        {/* 3D scene */}
        <div className="absolute inset-0">
          <HeroScene isAnalyzing={isAnalyzing || isLoading} dataPointCount={dataPoints} compact />
        </div>

        {/* Sidebar content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo + back */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 2px 12px rgba(124,58,237,0.4)' }}
              >
                <Brain size={15} className="text-white" />
              </div>
              <span className="font-bold text-sm text-white">Coach Carrière</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <ArrowLeft size={12} />
              Accueil
            </button>
          </div>

          {/* Navigation */}
          {visibleTabs.length > 1 && (
            <div className="px-4 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-4)' }}>Navigation</p>
              <div className="space-y-1">
                {visibleTabs.map((item) => {
                  const isActive = phase === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPhase(item.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: isActive ? `${item.color}15` : 'transparent',
                        border: isActive ? `1px solid ${item.color}25` : '1px solid transparent',
                        color: isActive ? item.color : 'var(--text-3)',
                      }}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Tools shortcuts */}
          {hasCareer && (
            <div className="px-4 mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-2 px-1" style={{ color: 'var(--text-4)' }}>Outils</p>
              <div className="space-y-1">
                <button
                  onClick={() => setPhase('cv')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: phase === 'cv' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                    border: phase === 'cv' ? '1px solid rgba(245,158,11,0.22)' : '1px solid rgba(255,255,255,0.06)',
                    color: phase === 'cv' ? '#fbbf24' : 'var(--text-3)',
                  }}
                >
                  <FileText size={14} />
                  Analyser mon CV
                </button>
                <button
                  onClick={() => setPhase('entretien')}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: phase === 'entretien' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.03)',
                    border: phase === 'entretien' ? '1px solid rgba(16,185,129,0.22)' : '1px solid rgba(255,255,255,0.06)',
                    color: phase === 'entretien' ? '#34d399' : 'var(--text-3)',
                  }}
                >
                  <Mic size={14} />
                  Simuler un entretien
                </button>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="mt-auto p-5">
            <AnimatePresence>
              {(isLoading || isAnalyzing) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-3 p-3 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}
                >
                  <div className="flex gap-1 mb-1.5 justify-center">
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1 h-3.5 rounded-full"
                        style={{ background: '#a78bfa' }}
                        animate={{ scaleY: [0.4, 1, 0.4] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-center font-medium" style={{ color: '#a78bfa' }}>
                    {isAnalyzing ? 'Analyse du profil…' : "Réflexion en cours…"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="flex items-center justify-between px-3 py-2 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="text-xs" style={{ color: 'var(--text-4)' }}>Données collectées</span>
              <span className="text-xs font-bold" style={{ color: '#a78bfa' }}>{dataPoints}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
        >
          <button
            onClick={() => router.push('/')}
            className="lg:hidden p-1.5 rounded-lg mr-1"
            style={{ color: 'var(--text-3)', background: 'rgba(255,255,255,0.04)' }}
          >
            <ArrowLeft size={16} />
          </button>

          <div
            className="lg:hidden w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Brain size={14} className="text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white">Coach Carrière IA</p>
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isAnalyzing || isLoading ? '#f59e0b' : '#10b981', animation: isAnalyzing || isLoading ? 'pulse 1s infinite' : 'none' }}
              />
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {isAnalyzing ? 'Analyse en cours…' : isLoading ? 'Réflexion…' : 'En ligne'}
              </p>
            </div>
          </div>

          {/* Mobile tab strip */}
          {visibleTabs.length > 1 && (
            <div className="lg:hidden flex gap-1">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPhase(item.id)}
                  className="p-2 rounded-xl transition-all"
                  style={{
                    background: phase === item.id ? `${item.color}18` : 'transparent',
                    color: phase === item.id ? item.color : 'var(--text-4)',
                  }}
                >
                  <item.icon size={15} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          <AnimatePresence mode="wait">

            {/* Chat */}
            {phase === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3 max-w-2xl mx-auto">
                {messages.map((msg, i) => (
                  <ChatMessage key={msg.id} message={msg} isLast={i === messages.length - 1 && msg.role === 'assistant'} />
                ))}
                {isLoading && <TypingIndicator isAnalyzing={isAnalyzing} />}
                <div ref={messagesEndRef} />
              </motion.div>
            )}

            {/* Careers */}
            {phase === 'careers' && (
              <motion.div key="careers" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                    style={{ background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.22)', color: '#60a5fa' }}
                  >
                    <Briefcase size={11} />
                    Résultats personnalisés
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Tes <span className="gradient-text">métiers idéaux</span>
                  </h2>
                  <p className="text-sm" style={{ color: 'var(--text-2)' }}>
                    Classés par compatibilité avec ton profil
                  </p>
                </div>
                <div className="space-y-4">
                  {careers.map((career, i) => (
                    <CareerCard key={career.title} career={career} index={i} selected={selectedCareer?.title === career.title} onSelect={() => handleSelectCareer(career)} />
                  ))}
                </div>
                {isLoading && (
                  <div className="mt-6 text-center p-4 rounded-2xl" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                    <p className="text-sm" style={{ color: '#a78bfa' }}>Génération de ta feuille de route…</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Plan */}
            {phase === 'plan' && actionPlan && (
              <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ActionPlanView plan={actionPlan} onRestart={handleRestart} />
              </motion.div>
            )}

            {/* CV */}
            {phase === 'cv' && (
              <motion.div key="cv" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <CVAnalyzer targetCareer={selectedCareer?.title || actionPlan?.careerTitle} onRestart={handleRestart} />
              </motion.div>
            )}

            {/* Interview */}
            {phase === 'entretien' && (
              <motion.div key="entretien" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <InterviewSimulator
                  targetCareer={selectedCareer?.title || actionPlan?.careerTitle || 'le poste visé'}
                  profile={{ name: undefined }}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input (chat only) ── */}
        {phase === 'chat' && (
          <div
            className="flex-shrink-0 px-4 md:px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
          >
            <div
              className="flex gap-3 items-end max-w-2xl mx-auto rounded-2xl p-3 transition-all focus-within:border-purple-500/30"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Écris ta réponse…"
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm outline-none resize-none placeholder:text-slate-600"
                style={{ color: 'var(--text)', maxHeight: 120, lineHeight: '1.6' }}
              />
              <motion.button
                whileHover={input.trim() && !isLoading ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.92 } : {}}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: input.trim() && !isLoading ? '0 2px 12px rgba(124,58,237,0.4)' : 'none',
                }}
              >
                <Send size={14} style={{ color: input.trim() && !isLoading ? 'white' : 'var(--text-4)' }} />
              </motion.button>
            </div>
            <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-4)' }}>
              Entrée pour envoyer · Shift+Entrée pour sauter une ligne
            </p>
          </div>
        )}

        {/* ── Mobile tool bar (plan / cv / entretien) ── */}
        {hasResults && (
          <div
            className="lg:hidden flex-shrink-0 px-4 py-3 flex gap-2"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <button
              onClick={() => setPhase('cv')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: phase === 'cv' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                border: phase === 'cv' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.07)',
                color: phase === 'cv' ? '#fbbf24' : 'var(--text-3)',
              }}
            >
              <FileText size={12} /> Analyser CV
            </button>
            <button
              onClick={() => setPhase('entretien')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: phase === 'entretien' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                border: phase === 'entretien' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                color: phase === 'entretien' ? '#34d399' : 'var(--text-3)',
              }}
            >
              <Mic size={12} /> Entretien
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
