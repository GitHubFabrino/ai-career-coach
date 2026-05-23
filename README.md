# AI Career Coach

An immersive AI-powered career coaching experience built with Next.js 16, Claude AI, and React Three Fiber.

## Setup

1. Add your Anthropic API key to `.env.local`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```

2. Run the dev server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Next.js 16** — App Router, TypeScript
- **Tailwind CSS** — Styling
- **Framer Motion** — Animations & transitions
- **Zustand** — State management
- **React Three Fiber + Three.js** — 3D neural network & particles
- **Claude API (Anthropic)** — ReAct AI agent
- **Lucide React** — Icons

## Features

- Landing page with live 3D neural network and particle field
- AI Chat guided by Claude (ReAct pattern with tools)
- Neural network that grows as you answer questions
- Career Matching — 3 personalized suggestions with match scores
- Action Plan — step-by-step roadmap tailored to your profile
- Skill Gap Analysis — exactly what to learn and where

## Architecture

```
src/
  app/
    page.tsx            Landing page
    coach/page.tsx      Main coach experience
    api/coach/          Claude API route (ReAct loop)
  components/3d/
    HeroScene.tsx       Three.js canvas wrapper
    NeuralNetwork.tsx   Animated neural network nodes
    ParticleField.tsx   Mouse-reactive particle system
  features/coach/
    ChatMessage.tsx     Chat bubble
    TypingIndicator.tsx AI thinking indicator
    CareerCard.tsx      Career suggestion card (3D tilt)
    ActionPlanView.tsx  Timeline roadmap
  lib/ai-agent/
    agent.ts            ReAct agent loop (Thought→Action→Observation)
    tools.ts            Tool definitions (profile, careers, gaps, plan)
  store/
    coach-store.ts      Zustand global state
  types/index.ts        Shared TypeScript types
```
Tout est en place. Voici ce qui a été fait :

Fichiers créés :

src/app/api/jobs/route.ts — API qui interroge JSearch (RapidAPI) pour les offres locales/internationales + Remotive en fallback gratuit
src/features/coach/JobOffers.tsx — Composant avec recherche, 3 modes, et cards d'offres
src/features/coach/JobOffers.module.css — Styles cohérents avec le reste de l'app
Fichiers modifiés :

src/app/coach/page.tsx — Nouvel onglet "Offres" (sidebar + mobile bar)
.env.local — Placeholder RAPIDAPI_KEY= avec instructions
Pour activer les offres Madagascar + international :

Va sur rapidapi.com → cherche "JSearch" → subscribe (plan Free : 500 req/mois)
Copie ta clé API et colle-la dans .env.local :

RAPIDAPI_KEY=ta_clé_ici
Redémarre le serveur (npm run dev)
Sans clé, le mode Remote fonctionne déjà (Remotive API est gratuite sans authentification) — tu peux l'utiliser tout de suite pour des offres remote internationales.