import { NextRequest, NextResponse } from 'next/server'
import { runAgentTurn } from '@/lib/ai-agent/agent'
import type { AgentMessage } from '@/lib/ai-agent/agent'

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    const result = await runAgentTurn(messages as AgentMessage[])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Coach API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
