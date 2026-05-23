import { create } from 'zustand'
import type {
  UserProfile,
  CareerSuggestion,
  ActionPlan,
  Message,
  CoachingPhase,
} from '@/types'

type CoachStore = {
  phase: CoachingPhase
  profile: Partial<UserProfile>
  messages: Message[]
  careers: CareerSuggestion[]
  selectedCareer: CareerSuggestion | null
  actionPlan: ActionPlan | null
  isAnalyzing: boolean
  questionIndex: number

  setPhase: (phase: CoachingPhase) => void
  updateProfile: (update: Partial<UserProfile>) => void
  addMessage: (message: Message) => void
  setCareers: (careers: CareerSuggestion[]) => void
  selectCareer: (career: CareerSuggestion) => void
  setActionPlan: (plan: ActionPlan) => void
  setIsAnalyzing: (val: boolean) => void
  incrementQuestion: () => void
  reset: () => void
}

const initialState = {
  phase: 'landing' as CoachingPhase,
  profile: {},
  messages: [],
  careers: [],
  selectedCareer: null,
  actionPlan: null,
  isAnalyzing: false,
  questionIndex: 0,
}

export const useCoachStore = create<CoachStore>((set) => ({
  ...initialState,

  setPhase: (phase) => set({ phase }),
  updateProfile: (update) =>
    set((s) => ({ profile: { ...s.profile, ...update } })),
  addMessage: (message) =>
    set((s) => ({ messages: [...s.messages, message] })),
  setCareers: (careers) => set({ careers }),
  selectCareer: (career) => set({ selectedCareer: career }),
  setActionPlan: (plan) => set({ actionPlan: plan }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  incrementQuestion: () =>
    set((s) => ({ questionIndex: s.questionIndex + 1 })),
  reset: () => set(initialState),
}))
