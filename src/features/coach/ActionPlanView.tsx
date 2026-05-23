'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, Zap, FileText, Link, Mic, Map, ChevronRight } from 'lucide-react'
import type { ActionPlan } from '@/types'

type Props = {
  plan: ActionPlan
  onRestart: () => void
}

const phaseConfig = {
  compétences: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', label: 'Compétences' },
  portfolio:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)',  label: 'Portfolio' },
  outils_emploi:{ color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'CV & LinkedIn' },
  réseau:      { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Réseau' },
  entretiens:  { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Entretiens' },
  lancement:   { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', label: 'Lancement' },
}

const priorityDot = { high: '#f59e0b', medium: '#60a5fa', low: '#34d399' }

type Tab = 'roadmap' | 'cv' | 'linkedin' | 'entretiens'

const tabs: { id: Tab; label: string; icon: typeof FileText; color: string }[] = [
  { id: 'roadmap',   label: 'Feuille de route', icon: Map,      color: '#a78bfa' },
  { id: 'cv',        label: 'CV & Branding',    icon: FileText,  color: '#fbbf24' },
  { id: 'linkedin',  label: 'LinkedIn',          icon: Link,      color: '#60a5fa' },
  { id: 'entretiens',label: 'Entretiens',        icon: Mic,       color: '#f87171' },
]

export default function ActionPlanView({ plan, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap')

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)', color: '#a78bfa' }}
          >
            <Zap size={11} />
            Feuille de route personnelle
          </div>
        </div>

        <h2 className="text-3xl font-bold text-white mb-2 leading-tight">
          Devenir{' '}
          <span className="gradient-text">{plan.careerTitle}</span>
        </h2>

        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-2)' }}>
          {plan.summary}
        </p>

        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', color: '#c4b5fd' }}
        >
          <Clock size={13} />
          Durée estimée : {plan.totalDuration}
        </div>
      </motion.div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-7 p-1 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        {tabs.map((tab) => {
          const hasContent =
            tab.id === 'roadmap' ||
            (tab.id === 'cv' && plan.cvTips && plan.cvTips.length > 0) ||
            (tab.id === 'linkedin' && plan.linkedinTips && plan.linkedinTips.length > 0) ||
            (tab.id === 'entretiens' && plan.interviewTips && plan.interviewTips.length > 0)

          if (!hasContent) return null

          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
              style={{ color: isActive ? tab.color : 'var(--text-3)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: `${tab.color}14`, border: `1px solid ${tab.color}25` }}
                  transition={{ type: 'spring', stiffness: 350, damping: 35 }}
                />
              )}
              <tab.icon size={12} className="relative" />
              <span className="relative hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Roadmap ── */}
        {activeTab === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="relative">
              {/* Timeline line */}
              <div
                className="absolute left-[15px] top-8 bottom-8 w-px"
                style={{ background: 'linear-gradient(to bottom, rgba(124,58,237,0.4), rgba(124,58,237,0.05))' }}
              />

              <div className="space-y-3">
                {plan.steps.map((step, i) => {
                  const phase = phaseConfig[step.phase] || phaseConfig['compétences']
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="relative pl-10"
                    >
                      {/* Step number circle */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.07 + 0.1, type: 'spring', stiffness: 300 }}
                        className="absolute left-0 w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: `linear-gradient(135deg, ${phase.color}cc, ${phase.color}66)`,
                          border: `2px solid ${phase.color}33`,
                          color: 'white',
                          top: '14px',
                          boxShadow: `0 0 12px ${phase.color}30`,
                        }}
                      >
                        {i + 1}
                      </motion.div>

                      {/* Card */}
                      <div
                        className="p-4 rounded-2xl group hover:border-white/10 transition-colors"
                        style={{
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                            style={{ background: phase.bg, color: phase.color, border: `1px solid ${phase.color}30` }}
                          >
                            {phase.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: priorityDot[step.priority] }}
                            />
                            <span className="text-[11px]" style={{ color: 'var(--text-3)' }}>
                              {step.duration}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-white mb-1.5">{step.title}</h3>
                        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--text-2)' }}>
                          {step.description}
                        </p>

                        {step.resources && step.resources.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {step.resources.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium"
                                style={{
                                  background: 'rgba(96,165,250,0.08)',
                                  border: '1px solid rgba(96,165,250,0.15)',
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
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: plan.steps.length * 0.07 + 0.15 }}
                  className="relative pl-10"
                >
                  <div
                    className="absolute left-0 w-[30px] h-[30px] rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', top: '14px', boxShadow: '0 0 16px rgba(16,185,129,0.4)' }}
                  >
                    <CheckCircle size={14} className="text-white" />
                  </div>
                  <div
                    className="p-4 rounded-2xl text-center"
                    style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}
                  >
                    <p className="font-bold" style={{ color: '#34d399' }}>
                      Tu es devenu(e) {plan.careerTitle} 🎉
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                      Chaque étape franchie t'a rapproché(e) de cet objectif.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CV ── */}
        {activeTab === 'cv' && plan.cvTips && (
          <motion.div key="cv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList title="Optimiser ton CV" icon={<FileText size={15} style={{ color: '#fbbf24' }} />} color="#fbbf24" tips={plan.cvTips} />
          </motion.div>
        )}

        {/* ── LinkedIn ── */}
        {activeTab === 'linkedin' && plan.linkedinTips && (
          <motion.div key="linkedin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList title="Maximiser ton LinkedIn" icon={<Link size={15} style={{ color: '#60a5fa' }} />} color="#60a5fa" tips={plan.linkedinTips} />
          </motion.div>
        )}

        {/* ── Entretiens ── */}
        {activeTab === 'entretiens' && plan.interviewTips && (
          <motion.div key="entretiens" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList title="Réussir tes entretiens" icon={<Mic size={15} style={{ color: '#f87171' }} />} color="#f87171" tips={plan.interviewTips} />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={onRestart}
        className="w-full mt-10 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all hover:border-white/10"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          color: 'var(--text-3)',
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
      <div className="flex items-center gap-2.5 mb-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs" style={{ color: 'var(--text-3)' }}>{tips.length} conseils</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-3 p-3.5 rounded-xl group hover:border-white/10 transition-colors"
            style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span
              className="flex-shrink-0 w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-bold mt-0.5"
              style={{ background: `${color}20`, color }}
            >
              {i + 1}
            </span>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              {tip}
            </p>
            <ChevronRight
              size={14}
              className="flex-shrink-0 ml-auto opacity-0 group-hover:opacity-40 transition-opacity mt-0.5"
              style={{ color: 'var(--text-3)' }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
