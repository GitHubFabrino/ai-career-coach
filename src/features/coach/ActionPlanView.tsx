'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, Zap, FileText, Link, Mic, Map } from 'lucide-react'
import type { ActionPlan } from '@/types'

type Props = {
  plan: ActionPlan
  onRestart: () => void
}

const phaseConfig = {
  compétences: { color: '#7c3aed', label: 'Compétences' },
  portfolio: { color: '#3b82f6', label: 'Portfolio' },
  outils_emploi: { color: '#f59e0b', label: 'CV & LinkedIn' },
  réseau: { color: '#10b981', label: 'Réseau' },
  entretiens: { color: '#ef4444', label: 'Entretiens' },
  lancement: { color: '#a78bfa', label: 'Lancement' },
}

const priorityColor = {
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
}

type Tab = 'roadmap' | 'cv' | 'linkedin' | 'entretiens'

const tabs: { id: Tab; label: string; icon: typeof FileText }[] = [
  { id: 'roadmap', label: 'Feuille de route', icon: Map },
  { id: 'cv', label: 'CV & Branding', icon: FileText },
  { id: 'linkedin', label: 'LinkedIn', icon: Link },
  { id: 'entretiens', label: 'Entretiens', icon: Mic },
]

export default function ActionPlanView({ plan, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
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
          Ta feuille de route personnelle
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">
          Devenir {plan.careerTitle}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>
          {plan.summary}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <Clock size={14} style={{ color: '#a78bfa' }} />
          <span className="text-sm font-medium" style={{ color: '#a78bfa' }}>
            Durée estimée : {plan.totalDuration}
          </span>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((tab) => {
          const hasContent =
            tab.id === 'roadmap' ||
            (tab.id === 'cv' && plan.cvTips && plan.cvTips.length > 0) ||
            (tab.id === 'linkedin' && plan.linkedinTips && plan.linkedinTips.length > 0) ||
            (tab.id === 'entretiens' && plan.interviewTips && plan.interviewTips.length > 0)

          if (!hasContent) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.08)'}`,
                color: activeTab === tab.id ? '#a78bfa' : '#64748b',
              }}
            >
              <tab.icon size={12} />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Tab : Feuille de route ── */}
        {activeTab === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative">
              <div
                className="absolute left-4 top-0 bottom-0 w-px"
                style={{ background: 'rgba(124,58,237,0.2)' }}
              />
              <div className="space-y-4">
                {plan.steps.map((step, i) => {
                  const phase = phaseConfig[step.phase] || phaseConfig['compétences']
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative pl-10"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.08 + 0.15, type: 'spring' }}
                        className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${phase.color}cc, ${phase.color}88)`,
                          border: `2px solid ${phase.color}44`,
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
                        <div className="flex items-start justify-between mb-1">
                          <div>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full mr-2"
                              style={{
                                background: `${phase.color}22`,
                                color: phase.color,
                                border: `1px solid ${phase.color}44`,
                              }}
                            >
                              {phase.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: priorityColor[step.priority] }}
                            />
                            <span className="text-xs" style={{ color: '#64748b' }}>
                              {step.duration}
                            </span>
                          </div>
                        </div>
                        <h3 className="font-semibold text-white mt-2 mb-2">{step.title}</h3>
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
                  )
                })}

                {/* Finish */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: plan.steps.length * 0.08 + 0.2 }}
                  className="relative pl-10"
                >
                  <div
                    className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', top: '12px' }}
                  >
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <div
                    className="p-4 rounded-2xl text-center"
                    style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
                  >
                    <p className="font-semibold" style={{ color: '#34d399' }}>
                      Tu es devenu(e) {plan.careerTitle} 🎉
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Tab : CV & Branding ── */}
        {activeTab === 'cv' && plan.cvTips && (
          <motion.div
            key="cv"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TipList
              title="Optimiser ton CV"
              icon={<FileText size={16} style={{ color: '#f59e0b' }} />}
              color="#f59e0b"
              tips={plan.cvTips}
            />
          </motion.div>
        )}

        {/* ── Tab : LinkedIn ── */}
        {activeTab === 'linkedin' && plan.linkedinTips && (
          <motion.div
            key="linkedin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TipList
              title="Maximiser ton LinkedIn"
              icon={<Link size={16} style={{ color: '#3b82f6' }} />}
              color="#3b82f6"
              tips={plan.linkedinTips}
            />
          </motion.div>
        )}

        {/* ── Tab : Entretiens ── */}
        {activeTab === 'entretiens' && plan.interviewTips && (
          <motion.div
            key="entretiens"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <TipList
              title="Réussir tes entretiens"
              icon={<Mic size={16} style={{ color: '#ef4444' }} />}
              color="#ef4444"
              tips={plan.interviewTips}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onRestart}
        className="w-full mt-10 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: '#64748b',
        }}
      >
        <ArrowRight size={14} />
        Explorer une autre carrière
      </motion.button>
    </div>
  )
}

function TipList({ title, icon, color, tips }: {
  title: string
  icon: React.ReactNode
  color: string
  tips: string[]
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          {icon}
        </div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="flex gap-3 p-3 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
              style={{ background: `${color}33`, color }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              {tip}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
