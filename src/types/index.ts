export type UserProfile = {
  interests: string[]
  skills: string[]
  goals: string
  name?: string
  education?: string
  experience?: string
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
}

export type ActionPlanStep = {
  title: string
  description: string
  duration: string
  resources?: string[]
  priority: 'high' | 'medium' | 'low'
}

export type ActionPlan = {
  careerTitle: string
  steps: ActionPlanStep[]
  totalDuration: string
  summary: string
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

export type AgentThought = {
  thought: string
  action: string
  actionInput: Record<string, unknown>
  observation: string
}

export type SkillGap = {
  skill: string
  currentLevel: 'none' | 'beginner' | 'intermediate'
  targetLevel: 'intermediate' | 'advanced' | 'expert'
  resources: string[]
}
