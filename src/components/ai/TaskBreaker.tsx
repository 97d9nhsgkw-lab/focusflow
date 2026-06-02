import { useState } from 'react'
import { Brain, Loader2, Plus, Check, AlertCircle } from 'lucide-react'
import { sendAIMessage } from '../../ai/provider'
import { TASK_BREAKDOWN_PROMPT } from '../../ai/prompts'
import { useAIStore } from '../../store/aiStore'
import { useTrackerStore } from '../../store/trackerStore'
import { CATEGORIES } from '../../types'
import { useAppStore } from '../../store/appStore'

interface BreakdownTask {
  title: string
  estimatedMinutes: number
  category: string
}

const TaskBreaker = () => {
  const [goal, setGoal] = useState('')
  const [tasks, setTasks] = useState<BreakdownTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set())
  const [addedTasks, setAddedTasks] = useState<Set<number>>(new Set())

  const { hasApiKey } = useAIStore()
  const { addManualEntry } = useTrackerStore()
  const { setView } = useAppStore()

  const handleBreakDown = async () => {
    if (!goal.trim()) return

    setLoading(true)
    setError('')
    setTasks([])
    setSelectedTasks(new Set())
    setAddedTasks(new Set())

    const response = await sendAIMessage(
      [
        { role: 'system' as const, content: TASK_BREAKDOWN_PROMPT },
        { role: 'user' as const, content: goal },
      ],
      1500
    )

    setLoading(false)

    if (response.error) {
      setError(response.error)
      return
    }

    try {
      const parsed = JSON.parse(response.content)
      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        setTasks(parsed.tasks)
      } else {
        setError('Invalid response format from AI.')
      }
    } catch {
      setError('Failed to parse AI response. Please try again.')
    }
  }

  const toggleTask = (index: number) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleAddAll = () => {
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toISOString()
    const indicesToAdd = selectedTasks.size > 0 ? [...selectedTasks] : tasks.map((_, i) => i)

    indicesToAdd.forEach((i) => {
      const task = tasks[i]
      if (!task || addedTasks.has(i)) return

      addManualEntry({
        description: task.title,
        category: CATEGORIES.some((c) => c.name === task.category) ? task.category : 'Work',
        startTime: now,
        endTime: now,
        duration: task.estimatedMinutes,
        date: today,
      })
    })

    setAddedTasks(new Set([...addedTasks, ...indicesToAdd]))
    setSelectedTasks(new Set())
  }

  const getCategoryColor = (catName: string) =>
    CATEGORIES.find((c) => c.name === catName)?.color || '#6b7280'

  const getCatStyle = (catName: string) => ({
    backgroundColor: `${getCategoryColor(catName)}20`,
    color: getCategoryColor(catName),
  })

  const allAdded = tasks.length > 0 && tasks.every((_, i) => addedTasks.has(i))
  const someSelected = selectedTasks.size > 0

  if (!hasApiKey()) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Brain size={24} />
          Task Breaker
        </h2>
        <div className="bg-white dark:bg-gray-900 rounded-xl p-8 border border-gray-200 dark:border-gray-800 text-center">
          <AlertCircle size={48} className="mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No AI API Key Configured
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Add your API key in Settings to use the Task Breaker.
          </p>
          <button
            onClick={() => setView('settings')}
            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 rounded-lg text-sm font-medium text-white transition-colors"
          >
            Go to Settings
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <Brain size={24} />
        Task Breaker
      </h2>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Describe a goal or project and AI will break it into subtasks.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleBreakDown()}
            placeholder="e.g. Plan a product launch"
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50"
          />
          <button
            onClick={handleBreakDown}
            disabled={loading || !goal.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Breaking Down...
              </>
            ) : (
              <>
                <Brain size={16} />
                Break Down
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {tasks.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Suggested Tasks
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {tasks.length} tasks &middot;{' '}
                {tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0)} min total
              </p>
            </div>
            <button
              onClick={handleAddAll}
              disabled={allAdded}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
            >
              {allAdded ? (
                <>
                  <Check size={16} />
                  All Added
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {someSelected ? `Add Selected (${selectedTasks.size})` : 'Add All to Tracker'}
                </>
              )}
            </button>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.map((task, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                  addedTasks.has(index)
                    ? 'bg-green-50 dark:bg-green-900/10'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <button
                  onClick={() => toggleTask(index)}
                  disabled={addedTasks.has(index)}
                  className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    addedTasks.has(index)
                      ? 'bg-green-500 border-green-500'
                      : selectedTasks.has(index)
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  {(selectedTasks.has(index) || addedTasks.has(index)) && (
                    <Check size={12} className="text-white" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      addedTasks.has(index)
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {task.title}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                  style={getCatStyle(task.category)}
                >
                  {task.category}
                </span>
                <span className="text-xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0 w-16 text-right">
                  {task.estimatedMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskBreaker
