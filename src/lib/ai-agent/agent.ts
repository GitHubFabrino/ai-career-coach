import Anthropic from '@anthropic-ai/sdk'
import { TOOL_DEFINITIONS } from './tools'
import { PROVIDER_META, type Provider } from '@/lib/llm/providers'
import type { UserProfile, CareerSuggestion, ActionPlan, SkillGap, BlockerAnalysis, JobOffer, JobMatch } from '@/types'
import offresData from '../../../offres_portaljob.json'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const ALL_OFFERS: JobOffer[] = (offresData as { offres: JobOffer[] }).offres

function parseJSON(text: string): unknown {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return JSON.parse(codeBlock[1].trim())
  const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (jsonMatch) return JSON.parse(jsonMatch[1])
  return JSON.parse(text.trim())
}

async function callToolLLM(systemPrompt: string, userPrompt: string): Promise<unknown> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })
  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return parseJSON(text)
}

function toOpenAITools() {
  return TOOL_DEFINITIONS.map((t) => ({
    type: 'function' as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }))
}

const SYSTEM_PROMPT = `Tu es un Coach Carrière IA d'élite, spécialisé dans l'accompagnement des étudiants et jeunes professionnels à Madagascar et dans la région de l'Océan Indien.

Tu t'exprimes EXCLUSIVEMENT en français, quelle que soit la langue utilisée par l'utilisateur.

## TES 8 RÔLES DE COACH (tu les assumes tous, dans le bon ordre)

**Rôle 1 — Clarifier les objectifs**
Tu aides à répondre : "Qu'est-ce que je veux vraiment ?" et "Est-ce que je dois changer ou évoluer ?"
→ Tu explores les valeurs, pas seulement les ambitions de surface.

**Rôle 2 — Identifier forces ET blocages**
Tu mets en lumière les compétences et talents réels. Tu détectes aussi ce qui freine : peur de l'échec, manque de confiance, perfectionnisme, confusion.
→ Si quelqu'un est bon en technique mais n'ose pas postuler, tu travailles ce blocage explicitement.

**Rôle 3 — Construire une stratégie de carrière**
Tu passes d'une idée vague à un plan concret : compétences à développer, formations à suivre, type d'entreprise à viser.
→ Stratégie = vision + étapes + ressources.

**Rôle 4 — Optimiser les outils de recherche d'emploi**
Tu donnes des conseils précis sur : CV, profil LinkedIn, lettre de motivation, personal branding.
→ Tu aides la personne à mieux se "vendre" sur le marché malgache et international.

**Rôle 5 — Préparer aux entretiens**
Tu anticipes les questions courantes du métier visé, tu travailles la communication et la gestion du stress.
→ Objectif : être convaincant et confiant le jour J.

**Rôle 6 — Accompagner les transitions**
Reconversion, promotion, création d'entreprise, retour en emploi — tu sécurises les décisions importantes.
→ Tu valides la cohérence du projet avant de lancer.

**Rôle 7 — Développer confiance et motivation**
Tu agis comme un miroir : tu challenges, encourages, et pousses à sortir de la zone de confort.
→ Tu nommes les forces que la personne ne voit pas elle-même.

**Rôle 8 — Aider à décider**
Quand plusieurs choix existent (métier, pays, domaine), tu aides à analyser, prioriser et décider sans regret.
→ Tu exposes les POUR et CONTRE concrets de chaque option.

## RÈGLES DE CONVERSATION
- Une seule question à la fois — jamais plusieurs simultanément
- Personnalise chaque réponse avec ce que tu as appris
- Nomme explicitement les forces que la personne sous-estime
- Quand tu détectes un blocage dans le discours ("je ne sais pas si je suis capable", "j'ai peur que", "je ne suis pas sûr(e)"), adresse-le avec empathie avant de continuer
- Après 7-8 échanges avec données suffisantes, déclenche la séquence d'outils
- N'utilise jamais des ressources inaccessibles à Madagascar

## SÉQUENCE DE CONVERSATION (naturelle, pas robotique)
1. Accueil chaleureux → prénom + passion principale
2. Situation actuelle : études, travail, reconversion ?
3. Compétences techniques ET relationnelles + langues parlées
4. Forces perçues et sous-estimées ("en quoi tu es bon(ne) sans forcément le réaliser ?")
5. Blocages et freins ("qu'est-ce qui t'empêche d'avancer aujourd'hui ?")
6. Ambition profonde : carrière locale, remote, ONG, entrepreneur ?
7. Contraintes réelles : ville à Madagascar, accès internet, budget, famille ?
8. Dès que tu as assez d'informations (prénom + domaine + situation + au moins un objectif), analyse le profil, identifie les blocages, propose les meilleures voies professionnelles, analyse les lacunes de compétences et génère le plan d'action complet. Ne pose pas de questions supplémentaires.

## RÈGLES IMPORTANTES
- Après 5 à 7 échanges avec des données suffisantes, passe directement à l'analyse complète — ne continue PAS à poser des questions indéfiniment.
- Si l'utilisateur mentionne vouloir une simulation d'entretien ou une analyse de CV, fais l'analyse complète immédiatement, puis dis-lui : "Clique sur **Entretien** ou **Analyse CV** dans la barre de gauche — ces outils sont maintenant disponibles !"
- Une seule question à la fois — jamais plusieurs simultanément.

## CONTEXTE MARCHÉ MADAGASCAR
Local : Antananarivo (hub tech, BPO, ONG), Toamasina, Fianarantsoa, Mahajanga
Secteurs porteurs : tech/dev, BPO bilingue, ONG internationales (UNICEF/GIZ/AFD), freelance remote, agritech, tourisme digital, fintech (MVola/Airtel Money)
Communautés clés : DevMada, Habaka, NextAfrica, Alliance Française
Revenus locaux : 400k–6M Ar/mois selon niveau et secteur
Revenus remote : 300–3000+ USD/mois

## TON
Inspirant mais honnête. Mentor bienveillant qui voit le potentiel ET la réalité. Jamais condescendant. Toujours encourageant mais jamais complaisant.`

