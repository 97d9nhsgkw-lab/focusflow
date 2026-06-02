import { create } from 'zustand'
import type { ViewMode } from '../types'

interface AppState {
  currentView: ViewMode
  sidebarOpen: boolean
  setView: (view: ViewMode) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'dashboard',
  sidebarOpen: true,
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
