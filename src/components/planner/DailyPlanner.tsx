import { useState, useEffect, useCallback } from 'react'
import { Plus, Check, Clock, ArrowLeft, ArrowRight, GripVertical } from 'lucide-react'
import type { TimeBlock } from '../../types'
import { CATEGORIES } from '../../types'
import { generateId, formatDate, getTodayKey, getRelativeDay } from '../../utils'
import { usePlannerStore } from '../../store/plannerStore'

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6)

const YESTERDAY_ROLLOVER_KEY = 'daily-planner-rollover'

export default function DailyPlanner() {
  const [currentDate, setCurrentDate] = useState(getTodayKey())
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskCategory, setNewTaskCategory] = useState<string>(CATEGORIES[0].name)
  const [newTaskHour, setNewTaskHour] = useState(9)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [rolloverTasks, setRolloverTasks] = useState<TimeBlock[]>([])

  const plans = usePlannerStore((s) => s.plans)
  const updatePlan = usePlannerStore((s) => s.updatePlan)

  useEffect(() => {
    const yesterday = formatDate(new Date(Date.now() - 86400000))
    const saved = localStorage.getItem(YESTERDAY_ROLLOVER_KEY)
    if (saved) {
      const data = JSON.parse(saved) as { date: string; tasks: TimeBlock[] }
      if (data.date === yesterday) {
        setRolloverTasks(data.tasks)
      }
    }
  }, [])

  useEffect(() => {
    const todayPlan = plans[currentDate]
    if (!todayPlan) return
    const yesterday = formatDate(new Date(Date.now() - 86400000))
    const saved = localStorage.getItem(YESTERDAY_ROLLOVER_KEY)
    const data = saved ? JSON.parse(saved) : null
    if (data?.date === yesterday && rolloverTasks.length > 0) {
      const stillUncompleted = rolloverTasks.filter(
        (t) => !todayPlan.blocks.find((b) => b.id === t.id)?.completed
      )
      if (stillUncompleted.length === 0) {
        setRolloverTasks([])
        localStorage.removeItem(YESTERDAY_ROLLOVER_KEY)
      }
    }
  }, [plans, currentDate, rolloverTasks])

  const getCurrentPlan = useCallback(() => {
    return plans[currentDate] || { date: currentDate, blocks: [] }
  }, [plans, currentDate])

  const updateCurrentPlan = (updater: (plan: { date: string; blocks: TimeBlock[] }) => { date: string; blocks: TimeBlock[] }) => {
    const plan = plans[currentDate] || { date: currentDate, blocks: [] }
    updatePlan(currentDate, updater(plan))
  }

  const addTask = () => {
    if (!newTaskTitle.trim()) return
    const newBlock: TimeBlock = {
      id: generateId(),
      title: newTaskTitle.trim(),
      startHour: newTaskHour,
      endHour: newTaskHour + 1,
      category: newTaskCategory,
      completed: false,
    }
    updateCurrentPlan((plan) => ({ ...plan, blocks: [...plan.blocks, newBlock] }))
    setNewTaskTitle('')
  }

  const toggleComplete = (blockId: string) => {
    updateCurrentPlan((plan) => ({
      ...plan,
      blocks: plan.blocks.map((b) =>
        b.id === blockId ? { ...b, completed: !b.completed } : b
      ),
    }))
  }

  const deleteBlock = (blockId: string) => {
    updateCurrentPlan((plan) => ({
      ...plan,
      blocks: plan.blocks.filter((b) => b.id !== blockId),
    }))
  }

  const handleDragStart = (blockId: string) => {
    setDraggedBlockId(blockId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetHour: number) => {
    if (!draggedBlockId) return
    updateCurrentPlan((plan) => ({
      ...plan,
      blocks: plan.blocks.map((b) =>
        b.id === draggedBlockId
          ? { ...b, startHour: targetHour, endHour: targetHour + (b.endHour - b.startHour) }
          : b
      ),
    }))
    setDraggedBlockId(null)
  }

  const getBlocksForHour = (hour: number): TimeBlock[] => {
    return getCurrentPlan().blocks.filter((b) => b.startHour === hour)
  }

  const moveToEisenhower = (blockId: string, quadrant: string) => {
    updateCurrentPlan((plan) => ({
      ...plan,
      blocks: plan.blocks.map((b) => {
        if (b.id !== blockId) return b
        const titles: Record<string, string> = {
          'urgent-important': '🔴 DO FIRST',
          'not-urgent-important': '📅 SCHEDULE',
          'urgent-not-important': '👥 DELEGATE',
          'not-urgent-not-important': '🗑️ ELIMINATE',
        }
        return { ...b, title: `${titles[quadrant]}: ${b.title.replace(/^(🔴|📅|👥|🗑️)\s*(DO FIRST|SCHEDULE|DELEGATE|ELIMINATE):\s*/, '')}` }
      }),
    }))
  }

  const navigateDay = (direction: number) => {
    const date = new Date(currentDate)
    date.setDate(date.getDate() + direction)
    setCurrentDate(formatDate(date))
  }

  const goToToday = () => {
    setCurrentDate(getTodayKey())
  }

  const plan = getCurrentPlan()
  const isToday = currentDate === getTodayKey()

  return (
    <div className="flex gap-6 h-full">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="text-center min-w-[200px]">
              <h2 className="text-xl font-bold">{getRelativeDay(currentDate)}</h2>
              <p className="text-sm text-gray-400">{currentDate}</p>
            </div>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowRight size={18} />
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="ml-2 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Add a task..."
              className="flex-1 bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newTaskCategory}
              onChange={(e) => setNewTaskCategory(e.target.value)}
              className="bg-gray-700 rounded-lg px-3 py-2 focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={newTaskHour}
              onChange={(e) => setNewTaskHour(Number(e.target.value))}
              className="bg-gray-700 rounded-lg px-3 py-2 focus:outline-none"
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <button
              onClick={addTask}
              className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {rolloverTasks.length > 0 && (
          <div className="bg-amber-900/30 border border-amber-700 rounded-xl p-4 mb-4">
            <h3 className="text-amber-400 font-medium mb-2 flex items-center gap-2">
              <Clock size={16} />
              Rolled over from yesterday
            </h3>
            <div className="space-y-2">
              {rolloverTasks.filter((t) => !plan.blocks.find((b) => b.id === t.id)).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 bg-gray-800 rounded-lg p-2"
                >
                  <GripVertical size={14} className="text-gray-500 cursor-grab" />
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="w-5 h-5 rounded border-2 border-gray-500 flex items-center justify-center hover:border-green-500 transition-colors"
                  >
                    {task.completed && <Check size={12} className="text-green-500" />}
                  </button>
                  <span className="flex-1 text-sm">{task.title}</span>
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: CATEGORIES.find((c) => c.name === task.category)?.color + '20',
                      color: CATEGORIES.find((c) => c.name === task.category)?.color,
                    }}
                  >
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto bg-gray-800 rounded-xl">
          {HOURS.map((hour) => {
            const blocks = getBlocksForHour(hour)
            return (
              <div
                key={hour}
                className="flex border-b border-gray-700 last:border-b-0"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(hour)}
              >
                <div className="w-20 text-right pr-4 py-3 text-sm text-gray-400 font-mono border-r border-gray-700">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 min-h-[60px] p-2 flex flex-wrap gap-2 items-start">
                  {blocks.map((block) => {
                    const category = CATEGORIES.find((c) => c.name === block.category)
                    return (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => handleDragStart(block.id)}
                        className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing group transition-all hover:bg-gray-600"
                        style={{
                          borderLeft: `3px solid ${category?.color || '#6b7280'}`,
                        }}
                      >
                        <GripVertical size={14} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => toggleComplete(block.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            block.completed
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-500 hover:border-green-500'
                          }`}
                        >
                          {block.completed && <Check size={12} className="text-white" />}
                        </button>
                        <span className={`text-sm ${block.completed ? 'line-through text-gray-500' : ''}`}>
                          {block.title}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded ml-2"
                          style={{
                            backgroundColor: category?.color + '20',
                            color: category?.color,
                          }}
                        >
                          {block.category}
                        </span>
                        <button
                          onClick={() => deleteBlock(block.id)}
                          className="ml-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="w-80 flex flex-col">
        <h3 className="text-lg font-bold mb-4">Eisenhower Matrix</h3>
        <div className="grid grid-cols-2 gap-2 flex-1">
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-3">
            <h4 className="text-xs font-medium text-red-400 mb-2">Urgent & Important</h4>
            <p className="text-[10px] text-gray-400 mb-3">DO FIRST</p>
            <div className="space-y-2">
              {plan.blocks
                .filter((b) => b.title.startsWith('🔴'))
                .map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    className="bg-gray-800 rounded p-2 text-xs cursor-grab"
                  >
                    {block.title.replace('🔴 DO FIRST: ', '')}
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-3">
            <h4 className="text-xs font-medium text-blue-400 mb-2">Not Urgent & Important</h4>
            <p className="text-[10px] text-gray-400 mb-3">SCHEDULE</p>
            <div className="space-y-2">
              {plan.blocks
                .filter((b) => b.title.startsWith('📅'))
                .map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    className="bg-gray-800 rounded p-2 text-xs cursor-grab"
                  >
                    {block.title.replace('📅 SCHEDULE: ', '')}
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-yellow-900/30 border border-yellow-700 rounded-xl p-3">
            <h4 className="text-xs font-medium text-yellow-400 mb-2">Urgent & Not Important</h4>
            <p className="text-[10px] text-gray-400 mb-3">DELEGATE</p>
            <div className="space-y-2">
              {plan.blocks
                .filter((b) => b.title.startsWith('👥'))
                .map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    className="bg-gray-800 rounded p-2 text-xs cursor-grab"
                  >
                    {block.title.replace('👥 DELEGATE: ', '')}
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-gray-800/50 border border-gray-600 rounded-xl p-3">
            <h4 className="text-xs font-medium text-gray-400 mb-2">Not Urgent & Not Important</h4>
            <p className="text-[10px] text-gray-500 mb-3">ELIMINATE</p>
            <div className="space-y-2">
              {plan.blocks
                .filter((b) => b.title.startsWith('🗑️'))
                .map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(block.id)}
                    className="bg-gray-800 rounded p-2 text-xs cursor-grab"
                  >
                    {block.title.replace('🗑️ ELIMINATE: ', '')}
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-4 bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium mb-3">Quick Prioritize</h4>
          <p className="text-xs text-gray-400 mb-2">Select a task, then a quadrant:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const incomplete = plan.blocks.find((b) => !b.completed && !b.title.startsWith('🔴') && !b.title.startsWith('📅') && !b.title.startsWith('👥') && !b.title.startsWith('🗑️'))
                if (incomplete) moveToEisenhower(incomplete.id, 'urgent-important')
              }}
              className="text-xs bg-red-900/50 hover:bg-red-900/70 rounded p-2 transition-colors"
            >
              🔴 Do First
            </button>
            <button
              onClick={() => {
                const incomplete = plan.blocks.find((b) => !b.completed && !b.title.startsWith('🔴') && !b.title.startsWith('📅') && !b.title.startsWith('👥') && !b.title.startsWith('🗑️'))
                if (incomplete) moveToEisenhower(incomplete.id, 'not-urgent-important')
              }}
              className="text-xs bg-blue-900/50 hover:bg-blue-900/70 rounded p-2 transition-colors"
            >
              📅 Schedule
            </button>
            <button
              onClick={() => {
                const incomplete = plan.blocks.find((b) => !b.completed && !b.title.startsWith('🔴') && !b.title.startsWith('📅') && !b.title.startsWith('👥') && !b.title.startsWith('🗑️'))
                if (incomplete) moveToEisenhower(incomplete.id, 'urgent-not-important')
              }}
              className="text-xs bg-yellow-900/50 hover:bg-yellow-900/70 rounded p-2 transition-colors"
            >
              👥 Delegate
            </button>
            <button
              onClick={() => {
                const incomplete = plan.blocks.find((b) => !b.completed && !b.title.startsWith('🔴') && !b.title.startsWith('📅') && !b.title.startsWith('👥') && !b.title.startsWith('🗑️'))
                if (incomplete) moveToEisenhower(incomplete.id, 'not-urgent-not-important')
              }}
              className="text-xs bg-gray-700/50 hover:bg-gray-700/70 rounded p-2 transition-colors"
            >
              🗑️ Eliminate
            </button>
          </div>
        </div>

        <div className="mt-4 bg-gray-800 rounded-xl p-4">
          <h4 className="text-sm font-medium mb-3">Categories</h4>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => {
              const count = plan.blocks.filter((b) => b.category === cat.name).length
              const completed = plan.blocks.filter((b) => b.category === cat.name && b.completed).length
              return (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm flex-1">{cat.name}</span>
                  <span className="text-xs text-gray-400">
                    {completed}/{count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
