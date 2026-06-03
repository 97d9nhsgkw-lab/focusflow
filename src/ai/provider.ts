import { useAIStore } from '../store/aiStore'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface AIResponse {
  content: string
  error?: string
}

export async function sendAIMessage(
  messages: ChatMessage[],
  maxTokens: number = 1000
): Promise<AIResponse> {
  const { settings } = useAIStore.getState()

  if (!settings.apiKey || !settings.provider) {
    return { content: '', error: 'No API key configured. Go to Settings to add one.' }
  }

  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model,
        messages,
        maxTokens,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { content: '', error: data.error || `API error: ${res.status}` }
    }

    return { content: data.content || '' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return {
      content: '',
      error: `Network error: ${msg}. Make sure you're connected to the internet.`,
    }
  }
}
