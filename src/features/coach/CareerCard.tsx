'use client'

import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, DollarSign, ChevronRight } from 'lucide-react'
import type { CareerSuggestion } from '@/types'

type Props = {
  career: CareerSuggestion
  index: number
  selected: boolean
  onSelect: () => void
}

const rankConfig = [
  { label: '1er choix', bg: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: 'rgba(167,139,250,0.3)' },
  { label: '2e choix', bg: 'rgba(96,165,250,0.12)', color: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  { label: '3e choix', bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.2)' },
]

export default function CareerCard({ career, index, selected, onSelect }: Props) {
  const rank = rankConfig[index] || rankConfig[2]
  const scoreGradient =
    career.matchScore >= 80
      ? 'linear-gradient(90deg, #7c3aed, #a78bfa)'
      : career.matchScore >= 60
      ? 'linear-gradient(90deg, #4f46e5, #60a5fa)'
      : 'linear-gradient(90deg, #059669, #34d399)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, type: 'spring', stiffness: 220, damping: 22 }}
      whileHover={{ y: -5, transition: { duration: 0.18 } }}
      onClick={onSelect}
      className="cursor-pointer rounded-2xl relative overflow-hidden group"
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.12))'
          : 'rgba(255,255,255,0.03)',
        border: selected
          ? '1px solid rgba(167,139,250,0.45)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: selected
          ? '0 0 0 1px rgba(124,58,237,0.3), 0 8px 40px rgba(124,58,237,0.2)'
          : '0 2px 16px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(124,58,237,0.08), transparent 60%)' }}
      />

      <div className="relative p-5">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{career.icon}</span>
            <div>
              <div
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5"
                style={{ background: rank.bg, color: rank.color, border: `1px solid ${rank.border}` }}
              >
                {rank.label}
              </div>
              <h3 className="font-bold text-white leading-tight">{career.title}</h3>
            </div>
          </div>

          {selected ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle size={20} style={{ color: '#a78bfa' }} />
            </motion.div>
          ) : (
            <ChevronRight
              size={18}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: 'var(--text-3)' }}
            />
          )}
        </div>

        {/* Score bar */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${career.matchScore}%` }}
              transition={{ delay: index * 0.12 + 0.3, duration: 0.9, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: scoreGradient }}
            />
          </div>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: rank.color, minWidth: 36 }}
          >
            {career.matchScore}%
          </span>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
          {career.description}
        </p>

        {/* Why it fits */}
        <div
          className="p-3 rounded-xl mb-4 text-sm leading-relaxed"
          style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.15)',
            color: '#c4b5fd',
          }}
        >
          <span className="font-semibold text-xs uppercase tracking-wide opacity-70 block mb-1">
            Pourquoi ça te correspond
          </span>
          {career.whyItFits}
        </div>

        {/* Salary + growth */}
        <div className="flex flex-wrap gap-3 mb-4">
          {career.salaryRange && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <DollarSign size={11} />
              {career.salaryRange}
            </div>
          )}
          {career.growthPotential && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }}
            >
              <TrendingUp size={11} />
              {career.growthPotential}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1.5">
          {career.requiredSkills.slice(0, 4).map((skill) => (
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

        {/* CTA */}
        {!selected && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#a78bfa',
            }}
          >
            Choisir ce parcours
            <ChevronRight size={12} />
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
