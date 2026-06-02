import { useState, useMemo, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import {
  Plus,
  Trash2,
  Check,
  Flame,
  Target,
  X,
  Zap,
  Clock,
  Hash,
} from 'lucide-react'
import { useHabitStore } from '../../store/habitStore'
import { getTodayKey } from '../../utils'
import type { Habit } from '../../types'

const HABIT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
]

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: '3x/week', label: '3x / Week' },
  { value: 'custom', label: 'Custom' },
]

const TYPE_OPTIONS: { value: Habit['type']; label: string; icon: React.ElementType }[] = [
  { value: 'boolean', label: 'Done / Not Done', icon: Check },
  { value: 'count', label: 'Count', icon: Hash },
  { value: 'duration', label: 'Duration (min)', icon: Clock },
]

function HeatmapRow({
  habitId,
  color,
  logs,
}: {
  habitId: string
  color: string
  logs: { habitId: string; date: string; value: number }[]
}) {
  const cells = useMemo(() => {
    const today = new Date()
    return Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const log = logs.find((l) => l.habitId === habitId && l.date === dateStr)
      const value = log?.value ?? 0
      return { date: dateStr, value, dayOfWeek: d.getDay() }
    })
  }, [habitId, logs])

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex gap-0.5">
        {cells.map((cell) => (
          <div
            key={cell.date}
            className="w-3 h-3 rounded-[2px]"
            title={`${cell.date}: ${cell.value}`}
            style={{
              backgroundColor: cell.value > 0 ? color : undefined,
              opacity: cell.value > 0 ? 1 : undefined,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function AddHabitForm({ onClose }: { onClose: () => void }) {
  const addHabit = useHabitStore((s) => s.addHabit)
  const [name, setName] = useState('')
  const [type, setType] = useState<Habit['type']>('boolean')
  const [schedule, setSchedule] = useState('daily')
  const [color, setColor] = useState(HABIT_COLORS[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    addHabit({ name: name.trim(), type, schedule, color, target: type === 'boolean' ? 1 : undefined })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">New Habit</h3>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <X size={16} />
        </button>
      </div>

      <input
        type="text"
        placeholder="Habit name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
        autoFocus
      />

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Type</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg text-xs font-medium border transition-colors ${
                type === opt.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <opt.icon size={16} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Schedule</label>
        <div className="flex gap-2">
          {SCHEDULE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSchedule(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                schedule === opt.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Color</label>
        <div className="flex gap-2">
          {HABIT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!name.trim()}
        className="w-full py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium transition-colors"
      >
        Create Habit
      </button>
    </form>
  )
}

function HabitCard({ habit }: { habit: Habit }) {
  const { logs, logHabit, deleteHabit, getStreak, getConsistency } = useHabitStore()
  const today = getTodayKey()
  const todayLog = logs.find((l) => l.habitId === habit.id && l.date === today)
  const currentValue = todayLog?.value ?? 0
  const streak = getStreak(habit.id)
  const consistency30 = getConsistency(habit.id, 30)

  const totalCompletions = useMemo(
    () => logs.filter((l) => l.habitId === habit.id && l.value > 0).length,
    [logs, habit.id]
  )

  const handleCheckIn = useCallback(() => {
    if (habit.type === 'boolean') {
      logHabit(habit.id, currentValue > 0 ? 0 : 1)
    } else {
      logHabit(habit.id, currentValue + 1)
    }
  }, [habit.id, habit.type, currentValue, logHabit])

  const handleDecrement = useCallback(() => {
    if (habit.type !== 'boolean' && currentValue > 0) {
      logHabit(habit.id, currentValue - 1)
    }
  }, [habit.id, habit.type, currentValue, logHabit])

  const isChecked = habit.type === 'boolean' && currentValue > 0

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-2 h-8 rounded-full shrink-0"
            style={{ backgroundColor: habit.color }}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {habit.name}
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {habit.type} · {habit.schedule}
            </p>
          </div>
        </div>
        <button
          onClick={() => deleteHabit(habit.id)}
          className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="flex items-center justify-center py-3">
        {habit.type === 'boolean' ? (
          <button
            onClick={handleCheckIn}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 ${
              isChecked
                ? 'text-white shadow-lg'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={isChecked ? { backgroundColor: habit.color } : undefined}
          >
            <Check size={28} strokeWidth={3} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg font-bold"
            >
              −
            </button>
            <input
              type="number"
              value={currentValue}
              onChange={(e) => logHabit(habit.id, Math.max(0, Number(e.target.value)))}
              className="w-16 text-center text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <button
              onClick={handleCheckIn}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-lg font-bold"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="py-1">
          <div className="flex items-center justify-center gap-1">
            <Flame size={12} className={streak > 0 ? 'text-amber-500' : ''} />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{streak}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Streak</p>
        </div>
        <div className="py-1 border-x border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-center gap-1">
            <Target size={12} className="text-primary-500" />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{totalCompletions}</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Total</p>
        </div>
        <div className="py-1">
          <div className="flex items-center justify-center gap-1">
            <Zap size={12} className={consistency30 > 70 ? 'text-emerald-500' : ''} />
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{consistency30}%</p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">30d</p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }, (_, i) => {
            const d = subDays(new Date(), 6 - i)
            const dateStr = format(d, 'yyyy-MM-dd')
            const log = logs.find((l) => l.habitId === habit.id && l.date === dateStr)
            const value = log?.value ?? 0
            return (
              <div
                key={dateStr}
                className="w-3 h-3 rounded-sm"
                title={`${dateStr}: ${value}`}
                style={{
                  backgroundColor: value > 0 ? habit.color : undefined,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function HabitTracker() {
  const { habits, logs } = useHabitStore()
  const [showForm, setShowForm] = useState(false)

  const overallStats = useMemo(() => {
    if (habits.length === 0) return { totalCompletions: 0, avgConsistency: 0 }
    const totalCompletions = habits.reduce(
      (sum, h) => sum + logs.filter((l) => l.habitId === h.id && l.value > 0).length,
      0
    )
    const avgConsistency =
      habits.reduce((sum, h) => {
        const consistency = useHabitStore.getState().getConsistency(h.id, 30)
        return sum + consistency
      }, 0) / habits.length
    return { totalCompletions, avgConsistency: Math.round(avgConsistency) }
  }, [habits, logs])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Habits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Build consistency, track your progress
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Habit'}
        </button>
      </div>

      {habits.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-primary-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.totalCompletions}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Avg Consistency</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{overallStats.avgConsistency}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Flame size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Active Habits</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{habits.length}</p>
          </div>
        </div>
      )}

      {showForm && <AddHabitForm onClose={() => setShowForm(false)} />}

      {habits.length === 0 && !showForm ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
          <Target size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No habits yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Start building better habits today.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
          >
            Create your first habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            30-Day Overview
          </h2>
          <div className="space-y-3">
            {habits.map((habit) => (
              <button
                key={habit.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div
                  className="w-2 h-8 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {habit.name}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
                      {useHabitStore.getState().getConsistency(habit.id, 30)}%
                    </span>
                  </div>
                  <HeatmapRow habitId={habit.id} color={habit.color} logs={logs} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
