import Anthropic from '@anthropic-ai/sdk'
import { TOOL_DEFINITIONS } from './tools'
import type { UserProfile, CareerSuggestion, ActionPlan, SkillGap } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an elite AI Career Coach with deep expertise in career development, talent assessment, and professional growth.

Your mission: Help students discover their ideal career path through intelligent, empathetic conversation.

RULES:
- Ask ONE focused question at a time — never multiple questions at once
- Be inspiring, warm, and professional
- Personalize every response based on what you know about the user
- When you have enough information (after 4-6 questions), use your tools to analyze and generate results
- Never hallucinate facts — always justify recommendations with reasoning
- Make the user feel truly understood

CONVERSATION FLOW:
1. Greet warmly and ask their name + what field excites them most
2. Ask about their current skills or studies
3. Ask about their long-term goals or dreams
4. Ask what kind of work environment they prefer
5. Ask about any constraints (location, time, resources)
6. When ready, use profile_analyzer → career_matcher → skill_gap_analyzer → action_plan_generator

TONE: Inspiring, intelligent, personal — like a mentor who truly believes in them.`

export type AgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

export async function runAgentTurn(
  messages: AgentMessage[],
  onToken?: (token: string) => void
): Promise<{
  reply: string
  profile?: UserProfile
  careers?: CareerSuggestion[]
  skillGaps?: SkillGap[]
  actionPlan?: ActionPlan
  phase?: string
}> {
  let profile: UserProfile | undefined
  let careers: CareerSuggestion[] | undefined
  let skillGaps: SkillGap[] | undefined
  let actionPlan: ActionPlan | undefined
  let phase: string | undefined

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  let finalReply = ''
  let continueLoop = true

  while (continueLoop) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS as Anthropic.Tool[],
      messages: anthropicMessages,
    })

    if (response.stop_reason === 'tool_use') {
      const assistantMessage: Anthropic.MessageParam = {
        role: 'assistant',
        content: response.content,
      }
      anthropicMessages.push(assistantMessage)

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const toolName = block.name
          const toolInput = block.input as Record<string, unknown>
          let result: unknown

          if (toolName === 'profile_analyzer') {
            result = extractProfile(toolInput.answers as Record<string, string>)
            profile = result as UserProfile
          } else if (toolName === 'career_matcher') {
            result = matchCareers(toolInput.profile as UserProfile)
            careers = result as CareerSuggestion[]
            phase = 'careers'
          } else if (toolName === 'skill_gap_analyzer') {
            result = analyzeGaps(
              toolInput.profile as UserProfile,
              toolInput.career as string
            )
            skillGaps = result as SkillGap[]
          } else if (toolName === 'action_plan_generator') {
            result = generatePlan(
              toolInput.profile as UserProfile,
              toolInput.career as CareerSuggestion,
              toolInput.gaps as SkillGap[]
            )
            actionPlan = result as ActionPlan
            phase = 'plan'
          } else {
            result = { error: 'Unknown tool' }
          }

          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: JSON.stringify(result),
          })
        }
      }

      anthropicMessages.push({ role: 'user', content: toolResults })
    } else {
      for (const block of response.content) {
        if (block.type === 'text') {
          finalReply = block.text
          if (onToken) onToken(block.text)
        }
      }
      continueLoop = false
    }
  }

  return { reply: finalReply, profile, careers, skillGaps, actionPlan, phase }
}

function extractProfile(answers: Record<string, string>): UserProfile {
  const allText = Object.values(answers).join(' ').toLowerCase()
  const interests: string[] = []
  const skills: string[] = []

  const interestKeywords = [
    'technology', 'design', 'business', 'science', 'art', 'medicine',
    'engineering', 'data', 'marketing', 'education', 'finance', 'music',
    'writing', 'gaming', 'sports', 'environment', 'psychology', 'law',
  ]
  const skillKeywords = [
    'programming', 'coding', 'python', 'javascript', 'java', 'design',
    'photoshop', 'writing', 'communication', 'leadership', 'math',
    'statistics', 'analysis', 'management', 'research', 'teaching',
    'sales', 'marketing', 'accounting', 'drawing', 'music',
  ]

  interestKeywords.forEach((kw) => {
    if (allText.includes(kw)) interests.push(kw)
  })
  skillKeywords.forEach((kw) => {
    if (allText.includes(kw)) skills.push(kw)
  })

  return {
    interests: interests.length > 0 ? interests : ['technology'],
    skills: skills.length > 0 ? skills : ['communication'],
    goals: answers['goals'] || Object.values(answers).slice(-1)[0] || 'build a meaningful career',
    name: answers['name'],
    education: answers['education'],
    experience: answers['experience'],
  }
}

function matchCareers(profile: UserProfile): CareerSuggestion[] {
  const { interests, skills } = profile

  const careerDatabase: CareerSuggestion[] = [
    {
      title: 'Full-Stack Developer',
      matchScore: 0,
      description: 'Build complete web applications from front-end interfaces to back-end systems.',
      requiredSkills: ['JavaScript', 'React', 'Node.js', 'SQL', 'APIs'],
      whyItFits: 'Strong demand for problem-solvers who love building digital products.',
      salaryRange: '$80k–$150k',
      growthPotential: 'Very High',
      icon: '💻',
    },
    {
      title: 'AI/ML Engineer',
      matchScore: 0,
      description: 'Design intelligent systems that learn from data and power next-gen products.',
      requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'Statistics', 'Data Science'],
      whyItFits: 'Perfect for analytical minds passionate about the future of AI.',
      salaryRange: '$100k–$200k',
      growthPotential: 'Exceptional',
      icon: '🤖',
    },
    {
      title: 'UX/Product Designer',
      matchScore: 0,
      description: 'Craft beautiful, intuitive experiences that millions of people use every day.',
      requiredSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Psychology'],
      whyItFits: 'Ideal for creative thinkers who care deeply about human experience.',
      salaryRange: '$70k–$130k',
      growthPotential: 'High',
      icon: '🎨',
    },
    {
      title: 'Data Scientist',
      matchScore: 0,
      description: 'Turn raw data into strategic insights that drive business decisions.',
      requiredSkills: ['Python', 'Statistics', 'SQL', 'Visualization', 'Machine Learning'],
      whyItFits: 'Great for analytical personalities who love finding patterns in complexity.',
      salaryRange: '$90k–$160k',
      growthPotential: 'Very High',
      icon: '📊',
    },
    {
      title: 'Product Manager',
      matchScore: 0,
      description: 'Lead cross-functional teams to build products users love at scale.',
      requiredSkills: ['Strategy', 'Communication', 'Data Analysis', 'Leadership', 'User Research'],
      whyItFits: 'Perfect for natural leaders who bridge technology and business.',
      salaryRange: '$85k–$170k',
      growthPotential: 'High',
      icon: '🚀',
    },
    {
      title: 'Cybersecurity Analyst',
      matchScore: 0,
      description: 'Protect organizations from digital threats in an ever-evolving landscape.',
      requiredSkills: ['Networking', 'Security Protocols', 'Risk Analysis', 'Ethical Hacking', 'Compliance'],
      whyItFits: 'For detail-oriented problem solvers who enjoy high-stakes challenges.',
      salaryRange: '$75k–$140k',
      growthPotential: 'Very High',
      icon: '🔒',
    },
    {
      title: 'Digital Marketing Manager',
      matchScore: 0,
      description: 'Drive growth through data-driven campaigns across digital channels.',
      requiredSkills: ['SEO', 'Analytics', 'Content Strategy', 'Social Media', 'Copywriting'],
      whyItFits: 'Ideal for creative storytellers with a knack for data and strategy.',
      salaryRange: '$60k–$120k',
      growthPotential: 'Moderate–High',
      icon: '📣',
    },
    {
      title: 'Biomedical Engineer',
      matchScore: 0,
      description: 'Develop life-saving medical devices and technologies.',
      requiredSkills: ['Biology', 'Engineering', 'Physics', 'Research', 'CAD'],
      whyItFits: 'For those who want to combine science and engineering to improve lives.',
      salaryRange: '$70k–$130k',
      growthPotential: 'High',
      icon: '🧬',
    },
  ]

  const scoringMap: Record<string, Record<string, number>> = {
    technology: { 'Full-Stack Developer': 30, 'AI/ML Engineer': 25, 'Cybersecurity Analyst': 20, 'Data Scientist': 15 },
    design: { 'UX/Product Designer': 35, 'Digital Marketing Manager': 15, 'Full-Stack Developer': 10 },
    business: { 'Product Manager': 30, 'Digital Marketing Manager': 25, 'Data Scientist': 15 },
    science: { 'AI/ML Engineer': 25, 'Data Scientist': 25, 'Biomedical Engineer': 30 },
    data: { 'Data Scientist': 35, 'AI/ML Engineer': 25, 'Product Manager': 15 },
    programming: { 'Full-Stack Developer': 35, 'AI/ML Engineer': 25, 'Data Scientist': 20 },
    python: { 'AI/ML Engineer': 30, 'Data Scientist': 30, 'Full-Stack Developer': 15 },
    javascript: { 'Full-Stack Developer': 35, 'UX/Product Designer': 10, 'Digital Marketing Manager': 10 },
    analysis: { 'Data Scientist': 30, 'Product Manager': 20, 'Cybersecurity Analyst': 20 },
    communication: { 'Product Manager': 25, 'Digital Marketing Manager': 25, 'UX/Product Designer': 20 },
    leadership: { 'Product Manager': 35, 'Digital Marketing Manager': 20 },
    math: { 'Data Scientist': 30, 'AI/ML Engineer': 30, 'Biomedical Engineer': 25 },
    statistics: { 'Data Scientist': 35, 'AI/ML Engineer': 25 },
    writing: { 'Digital Marketing Manager': 30, 'Product Manager': 20 },
    art: { 'UX/Product Designer': 35, 'Digital Marketing Manager': 15 },
    medicine: { 'Biomedical Engineer': 40 },
    marketing: { 'Digital Marketing Manager': 40, 'Product Manager': 20 },
  }

  careerDatabase.forEach((career) => {
    let score = 50
    ;[...interests, ...skills].forEach((item) => {
      const mapping = scoringMap[item.toLowerCase()]
      if (mapping && mapping[career.title]) {
        score += mapping[career.title]
      }
    })
    career.matchScore = Math.min(99, score)
  })

  return careerDatabase
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3)
}

function analyzeGaps(profile: UserProfile, career: string): SkillGap[] {
  const userSkills = profile.skills.map((s) => s.toLowerCase())
  const careerSkillMap: Record<string, SkillGap[]> = {
    'Full-Stack Developer': [
      { skill: 'JavaScript/TypeScript', currentLevel: 'none', targetLevel: 'advanced', resources: ['freeCodeCamp', 'The Odin Project', 'MDN Web Docs'] },
      { skill: 'React', currentLevel: 'none', targetLevel: 'intermediate', resources: ['React Docs', 'Scrimba React Course'] },
      { skill: 'Node.js & APIs', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Node.js Official Docs', 'Coursera Backend Development'] },
      { skill: 'SQL Databases', currentLevel: 'none', targetLevel: 'intermediate', resources: ['SQLZoo', 'PostgreSQL Tutorial'] },
    ],
    'AI/ML Engineer': [
      { skill: 'Python', currentLevel: 'none', targetLevel: 'advanced', resources: ['Python.org', 'Automate the Boring Stuff', 'Python for Data Science'] },
      { skill: 'Machine Learning', currentLevel: 'none', targetLevel: 'advanced', resources: ['fast.ai', 'Andrew Ng ML Course', 'Hugging Face'] },
      { skill: 'Statistics & Math', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Khan Academy Statistics', '3Blue1Brown Linear Algebra'] },
      { skill: 'Deep Learning', currentLevel: 'none', targetLevel: 'intermediate', resources: ['DeepLearning.AI Specialization'] },
    ],
    'UX/Product Designer': [
      { skill: 'Figma', currentLevel: 'none', targetLevel: 'advanced', resources: ['Figma Academy', 'DesignLab', 'YouTube Figma Tutorials'] },
      { skill: 'User Research', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Nielsen Norman Group', 'UX Research Methods'] },
      { skill: 'Prototyping', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Figma Prototyping', 'Marvel App'] },
      { skill: 'Design Systems', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Material Design', 'Apple HIG'] },
    ],
    'Data Scientist': [
      { skill: 'Python & Pandas', currentLevel: 'none', targetLevel: 'advanced', resources: ['Kaggle Learn', 'DataCamp', 'Python Data Science Handbook'] },
      { skill: 'Statistical Analysis', currentLevel: 'none', targetLevel: 'advanced', resources: ['Statistics for Data Science', 'Think Stats'] },
      { skill: 'Machine Learning', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Scikit-learn Docs', 'Kaggle Competitions'] },
      { skill: 'Data Visualization', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Tableau Public', 'Matplotlib/Seaborn'] },
    ],
    'Product Manager': [
      { skill: 'Product Strategy', currentLevel: 'none', targetLevel: 'advanced', resources: ['Product School', 'Reforge', 'Inspired by Marty Cagan'] },
      { skill: 'Data Analysis', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Google Analytics Academy', 'SQL for Product Managers'] },
      { skill: 'User Research', currentLevel: 'none', targetLevel: 'intermediate', resources: ['IDEO Design Thinking', 'Interviewing Users'] },
      { skill: 'Roadmapping & Prioritization', currentLevel: 'none', targetLevel: 'intermediate', resources: ['ProductPlan Blog', 'RICE Framework'] },
    ],
  }

  const gaps = careerSkillMap[career] || careerSkillMap['Full-Stack Developer']

  return gaps.map((gap) => ({
    ...gap,
    currentLevel: userSkills.some((s) =>
      gap.skill.toLowerCase().includes(s) || s.includes(gap.skill.toLowerCase().split('/')[0])
    )
      ? 'beginner'
      : 'none',
  }))
}

function generatePlan(
  profile: UserProfile,
  career: CareerSuggestion,
  gaps: SkillGap[]
): ActionPlan {
  const steps = [
    {
      title: `Foundation: ${gaps[0]?.skill || 'Core Skills'}`,
      description: `Master the fundamentals of ${gaps[0]?.skill || 'your field'}. Use resources: ${gaps[0]?.resources?.join(', ') || 'online courses'}.`,
      duration: '1–2 months',
      resources: gaps[0]?.resources,
      priority: 'high' as const,
    },
    {
      title: `Build: ${gaps[1]?.skill || 'Applied Projects'}`,
      description: `Dive into ${gaps[1]?.skill || 'hands-on projects'} through guided practice and real projects.`,
      duration: '2–3 months',
      resources: gaps[1]?.resources,
      priority: 'high' as const,
    },
    {
      title: 'First Portfolio Project',
      description: `Build a complete, deployable project related to ${career.title}. This proves your skills to employers.`,
      duration: '1 month',
      resources: ['GitHub', 'Vercel', 'Portfolio best practices'],
      priority: 'high' as const,
    },
    {
      title: `Advanced: ${gaps[2]?.skill || 'Specialization'}`,
      description: `Deepen expertise in ${gaps[2]?.skill || 'advanced topics'} to stand out in the market.`,
      duration: '2–3 months',
      resources: gaps[2]?.resources,
      priority: 'medium' as const,
    },
    {
      title: 'Network & Apply',
      description: `Connect with professionals on LinkedIn, attend meetups, and start applying to ${career.title} positions. Aim for 10+ applications/week.`,
      duration: '1–2 months',
      resources: ['LinkedIn', 'Meetup.com', 'AngelList', 'Glassdoor'],
      priority: 'medium' as const,
    },
    {
      title: 'Land Your First Role',
      description: `Prepare for interviews, do mock interviews, and negotiate your offer confidently. You are ready.`,
      duration: 'Ongoing',
      resources: ['Pramp.com', 'LeetCode', 'Glassdoor Interview Reviews'],
      priority: 'high' as const,
    },
  ]

  return {
    careerTitle: career.title,
    steps,
    totalDuration: '9–12 months',
    summary: `A focused ${9}-month path tailored to transform ${profile.name || 'you'} into a confident ${career.title}. Every step is designed around your current skills and goals.`,
  }
}
