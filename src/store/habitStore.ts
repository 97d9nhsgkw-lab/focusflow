import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Habit, HabitLog } from '../types'
import { generateId, getTodayKey } from '../utils'

interface HabitState {
  habits: Habit[]
  logs: HabitLog[]
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void
  deleteHabit: (id: string) => void
  logHabit: (habitId: string, value: number) => void
  getLogsForDate: (date: string) => HabitLog[]
  getStreak: (habitId: string) => number
  getConsistency: (habitId: string, days: number) => number
}

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: [],
      logs: [],
      addHabit: (habit) => {
        const newHabit: Habit = {
          ...habit,
          id: generateId(),
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ habits: [...state.habits, newHabit] }))
      },
      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
          logs: state.logs.filter((l) => l.habitId !== id),
        })),
      logHabit: (habitId, value) => {
        const { logs } = get()
        const today = getTodayKey()
        const existing = logs.find((l) => l.habitId === habitId && l.date === today)
        if (existing) {
          set({
            logs: logs.map((l) =>
              l.habitId === habitId && l.date === today ? { ...l, value } : l
            ),
          })
        } else {
          set({ logs: [...logs, { habitId, date: today, value }] })
        }
      },
      getLogsForDate: (date) => get().logs.filter((l) => l.date === date),
      getStreak: (habitId) => {
        const { logs } = get()
        const habitLogs = logs
          .filter((l) => l.habitId === habitId && l.value > 0)
          .map((l) => l.date)
          .sort()
          .reverse()
        if (habitLogs.length === 0) return 0
        let streak = 0
        const today = getTodayKey()
        let checkDate = today
        for (const logDate of habitLogs) {
          if (logDate === checkDate) {
            streak++
            const d = new Date(checkDate)
            d.setDate(d.getDate() - 1)
            checkDate = d.toISOString().split('T')[0]
          } else {
            break
          }
        }
        return streak
      },
      getConsistency: (habitId, days) => {
        const { logs } = get()
        const today = new Date()
        let completed = 0
        for (let i = 0; i < days; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const dateStr = d.toISOString().split('T')[0]
          if (logs.some((l) => l.habitId === habitId && l.date === dateStr && l.value > 0)) {
            completed++
          }
        }
        return Math.round((completed / days) * 100)
      },
    }),
    { name: 'habit-storage' }
  )
)
