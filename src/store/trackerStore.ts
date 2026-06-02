import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TimeEntry } from '../types'
import { generateId, getTodayKey } from '../utils'

interface TrackerState {
  entries: TimeEntry[]
  activeEntry: TimeEntry | null
  startTimer: (description: string, category: string) => void
  stopTimer: () => void
  addManualEntry: (entry: Omit<TimeEntry, 'id'>) => void
  deleteEntry: (id: string) => void
  getEntriesForDate: (date: string) => TimeEntry[]
  getTotalForDate: (date: string) => number
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      entries: [],
      activeEntry: null,
      startTimer: (description, category) => {
        const entry: TimeEntry = {
          id: generateId(),
          description,
          category,
          startTime: new Date().toISOString(),
          duration: 0,
          date: getTodayKey(),
        }
        set({ activeEntry: entry })
      },
      stopTimer: () => {
        const { activeEntry, entries } = get()
        if (!activeEntry) return
        const endTime = new Date()
        const startTime = new Date(activeEntry.startTime)
        const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000)
        const completedEntry: TimeEntry = {
          ...activeEntry,
          endTime: endTime.toISOString(),
          duration,
        }
        set({
          entries: [...entries, completedEntry],
          activeEntry: null,
        })
      },
      addManualEntry: (entry) => {
        const newEntry = { ...entry, id: generateId() }
        set((state) => ({ entries: [...state.entries, newEntry] }))
      },
      deleteEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      getEntriesForDate: (date) => get().entries.filter((e) => e.date === date),
      getTotalForDate: (date) =>
        get()
          .entries.filter((e) => e.date === date)
          .reduce((sum, e) => sum + e.duration, 0),
    }),
    { name: 'tracker-storage' }
  )
)
