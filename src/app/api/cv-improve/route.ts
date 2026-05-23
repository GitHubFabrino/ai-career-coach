import { NextRequest, NextResponse } from 'next/server'
import { callLLMText } from '@/lib/llm/client'
import type { CVAnalysisResult } from '@/types'

export type CVImprovement = {
  section: string
  issue: string
  rewritten: string
}

export type CVImprovementResult = {
  improvements: CVImprovement[]
  globalAdvice: string[]
}

export async function POST(req: NextRequest) {
  try {
    const { cvText, analysis, career, provider = 'anthropic', modelId = 'claude-sonnet-4-6' } = await req.json() as {
      cvText: string
      analysis: CVAnalysisResult
      career?: string
      provider?: string
      modelId?: string
    }

    if (!cvText || !analysis) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    const careerCtx = career ? `Le candidat vise le poste : "${career}".` : 'Analyse générale.'
    const weakSections = analysis.sections
      .filter((s) => s.score < 75)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)

    const prompt = `Tu es un expert en rédaction de CV pour le marché malgache et africain.

${careerCtx}

Voici le CV extrait :
---
${cvText}
---

Analyse du CV :
- Score global : ${analysis.globalScore}/100
- Compétences manquantes : ${analysis.missingSkills.join(', ')}
- Priorités d'amélioration : ${analysis.improvements.join(' | ')}
- Sections faibles : ${weakSections.map((s) => `${s.label} (${s.score}/100) — ${s.feedback}`).join(' | ')}

Génère des suggestions concrètes de réécriture pour améliorer ce CV.

Retourne UNIQUEMENT un objet JSON valide (pas de markdown) :

{
  "improvements": [
    {
      "section": "Nom de la section à améliorer",
      "issue": "Problème identifié en 1 phrase courte",
      "rewritten": "Exemple concret de texte amélioré, rédigé directement comme si c'était dans le CV"
    }
  ],
  "globalAdvice": [
    "Conseil pratique et actionnable 1",
    "Conseil pratique et actionnable 2",
    "Conseil pratique et actionnable 3"
  ]
}

Règles :
- 3 à 5 améliorations concrètes (cibler les sections avec le score le plus bas)
- Le champ "rewritten" doit être du VRAI texte de CV prêt à copier-coller (pas une description de ce qu'il faudrait écrire)
- 3 conseils globaux actionnables et spécifiques au contexte malgache
- Tout en français, bienveillant et professionnel`

    const rawText = await callLLMText({ provider, modelId, messages: [{ role: 'user', content: prompt }], maxTokens: 1536 })
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Réponse invalide')

    const improvementResult: CVImprovementResult = JSON.parse(jsonMatch[0])
    return NextResponse.json(improvementResult)
  } catch (err) {
    console.error('[cv-improve]', err)
    return NextResponse.json({ error: 'Erreur lors de la génération des améliorations.' }, { status: 500 })
  }
}
