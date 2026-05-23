'use client'

import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, DollarSign, ChevronRight, Sparkles } from 'lucide-react'
import type { CareerSuggestion } from '@/types'
import styles from './CareerCard.module.css'

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

function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ

  return (
    <div className={styles.scoreRing} style={{ width: 48, height: 48 }}>
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
      <span className={styles.scoreRingLabel} style={{ color }}>{score}%</span>
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
      className={styles.card}
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
      }}
    >
      {/* Hover glow */}
      <div className={styles.hoverGlow} />

      <div className={styles.cardContent}>

        {/* Top row */}
        <div className={styles.topRow}>
          <div className={styles.topLeft}>
            <span className={styles.careerIcon}>{career.icon}</span>
            <div className={styles.titleWrap}>
              <div
                className={styles.rankBadge}
                style={{ background: rank.bg, color: rank.color, border: `1px solid ${rank.border}` }}
              >
                <Sparkles size={8} style={{ marginRight: '0.25rem' }} />
                {rank.label}
              </div>
              <h3 className={styles.careerTitle}>{career.title}</h3>
            </div>
          </div>

          {selected ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
              <CheckCircle size={22} style={{ color: '#a78bfa' }} />
            </motion.div>
          ) : (
            <ScoreRing score={career.matchScore} color={ringColor} />
          )}
        </div>

        {/* Description */}
        <p className={styles.description}>{career.description}</p>

        {/* Why it fits */}
        <div className={styles.whyBox}>
          <span className={styles.whyLabel}>Pourquoi ça te correspond</span>
          {career.whyItFits}
        </div>

        {/* Salary + growth */}
        <div className={styles.metaRow}>
          {career.salaryRange && (
            <div
              className={styles.metaBadge}
              style={{ background: 'rgba(16,185,129,0.08)', color: '#34d399', border: '1px solid rgba(16,185,129,0.15)' }}
            >
              <DollarSign size={11} />
              {career.salaryRange}
            </div>
          )}
          {career.growthPotential && (
            <div
              className={styles.metaBadge}
              style={{ background: 'rgba(96,165,250,0.08)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.15)' }}
            >
              <TrendingUp size={11} />
              {career.growthPotential}
            </div>
          )}
        </div>

        {/* Skills */}
        <div className={styles.skillsRow}>
          {career.requiredSkills.slice(0, 5).map((skill) => (
            <span key={skill} className={styles.skillTag}>{skill}</span>
          ))}
        </div>

        {/* CTA */}
        {!selected ? (
          <motion.div whileHover={{ x: 2 }} className={styles.ctaBtn}>
            <span>Choisir ce parcours</span>
            <ChevronRight size={13} />
          </motion.div>
        ) : (
          <div className={styles.ctaSelected}>
            <span>Parcours sélectionné ✓</span>
            <CheckCircle size={13} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
