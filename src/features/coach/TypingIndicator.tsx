'use client'

import { motion } from 'framer-motion'
import { Brain, Cpu } from 'lucide-react'
import styles from './TypingIndicator.module.css'

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
      className={styles.row}
    >
      {/* Avatar */}
      <motion.div
        className={styles.avatar}
        animate={{
          boxShadow: [
            '0 2px 14px rgba(124,58,237,0.4)',
            '0 2px 22px rgba(124,58,237,0.75)',
            '0 2px 14px rgba(124,58,237,0.4)',
          ],
        }}
        transition={{ duration: 1.6, repeat: Infinity }}
      >
        {isAnalyzing
          ? <Cpu size={13} style={{ color: 'white' }} />
          : <Brain size={14} style={{ color: 'white' }} />
        }
      </motion.div>

      {/* Bubble */}
      <div className={styles.bubble}>
        {isAnalyzing ? (
          <div className={styles.analyzingRow}>
            <div className={styles.waveform}>
              {BARS.map((i) => (
                <motion.div
                  key={i}
                  className={styles.waveBar}
                  animate={{
                    height: ['6px', '20px', '8px', '16px', '6px'],
                    opacity: [0.5, 1, 0.7, 1, 0.5],
                  }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <motion.span
              className={styles.analyzingText}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              Analyse de ton profil…
            </motion.span>
          </div>
        ) : (
          <div className={styles.typingRow}>
            <div className={styles.dots}>
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={styles.dot}
                  animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.0, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' }}
                />
              ))}
            </div>
            <motion.span
              className={styles.typingText}
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
