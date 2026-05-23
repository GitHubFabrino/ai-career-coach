'use client'

import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'

type Props = {
  isAnalyzing?: boolean
}

export default function TypingIndicator({ isAnalyzing }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-3 items-start"
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
      >
        <Brain size={14} className="text-white" />
      </div>

      <div
        className="px-4 py-3 rounded-2xl"
        style={{
          background: 'rgba(124,58,237,0.12)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: '4px 18px 18px 18px',
          minWidth: 80,
        }}
      >
        {isAnalyzing ? (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: '#a78bfa' }}
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: '#a78bfa' }}>
              Analyzing your profile...
            </span>
          </div>
        ) : (
          <div className="flex gap-1.5 items-center h-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="typing-dot w-2 h-2 rounded-full" style={{ background: '#a78bfa' }} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
