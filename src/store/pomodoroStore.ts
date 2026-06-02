import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PomodoroSettings } from '../types'

interface PomodoroState {
  settings: PomodoroSettings
  currentSessions: number
  todayCompleted: number
  updateSettings: (settings: Partial<PomodoroSettings>) => void
  incrementSession: () => void
  resetToday: () => void
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set) => ({
      settings: {
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsBeforeLongBreak: 4,
        autoStartBreaks: true,
        autoStartPomodoros: false,
        dailyGoal: 8,
      },
      currentSessions: 0,
      todayCompleted: 0,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      incrementSession: () =>
        set((state) => ({
          currentSessions: state.currentSessions + 1,
          todayCompleted: state.todayCompleted + 1,
        })),
      resetToday: () => set({ currentSessions: 0, todayCompleted: 0 }),
    }),
    { name: 'pomodoro-storage' }
  )
)
