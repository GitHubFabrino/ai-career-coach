export type UserProfile = {
  interests: string[]
  skills: string[]
  strengths: string[]
  goals: string
  name?: string
  education?: string
  experience?: string
  location?: string
  careerContext?: 'local' | 'remote' | 'ngo' | 'entrepreneurship'
  currentSituation?: 'étudiant' | 'en_emploi' | 'en_reconversion' | 'sans_emploi' | 'entrepreneur'
}

export type Blocker = {
  type:
    | 'peur_échec'
    | 'manque_confiance'
    | 'confusion_orientation'
    | 'manque_réseau'
    | 'manque_diplôme'
    | 'contrainte_financière'
    | 'peur_jugement'
    | 'perfectionnisme'
  label: string
  description: string
  coachingAdvice: string
}

export type BlockerAnalysis = {
  blockers: Blocker[]
  strengths: string[]
  motivationProfile: 'intrinsèque' | 'extrinsèque' | 'mixte'
  readinessScore: number
  readinessLabel: string
  encouragement: string
}

export type CareerSuggestion = {
  title: string
  matchScore: number
  description: string
  requiredSkills: string[]
  whyItFits: string
  salaryRange?: string
  growthPotential?: string
  icon?: string
  decisionPros?: string[]
  decisionCons?: string[]
}

export type ActionPlanStep = {
  title: string
  description: string
  duration: string
  resources?: string[]
  priority: 'high' | 'medium' | 'low'
  phase: 'compétences' | 'portfolio' | 'outils_emploi' | 'réseau' | 'entretiens' | 'lancement'
}

export type ActionPlan = {
  careerTitle: string
  steps: ActionPlanStep[]
  totalDuration: string
  summary: string
  cvTips?: string[]
  linkedinTips?: string[]
  interviewTips?: string[]
}

export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export type CoachingPhase =
  | 'landing'
  | 'onboarding'
  | 'chat'
  | 'analyzing'
  | 'careers'
  | 'plan'
  | 'dashboard'

export type SkillGap = {
  skill: string
  currentLevel: 'none' | 'beginner' | 'intermediate'
  targetLevel: 'intermediate' | 'advanced' | 'expert'
  resources: string[]
}

export type CVAnalysisResult = {
  detectedSkills: string[]
  missingSkills: string[]
  globalScore: number
  sections: {
    label: string
    score: number
    feedback: string
  }[]
  strengths: string[]
  improvements: string[]
  summary: string
}

export type InterviewQuestion = {
  id: string
  question: string
  category: 'motivation' | 'technique' | 'comportemental' | 'situationnel'
  hint?: string
}

export type InterviewAnswer = {
  questionId: string
  transcript: string
  score: number
  feedback: string
  tips: string[]
}

export type InterviewSession = {
  questions: InterviewQuestion[]
  answers: InterviewAnswer[]
  currentQuestionIndex: number
  status: 'idle' | 'questioning' | 'listening' | 'evaluating' | 'done'
  finalScore?: number
  finalFeedback?: string
}
