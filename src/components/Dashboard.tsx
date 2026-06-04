import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import {
  Timer,
  Focus,
  Clock,
  Plus,
  Flame,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react'
import { usePomodoroStore } from '../store/pomodoroStore'
import { useTrackerStore } from '../store/trackerStore'
import { useHabitStore } from '../store/habitStore'
import { useAppStore } from '../store/appStore'
import { formatTime, getTodayKey } from '../utils'

export default function Dashboard() {
  const { todayCompleted, settings } = usePomodoroStore()
  const { entries, getTotalForDate } = useTrackerStore()
  const { habits, getStreak, getLogsForDate } = useHabitStore()
  const { setView } = useAppStore()
  const [copied, setCopied] = useState(false)

  const today = getTodayKey()
  const todayEntries = useMemo(
    () => entries.filter((e) => e.date === today).slice(-5).reverse(),
    [entries, today]
  )
  const totalTrackedToday = useMemo(
    () => getTotalForDate(today),
    [getTotalForDate, today]
  )

  const todayLogs = useMemo(() => getLogsForDate(today), [getLogsForDate, today])
  const habitsCompletedToday = useMemo(
    () => todayLogs.filter((l) => l.value > 0).length,
    [todayLogs]
  )

  const overallStreak = useMemo(() => {
    if (habits.length === 0) return 0
    return Math.max(...habits.map((h) => getStreak(h.id)), 0)
  }, [habits, getStreak])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const handleShare = async () => {
    const url = window.location.origin
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const statCards = [
    {
      label: 'Pomodoros',
      value: todayCompleted,
      target: settings.dailyGoal,
      icon: Timer,
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-900/20',
    },
    {
      label: 'Focus Time',
      value: formatTime(totalTrackedToday),
      target: null,
      icon: Focus,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-900/20',
    },
    {
      label: 'Habits Done',
      value: `${habitsCompletedToday}/${habits.length}`,
      target: null,
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: 'Time Tracked',
      value: formatTime(totalTrackedToday),
      target: null,
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {greeting}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${card.bg}`}
              >
                <card.icon size={20} className={card.color} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {card.label}
              </p>
            </div>
            {card.target !== null && (
              <div className="mt-2">
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        (typeof card.value === 'number' ? card.value : 0) /
                          card.target *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                  {todayCompleted} / {settings.dailyGoal} daily goal
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {overallStreak > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Flame size={24} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">{overallStreak} Day Streak</p>
            <p className="text-sm text-white/80">
              Keep it up! You're on fire.
            </p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      )}

      {overallStreak === 0 && (
        <div className="bg-gradient-to-r from-primary-500 to-blue-500 rounded-xl p-4 flex items-center gap-4 text-white">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Share2 size={24} />
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">Share FocusFlow</p>
            <p className="text-sm text-white/80">
              Help friends boost their productivity
            </p>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            {copied ? <Check size={16} /> : <Share2 size={16} />}
            {copied ? 'Copied!' : 'Share'}
          </button>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Quick Start
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setView('pomodoro')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <Timer size={24} />
            <span className="text-xs font-medium">Pomodoro</span>
          </button>
          <button
            onClick={() => setView('focus')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
          >
            <Focus size={24} />
            <span className="text-xs font-medium">Focus Session</span>
          </button>
          <button
            onClick={() => setView('tracker')}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            <Plus size={24} />
            <span className="text-xs font-medium">Time Entry</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            Recent Activity
          </h2>
          <button
            onClick={() => setView('tracker')}
            className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
          >
            View all
          </button>
        </div>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
            No activity yet today. Start tracking your time!
          </p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {entry.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.category}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0 ml-2">
                  {formatTime(entry.duration)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