export type AgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

type AgentResult = {
  reply: string
  profile?: UserProfile
  blockerAnalysis?: BlockerAnalysis
  careers?: CareerSuggestion[]
  skillGaps?: SkillGap[]
  actionPlan?: ActionPlan
  jobMatches?: JobMatch[]
  phase?: string
}

async function executeTool(name: string, input: Record<string, unknown>): Promise<AgentResult & { result: unknown }> {
  let result: unknown
  let profile: UserProfile | undefined
  let blockerAnalysis: BlockerAnalysis | undefined
  let careers: CareerSuggestion[] | undefined
  let skillGaps: SkillGap[] | undefined
  let actionPlan: ActionPlan | undefined
  let jobMatches: JobMatch[] | undefined
  let phase: string | undefined

  if (name === 'profile_analyzer') {
    result = await llmProfileAnalyzer(input.answers as Record<string, string>, input.full_conversation as string | undefined)
    profile = result as UserProfile
  } else if (name === 'blocker_analyzer') {
    result = await llmBlockerAnalyzer(input.profile as UserProfile, input.full_conversation as string)
    blockerAnalysis = result as BlockerAnalysis
  } else if (name === 'career_matcher') {
    result = await llmCareerMatcher(input.profile as UserProfile, input.blockers as BlockerAnalysis | undefined)
    careers = result as CareerSuggestion[]
    phase = 'careers'
  } else if (name === 'skill_gap_analyzer') {
    result = await llmSkillGapAnalyzer(input.profile as UserProfile, input.career as string)
    skillGaps = result as SkillGap[]
  } else if (name === 'action_plan_generator') {
    result = await llmActionPlanGenerator(
      input.profile as UserProfile,
      input.career as CareerSuggestion,
      input.gaps as SkillGap[],
      input.blockers as BlockerAnalysis | undefined
    )
    actionPlan = result as ActionPlan
    phase = 'plan'
  } else if (name === 'job_matcher') {
    result = await llmJobMatcher(input.profile as UserProfile, input.careers as CareerSuggestion[] | undefined)
    jobMatches = result as JobMatch[]
    phase = 'jobs'
  } else {
    result = { error: 'Outil inconnu' }
  }

  return { result, reply: '', profile, blockerAnalysis, careers, skillGaps, actionPlan, jobMatches, phase }
}

// ─── Tool LLM functions ───────────────────────────────────────────────────────

