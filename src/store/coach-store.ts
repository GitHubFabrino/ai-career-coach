import { create } from 'zustand'
import type {
  UserProfile,
  CareerSuggestion,
  ActionPlan,
  BlockerAnalysis,
  JobMatch,
  Message,
  CoachingPhase,
} from '@/types'

type AppPhase = 'chat' | 'careers' | 'plan' | 'cv' | 'entretien' | 'jobs'

type CoachStore = {
  phase: CoachingPhase
  appPhase: AppPhase
  profile: Partial<UserProfile>
  messages: Message[]
  careers: CareerSuggestion[]
  selectedCareer: CareerSuggestion | null
  actionPlan: ActionPlan | null
  blockerAnalysis: BlockerAnalysis | null
  jobMatches: JobMatch[]
  isAnalyzing: boolean
  questionIndex: number

  setPhase: (phase: CoachingPhase) => void
  setAppPhase: (phase: AppPhase) => void
  updateProfile: (update: Partial<UserProfile>) => void
  addMessage: (message: Message) => void
  setCareers: (careers: CareerSuggestion[]) => void
  selectCareer: (career: CareerSuggestion) => void
  setActionPlan: (plan: ActionPlan) => void
  setBlockerAnalysis: (analysis: BlockerAnalysis) => void
  setJobMatches: (matches: JobMatch[]) => void
  setIsAnalyzing: (val: boolean) => void
  incrementQuestion: () => void
  reset: () => void
}

const initialState = {
  phase: 'landing' as CoachingPhase,
  appPhase: 'chat' as AppPhase,
  profile: {},
  messages: [],
  careers: [],
  selectedCareer: null,
  actionPlan: null,
  blockerAnalysis: null,
  jobMatches: [],
  isAnalyzing: false,
  questionIndex: 0,
}

export const useCoachStore = create<CoachStore>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  setAppPhase: (appPhase) => set({ appPhase }),
  updateProfile: (update) =>
    set((s) => ({ profile: { ...s.profile, ...update } })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setCareers: (careers) => set({ careers }),
  selectCareer: (career) => set({ selectedCareer: career }),
  setActionPlan: (plan) => set({ actionPlan: plan }),
  setBlockerAnalysis: (analysis) => set({ blockerAnalysis: analysis }),
  setJobMatches: (matches) => set({ jobMatches: matches }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  incrementQuestion: () =>
    set((s) => ({ questionIndex: s.questionIndex + 1 })),
  reset: () => set(initialState),
}))
