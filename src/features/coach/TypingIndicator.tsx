'use client'

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

type Props = {
  isAnalyzing?: boolean
}

export default function TypingIndicator({ isAnalyzing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className="flex gap-3 items-start"
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
        }}
      >
        <Brain size={14} className="text-white" />
      </div>

      <div
        className="px-4 py-3.5"
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.08))',
          border: '1px solid rgba(124,58,237,0.2)',
          borderRadius: '4px 18px 18px 18px',
        }}
      >
        {isAnalyzing ? (
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={`dot-${i}`}
                  className="w-1 h-4 rounded-full"
                  style={{ background: '#a78bfa' }}
                  animate={{ scaleY: [0.4, 1, 0.4], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                />
              ))}
            </div>
            <span className="text-xs font-medium" style={{ color: '#a78bfa' }}>
              Analyse de ton profil…
            </span>
          </div>
        ) : (
          <div className="flex gap-1.5 items-center h-4">
            {[0, 1, 2].map((i) => (
              <div
                key={`tdot-${i}`}
                className="typing-dot w-2 h-2 rounded-full"
                style={{ background: '#a78bfa' }}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