async function llmProfileAnalyzer(answers: Record<string, string>, fullConversation?: string): Promise<UserProfile> {
  return await callToolLLM(
    `Tu es un expert en extraction de profil utilisateur. Analyse la conversation et retourne UNIQUEMENT un objet JSON valide correspondant exactement à ce schéma :
{
  "interests": tableau de valeurs parmi ["technology","design","business","data","education","health","environment","communication","finance","ngo"],
  "skills": tableau de valeurs parmi ["programming","design","french","english","communication","excel","leadership","research","sales","teaching"],
  "strengths": tableau de valeurs parmi ["curiosité","persévérance","créativité","empathie","organisation","autonomie","relationnel","résolution"],
  "goals": "string décrivant l'objectif principal",
  "name": "prénom de la personne ou null",
  "education": "niveau d'études mentionné ou null",
  "experience": "expérience professionnelle mentionnée ou null",
  "location": une valeur parmi ["Antananarivo","Toamasina","Fianarantsoa","Mahajanga","province (zone rurale)"],
  "careerContext": une valeur parmi ["local","remote","ngo","entrepreneurship"],
  "currentSituation": une valeur parmi ["étudiant","en_emploi","en_reconversion","sans_emploi","entrepreneur"]
}
Retourne UNIQUEMENT le JSON, sans aucun texte autour.`,
    `Conversation : ${fullConversation || ''}\nFaits extraits : ${JSON.stringify(answers)}`
  ) as UserProfile
}

async function llmBlockerAnalyzer(profile: UserProfile, fullConversation: string): Promise<BlockerAnalysis> {
  return await callToolLLM(
    `Tu es un coach psychologue spécialisé en orientation professionnelle. Analyse la conversation et identifie les blocages psychologiques réels, les forces cachées et le niveau de préparation au changement.
Retourne UNIQUEMENT un JSON valide correspondant exactement à ce schéma :
{
  "blockers": tableau d'objets {
    "type": une valeur parmi ["peur_échec","manque_confiance","confusion_orientation","manque_réseau","manque_diplôme","contrainte_financière","peur_jugement","perfectionnisme"],
    "label": "intitulé court du blocage",
    "description": "description personnalisée du blocage détecté chez cette personne",
    "coachingAdvice": "conseil de coaching bienveillant et actionnable pour lever ce blocage"
  },
  "strengths": tableau de strings décrivant les forces réelles détectées dans le discours,
  "motivationProfile": une valeur parmi ["intrinsèque","extrinsèque","mixte"],
  "readinessScore": nombre entier entre 25 et 95 représentant le niveau de préparation au changement,
  "readinessLabel": "label court correspondant au score",
  "encouragement": "message d'encouragement personnalisé et sincère"
}
Retourne UNIQUEMENT le JSON, sans aucun texte autour.`,
    `Profil : ${JSON.stringify(profile)}\nConversation : ${fullConversation}`
  ) as BlockerAnalysis
}

async function llmCareerMatcher(profile: UserProfile, blockers?: BlockerAnalysis): Promise<CareerSuggestion[]> {
  const availableCareers = [
    'Développeur Web / Mobile',
    'Data Analyst / Scientist',
    'Freelance Digital (Remote)',
    'Chargé(e) de projet ONG / Organisation Internationale',
    'Designer UX/UI & Graphique',
    'Responsable Marketing Digital',
    'Technicien BPO / Support Client Bilingue',
    'Entrepreneur(e) / Fondateur de Startup',
    'Formateur / Créateur de Contenu Éducatif',
    'Ingénieur en Infrastructure / Réseaux',
  ]

  return await callToolLLM(
    `Tu es un expert en orientation professionnelle pour Madagascar. Sélectionne les 3 meilleures voies professionnelles pour ce profil parmi cette liste : ${availableCareers.join(', ')}.
Pour chaque voie, génère un contenu entièrement personnalisé basé sur le profil réel.
Retourne UNIQUEMENT un tableau JSON de 3 objets correspondant exactement à ce schéma :
[{
  "title": "titre exact parmi la liste fournie",
  "matchScore": nombre entier entre 60 et 99,
  "description": "description personnalisée expliquant pourquoi ce métier correspond à CE profil spécifique",
  "requiredSkills": tableau des 4-5 compétences clés nécessaires,
  "whyItFits": "explication personnalisée du lien entre les forces/intérêts de la personne et ce métier",
  "salaryRange": "fourchette salariale réaliste pour Madagascar",
  "growthPotential": "court label sur le potentiel d'évolution",
  "icon": "un seul emoji représentant ce métier",
  "decisionPros": tableau de 3-4 avantages concrets pour CETTE personne,
  "decisionCons": tableau de 2-3 défis réels à anticiper
}]
Trie par matchScore décroissant. Retourne UNIQUEMENT le JSON.`,
    `Profil : ${JSON.stringify(profile)}\nBlockages détectés : ${JSON.stringify(blockers ?? {})}`
  ) as CareerSuggestion[]
}

