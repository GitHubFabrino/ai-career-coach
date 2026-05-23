'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { MODELS, PROVIDER_META, DEFAULT_PROVIDER, DEFAULT_MODEL_ID } from '@/lib/llm/providers'
import type { Provider } from '@/lib/llm/providers'
import styles from './LLMSelector.module.css'

const STORAGE_KEY = 'llm_selection'

type LLMSelection = { provider: string; modelId: string }

function loadSelection(): LLMSelection {
  if (typeof window === 'undefined') return { provider: DEFAULT_PROVIDER, modelId: DEFAULT_MODEL_ID }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LLMSelection
  } catch {}
  return { provider: DEFAULT_PROVIDER, modelId: DEFAULT_MODEL_ID }
}

function saveSelection(sel: LLMSelection) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sel)) } catch {}
}

type Props = {
  onChange: (provider: string, modelId: string) => void
  compact?: boolean
}

const providers = Object.keys(PROVIDER_META) as Provider[]

export default function LLMSelector({ onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const [selection, setSelection] = useState<LLMSelection>({ provider: DEFAULT_PROVIDER, modelId: DEFAULT_MODEL_ID })
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = loadSelection()
    setSelection(saved)
    onChange(saved.provider, saved.modelId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function select(provider: string, modelId: string) {
    const next = { provider, modelId }
    setSelection(next)
    saveSelection(next)
    onChange(provider, modelId)
    setOpen(false)
  }

  const currentModel = MODELS.find((m) => m.id === selection.modelId)
  const currentMeta = PROVIDER_META[selection.provider as Provider]

  if (compact) {
    return (
      <div className={styles.wrapper} ref={wrapperRef}>
        <button className={styles.triggerCompact} onClick={() => setOpen((v) => !v)}>
          <span className={styles.providerDot} style={{ background: currentMeta?.color }} />
          {currentMeta?.abbr} · {currentModel?.name ?? selection.modelId}
          <ChevronDown size={10} />
        </button>
        <AnimatePresence>
          {open && <DropdownPanel selection={selection} onSelect={select} alignRight />}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button className={styles.trigger} onClick={() => setOpen((v) => !v)}>
        <span className={styles.providerDot} style={{ background: currentMeta?.color }} />
        <span className={styles.triggerProvider}>{currentMeta?.abbr}</span>
        <span className={styles.triggerSep}>·</span>
        <span className={styles.triggerModel}>{currentModel?.name ?? selection.modelId}</span>
        <ChevronDown
          size={11}
          className={`${styles.triggerChevron} ${open ? styles.triggerChevronOpen : ''}`}
        />
      </button>
      <AnimatePresence>
        {open && <DropdownPanel selection={selection} onSelect={select} />}
      </AnimatePresence>
    </div>
  )
}

function DropdownPanel({
  selection,
  onSelect,
  alignRight = false,
}: {
  selection: LLMSelection
  onSelect: (provider: string, modelId: string) => void
  alignRight?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`${styles.panel} ${alignRight ? styles.panelRight : ''}`}
    >
      {providers.map((provider) => {
        const meta = PROVIDER_META[provider]
        const models = MODELS.filter((m) => m.provider === provider)
        return (
          <div key={provider} className={styles.providerSection}>
            <div className={styles.providerHeader}>
              <span className={styles.providerHeaderDot} style={{ background: meta.color }} />
              {meta.name}
            </div>
            {models.map((model) => {
              const isActive = selection.modelId === model.id
              return (
                <button
                  key={model.id}
                  onClick={() => onSelect(provider, model.id)}
                  className={`${styles.modelItem} ${isActive ? styles.modelItemActive : ''}`}
                >
                  <span className={styles.modelName}>{model.name}</span>
                  {model.badge && <span className={styles.badge}>{model.badge}</span>}
                  {isActive && <Check size={11} className={styles.checkIcon} />}
                </button>
              )
            })}
          </div>
        )
      })}
    </motion.div>
  )
}
