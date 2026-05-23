'use client'

import { motion } from 'framer-motion'
import { Brain, User } from 'lucide-react'
import type { Message } from '@/types'

type Props = {
  message: Message
  isLast?: boolean
}

export default function ChatMessage({ message, isLast }: Props) {
  const isAI = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{
          background: isAI
            ? 'linear-gradient(135deg, #7c3aed, #4f46e5)'
            : 'rgba(255,255,255,0.08)',
        }}
      >
        {isAI ? (
          <Brain size={14} className="text-white" />
        ) : (
          <User size={14} style={{ color: '#94a3b8' }} />
        )}
      </div>

      <div
        className="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          background: isAI
            ? 'rgba(124,58,237,0.12)'
            : 'rgba(255,255,255,0.06)',
          border: isAI
            ? '1px solid rgba(124,58,237,0.25)'
            : '1px solid rgba(255,255,255,0.08)',
          color: '#e2e8f0',
          borderRadius: isAI
            ? '4px 18px 18px 18px'
            : '18px 4px 18px 18px',
        }}
      >
        {message.content}
        {isAI && isLast && (
          <span
            className="inline-block w-0.5 h-4 ml-1 align-middle"
            style={{
              background: '#7c3aed',
              animation: 'blink 1s step-end infinite',
            }}
          />
        )}
      </div>
    </motion.div>
  )
}
