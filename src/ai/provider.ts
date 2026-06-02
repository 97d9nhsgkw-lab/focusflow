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
    if (settings.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model || 'gpt-4o-mini',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          content: '',
          error: err.error?.message || `API error: ${res.status}`,
        }
      }

      const data = await res.json()
      return { content: data.choices[0]?.message?.content || '' }
    } else if (settings.provider === 'anthropic') {
      const systemMessage = messages.find((m) => m.role === 'system')?.content || ''
      const userMessages = messages.filter((m) => m.role !== 'system')

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': settings.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: settings.model || 'claude-3-haiku',
          max_tokens: maxTokens,
          system: systemMessage,
          messages: userMessages,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        return {
          content: '',
          error: err.error?.message || `API error: ${res.status}`,
        }
      }

      const data = await res.json()
      return { content: data.content?.[0]?.text || '' }
    }

    return { content: '', error: 'Unknown provider' }
  } catch (e) {
    return {
      content: '',
      error: e instanceof Error ? e.message : 'Network error. Check your connection.',
    }
  }
}
