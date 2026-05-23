'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Zap, Target, Sparkles, FileText, Mic, Shield, Star, CheckCircle } from 'lucide-react'
import styles from './page.module.css'

const HeroScene = dynamic(() => import('@/components/3d/HeroScene'), {
  ssr: false,
  loading: () => <div style={{ width: '100%', height: '100%' }} />,
})

/* ── Data ─────────────────────────────────────────────── */
const features = [
  {
    icon: Brain, color: '#a78bfa',
    glow: 'rgba(124,58,237,0.18)', border: 'rgba(124,58,237,0.3)',
    title: 'Analyse IA profonde',
    desc: 'Agent ReAct qui analyse ton profil avec précision chirurgicale et révèle tes vraies forces.',
  },
  {
    icon: Target, color: '#60a5fa',
    glow: 'rgba(59,130,246,0.18)', border: 'rgba(59,130,246,0.3)',
    title: 'Métiers sur mesure',
    desc: '3 parcours personnalisés avec score de compatibilité basé sur tes compétences.',
  },
  {
    icon: FileText, color: '#fbbf24',
    glow: 'rgba(245,158,11,0.18)', border: 'rgba(245,158,11,0.3)',
    title: 'Analyse de CV',
    desc: 'Détection automatique de tes compétences et feedback personnalisé pour optimiser ton CV.',
  },
  {
    icon: Mic, color: '#34d399',
    glow: 'rgba(16,185,129,0.18)', border: 'rgba(16,185,129,0.3)',
    title: 'Simulation vocale',
    desc: "Entraîne-toi à l'oral avec un entretien IA interactif et reçois un feedback instantané.",
  },
  {
    icon: Zap, color: '#f472b6',
    glow: 'rgba(236,72,153,0.18)', border: 'rgba(236,72,153,0.3)',
    title: "Plan d'action concret",
    desc: 'Feuille de route étape par étape avec ressources gratuites adaptées à ton contexte.',
  },
  {
    icon: Sparkles, color: '#818cf8',
    glow: 'rgba(99,102,241,0.18)', border: 'rgba(99,102,241,0.3)',
    title: 'Coaching psychologique',
    desc: 'Identification des blocages — peur, perfectionnisme — avec des solutions concrètes.',
  },
]

const stats = [
  { value: '10+',   label: 'Filières disponibles' },
  { value: '8',     label: 'Rôles de coaching' },
  { value: '100%',  label: 'Gratuit & sans inscription' },
  { value: '5 min', label: 'Pour un plan complet' },
]

const trustPoints = [
  {
    icon: Star, color: '#fbbf24',
    bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)',
    title: 'Propulsé par Claude Sonnet',
    desc: "Le modèle frontier d'Anthropic pour des conseils de niveau expert.",
  },
  {
    icon: Shield, color: '#34d399',
    bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.18)',
    title: 'Privé & sécurisé',
    desc: "Aucune inscription. Tes données ne sont jamais stockées ni partagées.",
  },
  {
    icon: CheckCircle, color: '#60a5fa',
    bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.18)',
    title: 'Contexte malgache',
    desc: "Adapté au marché de l'emploi de Madagascar et de l'Océan Indien.",
  },
]

