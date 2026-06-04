import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DailyPlan } from '../types'

interface PlannerState {
  plans: Record<string, DailyPlan>
  updatePlan: (date: string, plan: DailyPlan) => void
  getPlan: (date: string) => DailyPlan | undefined
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set, get) => ({
      plans: {},

      updatePlan: (date, plan) =>
        set((state) => ({
          plans: { ...state.plans, [date]: plan },
        })),

      getPlan: (date) => get().plans[date],
    }),
    { name: 'planner-storage' }
  )
)
