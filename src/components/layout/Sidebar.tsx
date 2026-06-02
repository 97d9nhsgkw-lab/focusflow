import React from 'react'
import {
  LayoutDashboard,
  Timer,
  Focus,
  CalendarDays,
  CheckSquare,
  Clock,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import type { ViewMode } from '../../types'

const NAV_ITEMS: { icon: React.ElementType; label: string; view: ViewMode }[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'dashboard' },
  { icon: Timer, label: 'Pomodoro', view: 'pomodoro' },
  { icon: Focus, label: 'Focus', view: 'focus' },
  { icon: CalendarDays, label: 'Planner', view: 'planner' },
  { icon: CheckSquare, label: 'Habits', view: 'habits' },
  { icon: Clock, label: 'Tracker', view: 'tracker' },
  { icon: BarChart3, label: 'Analytics', view: 'analytics' },
  { icon: Settings, label: 'Settings', view: 'settings' },
]

export const Sidebar = () => {
  const { currentView, setView, sidebarOpen, toggleSidebar } = useAppStore()

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-md lg:hidden"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
            FocusFlow
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Time Management
          </p>
        </div>
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setView(item.view)
                if (window.innerWidth < 1024) toggleSidebar()
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.view
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
    </>
  )
}
