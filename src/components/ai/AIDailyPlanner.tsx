import { useState } from 'react'
import { CalendarDays, Loader2, Plus, Check, Brain } from 'lucide-react'
import { sendAIMessage } from '../../ai/provider'
import { DAILY_PLANNER_PROMPT } from '../../ai/prompts'
import { useAIStore } from '../../store/aiStore'
import { useHabitStore } from '../../store/habitStore'
import { useTrackerStore } from '../../store/trackerStore'
import { CATEGORIES } from '../../types'
import { getTodayKey, formatTime } from '../../utils'

interface ScheduleItem {
  time: string
  task: string
  category: string
  duration: number
}

interface DailyPlanResponse {
  schedule: ScheduleItem[]
  summary: string
}

const AI_DAILY_PLAN_KEY = 'ai-daily-plan'

export default function AIDailyPlanner() {
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const { hasApiKey } = useAIStore()
  const { habits, logs } = useHabitStore()
  const { entries } = useTrackerStore()

  const today = getTodayKey()
  const todayEntries = entries.filter((e) => e.date === today)
  const todayLogs = logs.filter((l) => l.date === today)
  const recentEntries = entries.filter((e) => {
    const entryDate = new Date(e.date)
    const daysAgo = 7
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - daysAgo)
    return entryDate >= cutoff
  })

  const buildContext = () => {
    const habitSummary = habits.length > 0
      ? habits.map((h) => {
          const log = todayLogs.find((l) => l.habitId === h.id)
          const completed = log && log.value > 0
          return `${h.name} (${h.type}, ${completed ? 'completed today' : 'not yet done today'})`
        }).join(', ')
      : 'No habits configured'

    const trackedTime = todayEntries.length > 0
      ? todayEntries.map((e) => `${e.description} (${e.category}, ${formatTime(e.duration)})`).join(', ')
      : 'No time tracked today'

    const recentPatterns = recentEntries.length > 0
      ? recentEntries.slice(0, 10).map((e) => `${e.description} on ${e.date}`).join('; ')
      : 'No recent tracking data'

    return `Habits: ${habitSummary}\nToday's tracked time: ${trackedTime}\nRecent patterns (last 7 days): ${recentPatterns}`
  }

  const generatePlan = async () => {
    setLoading(true)
    setError('')
    setSchedule(null)
    setSummary('')
    setSaved(false)

    const context = buildContext()

    const messages = [
      { role: 'system' as const, content: DAILY_PLANNER_PROMPT },
      { role: 'user' as const, content: `Create a daily schedule based on this data:\n\n${context}` },
    ]

    const response = await sendAIMessage(messages, 1500)

    if (response.error) {
      setError(response.error)
      setLoading(false)
      return
    }

    try {
      const json = JSON.parse(response.content) as DailyPlanResponse
      setSchedule(json.schedule)
      setSummary(json.summary)
    } catch {
      setError('Failed to parse AI response. Please try again.')
    }

    setLoading(false)
  }

  const addToPlanner = () => {
    if (!schedule) return
    const planData = {
      date: today,
      schedule,
      summary,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem(AI_DAILY_PLAN_KEY, JSON.stringify(planData))
    setSaved(true)
  }

  const getCategoryColor = (categoryName: string) => {
    return CATEGORIES.find((c) => c.name === categoryName)?.color || '#6b7280'
  }

  if (!hasApiKey()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Brain size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          AI Not Configured
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Configure your AI settings in the Settings page to use the AI Daily Planner.
        </p>
        <a
          href="#settings"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
        >
          Go to Settings
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Daily Planner</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Generate an optimized schedule based on your habits and tracked time
          </p>
        </div>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CalendarDays size={16} />
          )}
          {loading ? 'Generating...' : 'Plan My Day'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          AI Context
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-500 dark:text-gray-400 block mb-1">Habits ({habits.length})</span>
            <p className="text-gray-700 dark:text-gray-300">
              {habits.length > 0
                ? habits.map((h) => h.name).join(', ')
                : 'No habits configured'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400 block mb-1">Today's Entries ({todayEntries.length})</span>
            <p className="text-gray-700 dark:text-gray-300">
              {todayEntries.length > 0
                ? todayEntries.map((e) => e.description).join(', ')
                : 'No time tracked today'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Loader2 size={48} className="mx-auto text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Generating your optimized schedule...</p>
        </div>
      )}

      {schedule && !loading && (
        <div className="space-y-4">
          {summary && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
              <p className="text-sm text-primary-700 dark:text-primary-300">{summary}</p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {schedule.map((item, index) => {
                const categoryColor = getCategoryColor(item.category)
                return (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="w-16 text-right">
                      <span className="text-sm font-mono font-medium text-gray-900 dark:text-white">
                        {item.time}
                      </span>
                    </div>
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.task}
                      </p>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        backgroundColor: categoryColor + '20',
                        color: categoryColor,
                      }}
                    >
                      {item.category}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-12 text-right">
                      {formatTime(item.duration)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={addToPlanner}
              disabled={saved}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {saved ? (
                <>
                  <Check size={16} />
                  Saved to Planner
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add to Planner
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!schedule && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <CalendarDays size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No schedule generated yet
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Click "Plan My Day" to generate an optimized schedule based on your habits and tracked time.
          </p>
        </div>
      )}
    </div>
  )
}
