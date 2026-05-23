'use client'

import { motion } from 'framer-motion'
import { Brain, User } from 'lucide-react'
import type { Message } from '@/types'

type Props = {
  message: Message
  isLast?: boolean
}

/** Parse inline markdown: **bold**, *italic*, `code` */
function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g
  let last = 0
  let m: RegExpExecArray | null
  let key = 0

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[2]) parts.push(<strong key={key++} className="font-semibold text-white">{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={key++} className="italic">{m[3]}</em>)
    else if (m[4]) parts.push(
      <code
        key={key++}
        className="px-1.5 py-0.5 rounded text-xs font-mono"
        style={{ background: 'rgba(124,58,237,0.2)', color: '#c4b5fd' }}
      >
        {m[4]}
      </code>
    )
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Render lines — handles bullet lists & blank lines */
function renderContent(content: string, isLast: boolean): React.ReactNode {
  const lines = content.split('\n')
  const result: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line === '') {
      result.push(<div key={key++} className="h-2" />)
      continue
    }

    // Bullet point
    if (/^[-•]\s+/.test(line)) {
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: '#a78bfa' }}
          />
          <span>{parseInline(line.replace(/^[-•]\s+/, ''))}</span>
        </div>
      )
      continue
    }

    // Numbered list
    const numMatch = /^(\d+)[.)]\s+/.exec(line)
    if (numMatch) {
      result.push(
        <div key={key++} className="flex items-start gap-2 my-0.5">
          <span
            className="flex-shrink-0 text-xs font-bold mt-0.5 w-4 text-right"
            style={{ color: '#a78bfa' }}
          >
            {numMatch[1]}.
          </span>
          <span>{parseInline(line.replace(/^\d+[.)]\s+/, ''))}</span>
        </div>
      )
      continue
    }

    // Regular line — add cursor blink on very last line
    const isVeryLast = isLast && i === lines.length - 1
    result.push(
      <span key={key++} className="block">
        {parseInline(line)}
        {isVeryLast && (
          <span
            className="inline-block w-0.5 h-3.5 ml-0.5 align-middle rounded-full"
            style={{ background: '#a78bfa', animation: 'blink 1s step-end infinite' }}
          />
        )}
      </span>
    )
  }

  return <>{result}</>
}

export default function ChatMessage({ message, isLast }: Props) {
  const isAI = message.role === 'assistant'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className={`flex gap-3 ${isAI ? 'items-start' : 'items-start flex-row-reverse'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        {isAI ? (
          <motion.div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              boxShadow: '0 2px 14px rgba(124,58,237,0.4)',
            }}
            animate={isLast ? { boxShadow: ['0 2px 14px rgba(124,58,237,0.4)', '0 2px 20px rgba(124,58,237,0.7)', '0 2px 14px rgba(124,58,237,0.4)'] } : {}}
            transition={{ duration: 2, repeat: isLast ? Infinity : 0 }}
          >
            <Brain size={14} className="text-white" />
          </motion.div>
        ) : (
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <User size={14} style={{ color: 'var(--text-2)' }} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col gap-1 ${isAI ? 'max-w-[82%]' : 'max-w-[78%] items-end'}`}>
        <div
          className="px-4 py-3 text-sm leading-relaxed"
          style={{
            background: isAI
              ? 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.07))'
              : 'rgba(255,255,255,0.07)',
            border: isAI
              ? '1px solid rgba(124,58,237,0.18)'
              : '1px solid rgba(255,255,255,0.1)',
            borderRadius: isAI ? '4px 18px 18px 18px' : '18px 4px 18px 18px',
            color: 'var(--text)',
            boxShadow: isAI
              ? '0 2px 12px rgba(0,0,0,0.3)'
              : '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {renderContent(message.content, !!isLast && isAI)}
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
