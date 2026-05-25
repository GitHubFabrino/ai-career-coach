import type { UserProfile, CareerSuggestion, ActionPlan, SkillGap, BlockerAnalysis, JobMatch } from '@/types'

export type ToolName =
  | 'profile_analyzer'
  | 'blocker_analyzer'
  | 'career_matcher'
  | 'skill_gap_analyzer'
  | 'action_plan_generator'
  | 'job_matcher'

export type ToolInput = {
  profile_analyzer: { answers: Record<string, string>; full_conversation?: string }
  blocker_analyzer: { profile: UserProfile; full_conversation: string }
  career_matcher: { profile: UserProfile; blockers?: BlockerAnalysis }
  skill_gap_analyzer: { profile: UserProfile; career: string }
  action_plan_generator: {
    profile: UserProfile
    career: CareerSuggestion
    gaps: SkillGap[]
    blockers?: BlockerAnalysis
  }
  job_matcher: { profile: UserProfile; careers?: CareerSuggestion[] }
}

export type ToolOutput = {
  profile_analyzer: UserProfile
  blocker_analyzer: BlockerAnalysis
  career_matcher: CareerSuggestion[]
  skill_gap_analyzer: SkillGap[]
  action_plan_generator: ActionPlan
  job_matcher: JobMatch[]
}

export const TOOL_DEFINITIONS = [
  {
    name: 'profile_analyzer',
    description:
      'Extrait le profil structuré de l\'utilisateur depuis la conversation : intérêts, compétences, forces, objectifs, ville à Madagascar, contexte de carrière (local / remote / ngo / entrepreneuriat) et situation actuelle (étudiant, en emploi, reconversion…).',
    input_schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'object',
          description: 'Faits clés extraits de la conversation : { name, education, goals, location, careerContext, currentSituation }',
        },
        full_conversation: {
          type: 'string',
          description: 'Texte complet de la conversation (messages utilisateur) pour une extraction plus riche.',
        },
      },
      required: ['answers'],
    },
  },
  {
    name: 'blocker_analyzer',
    description:
      'Identifie les blocages psychologiques (peurs, manque de confiance, perfectionnisme, confusion…), les forces cachées et le niveau de préparation au changement. À utiliser après avoir extrait le profil utilisateur.',
    input_schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          description: 'Le profil structuré retourné par profile_analyzer',
        },
        full_conversation: {
          type: 'string',
          description: 'Texte complet de la conversation pour détecter les signaux faibles (hésitations, formulations négatives, doutes exprimés)',
        },
      },
      required: ['profile', 'full_conversation'],
    },
  },
  {
    name: 'career_matcher',
    description:
      'Associe le profil utilisateur aux 3 meilleures voies professionnelles dans le contexte malgache, avec scores de compatibilité personnalisés, arguments POUR et CONTRE chaque option pour aider la décision. Prend en compte les blocages identifiés pour ajuster les recommandations.',
    input_schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          description: 'Le profil structuré de l\'utilisateur',
        },
        blockers: {
          type: 'object',
          description: 'L\'analyse des blocages pour adapter les recommandations',
        },
      },
      required: ['profile'],
    },
  },
  {
    name: 'skill_gap_analyzer',
    description:
      'Identifie les compétences à développer pour atteindre un métier spécifique. Retourne des écarts avec des ressources GRATUITES et accessibles à Madagascar (faible bande passante, en français, utilisables sur mobile).',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'Le profil utilisateur' },
        career: { type: 'string', description: 'Le titre exact du métier visé (correspondance exacte avec career_matcher)' },
      },
      required: ['profile', 'career'],
    },
  },
  {
    name: 'action_plan_generator',
    description:
      'Génère un plan d\'action complet et personnalisé couvrant les 6 phases : compétences → portfolio → outils de recherche d\'emploi (CV, LinkedIn, personal branding) → réseau → préparation entretiens → lancement. Adapté au contexte de l\'utilisateur (local / remote / ONG) et à ses blocages identifiés.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'Le profil utilisateur' },
        career: { type: 'object', description: 'La suggestion de carrière sélectionnée' },
        gaps: { type: 'array', description: 'Les lacunes de compétences identifiées' },
        blockers: { type: 'object', description: 'L\'analyse des blocages pour personnaliser le coaching' },
      },
      required: ['profile', 'career', 'gaps'],
    },
  },
  {
    name: 'job_matcher',
    description:
      'Recherche dans les offres d\'emploi réelles de portaljob-madagascar.com et retourne les 5 meilleures offres correspondant au profil et aux carrières suggérées. À utiliser après career_matcher pour proposer des offres concrètes à postuler immédiatement.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'Le profil structuré de l\'utilisateur' },
        careers: { type: 'array', description: 'Les suggestions de carrières retournées par career_matcher (optionnel, améliore la précision)' },
      },
      required: ['profile'],
    },
  },
]
