'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import type { CVAnalysisResult } from '@/types'
import styles from './CVAnalyzer.module.css'

type Props = {
  targetCareer?: string
  onRestart: () => void
}

function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const fontSize = size * 0.24

  return (
    <div className={styles.scoreRing} style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      <div className={styles.scoreRingInner}>
        <span className={styles.scoreValue} style={{ fontSize, color }}>{score}</span>
        <span className={styles.scoreSubtext} style={{ color }}>/100</span>
      </div>
    </div>
  )
}

export default function CVAnalyzer({ targetCareer, onRestart }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CVAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.pdf') && !f.name.endsWith('.txt')) {
      setError('Format non supporté. Utilise un fichier PDF ou TXT.')
      return
    }
    setFile(f)
    setError(null)
    setResult(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    const formData = new FormData()
    formData.append('cv', file)
    if (targetCareer) formData.append('career', targetCareer)
    try {
      const res = await fetch('/api/cv-analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      setResult(data.result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue')
    } finally {
      setIsLoading(false)
    }
  }

  const scoreColor  = (s: number) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444'
  const scoreBg     = (s: number) => s >= 75 ? 'rgba(16,185,129,0.08)' : s >= 50 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)'
  const scoreBorder = (s: number) => s >= 75 ? 'rgba(16,185,129,0.2)'  : s >= 50 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'
  const scoreLabel  = (s: number) => s >= 75 ? '✅ Excellent' : s >= 50 ? '⚡ À améliorer' : '❌ Insuffisant'

  return (
    <div className={styles.container}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
        <div className={styles.headerBadge}>
          <FileText size={11} />
          Analyse de CV par IA
        </div>
        <h2 className={styles.headerTitle}>
          Analyse ton <span className="gradient-text-gold">CV</span>
        </h2>
        <p className={styles.headerSubtext}>
          {targetCareer
            ? `Optimisé pour : ${targetCareer}`
            : 'Détection des compétences · Score global · Feedback personnalisé'}
        </p>
      </motion.div>

      {/* Upload zone */}
      {!result && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={styles.dropZone}
            style={{
              borderColor: isDragging ? '#f59e0b' : file ? '#10b981' : 'rgba(255,255,255,0.1)',
              background: isDragging
                ? 'rgba(245,158,11,0.04)'
                : file
                ? 'rgba(16,185,129,0.04)'
                : 'rgba(255,255,255,0.02)',
            }}
          >
            {isDragging && <div className={styles.dragGlow} />}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt"
              className={styles.fileInput}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={styles.filePreview}
                >
                  <div className={styles.fileIconWrap}>
                    <CheckCircle size={28} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className={styles.fileName}>{file.name}</p>
                    <p className={styles.fileMeta}>
                      {(file.size / 1024).toFixed(0)} Ko · Clique pour changer
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyState}>
                  <div className={styles.uploadIconWrap}>
                    <Upload size={24} style={{ color: 'var(--text-3)' }} />
                  </div>
                  <div>
                    <p className={styles.uploadTitle}>
                      {isDragging ? 'Dépose ici !' : 'Dépose ton CV ici'}
                    </p>
                    <p className={styles.uploadSubtext}>PDF ou TXT · max 10 Mo</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.errorMsg}>
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {/* Analyze button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className={`${styles.analyzeBtn} ${file && !isLoading ? styles.analyzeBtnActive : styles.analyzeBtnDisabled}`}
          >
            {isLoading
              ? <><Loader2 size={15} className={styles.spin} /> Analyse en cours…</>
              : <><FileText size={15} /> Analyser mon CV</>}
          </motion.button>
        </motion.div>
      )}

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.results}
          >
            {/* Score hero */}
            <div
              className={styles.scoreHero}
              style={{ background: scoreBg(result.globalScore), border: `1px solid ${scoreBorder(result.globalScore)}` }}
            >
              <div
                className={styles.scoreHeroGlow}
                style={{ background: `radial-gradient(ellipse at 50% -10%, ${scoreBg(result.globalScore).replace('0.08', '0.18')}, transparent 65%)` }}
              />
              <div className={styles.scoreHeroRow}>
                <ScoreRing score={result.globalScore} color={scoreColor(result.globalScore)} size={110} />
                <div className={styles.scoreHeroInfo}>
                  <p className={styles.scoreLabelText} style={{ color: scoreColor(result.globalScore) }}>
                    Score global
                  </p>
                  <p className={styles.scoreTitleText}>{scoreLabel(result.globalScore)}</p>
                  <p className={styles.scoreSummaryText}>{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Section scores */}
            <div className={styles.sectionsCard}>
              <h3 className={styles.sectionsTitle}>Analyse par section</h3>
              {result.sections.map((section, i) => (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className={styles.sectionHeader}>
                    <span className={styles.sectionLabel}>{section.label}</span>
                    <span className={styles.sectionScore} style={{ color: scoreColor(section.score) }}>
                      {section.score}/100
                    </span>
                  </div>
                  <div className={styles.progressTrack}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${section.score}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: 'easeOut' }}
                      className={styles.progressBar}
                      style={{
                        background: scoreColor(section.score),
                        boxShadow: `0 0 8px ${scoreColor(section.score)}60`,
                      }}
                    />
                  </div>
                  <p className={styles.sectionFeedback}>{section.feedback}</p>
                </motion.div>
              ))}
            </div>

            {/* Skills detected / missing */}
            <div className={styles.skillsGrid}>
              <div
                className={styles.skillsCard}
                style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}
              >
                <div className={styles.skillsHeader}>
                  <CheckCircle size={13} style={{ color: '#10b981' }} />
                  <h4 className={styles.skillsTitle} style={{ color: '#34d399' }}>Compétences détectées</h4>
                </div>
                <div className={styles.skillsTags}>
                  {result.detectedSkills.map((s) => (
                    <span key={s} className={styles.skillTag} style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div
                className={styles.skillsCard}
                style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}
              >
                <div className={styles.skillsHeader}>
                  <XCircle size={13} style={{ color: '#ef4444' }} />
                  <h4 className={styles.skillsTitle} style={{ color: '#f87171' }}>Compétences manquantes</h4>
                </div>
                <div className={styles.skillsTags}>
                  {result.missingSkills.map((s) => (
                    <span key={s} className={styles.skillTag} style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths & improvements */}
            {(result.strengths.length > 0 || result.improvements.length > 0) && (
              <div className={styles.feedbackGrid}>
                {result.strengths.length > 0 && (
                  <div className={styles.feedbackCard}>
                    <h4 className={styles.feedbackTitle}>Points forts</h4>
                    <ul className={styles.feedbackList}>
                      {result.strengths.map((s) => (
                        <li key={s} className={styles.feedbackItem}>
                          <span className={styles.strengthDot} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.improvements.length > 0 && (
                  <div className={styles.feedbackCard}>
                    <h4 className={styles.feedbackTitle}>Priorités</h4>
                    <ul className={styles.feedbackList}>
                      {result.improvements.map((s, i) => (
                        <li key={s} className={styles.feedbackItem}>
                          <span className={styles.improvementNum}>{i + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className={styles.actions}>
              <button
                onClick={() => { setResult(null); setFile(null) }}
                className={styles.retryBtn}
              >
                <RotateCcw size={13} /> Analyser un autre CV
              </button>
              <button onClick={onRestart} className={styles.restartBtn}>
                <ArrowRight size={13} /> Explorer une autre carrière
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
