import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Calendar, TrendingUp, BarChart3 } from 'lucide-react'
import { useTrackerStore } from '../../store/trackerStore'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useHabitStore } from '../../store/habitStore'
import { formatTime, formatDate } from '../../utils'
import { CATEGORIES } from '../../types'
import { format, subDays, startOfWeek, isWithinInterval, parseISO, startOfMonth } from 'date-fns'

type DateRange = 'today' | 'week' | 'month' | 'last30'

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  last30: 'Last 30 Days',
}

export const Analytics = () => {
  const { entries } = useTrackerStore()
  const { todayCompleted } = usePomodoroStore()
  const { logs } = useHabitStore()
  const [dateRange, setDateRange] = useState<DateRange>('week')

  const dateIntervals = useMemo(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return {
      today: { start: today, end: now },
      week: { start: startOfWeek(now, { weekStartsOn: 1 }), end: now },
      month: { start: startOfMonth(now), end: now },
      last30: { start: subDays(now, 29), end: now },
    }
  }, [])

  const filteredEntries = useMemo(() => {
    const interval = dateIntervals[dateRange]
    return entries.filter((e) => {
      const entryDate = parseISO(e.date)
      return isWithinInterval(entryDate, { start: interval.start, end: interval.end })
    })
  }, [entries, dateRange, dateIntervals])

  const totalMinutes = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.duration, 0),
    [filteredEntries]
  )

  const dailyData = useMemo(() => {
    const map = new Map<string, number>()
    const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 30
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i)
      map.set(format(date, 'yyyy-MM-dd'), 0)
    }
    for (const entry of entries) {
      if (map.has(entry.date)) {
        map.set(entry.date, (map.get(entry.date) || 0) + entry.duration)
      }
    }
    return Array.from(map.entries()).map(([date, minutes]) => ({
      date: format(parseISO(date), 'MMM d'),
      hours: parseFloat((minutes / 60).toFixed(1)),
      minutes,
    }))
  }, [entries, dateRange])

  const categoryData = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of filteredEntries) {
      map.set(entry.category, (map.get(entry.category) || 0) + entry.duration)
    }
    return CATEGORIES.map((cat) => ({
      name: cat.name,
      value: map.get(cat.name) || 0,
      color: cat.color,
    })).filter((d) => d.value > 0)
  }, [filteredEntries])

  const avgDailyMinutes = useMemo(() => {
    const days = dateRange === 'today' ? 1 : dateRange === 'week' ? 7 : dateRange === 'month' ? 30 : 30
    return Math.round(totalMinutes / days)
  }, [totalMinutes, dateRange])

  const mostProductiveDay = useMemo(() => {
    if (dailyData.length === 0) return 'N/A'
    let max = dailyData[0]
    for (const d of dailyData) {
      if (d.minutes > max.minutes) max = d
    }
    return max.date
  }, [dailyData])

  const topCategory = useMemo(() => {
    if (categoryData.length === 0) return 'N/A'
    return categoryData.reduce((a, b) => (a.value > b.value ? a : b)).name
  }, [categoryData])

  const thisWeekEntries = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    return entries.filter((e) => parseISO(e.date) >= start)
  }, [entries])

  const lastWeekEntries = useMemo(() => {
    const end = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 1)
    const start = startOfWeek(end, { weekStartsOn: 1 })
    return entries.filter((e) => {
      const d = parseISO(e.date)
      return d >= start && d <= end
    })
  }, [entries])

  const thisWeekTotal = thisWeekEntries.reduce((s, e) => s + e.duration, 0)
  const lastWeekTotal = lastWeekEntries.reduce((s, e) => s + e.duration, 0)
  const weekDiff = lastWeekTotal > 0 ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100) : 0

  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 89; i >= 0; i--) {
      const date = subDays(new Date(), i)
      map.set(format(date, 'yyyy-MM-dd'), 0)
    }
    for (const entry of entries) {
      if (map.has(entry.date)) {
        map.set(entry.date, (map.get(entry.date) || 0) + entry.duration)
      }
    }
    return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }))
  }, [entries])

  const maxHeat = Math.max(...heatmapData.map((d) => d.minutes), 1)

  const getHeatColor = (minutes: number) => {
    const ratio = minutes / maxHeat
    if (ratio === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (ratio < 0.25) return 'bg-green-200 dark:bg-green-900'
    if (ratio < 0.5) return 'bg-green-300 dark:bg-green-700'
    if (ratio < 0.75) return 'bg-green-500 dark:bg-green-500'
    return 'bg-green-700 dark:bg-green-300'
  }

  const categoryBreakdown = useMemo(() => {
    if (totalMinutes === 0) return []
    return categoryData.map((c) => ({
      ...c,
      hours: formatTime(c.value),
      percentage: Math.round((c.value / totalMinutes) * 100),
    }))
  }, [categoryData, totalMinutes])

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      dateRange: RANGE_LABELS[dateRange],
      summary: {
        totalFocusTime: totalMinutes,
        averageDaily: avgDailyMinutes,
        topCategory,
        pomodorosToday: todayCompleted,
      },
      entries: filteredEntries,
      habitsLogged: logs.length,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${formatDate(new Date())}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const renderHeatmap = () => {
    const weeks: { date: string; minutes: number }[][] = []
    let currentWeek: { date: string; minutes: number }[] = []
    const firstDate = parseISO(heatmapData[0]?.date || formatDate(new Date()))
    const startDay = firstDate.getDay()
    for (let i = 0; i < startDay; i++) {
      currentWeek.push({ date: '', minutes: 0 })
    }
    for (const day of heatmapData) {
      currentWeek.push(day)
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', minutes: 0 })
      }
      weeks.push(currentWeek)
    }
    return weeks
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.keys(RANGE_LABELS) as DateRange[]).map((key) => (
          <button
            key={key}
            onClick={() => setDateRange(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              dateRange === key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            {RANGE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Focus Time</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatTime(totalMinutes)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Daily</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatTime(avgDailyMinutes)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Most Productive</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{mostProductiveDay}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Top Category</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{topCategory}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Daily Focus</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value}h`, 'Focus Time']} />
                <Bar dataKey="hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatTime(Number(value)), 'Time']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {categoryData.map((c) => (
              <div key={c.name} className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                {c.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Productivity Heatmap <span className="text-sm font-normal text-gray-500">(Last 90 Days)</span>
        </h2>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {renderHeatmap().map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day, di) => (
                  <div
                    key={di}
                    title={day.date ? `${day.date}: ${formatTime(day.minutes)}` : ''}
                    className={`w-3 h-3 rounded-sm ${day.date ? getHeatColor(day.minutes) : 'bg-transparent'}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
            <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
            <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-300" />
            <span>More</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400">Category</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400">Hours</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {categoryBreakdown.map((c) => (
                  <tr key={c.name} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </td>
                    <td className="text-right py-2 text-gray-700 dark:text-gray-300">{c.hours}</td>
                    <td className="text-right py-2 text-gray-700 dark:text-gray-300">{c.percentage}%</td>
                  </tr>
                ))}
                {categoryBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-4 text-gray-400">No data for this period</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <TrendingUp className="h-5 w-5 inline mr-1" />
            Weekly Trends
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">This Week</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(thisWeekTotal)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Last Week</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatTime(lastWeekTotal)}</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-sm font-medium ${
                  weekDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}
              >
                {weekDiff >= 0 ? `+${weekDiff}%` : `${weekDiff}%`}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">vs last week</span>
            </div>
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pomodoros Today</span>
                <span className="font-medium text-gray-900 dark:text-white">{todayCompleted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total Entries</span>
                <span className="font-medium text-gray-900 dark:text-white">{filteredEntries.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
