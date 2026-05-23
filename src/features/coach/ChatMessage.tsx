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

  const lines = message.content.split('\n')

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
      className={`flex gap-3 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isAI ? (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 2px 12px rgba(124,58,237,0.4)',
            }}
          >
            <Brain size={14} className="text-white" />
          </div>
        ) : (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <User size={14} style={{ color: 'var(--text-2)' }} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className="flex flex-col gap-1 max-w-[78%]">
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={{
            background: isAI
              ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.08))'
              : 'rgba(255,255,255,0.06)',
            border: isAI
              ? '1px solid rgba(124,58,237,0.2)'
              : '1px solid rgba(255,255,255,0.08)',
            borderRadius: isAI ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
            color: 'var(--text)',
          }}
        >
          {lines.map((line, i) =>
            line === '' ? (
              <br key={i} />
            ) : (
              <span key={i} className="block">
                {line}
                {isAI && isLast && i === lines.length - 1 && (
                  <span
                    className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
                    style={{
                      background: '#a78bfa',
                      animation: 'blink 1s step-end infinite',
                    }}
                  />
                )}
              </span>
            )
          )}
        </div>

        {/* Timestamp */}
        <p
          className={`text-[10px] px-1 ${isAI ? 'text-left' : 'text-right'}`}
          style={{ color: 'var(--text-4)' }}
        >
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}
