export interface PomodoroSettings {
  workDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  sessionsBeforeLongBreak: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  dailyGoal: number
}

export interface PomodoroPreset {
  name: string
  work: number
  shortBreak: number
  longBreak: number
}

export interface TimeEntry {
  id: string
  description: string
  category: string
  startTime: string
  endTime?: string
  duration: number
  date: string
}

export interface TimeBlock {
  id: string
  title: string
  startHour: number
  endHour: number
  category: string
  completed: boolean
}

export interface DailyPlan {
  date: string
  blocks: TimeBlock[]
}

export interface Habit {
  id: string
  name: string
  type: 'boolean' | 'count' | 'duration'
  target?: number
  schedule: string
  color: string
  createdAt: string
}

export interface HabitLog {
  habitId: string
  date: string
  value: number
}

export interface FocusSession {
  id: string
  date: string
  declaration: string
  duration: number
  completed: boolean
  rating?: number
}

export interface AISettings {
  provider: 'openai' | 'anthropic' | null
  apiKey: string
  model: string
}

export type ViewMode = 'dashboard' | 'pomodoro' | 'focus' | 'planner' | 'habits' | 'tracker' | 'analytics' | 'settings' | 'userguide'

export const CATEGORIES = [
  { name: 'Work', color: '#0ea5e9' },
  { name: 'Learning', color: '#8b5cf6' },
  { name: 'Exercise', color: '#10b981' },
  { name: 'Personal', color: '#f59e0b' },
  { name: 'Break', color: '#6b7280' },
] as const

export const POMODORO_PRESETS: PomodoroPreset[] = [
  { name: 'Classic', work: 25, shortBreak: 5, longBreak: 15 },
  { name: 'Sprint', work: 15, shortBreak: 3, longBreak: 10 },
  { name: 'Deep Work', work: 45, shortBreak: 10, longBreak: 20 },
  { name: '52/17', work: 52, shortBreak: 17, longBreak: 20 },
]
