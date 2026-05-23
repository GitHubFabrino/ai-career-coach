export type Provider = 'anthropic' | 'groq' | 'mistral' | 'openrouter'

export type ModelConfig = {
  id: string
  name: string
  provider: Provider
  supportsTools: boolean
  badge?: string
}

export const PROVIDER_META: Record<Provider, {
  name: string
  abbr: string
  color: string
  baseUrl?: string
  envKey: string
}> = {
  anthropic:  { name: 'Claude',     abbr: 'Claude',  color: '#d97706', envKey: 'ANTHROPIC_API_KEY' },
  groq:       { name: 'Groq',       abbr: 'Groq',    color: '#f97316', baseUrl: 'https://api.groq.com/openai/v1',  envKey: 'GROQ_API_KEY' },
  mistral:    { name: 'Mistral AI', abbr: 'Mistral', color: '#7c3aed', baseUrl: 'https://api.mistral.ai/v1',       envKey: 'MISTRAL_API_KEY' },
  openrouter: { name: 'OpenRouter', abbr: 'OR',      color: '#0ea5e9', baseUrl: 'https://openrouter.ai/api/v1',   envKey: 'OPENROUTER_API_KEY' },
}

export const MODELS: ModelConfig[] = [
  // Claude
  { id: 'claude-sonnet-4-6',         name: 'Sonnet 4.6',     provider: 'anthropic',  supportsTools: true, badge: 'Recommandé' },
  { id: 'claude-haiku-4-5-20251001', name: 'Haiku 4.5',      provider: 'anthropic',  supportsTools: true, badge: 'Rapide' },
  // Groq
  { id: 'llama-3.3-70b-versatile',   name: 'LLaMA 3.3 70B',  provider: 'groq',       supportsTools: true, badge: '⚡ Ultra-rapide' },
  { id: 'llama-3.1-8b-instant',      name: 'LLaMA 3.1 8B',   provider: 'groq',       supportsTools: true, badge: 'Léger' },
  { id: 'mixtral-8x7b-32768',        name: 'Mixtral 8×7B',   provider: 'groq',       supportsTools: true },
  // Mistral
  { id: 'mistral-large-latest',      name: 'Mistral Large',  provider: 'mistral',    supportsTools: true },
  { id: 'mistral-small-latest',      name: 'Mistral Small',  provider: 'mistral',    supportsTools: true, badge: 'Rapide' },
  // OpenRouter
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'LLaMA 3.3 70B',    provider: 'openrouter', supportsTools: true },
  { id: 'google/gemini-flash-1.5',            name: 'Gemini Flash 1.5', provider: 'openrouter', supportsTools: true, badge: 'Rapide' },
  { id: 'mistralai/mistral-large',            name: 'Mistral Large',    provider: 'openrouter', supportsTools: true },
]

export const DEFAULT_PROVIDER: Provider = 'anthropic'
export const DEFAULT_MODEL_ID = 'claude-sonnet-4-6'
