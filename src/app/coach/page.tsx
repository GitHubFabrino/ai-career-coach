'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ArrowLeft, Brain } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCoachStore } from '@/store/coach-store'
import ChatMessage from '@/features/coach/ChatMessage'
import TypingIndicator from '@/features/coach/TypingIndicator'
import CareerCard from '@/features/coach/CareerCard'
import ActionPlanView from '@/features/coach/ActionPlanView'
import type { Message } from '@/types'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div />,
})

function makeInitialMessage(): Message {
  return {
    id: 'init-' + Math.random().toString(36).slice(2),
    role: 'assistant',
    content:
      "Bonjour ! Je suis ton Coach Carrière IA. Je suis là pour t'aider à découvrir le parcours professionnel qui te correspond vraiment.\n\nCommençons par quelque chose de simple — comment tu t'appelles ?",
    timestamp: new Date(),
  }
}

export default function CoachPage() {
  const router = useRouter()
  const {
    messages,
    careers,
    selectedCareer,
    actionPlan,
    isAnalyzing,
    addMessage,
    setCareers,
    selectCareer,
    setActionPlan,
    setBlockerAnalysis,
    setIsAnalyzing,
    reset,
  } = useCoachStore()

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [phase, setPhase] = useState<'chat' | 'careers' | 'plan'>('chat')
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

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    addMessage(userMsg)
    setInput('')
    setIsLoading(true)
    setDataPoints((d) => Math.min(d + 3, 28))

    try {
      const allMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()

      if (data.blockerAnalysis) {
        setBlockerAnalysis(data.blockerAnalysis)
      }

      if (data.careers) {
        setIsAnalyzing(true)
        await new Promise((r) => setTimeout(r, 2000))
        setIsAnalyzing(false)
        setCareers(data.careers)
        setPhase('careers')
      }

      if (data.actionPlan) {
        setActionPlan(data.actionPlan)
        setPhase('plan')
      }

      if (data.reply) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
          timestamp: new Date(),
        }
        addMessage(aiMsg)
      }
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          "J'ai rencontré un problème de connexion à mon moteur d'analyse. Vérifie ta clé API dans .env.local et réessaie.",
        timestamp: new Date(),
      }
      addMessage(errMsg)
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleSelectCareer = async (career: Parameters<typeof selectCareer>[0]) => {
    selectCareer(career)
    setIsLoading(true)

    const selectionMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Je veux poursuivre la carrière de ${career.title}. Génère mon plan d'action personnalisé.`,
      timestamp: new Date(),
    }

    try {
      const allMessages = [...messages, selectionMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages }),
      })

      const data = await res.json()

      if (data.actionPlan) {
        setActionPlan(data.actionPlan)
      }

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
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050510' }}>
      {/* Left panel — 3D */}
      <div className="hidden lg:flex flex-col w-96 flex-shrink-0 relative">
        <div
          className="absolute inset-0"
          style={{
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        />
        <div className="absolute inset-0">
          <HeroScene
            isAnalyzing={isAnalyzing || isLoading}
            dataPointCount={dataPoints}
            compact
          />
        </div>

        <div className="relative z-10 p-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft size={14} />
            Retour
          </button>
        </div>

        <div className="relative z-10 mt-auto p-6">
          <AnimatePresence>
            {(isLoading || isAnalyzing) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <p className="text-xs font-medium" style={{ color: '#a78bfa' }}>
                  {isAnalyzing ? 'Analyse de ton profil…' : "L'IA réfléchit…"}
                </p>
                <div className="flex justify-center gap-1 mt-2">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{ background: '#7c3aed' }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4 text-center">
            <p className="text-xs" style={{ color: '#334155' }}>
              {dataPoints} données collectées
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — Chat / Results */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="flex items-center gap-3 px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => router.push('/')}
            className="lg:hidden flex items-center gap-1 text-sm mr-2"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft size={14} />
          </button>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
          >
            <Brain size={14} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Coach Carrière IA</p>
            <p className="text-xs" style={{ color: '#475569' }}>
              {isAnalyzing
                ? 'Analyse en cours…'
                : isLoading
                ? 'Réflexion…'
                : 'En ligne'}
            </p>
          </div>

          {phase !== 'chat' && (
            <div className="ml-auto flex gap-2">
              {['chat', 'careers', 'plan'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p as typeof phase)}
                  className="px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize"
                  style={{
                    background: phase === p ? 'rgba(124,58,237,0.2)' : 'transparent',
                    color: phase === p ? '#a78bfa' : '#475569',
                    border: '1px solid',
                    borderColor: phase === p ? 'rgba(124,58,237,0.4)' : 'transparent',
                  }}
                >
                  {p === 'careers' ? 'Métiers' : p === 'plan' ? 'Feuille de route' : 'Discussion'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <AnimatePresence mode="wait">
            {phase === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 max-w-2xl mx-auto"
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

            {phase === 'careers' && (
              <motion.div
                key="careers"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-2xl mx-auto"
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Tes métiers idéaux
                  </h2>
                  <p className="text-sm" style={{ color: '#64748b' }}>
                    Basé sur ton profil, voici tes 3 meilleures pistes
                  </p>
                </div>

                <div className="space-y-4">
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
                  <div className="mt-6 text-center">
                    <p className="text-sm" style={{ color: '#a78bfa' }}>
                      Génération de ta feuille de route…
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {phase === 'plan' && actionPlan && (
              <motion.div
                key="plan"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ActionPlanView plan={actionPlan} onRestart={handleRestart} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input */}
        {phase === 'chat' && (
          <div
            className="flex-shrink-0 px-6 py-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex gap-3 items-end max-w-2xl mx-auto rounded-2xl p-3"
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
                className="flex-1 bg-transparent text-sm outline-none resize-none"
                style={{
                  color: '#e2e8f0',
                  maxHeight: 120,
                  lineHeight: '1.5',
                }}
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  background:
                    input.trim() && !isLoading
                      ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
                      : 'rgba(255,255,255,0.06)',
                }}
              >
                <Send size={14} style={{ color: input.trim() && !isLoading ? 'white' : '#475569' }} />
              </motion.button>
            </div>
            <p className="text-center text-xs mt-2" style={{ color: '#334155' }}>
              Entrée pour envoyer · Shift+Entrée pour un saut de ligne
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
