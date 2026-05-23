import Anthropic from '@anthropic-ai/sdk'
import { TOOL_DEFINITIONS } from './tools'
import { PROVIDER_META, type Provider } from '@/lib/llm/providers'
import type { UserProfile, CareerSuggestion, ActionPlan, SkillGap, BlockerAnalysis, Blocker } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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
  phase?: string
}

function executeTool(name: string, input: Record<string, unknown>): AgentResult & { result: unknown } {
  let result: unknown
  let profile: UserProfile | undefined
  let blockerAnalysis: BlockerAnalysis | undefined
  let careers: CareerSuggestion[] | undefined
  let skillGaps: SkillGap[] | undefined
  let actionPlan: ActionPlan | undefined
  let phase: string | undefined

  if (name === 'profile_analyzer') {
    result = extractProfile(input.answers as Record<string, string>, input.full_conversation as string | undefined)
    profile = result as UserProfile
  } else if (name === 'blocker_analyzer') {
    result = analyzeBlockers(input.profile as UserProfile, input.full_conversation as string)
    blockerAnalysis = result as BlockerAnalysis
  } else if (name === 'career_matcher') {
    result = matchCareers(input.profile as UserProfile, input.blockers as BlockerAnalysis | undefined)
    careers = result as CareerSuggestion[]
    phase = 'careers'
  } else if (name === 'skill_gap_analyzer') {
    result = analyzeGaps(input.profile as UserProfile, input.career as string)
    skillGaps = result as SkillGap[]
  } else if (name === 'action_plan_generator') {
    result = generatePlan(
      input.profile as UserProfile,
      input.career as CareerSuggestion,
      input.gaps as SkillGap[],
      input.blockers as BlockerAnalysis | undefined
    )
    actionPlan = result as ActionPlan
    phase = 'plan'
  } else {
    result = { error: 'Outil inconnu' }
  }

  return { result, reply: '', profile, blockerAnalysis, careers, skillGaps, actionPlan, phase }
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
          const { result, profile: p, blockerAnalysis: ba, careers: c, skillGaps: sg, actionPlan: ap, phase: ph } =
            executeTool(block.name, block.input as Record<string, unknown>)
          if (p) profile = p
          if (ba) blockerAnalysis = ba
          if (c) careers = c
          if (sg) skillGaps = sg
          if (ap) actionPlan = ap
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

  return { reply: finalReply, profile, blockerAnalysis, careers, skillGaps, actionPlan, phase }
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
    const res = await fetch(`${meta.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: modelId, max_tokens: 8096, messages: oaiMessages, tools: toOpenAITools(), tool_choice: 'auto' }),
    })

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
        const { result, profile: p, blockerAnalysis: ba, careers: c, skillGaps: sg, actionPlan: ap, phase: ph } =
          executeTool(tc.function.name, input)
        if (p) profile = p
        if (ba) blockerAnalysis = ba
        if (c) careers = c
        if (sg) skillGaps = sg
        if (ap) actionPlan = ap
        if (ph) phase = ph

        oaiMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) })
      }
    } else {
      finalReply = msg.content || ''
      continueLoop = false
    }
  }

  return { reply: finalReply, profile, blockerAnalysis, careers, skillGaps, actionPlan, phase }
}

// ─── 1. Extraction du profil ──────────────────────────────────────────────────

function extractProfile(
  answers: Record<string, string>,
  fullConversation?: string
): UserProfile {
  const text = (fullConversation || Object.values(answers).join(' ')).toLowerCase()

  const interestMap: Record<string, string[]> = {
    technology: ['technologie', 'tech', 'informatique', 'numérique', 'digital', 'coding', 'programmation', 'développement'],
    design: ['design', 'graphisme', 'créatif', 'création', 'ui', 'ux', 'figma', 'art', 'artistique', 'visuel'],
    business: ['business', 'commerce', 'affaires', 'entreprise', 'gestion', 'management', 'entrepreneuriat', 'startup'],
    data: ['data', 'données', 'analyse', 'statistiques', 'excel', 'chiffres', 'analytique', 'tableau'],
    education: ['enseigner', 'éducation', 'formation', 'enseignant', 'professeur', 'apprendre', 'pédagogie'],
    health: ['santé', 'médecine', 'médical', 'biologie', 'science', 'laboratoire', 'pharmacie'],
    environment: ['environnement', 'nature', 'agriculture', 'vanille', 'écologie', 'tourisme', 'agronomie'],
    communication: ['communication', 'réseaux sociaux', 'marketing', 'contenu', 'écriture', 'journalisme', 'médias'],
    finance: ['finance', 'banque', 'argent', 'comptabilité', 'fintech', 'mvola', 'mobile money', 'comptable'],
    ngo: ['ong', 'humanitaire', 'développement', 'impact', 'coopération', 'unicef', 'social'],
  }

  const skillMap: Record<string, string[]> = {
    programming: ['programmation', 'coder', 'coding', 'développeur', 'python', 'javascript', 'php', 'java', 'html', 'css', 'développement web'],
    design: ['figma', 'photoshop', 'illustrator', 'canva', 'design graphique', 'graphic design', 'maquette'],
    french: ['français', 'french', 'francophone', 'langue française', 'bilingue français'],
    english: ['anglais', 'english', 'bilingue anglais', 'toeic', 'toefl', 'langue anglaise'],
    communication: ['communication', 'présentation', 'écriture', 'rédaction', 'discours', 'oral', 'expression'],
    excel: ['excel', 'tableur', 'google sheets', 'calcul', 'données excel'],
    leadership: ['leadership', 'gestion d\'équipe', 'management', 'chef de projet', 'team leader', 'diriger'],
    research: ['recherche', 'analyse', 'investigation', 'enquête', 'rapport'],
    sales: ['vente', 'commercial', 'client', 'négociation', 'prospection'],
    teaching: ['enseigner', 'tutorer', 'formation', 'formateur', 'enseignement'],
  }

  const strengthMap: Record<string, string[]> = {
    curiosité: ['curieux', 'apprendre', 'toujours', 'j\'aime découvrir', 'j\'aime comprendre'],
    persévérance: ['je n\'abandonne pas', 'persévérant', 'déterminé', 'malgré', 'continue'],
    créativité: ['créatif', 'innover', 'idées', 'créer', 'original', 'imaginatif'],
    empathie: ['écouter', 'aider', 'comprendre les autres', 'sensible', 'humain'],
    organisation: ['organisé', 'structuré', 'planifier', 'méthode', 'rigoureux'],
    autonomie: ['seul', 'auto-didacte', 'autodidacte', 'j\'apprends seul', 'par moi-même'],
    relationnel: ['équipe', 'collaborer', 'travailler avec', 'réseau', 'contact'],
    résolution: ['problème', 'solution', 'résoudre', 'trouver', 'analyser'],
  }

  const interests: string[] = []
  const skills: string[] = []
  const strengths: string[] = []

  Object.entries(interestMap).forEach(([k, kws]) => {
    if (kws.some((kw) => text.includes(kw))) interests.push(k)
  })
  Object.entries(skillMap).forEach(([k, kws]) => {
    if (kws.some((kw) => text.includes(kw))) skills.push(k)
  })
  Object.entries(strengthMap).forEach(([k, kws]) => {
    if (kws.some((kw) => text.includes(kw))) strengths.push(k)
  })

  let location = 'Antananarivo'
  if (text.includes('toamasina') || text.includes('tamatave')) location = 'Toamasina'
  else if (text.includes('fianarantsoa') || text.includes('fiana')) location = 'Fianarantsoa'
  else if (text.includes('mahajanga') || text.includes('majunga')) location = 'Mahajanga'
  else if (text.includes('rural') || text.includes('campagne') || text.includes('village') || text.includes('province')) location = 'province (zone rurale)'

  let careerContext: UserProfile['careerContext'] = 'local'
  if (text.includes('remote') || text.includes('freelance') || text.includes('upwork') || text.includes('malt') || text.includes('étranger') || text.includes('international')) {
    careerContext = 'remote'
  } else if (text.includes('ong') || text.includes('humanitaire') || text.includes('unicef') || text.includes('giz') || text.includes('développement international')) {
    careerContext = 'ngo'
  } else if (text.includes('entrepreneur') || text.includes('startup') || text.includes('ma boite') || text.includes('mon entreprise') || text.includes('créer')) {
    careerContext = 'entrepreneurship'
  }

  let currentSituation: UserProfile['currentSituation'] = 'étudiant'
  if (text.includes('je travaille') || text.includes('en poste') || text.includes('mon emploi actuel') || text.includes('salarié')) {
    currentSituation = 'en_emploi'
  } else if (text.includes('reconversion') || text.includes('changer de métier') || text.includes('changer de carrière')) {
    currentSituation = 'en_reconversion'
  } else if (text.includes('sans emploi') || text.includes('au chômage') || text.includes('je cherche') || text.includes('demandeur')) {
    currentSituation = 'sans_emploi'
  } else if (text.includes('entrepreneur') || text.includes('je dirige') || text.includes('mon entreprise')) {
    currentSituation = 'entrepreneur'
  }

  return {
    interests: interests.length > 0 ? interests : ['technology'],
    skills: skills.length > 0 ? skills : ['communication'],
    strengths: strengths.length > 0 ? strengths : ['curiosité'],
    goals: answers['goals'] || extractGoal(text) || 'construire une carrière significative',
    name: extractName(text, answers),
    education: answers['education'] || extractEducation(text),
    experience: answers['experience'],
    location,
    careerContext,
    currentSituation,
  }
}

function extractName(text: string, answers: Record<string, string>): string | undefined {
  if (answers['name']) return answers['name']
  const fr = text.match(/(?:je m['']appelle|mon nom est|je suis)\s+([a-zàâäéèêëîïôùûü-]+)/i)
  const en = text.match(/(?:my name is|i'm|call me)\s+([a-z]+)/i)
  return fr?.[1] || en?.[1]
}

function extractGoal(text: string): string | undefined {
  const patterns = [
    /(?:je veux|je voudrais|mon objectif|mon rêve|j'aimerais|j['']aspire à)\s+(.{10,100})/i,
    /(?:i want to|my goal is|i dream of)\s+(.{10,100})/i,
  ]
  for (const p of patterns) {
    const m = text.match(p)
    if (m) return m[1].trim()
  }
}

function extractEducation(text: string): string | undefined {
  const kws = ['bac', 'licence', 'master', 'ingénieur', 'doctorat', 'bts', 'dut', 'emit', 'inscae', 'ens', 'université', 'bachelor', 'terminale', 'lycée']
  return kws.find((kw) => text.includes(kw))
}

// ─── 2. Analyse des blocages (Rôles 2 & 7) ───────────────────────────────────

function analyzeBlockers(profile: UserProfile, fullConversation: string): BlockerAnalysis {
  const text = fullConversation.toLowerCase()

  const blockerPatterns: Array<{ type: Blocker['type']; label: string; signals: string[]; description: string; coachingAdvice: string }> = [
    {
      type: 'peur_échec',
      label: 'Peur de l\'échec',
      signals: ['j\'ai peur', 'et si ça ne marche pas', 'risque', 'si j\'échoue', 'raté', 'échec', 'je vais rater'],
      description: 'Tu exprimes des craintes face à l\'éventualité de ne pas réussir.',
      coachingAdvice: 'L\'échec est une donnée, pas une identité. Chaque professionnel accompli a un parcours fait d\'essais. Commence petit, itère vite — ce qui compte c\'est d\'avancer, pas d\'être parfait dès le départ.',
    },
    {
      type: 'manque_confiance',
      label: 'Manque de confiance en soi',
      signals: ['je ne suis pas sûr', 'je ne suis pas capable', 'je ne mérite pas', 'je suis trop', 'pas assez', 'je doute', 'pas à la hauteur', 'je ne me sens pas'],
      description: 'Tu tends à sous-estimer tes capacités réelles.',
      coachingAdvice: 'La confiance se construit avec des preuves. Tu as déjà des compétences réelles — notre travail est de les rendre visibles, pour toi d\'abord, puis pour les autres. Liste tes 3 dernières réussites, même petites.',
    },
    {
      type: 'confusion_orientation',
      label: 'Confusion d\'orientation',
      signals: ['je ne sais pas quoi faire', 'perdu', 'je suis perdu', 'pas d\'idée', 'incertain', 'je ne sais plus', 'je ne sais pas vraiment', 'hésiter entre'],
      description: 'Tu ressens une confusion sur la direction à prendre.',
      coachingAdvice: 'La confusion est signe que tu prends ta décision au sérieux. C\'est bon signe. Ensemble on va clarifier en partant de tes vraies valeurs, pas des attentes extérieures.',
    },
    {
      type: 'manque_réseau',
      label: 'Réseau professionnel faible',
      signals: ['je ne connais personne', 'pas de contacts', 'seul', 'isolé', 'pas de réseau', 'je n\'ai personne', 'pas de relation'],
      description: 'Tu te sens sans contacts dans le milieu professionnel visé.',
      coachingAdvice: 'Le réseau se construit intentionnellement, pas automatiquement. À Tana, DevMada, Habaka et les groupes LinkedIn locaux sont des portes d\'entrée accessibles immédiatement. Un contact bien ciblé vaut mieux que 500 connexions passives.',
    },
    {
      type: 'manque_diplôme',
      label: 'Sentiment de manque de diplôme',
      signals: ['pas de diplôme', 'pas assez diplômé', 'pas le bon diplôme', 'sans formation', 'autodidacte', 'je n\'ai pas fait les études'],
      description: 'Tu penses que ton niveau d\'études est un frein.',
      coachingAdvice: 'Dans le numérique et le freelance, le portfolio prime sur le diplôme. Les certifications gratuites (Google, Meta, Salesforce) sont reconnues internationalement. Ce que tu sais faire compte plus que le parchemin.',
    },
    {
      type: 'contrainte_financière',
      label: 'Contrainte financière',
      signals: ['pas d\'argent', 'pas les moyens', 'cher', 'coûte trop', 'pas de budget', 'financièrement difficile', 'ressources limitées'],
      description: 'Les contraintes financières limitent tes options de formation ou de lancement.',
      coachingAdvice: 'Toutes les ressources recommandées sont gratuites ou auditables. freeCodeCamp, Kaggle, Google Skillshop, YouTube — un smartphone et une connexion suffisent. Les certifications gratuites ont une vraie valeur sur le marché.',
    },
    {
      type: 'peur_jugement',
      label: 'Peur du regard des autres',
      signals: ['qu\'est-ce qu\'on va penser', 'ma famille', 'les autres', 'le regard', 'honte', 'ridicule', 'jugé'],
      description: 'Le regard de l\'entourage influence tes choix professionnels.',
      coachingAdvice: 'Les décisions de carrière t\'appartiennent. L\'entourage réagit souvent avec crainte parce qu\'il t\'aime — pas parce qu\'il a raison. Partage ton plan concret, pas juste ton rêve : les gens font confiance aux plans.',
    },
    {
      type: 'perfectionnisme',
      label: 'Perfectionnisme bloquant',
      signals: ['pas encore prêt', 'quand je serai prêt', 'il me manque encore', 'je dois d\'abord finir', 'perfectionniste', 'pas assez bien', 'attendre'],
      description: 'Tu attends d\'être parfaitement prêt avant d\'agir.',
      coachingAdvice: '"Fait" vaut mieux que "parfait". Lance-toi avec 80% de préparation et affine en chemin. Le premier CV imparfait envoyé vaut infiniment plus que le CV parfait jamais envoyé.',
    },
  ]

  const detectedBlockers: Blocker[] = []
  for (const bp of blockerPatterns) {
    if (bp.signals.some((signal) => text.includes(signal))) {
      detectedBlockers.push({
        type: bp.type,
        label: bp.label,
        description: bp.description,
        coachingAdvice: bp.coachingAdvice,
      })
    }
  }

  // Détecter les forces cachées depuis le profil
  const strengthLabels: Record<string, string> = {
    curiosité: 'Curiosité naturelle — tu apprends vite',
    persévérance: 'Persévérance — tu ne lâches pas facilement',
    créativité: 'Créativité — tu génères des idées originales',
    empathie: 'Empathie — tu comprends les besoins des autres',
    organisation: 'Sens de l\'organisation — tu structures naturellement',
    autonomie: 'Autonomie — tu es capable d\'apprendre seul',
    relationnel: 'Sens du relationnel — tu construis des liens',
    résolution: 'Résolution de problèmes — tu cherches des solutions',
  }

  const strengths = (profile.strengths || []).map((s) => strengthLabels[s] || s)
  if (profile.skills.includes('french')) strengths.push('Maîtrise du français — atout majeur sur le marché francophone')
  if (profile.skills.includes('english')) strengths.push('Maîtrise de l\'anglais — accès au marché global')

  // Score de préparation au changement
  const blockersCount = detectedBlockers.length
  let readinessScore = 85 - blockersCount * 12
  readinessScore = Math.max(25, Math.min(95, readinessScore))

  let readinessLabel = ''
  let encouragement = ''
  if (readinessScore >= 75) {
    readinessLabel = 'Prêt(e) à agir'
    encouragement = 'Tu as les cartes en main. Le moment d\'agir, c\'est maintenant.'
  } else if (readinessScore >= 50) {
    readinessLabel = 'En préparation'
    encouragement = 'Quelques blocages à lever, mais ton potentiel est là. Un pas à la fois.'
  } else {
    readinessLabel = 'Phase de clarification'
    encouragement = 'La confusion est le début de la clarté. Ensemble on va démêler ça — c\'est pour ça que je suis là.'
  }

  // Profil de motivation
  const intrinsicSignals = ['passion', 'j\'aime', 'sens', 'impact', 'contribuer', 'créer', 'apprendre']
  const extrinsicSignals = ['salaire', 'argent', 'revenu', 'stable', 'sécurité', 'bien payé']
  const hasIntrinsic = intrinsicSignals.some((s) => text.includes(s))
  const hasExtrinsic = extrinsicSignals.some((s) => text.includes(s))
  const motivationProfile = hasIntrinsic && hasExtrinsic ? 'mixte' : hasIntrinsic ? 'intrinsèque' : 'extrinsèque'

  return {
    blockers: detectedBlockers,
    strengths: strengths.length > 0 ? strengths : ['Courage de faire cette démarche — ça en dit long sur ta détermination'],
    motivationProfile,
    readinessScore,
    readinessLabel,
    encouragement,
  }
}

// ─── 3. Matching de carrières (Rôles 3 & 8) ──────────────────────────────────

const CAREER_DATABASE: CareerSuggestion[] = [
  {
    title: 'Développeur Web / Mobile',
    matchScore: 0,
    description: 'Créer des applications web et mobiles pour des clients locaux ou internationaux en remote.',
    requiredSkills: ['JavaScript / TypeScript', 'React ou Vue.js', 'Node.js ou PHP', 'SQL', 'Git'],
    whyItFits: 'Forte demande locale (BeSta, Axian, startups) + accès au marché remote mondial avec de bons revenus en USD.',
    salaryRange: '600k–6M Ar/mois (local) · 500–3000$/mois (remote)',
    growthPotential: 'Très élevé',
    icon: '💻',
    decisionPros: ['Marché local ET international', 'Revenus parmi les plus élevés', 'Travail possible 100% remote', 'Progression rapide avec portfolio'],
    decisionCons: ['Courbe d\'apprentissage initiale exigeante', 'Nécessite une connexion internet stable', 'Concurrence internationale sur Upwork/Malt'],
  },
  {
    title: 'Data Analyst / Scientist',
    matchScore: 0,
    description: 'Transformer les données en décisions stratégiques pour des entreprises locales, ONG ou en remote.',
    requiredSkills: ['Python ou R', 'SQL', 'Excel avancé', 'Power BI ou Tableau', 'Statistiques'],
    whyItFits: 'INSTAT, UNICEF, WFP, GIZ et les entreprises locales cherchent activement des profils data.',
    salaryRange: '800k–3M Ar/mois · Forte demande ONG',
    growthPotential: 'Très élevé',
    icon: '📊',
    decisionPros: ['Très demandé par les ONG et INSTAT', 'Python + Excel suffisent pour commencer', 'Kaggle permet de pratiquer gratuitement'],
    decisionCons: ['Requiert des bases solides en maths/stats', 'Résultats moins immédiats qu\'un dev frontend'],
  },
  {
    title: 'Freelance Digital (Remote)',
    matchScore: 0,
    description: 'Offrir des services numériques (dev, design, rédaction, traduction) à des clients européens ou américains.',
    requiredSkills: ['Compétence principale (dev / design / rédaction)', 'Français ou Anglais C1+', 'Communication client', 'Gestion projet', 'Facturation internationale'],
    whyItFits: 'Accessible depuis n\'importe où avec une connexion. Revenus en EUR/USD, totale indépendance.',
    salaryRange: '300–3000+$/mois selon spécialité',
    growthPotential: 'Élevé avec expérience',
    icon: '🌍',
    decisionPros: ['Liberté totale d\'organisation', 'Revenus en devises étrangères', 'Pas besoin de diplôme spécifique', 'Accessible depuis toute ville de Madagascar'],
    decisionCons: ['Revenus irréguliers au début', 'Gestion administrative à assurer soi-même', 'Nécessite de se vendre activement'],
  },
  {
    title: 'Chargé(e) de projet ONG / Organisation Internationale',
    matchScore: 0,
    description: 'Piloter des programmes de développement pour UNICEF, GIZ, AFD, World Bank, MSF — tous actifs à Madagascar.',
    requiredSkills: ['Gestion de projet', 'Anglais professionnel', 'Rédaction de rapports', 'Analyse de données', 'Communication interculturelle'],
    whyItFits: 'Madagascar est un pays prioritaire pour les organisations internationales. Anglais + Data = profil très recherché.',
    salaryRange: '1.5M–5M Ar/mois + avantages',
    growthPotential: 'Élevé',
    icon: '🤝',
    decisionPros: ['Mission à fort impact social', 'Salaires compétitifs avec avantages', 'Réseau international valorisable', 'Stabilité contractuelle'],
    decisionCons: ['Anglais C1 souvent requis', 'Postes souvent à Antananarivo', 'Processus de recrutement compétitif'],
  },
  {
    title: 'Designer UX/UI & Graphique',
    matchScore: 0,
    description: 'Concevoir des interfaces, identités visuelles et supports de communication pour entreprises locales ou clients remote.',
    requiredSkills: ['Figma', 'Adobe Suite (Illustrator, Photoshop)', 'Principes UX', 'Canva Pro', 'Portfolio'],
    whyItFits: 'Forte demande locale (agences, startups, BPO) + marché remote accessible via Malt et Behance.',
    salaryRange: '500k–2M Ar/mois local · 500–2000$/mois remote',
    growthPotential: 'Élevé',
    icon: '🎨',
    decisionPros: ['Créativité au cœur du métier', 'Portfolio visible et tangible', 'Accessible sans diplôme spécifique'],
    decisionCons: ['Marché local encore restreint', 'Figma nécessite un apprentissage structuré'],
  },
  {
    title: 'Responsable Marketing Digital',
    matchScore: 0,
    description: 'Gérer la présence en ligne, les réseaux sociaux et les campagnes digitales pour des marques malgaches ou africaines.',
    requiredSkills: ['Réseaux sociaux (Facebook, TikTok, Instagram)', 'Google Ads / Meta Ads', 'SEO / Content', 'Analyse de performance', 'Copywriting'],
    whyItFits: 'L\'économie numérique malgache explose. Les PME et ONG ont un besoin urgent de profils marketing digital.',
    salaryRange: '500k–1.5M Ar/mois',
    growthPotential: 'Élevé',
    icon: '📣',
    decisionPros: ['Forte demande locale immédiate', 'Certification Meta Blueprint gratuite et reconnue', 'Créativité + données combinées'],
    decisionCons: ['Évolution salariale plus lente qu\'un profil tech', 'Requiert de suivre les tendances en continu'],
  },
  {
    title: 'Technicien BPO / Support Client Bilingue',
    matchScore: 0,
    description: 'Travailler dans un centre d\'appel (Intelcia, Telma, Webhelp) sur des missions françaises ou anglophones.',
    requiredSkills: ['Français C1 ou Anglais B2+', 'Communication orale', 'CRM (Salesforce, Zendesk)', 'Gestion du stress', 'Empathie client'],
    whyItFits: 'Entrée accessible sur le marché formel. Salaire stable + avantages. Tremplin vers management ou remote.',
    salaryRange: '400k–900k Ar/mois + primes',
    growthPotential: 'Modéré (évolution management)',
    icon: '🎧',
    decisionPros: ['Embauche rapide sans expérience', 'Formation assurée par l\'entreprise', 'Tremplin vers Team Leader'],
    decisionCons: ['Horaires parfois décalés', 'Plateau salarial si pas d\'évolution', 'Stress client à gérer'],
  },
  {
    title: 'Entrepreneur(e) / Fondateur de Startup',
    matchScore: 0,
    description: 'Créer une entreprise innovante dans la tech, l\'agri-tech, le tourisme ou l\'éducation à Madagascar.',
    requiredSkills: ['Vision produit', 'Gestion financière de base', 'Pitching', 'Leadership', 'Résilience'],
    whyItFits: 'Écosystème startup en croissance à Tana. Habaka, NextAfrica, et les incubateurs régionaux offrent du mentorat et du financement.',
    salaryRange: 'Variable — potentiel élevé à moyen terme',
    growthPotential: 'Très variable / fort potentiel',
    icon: '🚀',
    decisionPros: ['Liberté totale', 'Impact local direct', 'Soutien de Habaka et NextAfrica disponible'],
    decisionCons: ['Revenus instables au début', 'Risque financier réel', 'Nécessite une grande résilience'],
  },
  {
    title: 'Formateur / Créateur de Contenu Éducatif',
    matchScore: 0,
    description: 'Enseigner des compétences numériques en ligne (YouTube, formations locales) ou dans des centres de formation.',
    requiredSkills: ['Expertise dans un domaine', 'Pédagogie', 'Création vidéo / PowerPoint', 'Communication', 'Maîtrise du français et/ou malgasy'],
    whyItFits: 'Manque énorme de contenu tech de qualité en français et malgache. Monétisable via YouTube, sponsoring, ou formations payantes.',
    salaryRange: '200k–2M Ar/mois (scalable)',
    growthPotential: 'Élevé avec audience',
    icon: '🎓',
    decisionPros: ['Impact sur la communauté locale', 'Revenu passif scalable', 'Liberté créative totale'],
    decisionCons: ['Temps long avant monétisation', 'Nécessite une expertise reconnue d\'abord'],
  },
  {
    title: 'Ingénieur en Infrastructure / Réseaux',
    matchScore: 0,
    description: 'Déployer et maintenir les infrastructures réseau, serveurs et cloud pour des entreprises en pleine digitalisation.',
    requiredSkills: ['Linux', 'Réseaux (TCP/IP, DNS, VPN)', 'Cloud (AWS ou Azure)', 'Cybersécurité', 'Scripting'],
    whyItFits: 'Telma, Axian, banques et hôpitaux digitalisent leurs systèmes. Profil rare et très bien rémunéré localement.',
    salaryRange: '1M–4M Ar/mois',
    growthPotential: 'Très élevé',
    icon: '🔧',
    decisionPros: ['Profil rare = très bien payé', 'Certifications Cisco et AWS reconnues', 'Forte sécurité de l\'emploi'],
    decisionCons: ['Apprentissage technique exigeant', 'Moins de remote que le développement web'],
  },
]

function matchCareers(
  profile: UserProfile & { location?: string; careerContext?: string },
  blockers?: BlockerAnalysis
): CareerSuggestion[] {
  const { interests, skills, careerContext } = profile

  const scoringMap: Record<string, Record<string, number>> = {
    technology: { 'Développeur Web / Mobile': 35, 'Data Analyst / Scientist': 20, 'Ingénieur en Infrastructure / Réseaux': 25 },
    design: { 'Designer UX/UI & Graphique': 40, 'Responsable Marketing Digital': 20 },
    business: { 'Entrepreneur(e) / Fondateur de Startup': 35, 'Responsable Marketing Digital': 25, 'Chargé(e) de projet ONG / Organisation Internationale': 15 },
    data: { 'Data Analyst / Scientist': 40, 'Chargé(e) de projet ONG / Organisation Internationale': 20 },
    education: { 'Formateur / Créateur de Contenu Éducatif': 45, 'Chargé(e) de projet ONG / Organisation Internationale': 20 },
    health: { 'Chargé(e) de projet ONG / Organisation Internationale': 30, 'Data Analyst / Scientist': 15 },
    environment: { 'Chargé(e) de projet ONG / Organisation Internationale': 35, 'Entrepreneur(e) / Fondateur de Startup': 20 },
    communication: { 'Responsable Marketing Digital': 35, 'Technicien BPO / Support Client Bilingue': 30, 'Formateur / Créateur de Contenu Éducatif': 20 },
    finance: { 'Entrepreneur(e) / Fondateur de Startup': 25, 'Data Analyst / Scientist': 20 },
    ngo: { 'Chargé(e) de projet ONG / Organisation Internationale': 45, 'Data Analyst / Scientist': 20 },
    programming: { 'Développeur Web / Mobile': 45, 'Data Analyst / Scientist': 25, 'Freelance Digital (Remote)': 30 },
    french: { 'Technicien BPO / Support Client Bilingue': 30, 'Freelance Digital (Remote)': 20, 'Chargé(e) de projet ONG / Organisation Internationale': 15 },
    english: { 'Freelance Digital (Remote)': 35, 'Chargé(e) de projet ONG / Organisation Internationale': 30, 'Technicien BPO / Support Client Bilingue': 25 },
    excel: { 'Data Analyst / Scientist': 30, 'Chargé(e) de projet ONG / Organisation Internationale': 15 },
    leadership: { 'Chargé(e) de projet ONG / Organisation Internationale': 30, 'Entrepreneur(e) / Fondateur de Startup': 35 },
    research: { 'Data Analyst / Scientist': 30, 'Chargé(e) de projet ONG / Organisation Internationale': 25 },
    sales: { 'Responsable Marketing Digital': 25, 'Entrepreneur(e) / Fondateur de Startup': 20 },
    teaching: { 'Formateur / Créateur de Contenu Éducatif': 45, 'Chargé(e) de projet ONG / Organisation Internationale': 20 },
  }

  const contextBoost: Record<string, Record<string, number>> = {
    remote: { 'Freelance Digital (Remote)': 30, 'Développeur Web / Mobile': 15, 'Designer UX/UI & Graphique': 15 },
    ngo: { 'Chargé(e) de projet ONG / Organisation Internationale': 35, 'Data Analyst / Scientist': 15 },
    entrepreneurship: { 'Entrepreneur(e) / Fondateur de Startup': 40, 'Responsable Marketing Digital': 10 },
    local: { 'Technicien BPO / Support Client Bilingue': 15, 'Ingénieur en Infrastructure / Réseaux': 10 },
  }

  // Si blocages détectés sur la confiance → favoriser les parcours avec progression rapide visible
  const hasConfidenceBlocker = blockers?.blockers.some(
    (b) => b.type === 'manque_confiance' || b.type === 'peur_échec'
  )

  const db = CAREER_DATABASE.map((c) => ({ ...c, matchScore: 0 }))

  db.forEach((career) => {
    let score = 45
    ;[...interests, ...skills].forEach((item) => {
      const mapping = scoringMap[item?.toLowerCase()]
      if (mapping?.[career.title]) score += mapping[career.title]
    })
    if (careerContext && contextBoost[careerContext]?.[career.title]) {
      score += contextBoost[careerContext][career.title]
    }
    // Bonus pour profils avec manque de confiance vers les voies avec feedback rapide
    if (hasConfidenceBlocker) {
      if (['Technicien BPO / Support Client Bilingue', 'Formateur / Créateur de Contenu Éducatif'].includes(career.title)) {
        score += 10
      }
    }
    career.matchScore = Math.min(99, score)
  })

  return db.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3)
}

// ─── 4. Analyse des lacunes de compétences ────────────────────────────────────

function analyzeGaps(profile: UserProfile, career: string): SkillGap[] {
  const userSkills = profile.skills.map((s) => s.toLowerCase())

  const careerSkillMap: Record<string, SkillGap[]> = {
    'Développeur Web / Mobile': [
      { skill: 'HTML / CSS / JavaScript', currentLevel: 'none', targetLevel: 'advanced', resources: ['freeCodeCamp.org (gratuit, certifié)', 'The Odin Project (gratuit)', 'MDN Web Docs'] },
      { skill: 'React.js ou Vue.js', currentLevel: 'none', targetLevel: 'intermediate', resources: ['React.dev (officiel)', 'Scrimba (interactif)', 'YouTube: "Traversy Media"'] },
      { skill: 'Backend : Node.js ou PHP Laravel', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Laravel.com (officiel)', 'Node.js.org', 'YouTube: "Grafikart" (français)'] },
      { skill: 'Base de données SQL', currentLevel: 'none', targetLevel: 'intermediate', resources: ['SQLZoo.net (gratuit)', 'Mode Analytics SQL Tutorial', 'MySQL officiel'] },
      { skill: 'Git & GitHub', currentLevel: 'none', targetLevel: 'intermediate', resources: ['git-scm.com', 'GitHub Skills (gratuit)', 'YouTube: "Git pour débutants"'] },
    ],
    'Data Analyst / Scientist': [
      { skill: 'Python (Pandas, NumPy)', currentLevel: 'none', targetLevel: 'advanced', resources: ['Kaggle Learn (gratuit, certifié)', 'freeCodeCamp Python', 'Python.org tutorial'] },
      { skill: 'SQL avancé', currentLevel: 'none', targetLevel: 'advanced', resources: ['Mode Analytics', 'LeetCode SQL', 'SQLZoo'] },
      { skill: 'Power BI ou Tableau', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Microsoft Learn Power BI (gratuit)', 'Tableau Public (gratuit)', 'YouTube: "Guy in a Cube"'] },
      { skill: 'Statistiques appliquées', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Khan Academy Statistiques (FR)', 'Coursera "Statistics with Python"', 'StatQuest YouTube'] },
    ],
    'Freelance Digital (Remote)': [
      { skill: 'Compétence principale (dev / design / rédaction)', currentLevel: 'none', targetLevel: 'advanced', resources: ['freeCodeCamp', 'Figma Academy', 'Grammarly Blog'] },
      { skill: 'Anglais professionnel écrit', currentLevel: 'none', targetLevel: 'advanced', resources: ['Duolingo', 'BBC Learning English (gratuit)', 'Cambly (pratique orale)'] },
      { skill: 'Profil Upwork / Malt optimisé', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Upwork Academy (gratuit)', 'YouTube: "Comment décrocher son 1er client Upwork"', 'Malt Blog'] },
      { skill: 'Gestion client & facturation', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Wave (facturation gratuite)', 'Notion pour gestion projet', 'FreshBooks Blog'] },
    ],
    'Chargé(e) de projet ONG / Organisation Internationale': [
      { skill: 'Gestion de projet (PMD Pro)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['PMD Pro (formation ONG gratuite)', 'Coursera "Project Management"', 'PM4NGOs'] },
      { skill: 'Anglais professionnel C1', currentLevel: 'none', targetLevel: 'advanced', resources: ['EF English Live', 'Coursera "Business English"', 'BBC Learning English'] },
      { skill: 'Rédaction de rapports et propositions', currentLevel: 'none', targetLevel: 'intermediate', resources: ['USAID Report Writing guides', 'UN Report Templates', 'Purdue OWL Writing'] },
      { skill: 'Analyse de données (Excel / KoboToolbox)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['KoboToolbox Academy (gratuit)', 'Excel pour ONG YouTube', 'IFRC Data Analysis'] },
    ],
    'Designer UX/UI & Graphique': [
      { skill: 'Figma (UI Design & Prototypage)', currentLevel: 'none', targetLevel: 'advanced', resources: ['Figma Academy (gratuit officiel)', 'YouTube: "Flux Academy"', 'DesignLab'] },
      { skill: 'Principes UX & User Research', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Google UX Design Certificate (Coursera, auditable)', 'NNgroup.com', 'Interaction Design Foundation'] },
      { skill: 'Adobe Illustrator / Photoshop', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Adobe Learn (officiel)', 'YouTube: "Piximperfect"', 'Canva Design School (gratuit)'] },
      { skill: 'Portfolio Behance / Dribbble', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Behance.net', 'Dribbble.com', 'YouTube: "Build a UX Portfolio"'] },
    ],
    'Responsable Marketing Digital': [
      { skill: 'Community Management (Facebook, TikTok, Instagram)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Meta Blueprint (gratuit, certifié)', 'YouTube: "Olivier Roland"', 'Buffer Blog'] },
      { skill: 'Google Ads & Meta Ads', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Google Skillshop (gratuit, certifié)', 'Meta Blueprint', 'YouTube: marketing digital FR'] },
      { skill: 'SEO & Content Strategy', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Google Search Central', 'Ahrefs Blog (gratuit)', 'Semrush Academy (gratuit)'] },
      { skill: 'Analyse de données marketing', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Google Analytics 4 Academy (gratuit)', 'HubSpot Academy (gratuit)', 'Coursera Marketing Analytics'] },
    ],
    'Technicien BPO / Support Client Bilingue': [
      { skill: 'Français oral et écrit C1', currentLevel: 'none', targetLevel: 'advanced', resources: ['TV5Monde Langue Française', 'DELF/DALF préparation', 'Alliance Française Madagascar'] },
      { skill: 'Anglais professionnel B2', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Duolingo English', 'BBC Learning English', 'TOEIC préparation'] },
      { skill: 'Outils CRM (Salesforce, Zendesk)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Salesforce Trailhead (gratuit, certifié)', 'Zendesk Training (gratuit)', 'YouTube: "Salesforce pour débutants"'] },
      { skill: 'Gestion de conflits & empathie', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Coursera "Conflict Resolution"', 'YouTube: "Active Listening"', 'Formation interne BPO'] },
    ],
    'Entrepreneur(e) / Fondateur de Startup': [
      { skill: 'Lean Startup & Validation de marché', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Livre "The Lean Startup"', 'Habaka Madagascar (mentorat)', 'NextAfrica Hub Antananarivo'] },
      { skill: 'Pitch & Communication investisseurs', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Coursera "How to Pitch"', 'YouTube: "YCombinator Startup School"', 'Habaka pitch training'] },
      { skill: 'Gestion financière et business plan', currentLevel: 'none', targetLevel: 'intermediate', resources: ['INSCAE Formation continue', 'Coursera "Financial Planning"', 'Score.org (gratuit)'] },
      { skill: 'Leadership & gestion d\'équipe', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Coursera "Inspirational Leadership"', 'MindTools.com', 'Podcast "How I Built This"'] },
    ],
    'Formateur / Créateur de Contenu Éducatif': [
      { skill: 'Création vidéo YouTube (tournage + montage)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['YouTube Creator Academy (gratuit)', 'CapCut (montage mobile gratuit)', 'DaVinci Resolve (gratuit PC)'] },
      { skill: 'Pédagogie & design de formation', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Coursera "Learning How to Learn"', 'ATD', 'Canva pour supports visuels'] },
      { skill: 'Monétisation & croissance d\'audience', currentLevel: 'none', targetLevel: 'intermediate', resources: ['YouTube Creator Academy', 'Gumroad (vente de formations)', 'Teachable Blog'] },
      { skill: 'Expertise spécifique à approfondir', currentLevel: 'none', targetLevel: 'advanced', resources: ['Dépend du domaine choisi', 'Kaggle / freeCodeCamp / Figma Academy', 'Pratique intensive + portfolio'] },
    ],
    'Ingénieur en Infrastructure / Réseaux': [
      { skill: 'Linux & Administration système', currentLevel: 'none', targetLevel: 'advanced', resources: ['Linux Journey (gratuit)', 'The Linux Foundation courses', 'OverTheWire (pratique)'] },
      { skill: 'Réseaux (niveau CCNA)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['Cisco NetAcad (gratuit)', 'YouTube: "Professor Messer"', 'David Bombal YouTube'] },
      { skill: 'Cloud (AWS / Azure)', currentLevel: 'none', targetLevel: 'intermediate', resources: ['AWS Cloud Practitioner (gratuit)', 'Microsoft Azure Fundamentals', 'A Cloud Guru'] },
      { skill: 'Cybersécurité de base', currentLevel: 'none', targetLevel: 'intermediate', resources: ['TryHackMe (gamifié, gratuit)', 'Google Cybersecurity Certificate', 'OWASP.org'] },
    ],
  }

  const gaps = careerSkillMap[career] || careerSkillMap['Développeur Web / Mobile']

  return gaps.map((gap) => ({
    ...gap,
    currentLevel: userSkills.some(
      (s) => gap.skill.toLowerCase().includes(s) || s.includes(gap.skill.toLowerCase().split(' ')[0].toLowerCase())
    )
      ? 'beginner'
      : 'none',
  }))
}

// ─── 5. Génération du plan d'action complet (Rôles 3, 4, 5, 6) ───────────────

function generatePlan(
  profile: UserProfile & { location?: string; careerContext?: string },
  career: CareerSuggestion,
  gaps: SkillGap[],
  blockers?: BlockerAnalysis
): ActionPlan {
  const name = profile.name || 'toi'
  const isRemote = profile.careerContext === 'remote' || career.title.includes('Remote')
  const isNGO = profile.careerContext === 'ngo' || career.title.includes('ONG')
  const isEntrepreneur = profile.careerContext === 'entrepreneurship' || career.title.includes('Startup')
  const hasConfidenceBlocker = blockers?.blockers.some(
    (b) => b.type === 'manque_confiance' || b.type === 'peur_échec'
  )

  // CV tips personnalisés
  const cvTips = [
    `Utilise un modèle minimaliste et professionnel (Canva, Novoresume gratuit) — une page max`,
    `En-tête : prénom, email professionnel (pas de surnom), LinkedIn, GitHub/Behance selon ton profil`,
    `Section "Compétences" avant "Expériences" si tu débutes — mets en avant ce que tu sais faire`,
    `Résultats, pas tâches : écris "Développé une app utilisée par 500 personnes" plutôt que "Développement d\'app"`,
    profile.careerContext === 'remote'
      ? 'Mention explicite : "Disponible pour missions remote 100%" + fuseau horaire Madagascar (UTC+3)'
      : `Adapte l\'objet de ta candidature à chaque entreprise — 2 lignes personnalisées changent tout`,
    'Inclus un lien vers ton portfolio / GitHub / Behance — un recruteur doit pouvoir voir ton travail en 1 clic',
  ]

  // LinkedIn tips personnalisés
  const linkedinTips = [
    `Photo professionnelle : fond neutre, sourire, tenue soignée — la photo augmente les vues de 21x`,
    `Titre LinkedIn = ce que tu APPORTES, pas ton statut : "Développeur React | Solutions web pour PME malgaches" plutôt que "Étudiant"`,
    `Résumé (section "À propos") en 3-4 lignes : qui tu es, ce que tu fais, ce que tu cherches`,
    `Rejoins ces groupes LinkedIn : "Tech Madagascar", "Madagascar Digital", "ONG et développement Afrique"`,
    isNGO
      ? 'Suis les pages de UNICEF Madagascar, GIZ, AFD, World Bank Madagascar — commente leurs publications pour te rendre visible'
      : isRemote
      ? 'Active le filtre "Open to remote work" et mentionne-le dans ton titre et résumé'
      : `Connecte avec les responsables RH de Telma, Axian, BeSta, Habaka — un message court et sincère fonctionne`,
    `Publie 1 post par semaine sur ce que tu apprends : c\'est la meilleure visibilité gratuite disponible`,
  ]

  // Tips entretien personnalisés
  const interviewTips = [
    `Méthode STAR pour chaque question comportementale : Situation → Tâche → Action → Résultat`,
    `Prépare 3 exemples concrets de problèmes résolus dans ton domaine — même des projets personnels ou académiques`,
    isNGO
      ? 'Pour les ONG : prépare "Pourquoi ce secteur ?" avec un exemple d\'impact social que tu veux créer'
      : isRemote
      ? 'Pour un client freelance : démontre ta capacité à communiquer par écrit de façon claire et proactive'
      : `Recherche l\'entreprise avant : leur actualité, leurs produits, leurs valeurs — montre que tu t\'es préparé(e)`,
    `Question inévitable : "Parle-moi de toi" — prépare une réponse de 90 secondes : passé → présent → futur`,
    hasConfidenceBlocker
      ? 'Rappelle-toi : l\'entretien est une conversation, pas un examen. Tu évalues aussi si l\'entreprise TE convient.'
      : `Arrive avec 2 questions intelligentes à poser — ça montre ton intérêt et ta proactivité`,
    `Après l\'entretien : envoie un email de remerciement dans les 24h — 80% des candidats ne le font pas`,
    `Pratique sur Pramp.com (mock interviews gratuits) ou avec un ami avant le vrai entretien`,
  ]

  const steps = [
    // PHASE 1 — Compétences
    {
      title: `Fondations : ${gaps[0]?.skill || 'Compétences clés'}`,
      description: `${hasConfidenceBlocker ? 'Commence petit pour te prouver à toi-même que tu peux : ' : ''}Maîtrise les bases de ${gaps[0]?.skill || 'ton domaine'}. Ressources : ${gaps[0]?.resources?.slice(0, 2).join(' et ') || 'cours en ligne gratuits'}. Consacre 45 min/jour — régularité > durée.`,
      duration: '1–2 mois',
      resources: gaps[0]?.resources,
      priority: 'high' as const,
      phase: 'compétences' as const,
    },
    {
      title: `Montée en puissance : ${gaps[1]?.skill || 'Pratique avancée'}`,
      description: `Approfondis ${gaps[1]?.skill || 'les compétences pratiques'}. Rejoins la communauté DevMada ou les groupes Facebook locaux pour te challenger et progresser plus vite.`,
      duration: '2–3 mois',
      resources: gaps[1]?.resources,
      priority: 'high' as const,
      phase: 'compétences' as const,
    },
    // PHASE 2 — Portfolio
    {
      title: 'Premier projet concret dans ton portfolio',
      description: `Construis UN vrai projet lié à ${career.title} et publie-le (GitHub, Behance, ou LinkedIn). ${hasConfidenceBlocker ? "Ce projet va te donner la preuve concrète de ta valeur — même imparfait, il compte. 'Fait' vaut mieux que 'parfait'." : "C'est ta preuve de compétence pour tous les recruteurs."}`,
      duration: '3–4 semaines',
      resources: ['GitHub (portfolio dev)', 'Behance (portfolio design)', 'Notion (portfolio généraliste)', 'LinkedIn (visibilité)'],
      priority: 'high' as const,
      phase: 'portfolio' as const,
    },
    // PHASE 3 — Outils de recherche
    {
      title: 'Optimiser ton CV et profil LinkedIn',
      description: `Crée un CV professionnel une page (Canva gratuit). Configure ton LinkedIn avec photo, titre percutant et résumé clair. ${isRemote ? 'Mentionne explicitement "disponible remote" et "UTC+3".' : 'Adapte chaque candidature à l\'entreprise visée.'}`,
      duration: '1 semaine',
      resources: ['Canva (modèles CV gratuits)', 'LinkedIn.com', 'Novoresume.com (gratuit)', 'ChatGPT pour relecture'],
      priority: 'high' as const,
      phase: 'outils_emploi' as const,
    },
    // PHASE 4 — Réseau
    {
      title: isRemote ? 'Créer tes profils freelance et décrocher ton 1er client' : isNGO ? 'Réseauter dans le milieu ONG à Madagascar' : 'Construire ton réseau professionnel local',
      description: isRemote
        ? 'Crée et optimise tes profils sur Malt (marché francophone) et Upwork (marché anglophone). Propose tes 3 premiers services à prix d\'entrée pour obtenir des avis. Un seul avis 5★ change tout.'
        : isNGO
        ? 'Rejoins les groupes LinkedIn des ONG actives. Assiste aux événements humanitaires. Propose du bénévolat pour obtenir une première expérience terrain — les ONG valorisent l\'engagement.'
        : 'Rejoins DevMada, Habaka, et les groupes tech de Tana. Assiste aux meetups (gratuits). 60% des emplois se trouvent via le réseau, pas via les annonces.',
      duration: '2–4 semaines',
      resources: isRemote
        ? ['Malt.fr', 'Upwork.com', 'Fiverr.com', 'LinkedIn']
        : ['DevMada (groupe Facebook)', 'Habaka Madagascar', 'LinkedIn', 'NextAfrica Hub'],
      priority: 'medium' as const,
      phase: 'réseau' as const,
    },
    // PHASE 5 — Entretiens
    {
      title: 'Préparer et réussir tes entretiens',
      description: `Prépare la méthode STAR, tes 3 exemples de réussite et ta réponse à "Parle-moi de toi". ${hasConfidenceBlocker ? "Souviens-toi : l'entretien est une conversation, pas un examen. Tu as de vraies compétences à montrer." : "Pratique avec Pramp.com avant les vrais entretiens."} Envoie un email de remerciement dans les 24h après chaque entretien.`,
      duration: '1–2 semaines de préparation',
      resources: ['Pramp.com (mock interviews gratuits)', 'YouTube: "Réussir un entretien d\'embauche"', 'Glassdoor (retours d\'entretiens par entreprise)'],
      priority: 'high' as const,
      phase: 'entretiens' as const,
    },
    // PHASE 6 — Lancement
    {
      title: isRemote ? 'Décrocher ton premier contrat payant' : isEntrepreneur ? 'Lancer ton MVP et tes premières ventes' : 'Décrocher ton premier poste ou mission',
      description: isRemote
        ? 'Vise ton premier contrat, même petit (50–200€). L\'objectif : une première preuve de paiement international. Après ça, les tarifs montent vite. Chaque avis positif est une porte ouverte.'
        : isEntrepreneur
        ? 'Lance ton MVP le plus simple possible, fais tester par 10 utilisateurs réels, itère. Présente à Habaka pour le premier financement et mentorat. Le marché t\'apprendra plus que 6 mois de planification.'
        : `Postule à des offres sur JobInMada.com, LinkedIn Jobs Madagascar, et via ton réseau. ${name}, tu es prêt(e) — c\'est le moment.`,
      duration: 'Continu',
      resources: isRemote
        ? ['Upwork First Job Tips', 'Malt First Mission', 'Reddit r/freelance']
        : isEntrepreneur
        ? ['Habaka Madagascar', 'NextAfrica Hub', 'YCombinator Startup School (gratuit)']
        : ['JobInMada.com', 'LinkedIn Jobs Madagascar', 'Facebook: Emploi Madagascar'],
      priority: 'high' as const,
      phase: 'lancement' as const,
    },
  ]

  return {
    careerTitle: career.title,
    steps,
    totalDuration: '8–12 mois',
    summary: `Un plan sur mesure de 8 à 12 mois pour transformer ${name} en ${career.title} compétent et employable — couvrant compétences, portfolio, CV, LinkedIn, réseau ET préparation aux entretiens. Adapté à la réalité du marché malgache.`,
    cvTips,
    linkedinTips,
    interviewTips,
  }
}
