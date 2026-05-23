'use client'

import { motion } from 'framer-motion'
import { Brain, Cpu } from 'lucide-react'

type Props = {
  isAnalyzing?: boolean
}

const BARS = [0, 1, 2, 3, 4]

export default function TypingIndicator({ isAnalyzing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="flex gap-3 items-start"
    >
      {/* Avatar */}
      <motion.div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 2px 14px rgba(124,58,237,0.4)',
        }}
        animate={{
          boxShadow: [
            '0 2px 14px rgba(124,58,237,0.4)',
            '0 2px 22px rgba(124,58,237,0.75)',
            '0 2px 14px rgba(124,58,237,0.4)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {isAnalyzing ? (
          <Cpu size={13} className="text-white" />
        ) : (
          <Brain size={14} className="text-white" />
        )}
      </motion.div>

      {/* Bubble */}
      <div
        className="px-4 py-3"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.07))',
          border: '1px solid rgba(124,58,237,0.18)',
          borderRadius: '4px 18px 18px 18px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
        }}
      >
        {isAnalyzing ? (
          <div className="flex items-center gap-3">
            {/* Waveform bars */}
            <div className="flex items-center gap-0.5 h-5">
              {BARS.map((i) => (
                <motion.div
                  key={i}
                  className="w-[3px] rounded-full"
                  style={{ background: 'linear-gradient(to top, #7c3aed, #c4b5fd)' }}
                  animate={{
                    height: ['6px', '20px', '8px', '16px', '6px'],
                    opacity: [0.5, 1, 0.7, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.1,
                    repeat: Infinity,
                    delay: i * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <motion.span
              className="text-xs font-medium"
              style={{ color: '#a78bfa' }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              Analyse de ton profil…
            </motion.span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            {/* Typing dots */}
            <div className="flex gap-1.5 items-center h-4">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#a78bfa' }}
                  animate={{
                    scale: [0.6, 1, 0.6],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 1.0,
                    repeat: Infinity,
                    delay: i * 0.22,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <motion.span
              className="text-xs"
              style={{ color: 'var(--text-4)' }}
              animate={{ opacity: [0.5, 0.9, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Réflexion…
            </motion.span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
