import { useState, useEffect } from 'react'
import { Play, Square, Plus, Trash2, Clock, Calendar } from 'lucide-react'
import { useTrackerStore } from '../../store/trackerStore'
import { CATEGORIES } from '../../types'
import {
  formatTime,
  formatTimerDisplay,
  getTodayKey,
  getWeekDates,
  formatDate,
  getRelativeDay,
} from '../../utils'

const TimeTracker = () => {
  const {
    activeEntry,
    startTimer,
    stopTimer,
    addManualEntry,
    deleteEntry,
    getEntriesForDate,
    getTotalForDate,
  } = useTrackerStore()

  const today = getTodayKey()
  const todayEntries = getEntriesForDate(today)
  const dailyTotal = getTotalForDate(today)

  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>(CATEGORIES[0].name)
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualStart, setManualStart] = useState('')
  const [manualEnd, setManualEnd] = useState('')
  const [manualDescription, setManualDescription] = useState('')
  const [manualCategory, setManualCategory] = useState<string>(CATEGORIES[0].name)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!activeEntry) return
    const interval = setInterval(() => {
      const start = new Date(activeEntry.startTime).getTime()
      const now = Date.now()
      setElapsedSeconds(Math.floor((now - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeEntry])

  const handleStart = () => {
    if (!description.trim()) return
    startTimer(description.trim(), category)
    setDescription('')
  }

  const handleStop = () => {
    stopTimer()
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualStart || !manualEnd || !manualDescription.trim()) return

    const startDate = new Date(manualStart)
    const endDate = new Date(manualEnd)
    const durationMs = endDate.getTime() - startDate.getTime()
    if (durationMs <= 0) return

    const duration = Math.round(durationMs / 60000)
    addManualEntry({
      description: manualDescription.trim(),
      category: manualCategory,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      duration,
      date: formatDate(startDate),
    })

    setManualStart('')
    setManualEnd('')
    setManualDescription('')
    setManualCategory(CATEGORIES[0].name)
    setShowManualForm(false)
  }

  const weekDates = getWeekDates()
  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const weekTotals = weekDates.map((d) => getTotalForDate(formatDate(d)))
  const maxWeekTotal = Math.max(...weekTotals, 1)

  const categoryTotals: Record<string, number> = {}
  todayEntries.forEach((entry) => {
    categoryTotals[entry.category] = (categoryTotals[entry.category] || 0) + entry.duration
  })
  const totalCategoryMinutes = Object.values(categoryTotals).reduce((a, b) => a + b, 0)

  const getCategoryColor = (catName: string) =>
    CATEGORIES.find((c) => c.name === catName)?.color || '#6b7280'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={24} />
          Time Tracker
        </h2>
        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Calendar size={14} />
          {getRelativeDay(today)}
        </div>
      </div>

      {activeEntry ? (
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl p-6 text-white shadow-lg">
          <div className="text-sm font-medium opacity-80 mb-1">Running</div>
          <div className="text-5xl font-mono font-bold mb-2 tracking-wider animate-pulse">
            {formatTimerDisplay(activeEntry ? elapsedSeconds : 0)}
          </div>
          <div className="text-sm opacity-75 mb-4">{activeEntry.description}</div>
          <div className="flex items-center justify-between">
            <span
              className="px-3 py-1 rounded-full text-xs font-medium bg-white/20"
            >
              {activeEntry.category}
            </span>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              <Square size={16} />
              Stop
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStart()}
              placeholder="What are you working on?"
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleStart}
              disabled={!description.trim()}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              <Play size={16} />
              Start
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Plus size={16} />
          Manual Entry
        </button>
      </div>

      {showManualForm && (
        <form
          onSubmit={handleManualSubmit}
          className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={manualStart}
                onChange={(e) => setManualStart(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                End Time
              </label>
              <input
                type="datetime-local"
                value={manualEnd}
                onChange={(e) => setManualEnd(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={manualDescription}
              onChange={(e) => setManualDescription(e.target.value)}
              placeholder="Description"
              required
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Today's Entries
        </h3>
        {todayEntries.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
            No entries yet. Start a timer or add a manual entry.
          </p>
        ) : (
          <div className="space-y-2">
            {todayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCategoryColor(entry.category) }}
                  />
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {entry.description}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                    style={{
                      backgroundColor: `${getCategoryColor(entry.category)}20`,
                      color: getCategoryColor(entry.category),
                    }}
                  >
                    {entry.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                    {formatTime(entry.duration)}
                  </span>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {todayEntries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatTime(dailyTotal)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Week Summary
          </h3>
          <div className="flex items-end justify-between gap-2 h-32">
            {weekTotals.map((total, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {total > 0 ? formatTime(total) : ''}
                </span>
                <div className="w-full flex justify-center">
                  <div
                    className="w-full max-w-[40px] rounded-t bg-primary-500 transition-all duration-300"
                    style={{
                      height: `${Math.max((total / maxWeekTotal) * 80, total > 0 ? 4 : 1)}px`,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {weekDayLabels[i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Category Breakdown
          </h3>
          {totalCategoryMinutes === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
              No time tracked today.
            </p>
          ) : (
            <>
              <div className="w-full h-4 rounded-full overflow-hidden flex mb-4">
                {Object.entries(categoryTotals).map(([cat, mins]) => (
                  <div
                    key={cat}
                    style={{
                      width: `${(mins / totalCategoryMinutes) * 100}%`,
                      backgroundColor: getCategoryColor(cat),
                    }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                {Object.entries(categoryTotals)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, mins]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: getCategoryColor(cat) }}
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {cat}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                        {formatTime(mins)}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimeTracker
