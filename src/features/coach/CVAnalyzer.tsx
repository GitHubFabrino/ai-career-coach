'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, ArrowRight, Loader2, RotateCcw } from 'lucide-react'
import type { CVAnalysisResult } from '@/types'

type Props = {
  targetCareer?: string
  onRestart: () => void
}

/** Animated SVG ring for score display */
function ScoreRing({ score, color, size = 120 }: { score: number; color: string; size?: number }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const fontSize = size * 0.24

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-black tabular-nums leading-none" style={{ fontSize, color }}>
          {score}
        </span>
        <span className="text-xs font-semibold" style={{ color, opacity: 0.7 }}>/100</span>
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
    <div className="max-w-2xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-4"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.22)', color: '#fbbf24' }}
        >
          <FileText size={11} />
          Analyse de CV par IA
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
          Analyse ton <span className="gradient-text-gold">CV</span>
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-2)' }}>
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
            className="relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300"
            style={{
              borderColor: isDragging ? '#f59e0b' : file ? '#10b981' : 'rgba(255,255,255,0.1)',
              background: isDragging
                ? 'rgba(245,158,11,0.04)'
                : file
                ? 'rgba(16,185,129,0.04)'
                : 'rgba(255,255,255,0.02)',
            }}
          >
            {/* Glow overlay when dragging */}
            {isDragging && (
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: 'inset 0 0 40px rgba(245,158,11,0.1)' }}
              />
            )}

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <AnimatePresence mode="wait">
              {file ? (
                <motion.div
                  key="file"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <CheckCircle size={28} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{file.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>
                      {(file.size / 1024).toFixed(0)} Ko · Clique pour changer
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    <Upload size={24} style={{ color: 'var(--text-3)' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      {isDragging ? 'Dépose ici !' : 'Dépose ton CV ici'}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-3)' }}>PDF ou TXT · max 10 Mo</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {/* Analyze button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={!file || isLoading}
            className="mt-4 w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{
              background: file && !isLoading ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.05)',
              border: file && !isLoading ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.07)',
              color: file && !isLoading ? 'white' : 'var(--text-3)',
              boxShadow: file && !isLoading ? '0 4px 20px rgba(245,158,11,0.28)' : 'none',
              cursor: file && !isLoading ? 'pointer' : 'not-allowed',
            }}
          >
            {isLoading
              ? <><Loader2 size={15} className="animate-spin" /> Analyse en cours…</>
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
            className="space-y-4"
          >
            {/* Score hero */}
            <div
              className="p-6 rounded-2xl relative overflow-hidden"
              style={{ background: scoreBg(result.globalScore), border: `1px solid ${scoreBorder(result.globalScore)}` }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(ellipse at 50% -10%, ${scoreBg(result.globalScore).replace('0.08', '0.18')}, transparent 65%)` }}
              />
              <div className="relative flex flex-col sm:flex-row items-center gap-6">
                <ScoreRing score={result.globalScore} color={scoreColor(result.globalScore)} size={110} />
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: scoreColor(result.globalScore), opacity: 0.75 }}>
                    Score global
                  </p>
                  <p className="font-bold text-lg text-white mb-2">{scoreLabel(result.globalScore)}</p>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>{result.summary}</p>
                </div>
              </div>
            </div>

            {/* Section scores */}
            <div
              className="p-5 rounded-2xl space-y-4"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h3 className="font-bold text-white text-sm font-display">Analyse par section</h3>
              {result.sections.map((section, i) => (
                <motion.div
                  key={section.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-white">{section.label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: scoreColor(section.score) }}>
                      {section.score}/100
                    </span>
                  </div>
                  <div className="w-full rounded-full h-1.5 mb-2" style={{ background: 'rgba(255,255,255,0.07)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${section.score}%` }}
                      transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{
                        background: scoreColor(section.score),
                        boxShadow: `0 0 8px ${scoreColor(section.score)}60`,
                      }}
                    />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{section.feedback}</p>
                </motion.div>
              ))}
            </div>

            {/* Skills detected / missing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={13} style={{ color: '#10b981' }} />
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#34d399' }}>Compétences détectées</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={13} style={{ color: '#ef4444' }} />
                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#f87171' }}>Compétences manquantes</h4>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.missingSkills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-lg text-[11px] font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Strengths & improvements */}
            {(result.strengths.length > 0 || result.improvements.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.strengths.length > 0 && (
                  <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-2)' }}>Points forts</h4>
                    <ul className="space-y-1.5">
                      {result.strengths.map((s) => (
                        <li key={s} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                          <span className="mt-1 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.improvements.length > 0 && (
                  <div className="p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--text-2)' }}>Priorités</h4>
                    <ul className="space-y-1.5">
                      {result.improvements.map((s, i) => (
                        <li key={s} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                          <span className="flex-shrink-0 font-bold text-amber-400 mt-0.5">{i + 1}.</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setResult(null); setFile(null) }}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.18)', color: '#fbbf24' }}
              >
                <RotateCcw size={13} /> Analyser un autre CV
              </button>
              <button
                onClick={onRestart}
                className="w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-3)' }}
              >
                <ArrowRight size={13} /> Explorer une autre carrière
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
