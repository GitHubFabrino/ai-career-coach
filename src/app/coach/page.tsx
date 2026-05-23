'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Brain, FileText, Mic, Map, Briefcase, MessageSquare, RotateCcw, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCoachStore } from '@/store/coach-store'
import ChatMessage from '@/features/coach/ChatMessage'
import TypingIndicator from '@/features/coach/TypingIndicator'
import CareerCard from '@/features/coach/CareerCard'
import ActionPlanView from '@/features/coach/ActionPlanView'
import CVAnalyzer from '@/features/coach/CVAnalyzer'
import InterviewSimulator from '@/features/coach/InterviewSimulator'
import JobOffers from '@/features/coach/JobOffers'
import LLMSelector from '@/features/coach/LLMSelector'
import type { Message } from '@/types'
import styles from './page.module.css'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div />,
})

type AppPhase = 'chat' | 'careers' | 'plan' | 'cv' | 'entretien' | 'offres'

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
  { id: 'chat',      label: 'Discussion',  icon: MessageSquare, color: '#a78bfa' },
  { id: 'careers',   label: 'Métiers',     icon: Briefcase,     color: '#60a5fa' },
  { id: 'plan',      label: 'Plan',        icon: Map,           color: '#34d399' },
  { id: 'cv',        label: 'Analyse CV',  icon: FileText,      color: '#fbbf24' },
  { id: 'entretien', label: 'Entretien',   icon: Mic,           color: '#f87171' },
  { id: 'offres',    label: 'Offres',      icon: Search,        color: '#60a5fa' },
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
  const [llm, setLLM] = useState({ provider: 'anthropic', modelId: 'claude-sonnet-4-6' })
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

  const resizeTextarea = () => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() }
    addMessage(userMsg)
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setIsLoading(true)
    setDataPoints((d) => Math.min(d + 3, 28))
    try {
      const allMessages = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages, provider: llm.provider, modelId: llm.modelId }),
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
        body: JSON.stringify({ messages: allMessages, provider: llm.provider, modelId: llm.modelId }),
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

  const hasResults = true
  const hasCareer = !!selectedCareer || !!actionPlan
  const progress = Math.min((dataPoints / 28) * 100, 100)

  const visibleTabs = phaseNavItems.filter((item) => {
    if (item.id === 'chat') return true
    if (item.id === 'careers') return careers.length > 0 || phase === 'careers'
    if (item.id === 'plan') return !!actionPlan
    if (item.id === 'cv' || item.id === 'entretien' || item.id === 'offres') return true
    return false
  })

  return (
    <div className={styles.pageWrapper}>

      {/* ══════════════════════════════════
          LEFT SIDEBAR (desktop)
      ══════════════════════════════════ */}
      <div className={styles.sidebar}>

        <div className={styles.sidebarBg}>
          <HeroScene isAnalyzing={isAnalyzing || isLoading} dataPointCount={dataPoints} compact />
        </div>

        <div className={styles.sidebarContent}>

          {/* ── Logo + back ── */}
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarLogo}>
              <div className={styles.sidebarLogoIcon}>
                <Brain size={15} style={{ color: 'white' }} />
              </div>
              <div className={styles.sidebarLogoText}>
                <span className={styles.sidebarLogoName}>Coach Carrière</span>
                <span className={styles.sidebarLogoBadge}>IA</span>
              </div>
            </div>
            <button onClick={() => router.push('/')} className={styles.sidebarBackBtn}>
              <ArrowLeft size={11} />
              Accueil
            </button>
          </div>

          {/* ── Navigation ── */}
          {visibleTabs.length > 1 && (
            <div className={styles.sidebarSection} style={{ paddingTop: '1rem' }}>
              <p className={styles.sidebarSectionLabel}>Navigation</p>
              <div className={styles.navList}>
                {visibleTabs.map((item) => {
                  const isActive = phase === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPhase(item.id)}
                      className={styles.navItem}
                      style={{
                        background: isActive ? `${item.color}14` : 'transparent',
                        border: isActive ? `1px solid ${item.color}22` : '1px solid transparent',
                        color: isActive ? item.color : 'var(--text-3)',
                      }}
                    >
                      <item.icon size={14} />
                      {item.label}
                      {isActive && (
                        <span className={styles.navItemDot} style={{ background: item.color }} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Tools ── */}
          {hasCareer && (
            <div className={styles.sidebarSection}>
              <p className={styles.sidebarSectionLabel}>Outils</p>
              <div className={styles.navList}>
                {[
                  { id: 'cv' as AppPhase,        label: 'Analyser mon CV',      icon: FileText, color: '#fbbf24', activeBg: 'rgba(245,158,11,0.1)',   activeBorder: 'rgba(245,158,11,0.2)'   },
                  { id: 'entretien' as AppPhase, label: 'Simuler un entretien', icon: Mic,      color: '#34d399', activeBg: 'rgba(16,185,129,0.1)',  activeBorder: 'rgba(16,185,129,0.2)'  },
                  { id: 'offres' as AppPhase,    label: 'Offres d\'emploi',     icon: Search,   color: '#60a5fa', activeBg: 'rgba(96,165,250,0.1)',  activeBorder: 'rgba(96,165,250,0.2)'  },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setPhase(tool.id)}
                    className={styles.navItem}
                    style={{
                      background: phase === tool.id ? tool.activeBg : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${phase === tool.id ? tool.activeBorder : 'rgba(255,255,255,0.06)'}`,
                      color: phase === tool.id ? tool.color : 'var(--text-3)',
                    }}
                  >
                    <tool.icon size={14} />
                    {tool.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LLM Selector ── */}
          <div className={styles.sidebarSection}>
            <p className={styles.sidebarSectionLabel}>Modèle IA</p>
            <LLMSelector onChange={(p, m) => setLLM({ provider: p, modelId: m })} />
          </div>

          {/* ── Status / Progress ── */}
          <div className={styles.sidebarBottom}>
            <AnimatePresence>
              {(isLoading || isAnalyzing) && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className={styles.aiStatusCard}
                >
                  <div className={styles.aiWaves}>
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        className={styles.aiWave}
                        animate={{ scaleY: [0.3, 1, 0.3] }}
                        transition={{ duration: 0.75, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                  <p className={styles.aiStatusText}>
                    {isAnalyzing ? 'Analyse du profil…' : 'Réflexion en cours…'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className={styles.progressCard}>
              <div className={styles.progressHeader}>
                <span className={styles.progressLabel}>Profil complété</span>
                <span className={styles.progressValue}>{Math.round(progress)}%</span>
              </div>
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressFill}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>

            <button onClick={handleRestart} className={styles.restartBtn}>
              <RotateCcw size={11} />
              Recommencer
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════ */}
      <div className={styles.mainContent}>

        {/* ── Mobile top header ── */}
        <div className={styles.mobileHeader}>
          <button onClick={() => router.push('/')} className={styles.mobileBackBtn}>
            <ArrowLeft size={15} />
          </button>

          <div className={styles.mobileBrainIcon}>
            <Brain size={14} style={{ color: 'white' }} />
          </div>

          <div className={styles.mobileTitleArea}>
            <p className={styles.mobileTitleText}>Coach Carrière IA</p>
            <div className={styles.mobileStatusRow}>
              <span
                className={styles.mobileStatusDot}
                style={{
                  background: isAnalyzing || isLoading ? '#f59e0b' : '#10b981',
                  animation: isAnalyzing || isLoading ? 'pulse 1s infinite' : 'none',
                }}
              />
              <p className={styles.mobileStatusText}>
                {isAnalyzing ? 'Analyse…' : isLoading ? 'Réflexion…' : 'En ligne'}
              </p>
            </div>
          </div>

          {visibleTabs.length > 1 && (
            <div className={styles.mobileTabBar}>
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setPhase(item.id)}
                  className={styles.mobileTabBtn}
                  style={{
                    background: phase === item.id ? `${item.color}18` : 'transparent',
                    color: phase === item.id ? item.color : 'var(--text-4)',
                  }}
                  title={item.label}
                >
                  <item.icon size={15} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content area ── */}
        <div className={styles.contentArea}>
          <AnimatePresence mode="wait">

            {/* Chat */}
            {phase === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.chatThread}
              >
                {messages.map((msg, i) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    isLast={i === messages.length - 1 && msg.role === 'assistant'}
                  />
                ))}
                {isLoading && <TypingIndicator isAnalyzing={isAnalyzing} />}
                <div ref={messagesEndRef} />
              </motion.div>
            )}

            {/* Careers */}
            {phase === 'careers' && (
              <motion.div
                key="careers"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={styles.careersView}
              >
                <div className={styles.careersHeader}>
                  <div className={styles.careersBadge}>
                    <Briefcase size={11} />
                    Résultats personnalisés
                  </div>
                  <h2 className={styles.careersTitle}>
                    Tes <span className="gradient-text">métiers idéaux</span>
                  </h2>
                  <p className={styles.careersSubtitle}>Classés par compatibilité avec ton profil</p>
                </div>
                <div className={styles.careersList}>
                  {careers.map((career, i) => (
                    <CareerCard
                      key={career.title}
                      career={career}
                      index={i}
                      selected={selectedCareer?.title === career.title}
                      onSelect={() => handleSelectCareer(career)}
                    />
                  ))}
                </div>
                {isLoading && (
                  <div className={styles.careersLoadingCard}>
                    <p className={styles.careersLoadingText}>Génération de ta feuille de route…</p>
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
                <CVAnalyzer
                  targetCareer={selectedCareer?.title || actionPlan?.careerTitle}
                  onRestart={handleRestart}
                  provider={llm.provider}
                  modelId={llm.modelId}
                />
              </motion.div>
            )}

            {/* Interview */}
            {phase === 'entretien' && (
              <motion.div key="entretien" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <InterviewSimulator
                  targetCareer={selectedCareer?.title || actionPlan?.careerTitle || 'le poste visé'}
                  profile={{ name: undefined }}
                  onRestart={handleRestart}
                  provider={llm.provider}
                  modelId={llm.modelId}
                />
              </motion.div>
            )}

            {/* Job offers */}
            {phase === 'offres' && (
              <motion.div key="offres" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <JobOffers
                  targetCareer={selectedCareer?.title || actionPlan?.careerTitle}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Chat input ── */}
        {phase === 'chat' && (
          <div className={styles.inputArea}>
            <div className={styles.inputWrapper}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); resizeTextarea() }}
                onKeyDown={handleKeyDown}
                placeholder="Écris ta réponse…"
                rows={1}
                disabled={isLoading}
                className={styles.inputTextarea}
              />
              <motion.button
                whileHover={input.trim() && !isLoading ? { scale: 1.08 } : {}}
                whileTap={input.trim() && !isLoading ? { scale: 0.92 } : {}}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className={styles.sendBtn}
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                    : 'rgba(255,255,255,0.06)',
                  boxShadow: input.trim() && !isLoading
                    ? '0 4px 20px rgba(124,58,237,0.5)'
                    : 'none',
                }}
              >
                <Send size={13} style={{ color: input.trim() && !isLoading ? 'white' : 'var(--text-4)' }} />
              </motion.button>
            </div>
            <div className={styles.inputFooter}>
              <span className={styles.inputHintPill}>↵ Envoyer</span>
              <span className={styles.inputHintSep}>·</span>
              <span className={styles.inputHintPill}>⇧ ↵ Nouvelle ligne</span>
            </div>
          </div>
        )}

        {/* ── Mobile tools bar ── */}
        {hasResults && (
          <div className={styles.mobileToolsBar}>
            <button
              onClick={() => setPhase('cv')}
              className={styles.mobileToolBtn}
              style={{
                background: phase === 'cv' ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                border: phase === 'cv' ? '1px solid rgba(245,158,11,0.25)' : '1px solid rgba(255,255,255,0.07)',
                color: phase === 'cv' ? '#fbbf24' : 'var(--text-3)',
              }}
            >
              <FileText size={13} /> Analyser CV
            </button>
            <button
              onClick={() => setPhase('entretien')}
              className={styles.mobileToolBtn}
              style={{
                background: phase === 'entretien' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)',
                border: phase === 'entretien' ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(255,255,255,0.07)',
                color: phase === 'entretien' ? '#34d399' : 'var(--text-3)',
              }}
            >
              <Mic size={13} /> Entretien
            </button>
            <button
              onClick={() => setPhase('offres')}
              className={styles.mobileToolBtn}
              style={{
                background: phase === 'offres' ? 'rgba(96,165,250,0.12)' : 'rgba(255,255,255,0.04)',
                border: phase === 'offres' ? '1px solid rgba(96,165,250,0.25)' : '1px solid rgba(255,255,255,0.07)',
                color: phase === 'offres' ? '#60a5fa' : 'var(--text-3)',
              }}
            >
              <Search size={13} /> Offres
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
