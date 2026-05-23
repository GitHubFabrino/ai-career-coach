'use client'

import { motion } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, Zap } from 'lucide-react'
import type { ActionPlan } from '@/types'

type Props = {
  plan: ActionPlan
  onRestart: () => void
}

const priorityColor = {
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
}

export default function ActionPlanView({ plan, onRestart }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm"
          style={{
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa',
          }}
        >
          <Zap size={14} />
          Your Personal Roadmap
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Path to {plan.careerTitle}
        </h2>
        <p className="text-sm" style={{ color: '#64748b' }}>
          {plan.summary}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Clock size={14} style={{ color: '#a78bfa' }} />
          <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
            {plan.totalDuration} estimated
          </span>
        </div>
      </motion.div>

      <div className="relative">
        <div
          className="absolute left-4 top-0 bottom-0 w-px"
          style={{ background: 'rgba(124,58,237,0.2)' }}
        />

        <div className="space-y-4">
          {plan.steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 + 0.2, type: 'spring' }}
                className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  border: '2px solid rgba(124,58,237,0.3)',
                  color: 'white',
                  top: '12px',
                }}
              >
                {i + 1}
              </motion.div>

              <div
                className="p-4 rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{step.title}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: priorityColor[step.priority] }}
                    />
                    <span className="text-xs" style={{ color: '#64748b' }}>
                      {step.duration}
                    </span>
                  </div>
                </div>
                <p className="text-sm leading-relaxed mb-3" style={{ color: '#94a3b8' }}>
                  {step.description}
                </p>
                {step.resources && step.resources.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {step.resources.map((r) => (
                      <span
                        key={r}
                        className="px-2 py-0.5 rounded-md text-xs"
                        style={{
                          background: 'rgba(59,130,246,0.1)',
                          border: '1px solid rgba(59,130,246,0.2)',
                          color: '#93c5fd',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: plan.steps.length * 0.1 + 0.3 }}
            className="relative pl-10"
          >
            <div
              className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                top: '12px',
              }}
            >
              <CheckCircle size={16} className="text-white" />
            </div>
            <div
              className="p-4 rounded-2xl text-center"
              style={{
                background: 'rgba(16,185,129,0.08)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <p className="font-semibold" style={{ color: '#34d399' }}>
                You are a {plan.careerTitle}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onRestart}
        className="w-full mt-10 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b',
        }}
      >
        <ArrowRight size={14} />
        Explore another career
      </motion.button>
    </div>
  )
}
