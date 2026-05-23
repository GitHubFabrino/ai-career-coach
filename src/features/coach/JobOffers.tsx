'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MapPin, Briefcase, ExternalLink, Globe, Wifi, RefreshCw, AlertCircle } from 'lucide-react'
import type { Job } from '@/app/api/jobs/route'
import styles from './JobOffers.module.css'

type Props = {
  targetCareer?: string
  onRestart: () => void
}

type Mode = 'all' | 'local' | 'remote'

const MODE_OPTIONS: { value: Mode; label: string; icon: typeof Globe }[] = [
  { value: 'all',    label: 'Tout',       icon: Globe   },
  { value: 'local',  label: 'Madagascar', icon: MapPin  },
  { value: 'remote', label: 'Remote',     icon: Wifi    },
]

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  FULLTIME:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  PARTTIME:   { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  CONTRACTOR: { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  INTERN:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  'Full-time':  { color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  'Part-time':  { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  contract:     { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  internship:   { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
}

const TYPE_LABELS: Record<string, string> = {
  FULLTIME:   'Temps plein',
  PARTTIME:   'Temps partiel',
  CONTRACTOR: 'Freelance',
  INTERN:     'Stage',
  'Full-time':  'Temps plein',
  'Part-time':  'Temps partiel',
  contract:     'Freelance',
  internship:   'Stage',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem`
  return `Il y a ${Math.floor(days / 30)} mois`
}

export default function JobOffers({ targetCareer }: Props) {
  const [query, setQuery] = useState(targetCareer ?? '')
  const [location, setLocation] = useState('Madagascar')
  const [mode, setMode] = useState<Mode>('all')
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [missingKey, setMissingKey] = useState(false)

  const search = async () => {
    if (!query.trim() || isLoading) return
    setIsLoading(true)
    setError('')
    setSearched(true)
    setMissingKey(false)
    try {
      const params = new URLSearchParams({
        query: query.trim(),
        location: location.trim() || 'Madagascar',
        mode,
      })
      const res = await fetch(`/api/jobs?${params}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setJobs(data.jobs ?? [])
      setMissingKey(data.missingKey === true)
    } catch {
      setError('Impossible de se connecter. Vérifie ta connexion.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') search()
  }

  return (
    <div className={styles.container}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className={styles.header}>
        <div className={styles.headerBadge}>
          <Briefcase size={11} /> Offres d&apos;emploi
        </div>
        <h2 className={styles.headerTitle}>
          Trouve ton <span className="gradient-text">prochain poste</span>
        </h2>
        <p className={styles.headerSubtext}>
          Offres à Madagascar et à l&apos;international via JSearch &amp; Remotive
        </p>
      </motion.div>

      {/* Search card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={styles.searchCard}
      >
        {/* Mode toggle */}
        <div className={styles.modeToggle}>
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              className={styles.modeBtn}
              style={{
                background: mode === opt.value ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)',
                border: mode === opt.value ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.07)',
                color: mode === opt.value ? '#a78bfa' : 'var(--text-3)',
              }}
            >
              <opt.icon size={11} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className={styles.searchRow}>
          <div className={styles.searchInputWrap}>
            <Search size={14} className={styles.searchIcon} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Poste recherché (ex: Développeur React, Comptable…)"
              className={styles.searchInput}
            />
          </div>
          {mode !== 'remote' && (
            <div className={styles.locationInputWrap}>
              <MapPin size={13} className={styles.locationIcon} />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Localisation"
                className={styles.locationInput}
              />
            </div>
          )}
        </div>

        <button
          onClick={search}
          disabled={!query.trim() || isLoading}
          className={`${styles.searchBtn} ${query.trim() && !isLoading ? styles.searchBtnActive : styles.searchBtnDisabled}`}
        >
          {isLoading
            ? <><RefreshCw size={14} className={styles.spin} /> Recherche en cours…</>
            : <><Search size={14} /> Rechercher des offres</>}
        </button>
      </motion.div>

      {/* Loading waveform */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.loadingSection}>
          <div className={styles.waveform}>
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div key={i} className={styles.waveBar}
                style={{ background: 'linear-gradient(to top, #7c3aed, #a78bfa)' }}
                animate={{ height: ['8px', '28px', '8px'] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
              />
            ))}
          </div>
          <p className={styles.loadingText}>Recherche d&apos;offres…</p>
        </motion.div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.errorMsg}>
          <AlertCircle size={14} /> {error}
        </motion.div>
      )}

      {/* Missing API key notice */}
      <AnimatePresence>
        {missingKey && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={styles.noKeyCard}
          >
            <p className={styles.noKeyTitle}>🔑 Clé RapidAPI manquante</p>
            <p className={styles.noKeyText}>
              Pour les offres locales (Madagascar) et internationales, ajoute ta clé dans <code className={styles.noKeyInlineCode}>.env.local</code> :
            </p>
            <div className={styles.noKeyCode}>RAPIDAPI_KEY=ta_clé_ici</div>
            <p className={styles.noKeySubtext}>
              Clé gratuite sur <strong>rapidapi.com</strong> → API <strong>JSearch</strong> (500 requêtes/mois).
              En attendant, les offres <strong>Remote</strong> fonctionnent sans clé.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {!isLoading && searched && jobs.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsCount}>
              {jobs.length} offre{jobs.length > 1 ? 's' : ''} trouvée{jobs.length > 1 ? 's' : ''}
            </span>
            {missingKey && (
              <span className={styles.resultsNote}>Résultats Remote uniquement — clé RapidAPI manquante</span>
            )}
          </div>

          <div className={styles.jobsList}>
            {jobs.map((job, i) => {
              const typeStyle = TYPE_COLORS[job.type] ?? { color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
              const typeLabel = TYPE_LABELS[job.type] ?? job.type
              return (
                <motion.a
                  key={job.id}
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.045 }}
                  whileHover={{ y: -2 }}
                  className={styles.jobCard}
                >
                  <div className={styles.jobCardTop}>
                    {job.companyLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={job.companyLogo} alt={job.company} className={styles.companyLogo} />
                    ) : (
                      <div className={styles.companyLogoFallback}>
                        {job.company.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className={styles.jobInfo}>
                      <p className={styles.jobTitle}>{job.title}</p>
                      <p className={styles.jobCompany}>{job.company}</p>
                    </div>
                    <ExternalLink size={13} className={styles.externalIcon} />
                  </div>

                  <div className={styles.jobMeta}>
                    <span className={styles.jobLocation}><MapPin size={10} /> {job.location}</span>
                    <span className={styles.jobType} style={{ color: typeStyle.color, background: typeStyle.bg }}>
                      {typeLabel}
                    </span>
                    {job.source === 'remotive' && (
                      <span className={styles.sourceTag}><Wifi size={9} /> Remote</span>
                    )}
                  </div>

                  {job.salary && <p className={styles.jobSalary}>{job.salary}</p>}

                  {job.description && (
                    <p className={styles.jobDescription}>{job.description}…</p>
                  )}

                  {job.postedAt && (
                    <p className={styles.jobPostedAt}>{timeAgo(job.postedAt)}</p>
                  )}
                </motion.a>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && searched && jobs.length === 0 && !error && !missingKey && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.emptyState}>
          <Briefcase size={32} style={{ opacity: 0.25, marginBottom: '0.75rem' }} />
          <p className={styles.emptyTitle}>Aucune offre trouvée</p>
          <p className={styles.emptySubtext}>
            Essaie avec d&apos;autres mots-clés ou passe en mode <strong>Remote</strong>.
          </p>
        </motion.div>
      )}
    </div>
  )
}
