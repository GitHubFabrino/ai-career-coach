import Anthropic from '@anthropic-ai/sdk'
import { PROVIDER_META, type Provider } from './providers'

export async function callLLMText({
  provider,
  modelId,
  messages,
  maxTokens = 1024,
}: {
  provider: string
  modelId: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<string> {
  if (provider === 'anthropic') {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: modelId,
      max_tokens: maxTokens,
      messages,
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text : ''
  }

  const meta = PROVIDER_META[provider as Provider]
  if (!meta?.baseUrl) throw new Error(`Provider inconnu ou sans baseUrl: ${provider}`)

  const apiKey = process.env[meta.envKey]
  if (!apiKey) throw new Error(`${meta.envKey} n'est pas configuré dans .env.local`)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://strongia.coach'
    headers['X-Title'] = 'Coach Carrière IA'
  }

  const res = await fetch(`${meta.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: modelId, max_tokens: maxTokens, messages }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`${provider} API error: ${(err as { error?: { message?: string } }).error?.message || res.statusText}`)
  }

  const data = await res.json() as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message?.content || ''
}
