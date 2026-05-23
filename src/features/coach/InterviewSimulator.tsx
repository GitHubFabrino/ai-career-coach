'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, MicOff, ChevronRight, Award, RefreshCw, ArrowRight, Lightbulb, Play } from 'lucide-react'
import type { InterviewQuestion, InterviewAnswer, InterviewSession } from '@/types'
import styles from './InterviewSimulator.module.css'

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
    <div className={styles.scoreRing} style={{ width: size, height: size }}>
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
      <div className={styles.scoreRingInner}>
        <span className={styles.scoreValue} style={{ color }}>{score}</span>
        <span className={styles.scoreSubtext} style={{ color }}>/100</span>
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
    <div className={styles.container}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
        <div className={styles.headerBadge}>
          <Mic size={11} /> Simulation d&apos;entretien vocal
        </div>
        <h2 className={styles.headerTitle}>
          Entretien <span className="gradient-text">simulé</span>
        </h2>
        <p className={styles.headerSubtext}>
          Poste visé : <span style={{ color: '#a78bfa' }}>{targetCareer}</span>
        </p>
      </motion.div>

      {/* IDLE */}
      {session.status === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.idleLayout}>
          <div className={styles.howItWorksCard}>
            <p className={styles.howItWorksTitle}>Comment ça marche</p>
            <ol className={styles.stepsList}>
              {[
                { n: '01', t: "L'IA génère 5 questions ciblées pour ton poste" },
                { n: '02', t: 'Tu réponds avec le micro (voix → texte automatique)' },
                { n: '03', t: 'Score et conseils personnalisés après chaque réponse' },
                { n: '04', t: "Bilan final avec tes forces et axes d'amélioration" },
              ].map(({ n, t }) => (
                <li key={n} className={styles.stepItem}>
                  <span className={styles.stepNum}>{n}</span>
                  <span className={styles.stepText}>{t}</span>
                </li>
              ))}
            </ol>
            {!speechSupported && (
              <div className={styles.speechWarning}>
                ⚠️ Ton navigateur ne supporte pas la reconnaissance vocale. Utilise Chrome ou Edge, ou tape ta réponse.
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={startInterview}
            className={`btn-primary ${styles.startBtn}`}
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)', boxShadow: '0 4px 24px rgba(16,185,129,0.3)', border: 'none' }}
          >
            <Play size={16} /> Démarrer l&apos;entretien
          </motion.button>
        </motion.div>
      )}

      {/* LOADING */}
      {loadingMsg && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.loadingSection}>
          <div className={styles.waveform}>
            {[0,1,2,3,4].map((i) => (
              <motion.div key={i} className={styles.waveBar}
                style={{ background: 'linear-gradient(to top, #059669, #34d399)' }}
                animate={{ height: ['8px', '32px', '8px'] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />
            ))}
          </div>
          <p className={styles.loadingText}>{loadingMsg}</p>
        </motion.div>
      )}

      {/* QUESTIONING / LISTENING */}
      {!loadingMsg && (session.status === 'questioning' || session.status === 'listening') && currentQ && (
        <AnimatePresence mode="wait">
          <motion.div
            key={session.currentQuestionIndex}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            className={styles.questionLayout}
          >
            {/* Progress bar */}
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>
                {session.currentQuestionIndex + 1} / {session.questions.length}
              </span>
              <div className={styles.progressTrack}>
                <motion.div className={styles.progressBar} animate={{ width: `${progress}%` }} />
              </div>
              <span
                className={styles.categoryBadge}
                style={{
                  background: categoryConfig[currentQ.category as keyof typeof categoryConfig]?.bg ?? 'rgba(124,58,237,0.12)',
                  color: categoryConfig[currentQ.category as keyof typeof categoryConfig]?.color ?? '#a78bfa',
                }}
              >
                {categoryConfig[currentQ.category as keyof typeof categoryConfig]?.label ?? currentQ.category}
              </span>
            </div>

            {/* Last answer feedback */}
            {lastAnswer && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className={styles.lastAnswerCard}>
                <div className={styles.lastAnswerHeader}>
                  <p className={styles.lastAnswerLabel}>Réponse précédente</p>
                  <span className={styles.lastAnswerScore} style={{ color: scoreColor(lastAnswer.score) }}>
                    {lastAnswer.score}/100
                  </span>
                </div>
                <p className={styles.lastAnswerFeedback}>{lastAnswer.feedback}</p>
              </motion.div>
            )}

            {/* Question card */}
            <div className={styles.questionCard}>
              <p className={styles.questionText}>{currentQ.question}</p>
              <button
                onClick={() => setShowHint((v) => !v)}
                className={styles.hintBtn}
                style={{ color: showHint ? '#fbbf24' : 'var(--text-4)' }}
              >
                <Lightbulb size={12} />
                {showHint ? 'Masquer le conseil' : 'Voir un conseil'}
              </button>
              <AnimatePresence>
                {showHint && currentQ.hint && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={styles.hintText}
                  >
                    {currentQ.hint}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Recording zone */}
            <div
              className={styles.recordingZone}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${isListening ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.07)'}`,
                boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.06)' : 'none',
              }}
            >
              {isListening && (
                <div className={styles.recordingHeader}>
                  <motion.div
                    className={styles.recordingDot}
                    animate={{ opacity: [1, 0.2, 1], scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                  <span className={styles.recordingLabel}>Enregistrement…</span>
                  <div className={styles.recordingWave}>
                    {[0,1,2,3,4].map((i) => (
                      <motion.div key={i} className={styles.recordingBar}
                        style={{ background: '#f87171' }}
                        animate={{ height: ['3px', '14px', '3px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.09 }} />
                    ))}
                  </div>
                </div>
              )}
              {transcript ? (
                <p className={styles.transcriptText}>{transcript}</p>
              ) : (
                <p className={styles.transcriptPlaceholder}>
                  {isListening ? "Parle maintenant, je t'écoute…" : 'Ta réponse apparaîtra ici'}
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
                className={styles.fallbackTextarea}
              />
            )}

            {/* Controls */}
            <div className={styles.controls}>
              {speechSupported && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={isListening ? stopListening : startListening}
                  className={styles.micBtn}
                  style={{
                    background: isListening ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    border: `1px solid ${isListening ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.25)'}`,
                    color: isListening ? '#f87171' : '#34d399',
                  }}
                >
                  {isListening
                    ? <><motion.div animate={{ scale: [1,1.2,1] }} transition={{ duration: 0.6, repeat: Infinity }}><MicOff size={15}/></motion.div>Arrêter</>
                    : <><Mic size={15}/>{transcript ? 'Réenregistrer' : 'Parler'}</>}
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={submitAnswer}
                disabled={!transcript.trim()}
                className={`${styles.submitBtn} ${transcript.trim() ? styles.submitBtnActive : styles.submitBtnDisabled}`}
              >
                <ChevronRight size={15} /> Soumettre
              </motion.button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* DONE */}
      {session.status === 'done' && finalResult && !loadingMsg && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={styles.doneLayout}>

          {/* Final score card */}
          <div
            className={styles.finalScoreCard}
            style={{
              background: `rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.06)`,
              border: `1px solid rgba(${finalResult.finalScore >= 75 ? '16,185,129' : finalResult.finalScore >= 50 ? '245,158,11' : '239,68,68'},0.2)`,
            }}
          >
            <div
              className={styles.finalScoreGlow}
              style={{ background: `radial-gradient(ellipse at 50% 0%, rgba(${finalResult.finalScore >= 75 ? '16,185,129' : '245,158,11'},0.1), transparent 60%)` }}
            />
            <motion.div
              className={styles.finalScoreInner}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            >
              <Award size={36} style={{ color: scoreColor(finalResult.finalScore) }} />
              <ScoreRing score={finalResult.finalScore} color={scoreColor(finalResult.finalScore)} size={110} />
              <div>
                <p className={styles.finalScoreLabel} style={{ color: scoreColor(finalResult.finalScore) }}>
                  Score final
                </p>
                <p className={styles.finalScoreFeedback}>{finalResult.finalFeedback}</p>
              </div>
            </motion.div>
          </div>

          {/* Per-question breakdown */}
          <div className={styles.breakdownCard}>
            <h4 className={styles.breakdownTitle}>Détail par question</h4>
            <div className={styles.breakdownList}>
              {session.answers.map((a, i) => (
                <div key={a.questionId}>
                  <div className={styles.breakdownItemHeader}>
                    <span className={styles.breakdownQuestion}>
                      Q{i + 1} — {session.questions[i]?.question.slice(0, 45)}…
                    </span>
                    <span className={styles.breakdownScore} style={{ color: scoreColor(a.score) }}>
                      {a.score}/100
                    </span>
                  </div>
                  <div className={styles.breakdownTrack}>
                    <motion.div
                      className={styles.breakdownBar}
                      initial={{ width: 0 }}
                      animate={{ width: `${a.score}%` }}
                      transition={{ delay: i * 0.08, duration: 0.7, ease: 'easeOut' }}
                      style={{ background: scoreColor(a.score), boxShadow: `0 0 6px ${scoreColor(a.score)}60` }}
                    />
                  </div>
                  <p className={styles.breakdownFeedback}>{a.feedback}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & actions */}
          <div className={styles.feedbackGrid}>
            <div className={styles.strengthCard}>
              <h4 className={styles.feedbackTitle} style={{ color: '#34d399' }}>Points forts</h4>
              <ul className={styles.feedbackList}>
                {finalResult.topStrengths.map((s) => (
                  <li key={s} className={styles.feedbackItem}>
                    <span className={styles.strengthDot} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className={styles.improvCard}>
              <h4 className={styles.feedbackTitle} style={{ color: '#a78bfa' }}>À travailler</h4>
              <ul className={styles.feedbackList}>
                {finalResult.priorityActions.map((s, i) => (
                  <li key={s} className={styles.feedbackItem}>
                    <span className={styles.improvementNum}>{i + 1}.</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <button
              onClick={() => { setSession({ questions: [], answers: [], currentQuestionIndex: 0, status: 'idle' }); setFinalResult(null); setTranscript('') }}
              className={styles.retryBtn}
            >
              <RefreshCw size={13} /> Recommencer l&apos;entretien
            </button>
            <button onClick={onRestart} className={styles.restartBtn}>
              <ArrowRight size={13} /> Explorer une autre carrière
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