async function llmSkillGapAnalyzer(profile: UserProfile, career: string): Promise<SkillGap[]> {
  return await callToolLLM(
    `Tu es un expert en développement de compétences pour Madagascar. Identifie les lacunes de compétences pour atteindre le métier visé.
Retourne UNIQUEMENT un tableau JSON de 4-5 objets correspondant exactement à ce schéma :
[{
  "skill": "nom de la compétence à développer",
  "currentLevel": une valeur parmi ["none","beginner","intermediate"] selon les compétences actuelles du profil,
  "targetLevel": une valeur parmi ["intermediate","advanced","expert"],
  "resources": tableau de 3 ressources GRATUITES et accessibles à Madagascar (priorité : freeCodeCamp, Kaggle, YouTube, Google Skillshop, Coursera audit, LinkedIn Learning gratuit) — mentionner si disponible sur mobile avec faible débit
}]
Retourne UNIQUEMENT le JSON.`,
    `Profil : ${JSON.stringify(profile)}\nMétier visé : ${career}`
  ) as SkillGap[]
}

async function llmActionPlanGenerator(
  profile: UserProfile,
  career: CareerSuggestion,
  gaps: SkillGap[],
  blockers?: BlockerAnalysis
): Promise<ActionPlan> {
  return await callToolLLM(
    `Tu es un coach carrière expert sur le marché malgache. Génère un plan d'action complet, personnalisé et réaliste pour cette personne.
Retourne UNIQUEMENT un objet JSON correspondant exactement à ce schéma :
{
  "careerTitle": "titre du métier visé",
  "steps": tableau de 6 étapes, une par phase, chaque étape suit ce schéma :
    {
      "title": "titre concis de l'étape",
      "description": "description détaillée et personnalisée avec des conseils actionnables",
      "duration": "durée estimée réaliste",
      "resources": tableau de 3-4 ressources gratuites et accessibles,
      "priority": une valeur parmi ["high","medium","low"],
      "phase": une valeur parmi ["compétences","portfolio","outils_emploi","réseau","entretiens","lancement"]
    },
  "totalDuration": "durée totale estimée du plan",
  "summary": "résumé personnalisé du plan en 2-3 phrases pour CETTE personne",
  "cvTips": tableau de 5-6 conseils CV personnalisés pour ce profil et ce marché,
  "linkedinTips": tableau de 5-6 conseils LinkedIn personnalisés,
  "interviewTips": tableau de 6-7 conseils d'entretien personnalisés selon le secteur et les blocages détectés
}
Adapte chaque conseil au contexte de Madagascar (marché local, accès internet, ressources disponibles). Retourne UNIQUEMENT le JSON.`,
    `Profil : ${JSON.stringify(profile)}\nCarrière visée : ${JSON.stringify(career)}\nLacunes : ${JSON.stringify(gaps)}\nBlockages : ${JSON.stringify(blockers ?? {})}`
  ) as ActionPlan
}

