'use client'

import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, DollarSign, ChevronRight, Sparkles } from 'lucide-react'
import type { CareerSuggestion } from '@/types'

type Props = {
  career: CareerSuggestion
  index: number
  selected: boolean
  onSelect: () => void
}

const rankConfig = [
  { label: '1er choix', bg: 'rgba(167,139,250,0.14)', color: '#a78bfa', border: 'rgba(167,139,250,0.28)' },
  { label: '2e choix',  bg: 'rgba(96,165,250,0.12)',  color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  { label: '3e choix',  bg: 'rgba(52,211,153,0.1)',   color: '#34d399', border: 'rgba(52,211,153,0.22)' },
]

/** Small SVG ring showing match score */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className="relative flex items-center justify-center" style={{ width: 48, height: 48 }}>
      <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />
        <motion.circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <span
        className="absolute text-[11px] font-bold tabular-nums"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  )
}

export default function CareerCard({ career, index, selected, onSelect }: Props) {
  const rank = rankConfig[index] || rankConfig[2]
  const ringColor = career.matchScore >= 80 ? '#a78bfa' : career.matchScore >= 60 ? '#60a5fa' : '#34d399'

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      onClick={onSelect}
      className="cursor-pointer rounded-2xl relative overflow-hidden group"
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(124,58,237,0.16), rgba(79,70,229,0.1))'
          : 'rgba(255,255,255,0.03)',
        border: selected
          ? '1px solid rgba(167,139,250,0.45)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected
          ? '0 0 0 1px rgba(124,58,237,0.3), 0 8px 40px rgba(124,58,237,0.18)'
          : '0 2px 16px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Hover glow overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.07), transparent 60%)' }}
      />

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-3xl flex-shrink-0">{career.icon}</span>
            <div className="min-w-0">
              <div
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold mb-1.5"
                style={{ background: rank.bg, color: rank.color, border: `1px solid ${rank.border}` }}
              >
                <Sparkles size={8} className="mr-1" />
                {rank.label}
              </div>
              <h3 className="font-bold text-white leading-tight text-base">{career.title}</h3>
            </div>
          </div>

          {/* Score ring or check */}
          {selected ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle size={22} style={{ color: '#a78bfa' }} />
            </motion.div>
          ) : (
            <ScoreRing score={career.matchScore} color={ringColor} />
          )}
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
          {career.description}
        </p>

        {/* Why it fits */}
        <div
          className="p-3 rounded-xl mb-4 text-sm leading-relaxed"
          style={{
            background: 'rgba(124,58,237,0.07)',
            border: '1px solid rgba(124,58,237,0.15)',
            color: '#c4b5fd',
          }}
        >
          <span className="font-semibold text-[10px] uppercase tracking-widest opacity-70 block mb-1">
            Pourquoi ça te correspond
          </span>
          {career.whyItFits}
        </div>

        {/* Salary + growth */}
        <div className="flex flex-wrap gap-2 mb-4">
          {career.salaryRange && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <DollarSign size={11} />
              {career.salaryRange}
            </div>
          )}
          {career.growthPotential && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }}
            >
              <TrendingUp size={11} />
              {career.growthPotential}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {career.requiredSkills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                color: 'var(--text-2)',
              }}
            >
              {skill}
            </span>
          ))}
        </div>

        {/* CTA — always visible (not hover-only) */}
        {!selected ? (
          <motion.div
            whileHover={{ x: 2 }}
            className="flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'rgba(124,58,237,0.1)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#a78bfa',
            }}
          >
            <span>Choisir ce parcours</span>
            <ChevronRight size={13} />
          </motion.div>
        ) : (
          <div
            className="flex items-center justify-between py-2.5 px-3 rounded-xl text-xs font-semibold"
            style={{
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.3)',
              color: '#a78bfa',
            }}
          >
            <span>Parcours sélectionné ✓</span>
            <CheckCircle size={13} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
