import { NextRequest, NextResponse } from 'next/server'
import { runAgentTurn } from '@/lib/ai-agent/agent'
import type { AgentMessage } from '@/lib/ai-agent/agent'

export async function POST(req: NextRequest) {
  try {
    const { messages, provider, modelId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const llm = provider && modelId ? { provider: provider as string, modelId: modelId as string } : undefined
    const result = await runAgentTurn(messages as AgentMessage[], undefined, llm)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
