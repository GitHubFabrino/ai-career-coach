'use client'

import { motion } from 'framer-motion'
import { CheckCircle, TrendingUp, DollarSign } from 'lucide-react'
import type { CareerSuggestion } from '@/types'

type Props = {
  career: CareerSuggestion
  index: number
  selected: boolean
  onSelect: () => void
}

export default function CareerCard({ career, index, selected, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 20 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay: index * 0.15, type: 'spring', stiffness: 200 }}
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={onSelect}
      className="cursor-pointer rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: selected
          ? 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.2))'
          : 'rgba(255,255,255,0.04)',
        border: selected
          ? '1px solid rgba(167,139,250,0.5)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: selected ? '0 0 40px rgba(124,58,237,0.3)' : 'none',
        backdropFilter: 'blur(20px)',
        transformStyle: 'preserve-3d',
      }}
    >
      {selected && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 right-4"
        >
          <CheckCircle size={20} style={{ color: '#a78bfa' }} />
        </motion.div>
      )}

      <div className="text-3xl mb-3">{career.icon}</div>

      <div className="flex items-center gap-2 mb-2">
        <h3 className="font-bold text-lg text-white">{career.title}</h3>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex-1 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${career.matchScore}%` }}
            transition={{ delay: index * 0.15 + 0.3, duration: 0.8 }}
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #7c3aed, #60a5fa)',
            }}
          />
        </div>
        <span className="text-sm font-bold" style={{ color: '#a78bfa' }}>
          {career.matchScore}%
        </span>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: '#94a3b8' }}>
        {career.description}
      </p>

      <div className="text-sm mb-4 p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)', color: '#c4b5fd' }}>
        <span className="font-medium">Why it fits: </span>
        {career.whyItFits}
      </div>

      <div className="flex gap-4 text-xs" style={{ color: '#64748b' }}>
        {career.salaryRange && (
          <span className="flex items-center gap-1">
            <DollarSign size={11} />
            {career.salaryRange}
          </span>
        )}
        {career.growthPotential && (
          <span className="flex items-center gap-1">
            <TrendingUp size={11} />
            {career.growthPotential}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {career.requiredSkills.slice(0, 3).map((skill) => (
          <span
            key={skill}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{
              background: 'rgba(124,58,237,0.15)',
              border: '1px solid rgba(124,58,237,0.25)',
              color: '#a78bfa',
            }}
          >
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  )
}
