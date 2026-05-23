import type { UserProfile, CareerSuggestion, ActionPlan, SkillGap } from '@/types'

export type ToolName =
  | 'profile_analyzer'
  | 'career_matcher'
  | 'skill_gap_analyzer'
  | 'action_plan_generator'

export type ToolInput = {
  profile_analyzer: { answers: Record<string, string> }
  career_matcher: { profile: UserProfile }
  skill_gap_analyzer: { profile: UserProfile; career: string }
  action_plan_generator: { profile: UserProfile; career: CareerSuggestion; gaps: SkillGap[] }
}

export type ToolOutput = {
  profile_analyzer: UserProfile
  career_matcher: CareerSuggestion[]
  skill_gap_analyzer: SkillGap[]
  action_plan_generator: ActionPlan
}

export const TOOL_DEFINITIONS = [
  {
    name: 'profile_analyzer',
    description:
      'Analyzes student answers and extracts a structured profile with interests, skills, and goals.',
    input_schema: {
      type: 'object',
      properties: {
        answers: {
          type: 'object',
          description: 'Key-value pairs of question IDs to user answers',
        },
      },
      required: ['answers'],
    },
  },
  {
    name: 'career_matcher',
    description:
      'Matches the user profile to the top 3 most relevant career paths with match scores and explanations.',
    input_schema: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          description: 'The structured user profile',
        },
      },
      required: ['profile'],
    },
  },
  {
    name: 'skill_gap_analyzer',
    description:
      'Identifies skills the user needs to develop for a specific career path.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object', description: 'The user profile' },
        career: { type: 'string', description: 'The target career title' },
      },
      required: ['profile', 'career'],
    },
  },
  {
    name: 'action_plan_generator',
    description:
      'Generates a step-by-step action plan for the user to reach their chosen career.',
    input_schema: {
      type: 'object',
      properties: {
        profile: { type: 'object' },
        career: { type: 'object', description: 'The selected career suggestion' },
        gaps: { type: 'array', description: 'Skill gaps identified' },
      },
      required: ['profile', 'career', 'gaps'],
    },
  },
]
