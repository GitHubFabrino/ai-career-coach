import { NextRequest, NextResponse } from 'next/server'
import { callLLMText } from '@/lib/llm/client'
import type { InterviewQuestion, InterviewAnswer } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, career, profile, question, answer, provider = 'anthropic', modelId = 'claude-sonnet-4-6' } = body

    if (action === 'generate_questions') {
      return handleGenerateQuestions(career, profile, provider, modelId)
    }

    if (action === 'evaluate_answer') {
      return handleEvaluateAnswer(career, question, answer, provider, modelId)
    }

    if (action === 'final_feedback') {
      return handleFinalFeedback(career, body.answers, provider, modelId)
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 })
  } catch (err) {
    console.error('[interview]', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function handleGenerateQuestions(career: string, profile: unknown, provider: string, modelId: string) {
  const profileInfo = profile ? `Profil du candidat : ${JSON.stringify(profile)}` : ''

  const prompt = `Tu es un expert RH spécialisé en recrutement à Madagascar. Génère 5 questions d'entretien pour le poste suivant.

Poste visé : "${career}"
${profileInfo}

Retourne UNIQUEMENT un tableau JSON valide (pas de markdown) avec cette structure :

[
  {
    "id": "q1",
    "question": "...",
    "category": "motivation",
    "hint": "Conseil bref pour bien répondre..."
  },
  {
    "id": "q2",
    "question": "...",
    "category": "technique",
    "hint": "..."
  },
  {
    "id": "q3",
    "question": "...",
    "category": "comportemental",
    "hint": "..."
  },
  {
    "id": "q4",
    "question": "...",
    "category": "situationnel",
    "hint": "..."
  },
  {
    "id": "q5",
    "question": "...",
    "category": "motivation",
    "hint": "..."
  }
]

Règles :
- Questions en français, pertinentes pour Madagascar
- 1 question de motivation (pourquoi ce métier)
- 2 questions techniques liées au poste
- 1 question comportementale (méthode STAR)
- 1 question situationnelle (mise en situation)
- Hint court et actionnable (1 phrase max)
- Pas de questions discriminatoires`

  const rawText = await callLLMText({ provider, modelId, messages: [{ role: 'user', content: prompt }], maxTokens: 1024 })
  const jsonMatch = rawText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('Questions invalides')

  const questions: InterviewQuestion[] = JSON.parse(jsonMatch[0])
  return NextResponse.json({ questions })
}

async function handleEvaluateAnswer(
  career: string,
  question: InterviewQuestion,
  answer: string,
  provider: string,
  modelId: string
) {
  if (!answer || answer.trim().length < 5) {
    const emptyResult: InterviewAnswer = {
      questionId: question.id,
      transcript: answer,
      score: 0,
      feedback: 'Réponse trop courte pour être évaluée. Développe davantage ta réponse.',
      tips: ['Vise au moins 1 à 2 minutes de réponse', 'Utilise la méthode STAR si c\'est une question comportementale'],
    }
    return NextResponse.json({ evaluation: emptyResult })
  }

  const prompt = `Tu es un coach carrière expert qui évalue des réponses d'entretien pour le marché malgache.

Poste visé : "${career}"
Question posée : "${question.question}" (catégorie: ${question.category})
Réponse du candidat : "${answer}"

Retourne UNIQUEMENT un objet JSON valide (pas de markdown) :

{
  "questionId": "${question.id}",
  "transcript": "${answer.replace(/"/g, '\\"')}",
  "score": 72,
  "feedback": "Feedback global en 2 phrases, bienveillant et précis",
  "tips": [
    "Conseil d'amélioration concret 1",
    "Conseil d'amélioration concret 2"
  ]
}

Règles :
- score entre 0 et 100
- feedback en français, encourageant mais honnête
- 2 tips actionnables et spécifiques
- Si la réponse utilise la méthode STAR, valorise-le
- Adapte au niveau malgache (pas d'attentes occidentales irréalistes)`

  const rawText = await callLLMText({ provider, modelId, messages: [{ role: 'user', content: prompt }], maxTokens: 512 })
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Évaluation invalide')

  const evaluation: InterviewAnswer = JSON.parse(jsonMatch[0])
  return NextResponse.json({ evaluation })
}

async function handleFinalFeedback(career: string, answers: InterviewAnswer[], provider: string, modelId: string) {
  const avgScore = Math.round(
    answers.reduce((acc, a) => acc + a.score, 0) / (answers.length || 1)
  )

  const prompt = `Tu es un coach carrière. Voici les résultats d'un entretien simulé pour "${career}".

Scores par question : ${answers.map((a, i) => `Q${i + 1}: ${a.score}/100`).join(', ')}
Score moyen : ${avgScore}/100

Retourne UNIQUEMENT un objet JSON valide :

{
  "finalScore": ${avgScore},
  "finalFeedback": "Bilan global en 3-4 phrases : ce qui était bon, ce qui est à améliorer, encouragement final",
  "topStrengths": ["Force observée 1", "Force observée 2"],
  "priorityActions": ["Action prioritaire 1", "Action prioritaire 2", "Action prioritaire 3"]
}

Ton : bienveillant, honnête, inspirant. En français.`

  const rawText = await callLLMText({ provider, modelId, messages: [{ role: 'user', content: prompt }], maxTokens: 512 })
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Feedback final invalide')

  return NextResponse.json(JSON.parse(jsonMatch[0]))
}
