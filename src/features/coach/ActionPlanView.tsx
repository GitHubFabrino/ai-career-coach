'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, ArrowRight, Zap, FileText, Link, Mic, Map, ChevronRight } from 'lucide-react'
import type { ActionPlan } from '@/types'
import styles from './ActionPlanView.module.css'

type Props = {
  plan: ActionPlan
  onRestart: () => void
}

const phaseConfig = {
  compétences:   { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  label: 'Compétences' },
  portfolio:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   label: 'Portfolio' },
  outils_emploi: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',   label: 'CV & LinkedIn' },
  réseau:        { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   label: 'Réseau' },
  entretiens:    { color: '#f87171', bg: 'rgba(248,113,113,0.1)',  label: 'Entretiens' },
  lancement:     { color: '#818cf8', bg: 'rgba(129,140,248,0.1)',  label: 'Lancement' },
}

const priorityConfig = {
  high:   { dot: '#f59e0b', label: 'Priorité haute' },
  medium: { dot: '#60a5fa', label: 'Priorité moyenne' },
  low:    { dot: '#34d399', label: 'Priorité basse' },
}

type Tab = 'roadmap' | 'cv' | 'linkedin' | 'entretiens'
const tabs: { id: Tab; label: string; icon: typeof FileText; color: string }[] = [
  { id: 'roadmap',    label: 'Feuille de route', icon: Map,      color: '#a78bfa' },
  { id: 'cv',        label: 'CV & Branding',     icon: FileText, color: '#fbbf24' },
  { id: 'linkedin',  label: 'LinkedIn',           icon: Link,     color: '#60a5fa' },
  { id: 'entretiens',label: 'Entretiens',         icon: Mic,      color: '#f87171' },
]

export default function ActionPlanView({ plan, onRestart }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('roadmap')

  return (
    <div className={styles.container}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <div className={styles.headerBadge}>
          <Zap size={11} />
          Feuille de route personnelle
        </div>

        <h2 className={styles.headerTitle}>
          Devenir{' '}
          <span className="gradient-text">{plan.careerTitle}</span>
        </h2>

        <p className={styles.headerSummary}>{plan.summary}</p>

        <div className={styles.durationBadge}>
          <Clock size={13} />
          Durée estimée : {plan.totalDuration}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <div className={styles.tabsOuter}>
        <div className={styles.tabsBar}>
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
                className={styles.tabBtn}
                style={{ color: isActive ? tab.color : 'var(--text-3)' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className={styles.tabActiveBg}
                    style={{ background: `${tab.color}13`, border: `1px solid ${tab.color}22` }}
                    transition={{ type: 'spring', stiffness: 380, damping: 36 }}
                  />
                )}
                <tab.icon size={12} style={{ flexShrink: 0, position: 'relative' }} />
                <span className={styles.tabLabel}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <AnimatePresence mode="wait">

        {/* Roadmap */}
        {activeTab === 'roadmap' && (
          <motion.div
            key="roadmap"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className={styles.roadmapContainer}>
              <div className={styles.timelineLine} />

              <div className={styles.stepsList}>
                {plan.steps.map((step, i) => {
                  const phase = phaseConfig[step.phase as keyof typeof phaseConfig] || phaseConfig['compétences']
                  const prio = priorityConfig[step.priority as keyof typeof priorityConfig] || priorityConfig['medium']

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07, type: 'spring', stiffness: 280, damping: 28 }}
                      className={styles.stepRow}
                    >
                      {/* Step bubble */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.07 + 0.1, type: 'spring', stiffness: 320 }}
                        className={styles.stepBubble}
                        style={{
                          background: `linear-gradient(135deg, ${phase.color}, ${phase.color}99)`,
                          boxShadow: `0 0 14px ${phase.color}40`,
                        }}
                      >
                        {i + 1}
                      </motion.div>

                      {/* Step card */}
                      <div className={styles.stepCard}>
                        <div className={styles.stepCardHeader}>
                          <span
                            className={styles.phaseTag}
                            style={{ background: phase.bg, color: phase.color, border: `1px solid ${phase.color}28` }}
                          >
                            {phase.label}
                          </span>
                          <div className={styles.stepMeta}>
                            <span
                              className={styles.prioDot}
                              style={{ background: prio.dot }}
                              title={prio.label}
                            />
                            <span className={styles.stepDuration}>{step.duration}</span>
                          </div>
                        </div>

                        <h3 className={styles.stepTitle}>{step.title}</h3>
                        <p className={styles.stepDesc}>{step.description}</p>

                        {step.resources && step.resources.length > 0 && (
                          <div className={styles.resourceTags}>
                            {step.resources.map((r) => (
                              <span key={r} className={styles.resourceTag}>{r}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}

                {/* Finish card */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: plan.steps.length * 0.07 + 0.15, type: 'spring' }}
                  className={styles.stepRow}
                >
                  <div className={styles.finishBubble}>
                    <CheckCircle size={13} style={{ color: 'white' }} />
                  </div>
                  <div className={styles.finishCard}>
                    <p className={styles.finishTitle}>
                      🎉 Tu es devenu(e) {plan.careerTitle} !
                    </p>
                    <p className={styles.finishSubtext}>
                      Chaque étape franchie t&apos;a rapproché(e) de cet objectif.
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CV Tips */}
        {activeTab === 'cv' && plan.cvTips && (
          <motion.div key="cv" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList
              title="Optimiser ton CV"
              icon={<FileText size={15} style={{ color: '#fbbf24' }} />}
              color="#fbbf24"
              tips={plan.cvTips}
            />
          </motion.div>
        )}

        {/* LinkedIn Tips */}
        {activeTab === 'linkedin' && plan.linkedinTips && (
          <motion.div key="linkedin" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList
              title="Maximiser ton LinkedIn"
              icon={<Link size={15} style={{ color: '#60a5fa' }} />}
              color="#60a5fa"
              tips={plan.linkedinTips}
            />
          </motion.div>
        )}

        {/* Interview Tips */}
        {activeTab === 'entretiens' && plan.interviewTips && (
          <motion.div key="entretiens" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <TipList
              title="Réussir tes entretiens"
              icon={<Mic size={15} style={{ color: '#f87171' }} />}
              color="#f87171"
              tips={plan.interviewTips}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Restart ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={onRestart}
        className={styles.restartBtn}
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
      <div className={styles.tipListHeader}>
        <div
          className={styles.tipListIconWrap}
          style={{ background: `${color}15`, border: `1px solid ${color}25` }}
        >
          {icon}
        </div>
        <div>
          <h3 className={styles.tipListTitle}>{title}</h3>
          <p className={styles.tipListCount}>{tips.length} conseils</p>
        </div>
      </div>

      <div className={styles.tipsList}>
        {tips.map((tip, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, type: 'spring', stiffness: 280 }}
            className={styles.tipItem}
          >
            <span
              className={styles.tipNumber}
              style={{ background: `${color}1e`, color }}
            >
              {i + 1}
            </span>
            <p className={styles.tipText}>{tip}</p>
            <ChevronRight size={13} className={styles.tipArrow} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