/* ── Framer helpers ──────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: 'easeOut' as const },
})

/* ════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter()

  return (
    <div className={styles.page}>

      {/* ── Ambient blobs ── */}
      <div className={styles.ambientBlobs}>
        <div className={styles.blobTop} />
        <div className={styles.blobLeft} />
        <div className={styles.blobRight} />
      </div>

      {/* ── 3D scene ── */}
      <div className={styles.sceneContainer}>
        <HeroScene dataPointCount={8} />
      </div>

      <div className={styles.main}>

        {/* ════════════════
            NAV
        ════════════════ */}
        <header className={styles.nav}>
          <div className={styles.navInner}>

            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className={styles.logo}
            >
              <div className={styles.logoIcon}>
                <Brain size={15} style={{ color: 'white' }} />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoName}>Coach Carrière</span>
                <span className={styles.logoBadge}>IA</span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45 }}
              className={styles.navRight}
            >
              <div className={styles.navBadge}>
                <span className={styles.navDot} />
                Claude AI · Gratuit
              </div>
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => router.push('/coach')}
                className={`btn-primary ${styles.navBtn}`}
              >
                Commencer
                <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          </div>
        </header>

        {/* ════════════════
            HERO
        ════════════════ */}
        <section className={styles.heroSection}>
          <div className={styles.heroContainer}>

            {/* Badge */}
            <motion.div {...fadeUp(0.05)} className={styles.heroBadge}>
              <div className={styles.heroBadgeInner}>
                <Sparkles size={11} />
                Agent ReAct · Madagascar &amp; Océan Indien
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1 {...fadeUp(0.15)} className={styles.heroTitle}>
              <span className={styles.heroTitleWhite}>Découvre ta</span>
              <span className="glow-text" style={{ display: 'block' }}>voie idéale</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p {...fadeUp(0.25)} className={styles.heroSubtitle}>
              Une IA qui comprend ton profil, détecte tes blocages,
              te propose les meilleurs parcours et construit ta feuille de route — en quelques minutes.
            </motion.p>

            {/* CTA buttons */}
            <motion.div {...fadeUp(0.35)} className={styles.ctaRow}>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/coach')}
                className={`btn-primary ${styles.ctaMainBtn}`}
              >
                Commencer mon parcours
                <ArrowRight size={18} />
              </motion.button>

              <div className={styles.ctaSecondary}>
                <Shield size={13} />
                Gratuit · Sans inscription · 5 minutes
              </div>
            </motion.div>

            {/* Stats row */}
            <motion.div {...fadeUp(0.45)} className={styles.statsRow}>
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`${styles.statItem} ${i > 0 ? styles.statItemBordered : ''}`}
                >
                  <p className={styles.statValue}>{s.value}</p>
                  <p className={styles.statLabel}>{s.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ════════════════
            FEATURES
        ════════════════ */}
        <section className={styles.featuresSection}>
          <div className={styles.featuresInner}>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={styles.sectionHeader}
            >
              <p className={styles.sectionLabel}>Ce que fait ton coach</p>
              <h2 className={styles.sectionTitleLg}>
                Tout ce dont tu as besoin,{' '}
                <span className="gradient-text">au même endroit</span>
              </h2>
            </motion.div>

            <div className={styles.featuresGrid}>
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 + i * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -5, transition: { duration: 0.18 } }}
                  className={styles.featureCard}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = f.border
                    e.currentTarget.style.boxShadow = `0 8px 40px ${f.glow}`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div
                    className={styles.featureGlow}
                    style={{ background: `radial-gradient(ellipse at 20% 20%, ${f.glow}, transparent 60%)` }}
                  />
                  <div
                    className={styles.featureIconWrap}
                    style={{ background: f.glow, border: `1px solid ${f.border}` }}
                  >
                    <f.icon size={20} style={{ color: f.color }} />
                  </div>
                  <h3 className={styles.featureTitle}>{f.title}</h3>
                  <p className={styles.featureDesc}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════
            TRUST
        ════════════════ */}
        <section className={styles.trustSection}>
          <div className={styles.trustInner}>

            <div className={styles.sectionDivider} />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className={styles.sectionHeader}
              style={{ marginBottom: '3rem' }}
            >
              <p className={styles.sectionLabel}>Pourquoi nous faire confiance</p>
              <h2 className={styles.sectionTitle}>Conçu avec soin pour toi</h2>
            </motion.div>

            <div className={styles.trustGrid}>
              {trustPoints.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85 + i * 0.1 }}
                  className={styles.trustCard}
                  style={{ background: t.bg, border: `1px solid ${t.border}` }}
                >
                  <div
                    className={styles.trustIconWrap}
                    style={{ background: t.bg, border: `1px solid ${t.border}` }}
                  >
                    <t.icon size={22} style={{ color: t.color }} />
                  </div>
                  <h3 className={styles.trustTitle}>{t.title}</h3>
                  <p className={styles.trustDesc}>{t.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* CTA block */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.05 }}
              className={styles.ctaBlock}
            >
              <div className={styles.ctaBlockGlow} />
              <div className={styles.ctaBlockContent}>
                <p className={styles.ctaBlockLabel}>Prêt à commencer ?</p>
                <h2 className={styles.ctaBlockTitle}>Découvre ta carrière idéale</h2>
                <p className={styles.ctaBlockSubtitle}>
                  Gratuit, sans inscription, en 5 minutes. Propulsé par Claude Sonnet d&apos;Anthropic.
                </p>
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => router.push('/coach')}
                  className={`btn-primary ${styles.ctaBlockBtn}`}
                >
                  Commencer gratuitement
                  <ArrowRight size={18} />
                </motion.button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ════════════════
            FOOTER
        ════════════════ */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <div className={styles.footerRow}>

              <div className={styles.brand}>
                <div className={styles.brandIcon}>
                  <Brain size={13} style={{ color: 'white' }} />
                </div>
                <span className={styles.brandName}>Coach Carrière IA</span>
              </div>

              <p className={styles.copyright}>
                © {new Date().getFullYear()} · Gratuit · Sans inscription · Propulsé par Claude AI
              </p>

              <div className={styles.statusBadge}>
                <span className={styles.statusDot} />
                <span className={styles.statusText}>Service en ligne</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
