import { useState } from 'react'
import { Layout } from './components/layout/Layout'
import Dashboard from './components/Dashboard'
import PomodoroTimer from './components/pomodoro/PomodoroTimer'
import { FocusMode } from './components/focus/FocusMode'
import DailyPlanner from './components/planner/DailyPlanner'
import HabitTracker from './components/habits/HabitTracker'
import TimeTracker from './components/tracker/TimeTracker'
import Analytics from './components/analytics/Analytics'
import { Settings } from './components/settings/Settings'
import UserGuide from './components/userguide/UserGuide'
import AIHub from './components/ai/AIHub'
import Welcome from './components/Welcome'
import { useAppStore } from './store/appStore'
import { SyncProvider } from './components/SyncProvider'

function App() {
  const { currentView } = useAppStore()
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('focusflow-welcomed')
  })

  const handleWelcomeDone = () => {
    localStorage.setItem('focusflow-welcomed', 'true')
    setShowWelcome(false)
  }

  const renderView = () => {
    if (showWelcome) {
      return <Welcome onGetStarted={handleWelcomeDone} />
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />
      case 'pomodoro':
        return <PomodoroTimer />
      case 'focus':
        return <FocusMode />
      case 'planner':
        return <DailyPlanner />
      case 'habits':
        return <HabitTracker />
      case 'tracker':
        return <TimeTracker />
      case 'analytics':
        return <Analytics />
      case 'settings':
        return <Settings />
      case 'userguide':
        return <UserGuide />
      case 'ai':
        return <AIHub />
      default:
        return <Dashboard />
    }
  }

  return (
    <SyncProvider>
      <Layout>
        {renderView()}
      </Layout>
    </SyncProvider>
  )
}

export default App
