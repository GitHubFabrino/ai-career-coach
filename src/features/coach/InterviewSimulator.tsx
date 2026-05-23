'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, ChevronRight, Award, RefreshCw, ArrowRight, Lightbulb, Play } from 'lucide-react'
import type { InterviewQuestion, InterviewAnswer, InterviewSession } from '@/types'

type Props = {
  targetCareer: string
  profile?: { name?: string }
  onRestart: () => void
}

type FinalResult = {
  finalScore: number
  finalFeedback: string
  topStrengths: string[]
  priorityActions: string[]
}

type SpeechRecognitionEvent = {
  results: { [index: number]: { [index: number]: { transcript: string } } }
  resultIndex: number
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

type SpeechRecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: (event: SpeechRecognitionEvent) => void
  onend: () => void
  onerror: () => void
  start: () => void
  stop: () => void
}

const categoryConfig = {
  motivation:     { label: 'Motivation',     color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  technique:      { label: 'Technique',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  comportemental: { label: 'Comportemental', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  situationnel:   { label: 'Situationnel',   color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
}

const scoreColor = (s: number) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

export default function InterviewSimulator({ targetCareer, profile, onRestart }: Props) {
  const [session, setSession] = useState<InterviewSession>({
    questions: [], answers: [], currentQuestionIndex: 0, status: 'idle',
  })
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null)
  const [loadingMsg, setLoadingMsg] = useState('')
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  useEffect(() => {
    const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null
    if (!SR) setSpeechSupported(false)
  }, [])

  const startInterview = async () => {
    setLoadingMsg('Génération des questions…')
    setSession((s) => ({ ...s, status: 'questioning' }))
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate_questions', career: targetCareer, profile }),
      })
      const data = await res.json()
      setSession((s) => ({ ...s, questions: data.questions, currentQuestionIndex: 0, answers: [], status: 'questioning' }))
    } catch {
      setSession((s) => ({ ...s, status: 'idle' }))
    } finally {
      setLoadingMsg('')
    }
  }

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.lang = 'fr-FR'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let text = ''
      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        text += event.results[i][0].transcript
      }
      setTranscript(text)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
    setSession((s) => ({ ...s, status: 'listening' }))
  }, [])

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setSession((s) => ({ ...s, status: 'questioning' }))
  }

  const submitAnswer = async () => {
    const currentQ = session.questions[session.currentQuestionIndex]
    if (!currentQ || !transcript.trim()) return
    setSession((s) => ({ ...s, status: 'evaluating' }))
    setLoadingMsg('Évaluation de ta réponse…')
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'evaluate_answer', career: targetCareer, question: currentQ, answer: transcript }),
      })
      const data = await res.json()
      const newAnswers = [...session.answers, data.evaluation]
      const isLast = session.currentQuestionIndex >= session.questions.length - 1
      if (isLast) {
        setLoadingMsg('Génération du bilan final…')
        const finalRes = await fetch('/api/interview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'final_feedback', career: targetCareer, answers: newAnswers }),
        })
        const finalData = await finalRes.json()
        setFinalResult(finalData)
        setSession((s) => ({ ...s, answers: newAnswers, status: 'done' }))
      } else {
        setSession((s) => ({ ...s, answers: newAnswers, currentQuestionIndex: s.currentQuestionIndex + 1, status: 'questioning' }))
        setTranscript('')
        setShowHint(false)
      }
    } catch {
      setSession((s) => ({ ...s, status: 'questioning' }))
    } finally {
      setLoadingMsg('')
    }
  }

  const currentQ = session.questions[session.currentQuestionIndex]
  const lastAnswer = session.answers[session.currentQuestionIndex - 1]
  const progress = session.questions.length > 0 ? (session.answers.length / session.questions.length) * 100 : 0

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}
          >
            <Mic size={11} />
            Simulation d'entretien vocal
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Entretien <span className="gradient-text">simulé</span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
          Poste visé : <span style={{ color: '#a78bfa' }}>{targetCareer}</span>
        </p>
      </motion.div>

      {/* IDLE */}
      {session.status === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
          <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-white mb-4">Comment ça marche</p>
            <ol className="space-y-3">
              {[
                { n: '01', t: "L'IA génère 5 questions pour ton poste" },
                { n: '02', t: 'Tu réponds avec le micro (voix → texte)' },
                { n: '03', t: 'Score et conseils après chaque réponse' },
                { n: '04', t: 'Bilan final avec tes forces et axes d\'amélioration' },
              ].map(({ n, t }) => (
                <li key={n} className="flex items-center gap-4">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa' }}
                  >
                    {n}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--text-2)' }}>{t}</span>
                </li>
              ))}
            </ol>
            {!speechSupported && (
              <div className="mt-4 p-3 rounded-xl text-xs" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                Ton navigateur ne supporte pas la reconnaissance vocale. Utilise Chrome ou Edge, ou tape ta réponse à la place.
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={startInterview}
            className="btn-primary w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}
          >
            <Play size={16} />
            Démarrer l'entretien
          </motion.button>
        </motion.div>
      )}

      {/* LOADING */}
      {loadingMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="flex justify-center gap-1.5 mb-4">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-6 rounded-full"
                style={{ background: '#10b981' }}
                animate={{ scaleY: [0.4, 1, 0.4] }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
              />
            ))}
          </div>
          <p className="text-sm font-medium" style={{ color: '#34d399' }}>{loadingMsg}</p>
        </motion.div>
      )}

      {/* QUESTIONING / LISTENING */}
      {!loadingMsg && (session.status === 'questioning' || session.status === 'listening') && currentQ && (
        <AnimatePresence mode="wait">
          <motion.div
            key={session.currentQuestionIndex}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            className="space-y-4"
          >
            {/* Progress */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium tabular-nums" style={{ color: 'var(--text-3)' }}>
                {session.currentQuestionIndex + 1} / {session.questions.length}
              </span>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }} animate={{ width: `${progress}%` }} />
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: categoryConfig[currentQ.category].bg, color: categoryConfig[currentQ.category].color }}
              >
                {categoryConfig[currentQ.category].label}
              </span>
            </div>

            {/* Last answer feedback */}
            {lastAnswer && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-2xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: '#34d399' }}>Réponse précédente</p>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(lastAnswer.score) }}>{lastAnswer.score}/100</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{lastAnswer.feedback}</p>
              </motion.div>
            )}

            {/* Question */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-bold text-white text-lg leading-relaxed mb-4">{currentQ.question}</p>
              <button
                onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: showHint ? '#fbbf24' : 'var(--text-4)' }}
              >
                <Lightbulb size={12} />
                {showHint ? 'Masquer le conseil' : 'Voir un conseil'}
              </button>
              <AnimatePresence>
                {showHint && currentQ.hint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs mt-2 leading-relaxed"
                    style={{ color: '#fbbf24' }}
                  >
                    {currentQ.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Transcript */}
            <div
              className="p-4 rounded-2xl min-h-20 transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isListening ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)'}`,
                boxShadow: isListening ? '0 0 0 3px rgba(16,185,129,0.08)' : 'none',
              }}
            >
              {isListening && (
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-red-400"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className="text-xs font-medium" style={{ color: '#34d399' }}>Enregistrement en cours…</span>
                </div>
              )}
              {transcript ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{transcript}</p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                  {isListening ? 'Parle maintenant, je t\'écoute.' : 'Ta réponse apparaîtra ici'}
                </p>
              )}
            </div>

            {/* Fallback textarea */}
            {!speechSupported && (
              <textarea
                rows={3}
                placeholder="Tape ta réponse ici…"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="w-full rounded-xl p-3 text-sm outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)' }}
              />
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {speechSupported && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={isListening ? stopListening : startListening}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isListening ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
                    color: isListening ? '#f87171' : '#34d399',
                  }}
                >
                  {isListening ? (
                    <><motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}><MicOff size={15} /></motion.div>Arrêter</>
                  ) : (
                    <><Mic size={15} />{transcript ? 'Réenregistrer' : 'Parler'}</>
                  )}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={submitAnswer}
                disabled={!transcript.trim()}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: transcript.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  color: transcript.trim() ? 'white' : 'var(--text-4)',
                  boxShadow: transcript.trim() ? '0 4px 16px rgba(124,58,237,0.3)' : 'none',
                }}
              >
                <ChevronRight size={15} />
                Soumettre
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* DONE */}
      {session.status === 'done' && finalResult && !loadingMsg && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Final score */}
          <div
            className="p-6 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: `rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.07)`,
              border: `1px solid rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.2)`,
            }}
          >
            <Award size={32} className="mx-auto mb-3" style={{ color: scoreColor(finalResult.finalScore) }} />
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: scoreColor(finalResult.finalScore), opacity: 0.7 }}>Score final</p>
            <p className="font-black" style={{ fontSize: 64, lineHeight: 1, color: scoreColor(finalResult.finalScore) }}>
              {finalResult.finalScore}<span className="text-2xl">/100</span>
            </p>
            <p className="text-sm mt-4 leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-2)' }}>{finalResult.finalFeedback}</p>
          </div>

          {/* Per-question scores */}
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="text-sm font-bold text-white mb-4">Détail par question</h4>
            <div className="space-y-3">
              {session.answers.map((a, i) => (
                <div key={a.questionId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                      Q{i + 1} — {session.questions[i]?.question.slice(0, 40)}…
                    </span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(a.score) }}>{a.score}/100</span>
                  </div>
                  <div className="w-full h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <div className="h-full rounded-full" style={{ width: `${a.score}%`, background: scoreColor(a.score) }} />
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>{a.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & actions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#34d399' }}>Points forts</h4>
              <ul className="space-y-1.5">
                {finalResult.topStrengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                    <span className="mt-0.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#a78bfa' }}>À travailler</h4>
              <ul className="space-y-1.5">
                {finalResult.priorityActions.map((s, i) => (
                  <li key={s} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-2)' }}>
                    <span className="flex-shrink-0 font-bold" style={{ color: '#a78bfa' }}>{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setSession({ questions: [], answers: [], currentQuestionIndex: 0, status: 'idle' }); setFinalResult(null); setTranscript('') }}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399' }}
            >
              <RefreshCw size={13} /> Recommencer l'entretien
            </button>
            <button
              onClick={onRestart}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-3)' }}
            >
              <ArrowRight size={13} /> Explorer une autre carrière
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
