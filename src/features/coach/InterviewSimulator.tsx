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
  technique:      { label: 'Technique',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  comportemental: { label: 'Comportemental', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  situationnel:   { label: 'Situationnel',   color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
}

const scoreColor = (s: number) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'

function ScoreRing({ score, color, size = 100 }: { score: number; color: string; size?: number }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: 'easeOut', delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black text-xl tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[10px] font-bold" style={{ color, opacity: 0.7 }}>/100</span>
      </div>
    </div>
  )
}

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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)', color: '#34d399' }}>
          <Mic size={11} /> Simulation d&apos;entretien vocal
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
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
            <p className="font-bold text-white mb-5 font-display">Comment ça marche</p>
            <ol className="space-y-4">
              {[
                { n: '01', t: "L'IA génère 5 questions ciblées pour ton poste" },
                { n: '02', t: 'Tu réponds avec le micro (voix → texte automatique)' },
                { n: '03', t: 'Score et conseils personnalisés après chaque réponse' },
                { n: '04', t: 'Bilan final avec tes forces et axes d\'amélioration' },
              ].map(({ n, t }) => (
                <li key={n} className="flex items-center gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black font-display"
                    style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.2)' }}>
                    {n}
                  </span>
                  <span className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{t}</span>
                </li>
              ))}
            </ol>
            {!speechSupported && (
              <div className="mt-5 p-3 rounded-xl text-xs"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24' }}>
                ⚠️ Ton navigateur ne supporte pas la reconnaissance vocale. Utilise Chrome ou Edge, ou tape ta réponse.
              </div>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={startInterview}
            className="btn-primary w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2.5 text-base"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 24px rgba(16,185,129,0.3)', border: 'none' }}>
            <Play size={16} /> Démarrer l&apos;entretien
          </motion.button>
        </motion.div>
      )}

      {/* LOADING */}
      {loadingMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <div className="flex justify-center items-end gap-1 mb-5">
            {[0,1,2,3,4].map((i) => (
              <motion.div key={i} className="w-1 rounded-full"
                style={{ background: 'linear-gradient(to top, #059669, #34d399)' }}
                animate={{ height: ['8px', '32px', '8px'] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
            ))}
          </div>
          <p className="text-sm font-semibold" style={{ color: '#34d399' }}>{loadingMsg}</p>
        </motion.div>
      )}

      {/* QUESTIONING / LISTENING */}
      {!loadingMsg && (session.status === 'questioning' || session.status === 'listening') && currentQ && (
        <AnimatePresence mode="wait">
          <motion.div key={session.currentQuestionIndex}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className="space-y-4">
            {/* Progress bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--text-3)' }}>
                {session.currentQuestionIndex + 1} / {session.questions.length}
              </span>
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #059669, #10b981)' }}
                  animate={{ width: `${progress}%` }} />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: categoryConfig[currentQ.category as keyof typeof categoryConfig]?.bg ?? 'rgba(124,58,237,0.12)',
                  color: categoryConfig[currentQ.category as keyof typeof categoryConfig]?.color ?? '#a78bfa',
                }}>
                {categoryConfig[currentQ.category as keyof typeof categoryConfig]?.label ?? currentQ.category}
              </span>
            </div>

            {/* Last answer feedback */}
            {lastAnswer && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl"
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: '#34d399' }}>Réponse précédente</p>
                  <span className="text-sm font-bold tabular-nums" style={{ color: scoreColor(lastAnswer.score) }}>
                    {lastAnswer.score}/100
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>{lastAnswer.feedback}</p>
              </motion.div>
            )}

            {/* Question card */}
            <div className="p-6 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="font-bold text-white text-lg leading-relaxed mb-4">{currentQ.question}</p>
              <button onClick={() => setShowHint((v) => !v)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: showHint ? '#fbbf24' : 'var(--text-4)' }}>
                <Lightbulb size={12} />
                {showHint ? 'Masquer le conseil' : 'Voir un conseil'}
              </button>
              <AnimatePresence>
                {showHint && currentQ.hint && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs mt-2 leading-relaxed" style={{ color: '#fbbf24' }}>
                    {currentQ.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Recording zone */}
            <div className="p-4 rounded-2xl min-h-20 transition-all duration-300"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isListening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.06)' : 'none',
              }}>
              {isListening && (
                <div className="flex items-center gap-2 mb-2">
                  <motion.div className="w-2 h-2 rounded-full bg-red-400"
                    animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }} />
                  <span className="text-xs font-semibold" style={{ color: '#f87171' }}>Enregistrement…</span>
                  <div className="flex items-end gap-0.5 ml-auto">
                    {[0,1,2,3,4].map((i) => (
                      <motion.div key={i} className="w-0.5 rounded-full"
                        style={{ background: '#f87171' }}
                        animate={{ height: ['3px', '14px', '3px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.09 }} />
                    ))}
                  </div>
                </div>
              )}
              {transcript ? (
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{transcript}</p>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-4)' }}>
                  {isListening ? 'Parle maintenant, je t\'écoute…' : 'Ta réponse apparaîtra ici'}
                </p>
              )}
            </div>

            {/* Fallback textarea */}
            {!speechSupported && (
              <textarea rows={3} placeholder="Tape ta réponse ici…"
                value={transcript} onChange={(e) => setTranscript(e.target.value)}
                className="w-full rounded-xl p-3 text-sm outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text)' }} />
            )}

            {/* Controls */}
            <div className="flex gap-3">
              {speechSupported && (
                <motion.button whileTap={{ scale: 0.96 }}
                  onClick={isListening ? stopListening : startListening}
                  className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
                    color: isListening ? '#f87171' : '#34d399',
                  }}>
                  {isListening
                    ? <><motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 0.6, repeat: Infinity }}><MicOff size={15}/></motion.div>Arrêter</>
                    : <><Mic size={15}/>{transcript ? 'Réenregistrer' : 'Parler'}</>}
                </motion.button>
              )}
              <motion.button whileTap={{ scale: 0.96 }}
                onClick={submitAnswer} disabled={!transcript.trim()}
                className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  background: transcript.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.05)',
                  color: transcript.trim() ? 'white' : 'var(--text-4)',
                  boxShadow: transcript.trim() ? '0 4px 18px rgba(124,58,237,0.32)' : 'none',
                  cursor: transcript.trim() ? 'pointer' : 'not-allowed',
                }}>
                <ChevronRight size={15} /> Soumettre
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* DONE */}
      {session.status === 'done' && finalResult && !loadingMsg && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Final score card */}
          <div className="p-6 rounded-2xl text-center relative overflow-hidden"
            style={{
              background: `rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.06)`,
              border: `1px solid rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.2)`,
            }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${finalResult.finalScore >= 75 ? '16,185,129' : '245,158,11'},0.1), transparent 60%)` }} />
            <motion.div className="relative flex flex-col items-center gap-4"
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
              <Award size={36} className="mx-auto" style={{ color: scoreColor(finalResult.finalScore) }} />
              <ScoreRing score={finalResult.finalScore} color={scoreColor(finalResult.finalScore)} size={110} />
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: scoreColor(finalResult.finalScore), opacity: 0.7 }}>
                  Score final
                </p>
                <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: 'var(--text-2)' }}>
                  {finalResult.finalFeedback}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Per-question breakdown */}
          <div className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h4 className="text-sm font-bold text-white mb-4 font-display">Détail par question</h4>
            <div className="space-y-3">
              {session.answers.map((a, i) => (
                <div key={a.questionId}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs truncate pr-2" style={{ color: 'var(--text-3)' }}>
                      Q{i + 1} — {session.questions[i]?.question.slice(0, 45)}…
                    </span>
                    <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: scoreColor(a.score) }}>
                      {a.score}/100
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div className="h-full rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${a.score}%` }}
                      transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: scoreColor(a.score), boxShadow: `0 0 6px ${scoreColor(a.score)}60` }} />
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-3)' }}>{a.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#34d399' }}>Points forts</h4>
              <ul className="space-y-1.5">
                {finalResult.topStrengths.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                    <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-2xl" style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)' }}>
              <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#a78bfa' }}>À travailler</h4>
              <ul className="space-y-1.5">
                {finalResult.priorityActions.map((s, i) => (
                  <li key={s} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
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
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', color: '#34d399' }}>
              <RefreshCw size={13} /> Recommencer l&apos;entretien
            </button>
            <button onClick={onRestart}
              className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-3)' }}>
              <ArrowRight size={13} /> Explorer une autre carrière
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
