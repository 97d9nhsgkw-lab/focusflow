import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { provider, apiKey, model, messages, maxTokens = 1000 } = req.body

  if (!provider || !apiKey || !messages) {
    return res.status(400).json({ error: 'Missing required fields: provider, apiKey, messages' })
  }

  try {
    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || 'gpt-4o-mini',
          messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'OpenAI API error' })
      }

      return res.status(200).json({ content: data.choices[0]?.message?.content || '' })
    }

    if (provider === 'anthropic') {
      const systemMessage = messages.find((m: { role: string }) => m.role === 'system')?.content || ''
      const userMessages = messages.filter((m: { role: string }) => m.role !== 'system')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: maxTokens,
          system: systemMessage,
          messages: userMessages,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' })
      }

      return res.status(200).json({ content: data.content?.[0]?.text || '' })
    }

    return res.status(400).json({ error: 'Unknown provider' })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Proxy error' })
  }
}
