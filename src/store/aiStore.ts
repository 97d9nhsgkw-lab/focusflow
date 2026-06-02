import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AISettings } from '../types'

interface AIState {
  settings: AISettings
  updateSettings: (settings: Partial<AISettings>) => void
  hasApiKey: () => boolean
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      settings: {
        provider: null,
        apiKey: '',
        model: '',
      },
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      hasApiKey: () => get().settings.apiKey.length > 0,
    }),
    { name: 'ai-storage' }
  )
)