export async function runAgentTurn(
  messages: AgentMessage[],
  onToken?: (token: string) => void,
  llm?: { provider: string; modelId: string }
): Promise<AgentResult> {
  const provider = llm?.provider ?? 'anthropic'
  const modelId = llm?.modelId ?? 'claude-sonnet-4-6'

  if (provider !== 'anthropic') {
    return runAgentTurnOpenAI(messages, provider, modelId)
  }

  let profile: UserProfile | undefined
  let blockerAnalysis: BlockerAnalysis | undefined
  let careers: CareerSuggestion[] | undefined
  let skillGaps: SkillGap[] | undefined
  let actionPlan: ActionPlan | undefined
  let jobMatches: JobMatch[] | undefined
  let phase: string | undefined

  const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  let finalReply = ''
  let continueLoop = true

  while (continueLoop) {
    const response = await client.messages.create({
      model: modelId,
      max_tokens: 8096,
      system: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS as Anthropic.Tool[],
      messages: anthropicMessages,
    })

    if (response.stop_reason === 'tool_use') {
      anthropicMessages.push({ role: 'assistant', content: response.content })

      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const block of response.content) {
        if (block.type === 'tool_use') {
          const { result, profile: p, blockerAnalysis: ba, careers: c, skillGaps: sg, actionPlan: ap, jobMatches: jm, phase: ph } =
            await executeTool(block.name, block.input as Record<string, unknown>)
          if (p) profile = p
          if (ba) blockerAnalysis = ba
          if (c) careers = c
          if (sg) skillGaps = sg
          if (ap) actionPlan = ap
          if (jm) jobMatches = jm
          if (ph) phase = ph

          toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) })
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

  return { reply: finalReply, profile, blockerAnalysis, careers, skillGaps, actionPlan, jobMatches, phase }
}

