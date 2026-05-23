'use client'

import { motion } from 'framer-motion'
import { Brain, User } from 'lucide-react'
import type { Message } from '@/types'
import styles from './ChatMessage.module.css'

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
    if (m[2]) parts.push(<strong key={key++} className={styles.bold}>{m[2]}</strong>)
    else if (m[3]) parts.push(<em key={key++} className={styles.italic}>{m[3]}</em>)
    else if (m[4]) parts.push(<code key={key++} className={styles.inlineCode}>{m[4]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}

/** Render lines — handles bullet lists, numbered lists & blank lines */
function renderContent(content: string, isLast: boolean): React.ReactNode {
  const lines = content.split('\n')
  const result: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line === '') {
      result.push(<div key={key++} className={styles.blankLine} />)
      continue
    }

    // Bullet point
    if (/^[-•]\s+/.test(line)) {
      result.push(
        <div key={key++} className={styles.bulletItem}>
          <span className={styles.bulletDot} />
          <span>{parseInline(line.replace(/^[-•]\s+/, ''))}</span>
        </div>
      )
      continue
    }

    // Numbered list
    const numMatch = /^(\d+)[.)]\s+/.exec(line)
    if (numMatch) {
      result.push(
        <div key={key++} className={styles.numberedItem}>
          <span className={styles.numberedLabel}>{numMatch[1]}.</span>
          <span>{parseInline(line.replace(/^\d+[.)]\s+/, ''))}</span>
        </div>
      )
      continue
    }

    // Regular line — blinking cursor on the very last line
    const isVeryLast = isLast && i === lines.length - 1
    result.push(
      <span key={key++} className={styles.line}>
        {parseInline(line)}
        {isVeryLast && <span className={styles.cursor} />}
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
      className={`${styles.message} ${isAI ? '' : styles.messageUser}`}
    >
      {/* Avatar */}
      <div className={styles.avatarWrap}>
        {isAI ? (
          <motion.div
            className={styles.avatarAI}
            animate={isLast ? {
              boxShadow: [
                '0 2px 14px rgba(124,58,237,0.4)',
                '0 2px 22px rgba(124,58,237,0.75)',
                '0 2px 14px rgba(124,58,237,0.4)',
              ],
            } : {}}
            transition={{ duration: 2, repeat: isLast ? Infinity : 0 }}
          >
            <Brain size={14} style={{ color: 'white' }} />
          </motion.div>
        ) : (
          <div className={styles.avatarUser}>
            <User size={14} style={{ color: 'var(--text-2)' }} />
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`${styles.bubbleWrap} ${isAI ? '' : styles.bubbleWrapUser}`}>
        <div className={`${styles.bubble} ${isAI ? styles.bubbleAI : styles.bubbleUser}`}>
          {renderContent(message.content, !!isLast && isAI)}
        </div>

        <p className={`${styles.timestamp} ${isAI ? '' : styles.timestampUser}`}>
          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </motion.div>
  )
}
