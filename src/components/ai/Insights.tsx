import { useState, useMemo } from 'react'
import { Brain, Loader2, TrendingUp, AlertTriangle, CheckCircle2, Lightbulb, Clock } from 'lucide-react'
import { sendAIMessage } from '../../ai/provider'
import { INSIGHTS_PROMPT } from '../../ai/prompts'
import { useTrackerStore } from '../../store/trackerStore'
import { useHabitStore } from '../../store/habitStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { formatTime, getWeekDates, formatDate } from '../../utils'
import { format } from 'date-fns'

interface Insight {
  type: 'pattern' | 'suggestion' | 'achievement' | 'warning'
  text: string
}

interface AIInsightsResponse {
  insights: Insight[]
  bestFocusTime: string
  topCategory: string
  weeklySummary: string
}

interface InsightsHistory {
  date: string
  data: AIInsightsResponse
}

const INSIGHT_ICONS: Record<Insight['type'], typeof Brain> = {
  pattern: TrendingUp,
  suggestion: Lightbulb,
  achievement: CheckCircle2,
  warning: AlertTriangle,
}

const INSIGHT_COLORS: Record<Insight['type'], string> = {
  pattern: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  suggestion: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  achievement: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30',
  warning: 'text-red-500 bg-red-100 dark:bg-red-900/30',
}

const Insights = () => {
  const { entries } = useTrackerStore()
  const { habits, logs } = useHabitStore()
  const { todayCompleted } = usePomodoroStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null)
  const [history, setHistory] = useState<InsightsHistory[]>(() => {
    try {
      const saved = localStorage.getItem('ai-insights-history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const weekDates = useMemo(() => getWeekDates(), [])

  const weekEntries = useMemo(() => {
    const start = formatDate(weekDates[0])
    const end = formatDate(weekDates[6])
    return entries.filter((e) => e.date >= start && e.date <= end)
  }, [entries, weekDates])

  const weekHabitLogs = useMemo(() => {
    const start = formatDate(weekDates[0])
    const end = formatDate(weekDates[6])
    return logs.filter((l) => l.date >= start && l.date <= end)
  }, [logs, weekDates])

  const totalWeekMinutes = useMemo(
    () => weekEntries.reduce((sum, e) => sum + e.duration, 0),
    [weekEntries]
  )

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of weekEntries) {
      map.set(entry.category, (map.get(entry.category) || 0) + entry.duration)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([category, minutes]) => `${category}: ${formatTime(minutes)}`)
      .join(', ')
  }, [weekEntries])

  const habitSummary = useMemo(() => {
    if (habits.length === 0) return 'No habits tracked'
    return habits
      .map((h) => {
        const habitLogs = weekHabitLogs.filter((l) => l.habitId === h.id && l.value > 0)
        return `${h.name}: ${habitLogs.length}/7 days`
      })
      .join(', ')
  }, [habits, weekHabitLogs])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)

    const userData = [
      `Week of ${format(weekDates[0], 'MMM d')} - ${format(weekDates[6], 'MMM d, yyyy')}`,
      `Total hours tracked: ${formatTime(totalWeekMinutes)}`,
      `Category breakdown: ${categoryBreakdown || 'None'}`,
      `Habits: ${habitSummary}`,
      `Focus sessions completed today: ${todayCompleted}`,
      `Total entries this week: ${weekEntries.length}`,
    ].join('\n')

    try {
      const response = await sendAIMessage([
        { role: 'system' as const, content: INSIGHTS_PROMPT },
        { role: 'user' as const, content: userData },
      ])

      if (response.error) {
        setError(response.error)
        return
      }

      const parsed = JSON.parse(response.content) as AIInsightsResponse
      setInsights(parsed)

      const newHistory: InsightsHistory = {
        date: new Date().toISOString(),
        data: parsed,
      }
      const updatedHistory = [newHistory, ...history].slice(0, 10)
      setHistory(updatedHistory)
      localStorage.setItem('ai-insights-history', JSON.stringify(updatedHistory))
    } catch {
      setError('Failed to parse AI response. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain className="h-6 w-6 text-purple-500" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Insights</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Data Preview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Hours Tracked</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(totalWeekMinutes)}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Habits</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{habits.length} active</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Focus Sessions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{todayCompleted} today</p>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="h-5 w-5" />
              Analyze My Week
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {insights && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Best Focus Time</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{insights.bestFocusTime}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly Summary</h2>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{insights.weeklySummary}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Insights</h2>
            {insights.insights.map((insight, i) => {
              const Icon = INSIGHT_ICONS[insight.type]
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-start gap-4"
                >
                  <div className={`p-2 rounded-lg ${INSIGHT_COLORS[insight.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      {insight.type}
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{insight.text}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {history.length > 0 && !insights && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Previous Analyses</h2>
          <div className="space-y-3">
            {history.map((entry, i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(entry.date), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mt-1">{entry.data.weeklySummary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Insights
