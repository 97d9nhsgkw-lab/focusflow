import { Brain } from 'lucide-react'
import TaskBreaker from './TaskBreaker'
import AIDailyPlanner from './AIDailyPlanner'
import Insights from './Insights'

export default function AIHub() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Brain size={24} className="text-primary-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Smart tools powered by your own API key
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TaskBreaker />
        <AIDailyPlanner />
      </div>

      <Insights />
    </div>
  )
}