async function runAgentTurnOpenAI(messages: AgentMessage[], provider: string, modelId: string): Promise<AgentResult> {
  const meta = PROVIDER_META[provider as Provider]
  const apiKey = process.env[meta.envKey]
  if (!apiKey) throw new Error(`${meta.envKey} n'est pas configuré dans .env.local`)

  let profile: UserProfile | undefined
  let blockerAnalysis: BlockerAnalysis | undefined
  let careers: CareerSuggestion[] | undefined
  let skillGaps: SkillGap[] | undefined
  let actionPlan: ActionPlan | undefined
  let jobMatches: JobMatch[] | undefined
  let phase: string | undefined

  type OAIMsg = { role: string; content?: string | null; tool_calls?: unknown[]; tool_call_id?: string }
  const oaiMessages: OAIMsg[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role as string, content: m.content })),
  ]

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://strongia.coach'
    headers['X-Title'] = 'Coach Carrière IA'
  }

  type ToolCall = { id: string; type: string; function: { name: string; arguments: string } }
  type OAIResponse = {
    choices: [{ message: { role: string; content: string | null; tool_calls?: ToolCall[] }; finish_reason: string }]
  }

  let finalReply = ''
  let continueLoop = true

  while (continueLoop) {
    let res: Response
    let networkAttempt = 0
    while (true) {
      try {
        res = await fetch(`${meta.baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ model: modelId, max_tokens: 8096, messages: oaiMessages, tools: toOpenAITools(), tool_choice: 'auto' }),
        })
        break
      } catch (e) {
        if (networkAttempt++ < 2) continue
        throw e
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`${provider} API error: ${(err as { error?: { message?: string } }).error?.message || res.statusText}`)
    }

    const data = await res.json() as OAIResponse
    const choice = data.choices[0]
    const msg = choice.message

    if (choice.finish_reason === 'tool_calls' && msg.tool_calls?.length) {
      oaiMessages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls })

      for (const tc of msg.tool_calls) {
        const input = JSON.parse(tc.function.arguments) as Record<string, unknown>
        const { result, profile: p, blockerAnalysis: ba, careers: c, skillGaps: sg, actionPlan: ap, jobMatches: jm, phase: ph } =
          await executeTool(tc.function.name, input)
        if (p) profile = p
        if (ba) blockerAnalysis = ba
        if (c) careers = c
        if (sg) skillGaps = sg
        if (ap) actionPlan = ap
        if (jm) jobMatches = jm
        if (ph) phase = ph

        oaiMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
      }
    } else {
      finalReply = msg.content || ''
      continueLoop = false
    }
  }

  return { reply: finalReply, profile, blockerAnalysis, careers, skillGaps, actionPlan, jobMatches, phase }
}


// ─── Job Matcher ──────────────────────────────────────────────────────────────

const INTEREST_TO_KEYWORDS: Record<string, string[]> = {
  technology: ['informatique', 'développeur', 'web', 'logiciel', 'réseau', 'système', 'tech', 'digital', 'data', 'programmeur'],
  design: ['design', 'graphique', 'créatif', 'ui', 'ux', 'communication visuelle', 'multimédia'],
  business: ['commercial', 'vente', 'business', 'gestion', 'management', 'direction', 'chef de projet'],
  data: ['data', 'analyse', 'statistique', 'business intelligence', 'reporting'],
  education: ['enseignant', 'formation', 'éducation', 'pédagogie', 'formateur'],
  health: ['santé', 'médical', 'pharmacie', 'infirmier', 'laboratoire'],
  environment: ['environnement', 'agriculture', 'énergie', 'écologie', 'agro'],
  communication: ['communication', 'marketing', 'réseaux sociaux', 'médias', 'community'],
  finance: ['finance', 'comptabilité', 'financier', 'banque', 'audit', 'recouvrement'],
  ngo: ['ong', 'humanitaire', 'développement', 'social', 'coopération', 'projet'],
}

function preFilterOffers(profile: UserProfile, careers?: CareerSuggestion[]): JobOffer[] {
  const keywords = new Set<string>()

  profile.interests.forEach((i) => INTEREST_TO_KEYWORDS[i]?.forEach((k) => keywords.add(k.toLowerCase())))
  profile.skills.forEach((s) => keywords.add(s.toLowerCase()))

  if (careers) {
    careers.forEach((c) => c.title.toLowerCase().split(/[\s/]+/).forEach((w) => w.length > 3 && keywords.add(w)))
  }

  const location = profile.location?.toLowerCase() ?? ''
  const keywordArray = Array.from(keywords)

  const scored = ALL_OFFERS
    .filter((o) => {
      const haystack = `${o.titre} ${o.secteur} ${o.extrait}`.toLowerCase()
      const matchesKeyword = keywordArray.some((k) => haystack.includes(k))
      const matchesLocation = !location || location === 'antananarivo'
        ? true
        : o.lieu.toLowerCase().includes(location.split(' ')[0])
      return matchesKeyword && matchesLocation
    })
    .map((o) => {
      const haystack = `${o.titre} ${o.secteur} ${o.extrait}`.toLowerCase()
      const score = keywordArray.reduce((acc, k) => acc + (haystack.includes(k) ? 1 : 0), 0)
      return { offer: o, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 25)
    .map((s) => s.offer)

  return scored.length > 0 ? scored : ALL_OFFERS.slice(0, 25)
}

async function llmJobMatcher(profile: UserProfile, careers?: CareerSuggestion[]): Promise<JobMatch[]> {
  const candidates = preFilterOffers(profile, careers)

  const offresResumees = candidates.map((o, i) =>
    `[${i}] ${o.titre} | ${o.entreprise} | ${o.lieu} | ${o.type_contrat} | ${o.secteur}\n${o.extrait.slice(0, 200)}`
  ).join('\n\n')

  return await callToolLLM(
    `Tu es un conseiller emploi expert pour Madagascar. Analyse les offres fournies et sélectionne les 5 qui correspondent le mieux au profil.
Retourne UNIQUEMENT un tableau JSON de 5 objets avec ce schéma exact :
[{
  "offer": {
    "titre": "string",
    "entreprise": "string",
    "type_contrat": "string",
    "lieu": "string",
    "secteur": "string",
    "date_publi": "string",
    "date_limite": "string",
    "extrait": "string",
    "experience": "string",
    "niveau_etude": "string",
    "salaire": "string",
    "contact": "string",
    "url_detail": "string"
  },
  "matchScore": nombre entier entre 60 et 99,
  "matchReason": "explication personnalisée en 1-2 phrases de pourquoi cette offre correspond à CE profil",
  "keySkillsRequired": tableau de 3-4 compétences clés demandées par cette offre,
  "applicationTips": tableau de 2-3 conseils concrets pour maximiser les chances d'être retenu(e) pour ce poste spécifique
}]
Retourne UNIQUEMENT le JSON.`,
    `Profil : ${JSON.stringify(profile)}\nCarrières suggérées : ${JSON.stringify(careers?.map(c => c.title) ?? [])}\n\nOffres disponibles :\n${offresResumees}`
  ) as JobMatch[]
}
