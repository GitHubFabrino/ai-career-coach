import { NextRequest, NextResponse } from 'next/server'
import { callLLMText } from '@/lib/llm/client'
import type { CVAnalysisResult } from '@/types'

// pdf-parse/node is the Node.js-specific build — avoids DOMMatrix and canvas
// browser APIs that are absent in the Next.js server runtime.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/node') as (buf: Buffer) => Promise<{ text: string }>

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('cv') as File | null
    const targetCareer = formData.get('career') as string | null
    const provider = (formData.get('provider') as string | null) ?? 'anthropic'
    const modelId = (formData.get('modelId') as string | null) ?? 'claude-sonnet-4-6'

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier reçu' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''

    if (file.name.toLowerCase().endsWith('.pdf')) {
      const data = await pdfParse(buffer)
      extractedText = data.text
    } else if (file.name.toLowerCase().endsWith('.txt')) {
      extractedText = buffer.toString('utf-8')
    } else {
      return NextResponse.json({ error: 'Format non supporté. Utilise un fichier PDF ou TXT.' }, { status: 400 })
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json({ error: 'Le fichier semble vide ou illisible.' }, { status: 400 })
    }

    const careerContext = targetCareer
      ? `Le candidat vise le poste : "${targetCareer}".`
      : 'Analyse le CV de façon générale.'

    const prompt = `Tu es un expert en recrutement et en développement de carrière, spécialisé sur le marché malgache et africain.

${careerContext}

Voici le texte extrait du CV :
---
${extractedText.slice(0, 4000)}
---

Analyse ce CV en profondeur et retourne UNIQUEMENT un objet JSON valide avec cette structure exacte (pas de markdown, pas de texte avant ou après) :

{
  "detectedSkills": ["liste des compétences détectées dans le CV"],
  "missingSkills": ["compétences clés manquantes pour le poste visé ou en général"],
  "globalScore": 72,
  "sections": [
    { "label": "Présentation / En-tête", "score": 80, "feedback": "..." },
    { "label": "Compétences techniques", "score": 65, "feedback": "..." },
    { "label": "Expériences professionnelles", "score": 70, "feedback": "..." },
    { "label": "Formation / Diplômes", "score": 85, "feedback": "..." },
    { "label": "Lisibilité & Format", "score": 75, "feedback": "..." }
  ],
  "strengths": ["point fort 1", "point fort 2", "point fort 3"],
  "improvements": ["amélioration prioritaire 1", "amélioration 2", "amélioration 3"],
  "summary": "Résumé global en 2-3 phrases avec ton bienveillant et constructif"
}

Règles :
- Réponds EXCLUSIVEMENT en français
- globalScore entre 0 et 100
- Chaque score de section entre 0 et 100
- Sois précis, bienveillant mais honnête
- Adapte tes conseils au marché malgache si pertinent
- N'invente pas de compétences absentes du CV`

    const rawText = await callLLMText({ provider, modelId, messages: [{ role: 'user', content: prompt }], maxTokens: 2048 })
    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Réponse Claude invalide')
    }

    const result: CVAnalysisResult = JSON.parse(jsonMatch[0])
    return NextResponse.json({ result })
  } catch (err) {
    console.error('[cv-analyze]', err)
    return NextResponse.json(
      { error: 'Erreur lors de l\'analyse. Réessaie avec un autre fichier.' },
      { status: 500 }
    )
  }
}
