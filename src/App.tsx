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
import { useAppStore } from './store/appStore'

function App() {
  const { currentView } = useAppStore()

  const renderView = () => {
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
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout>
      {renderView()}
    </Layout>
  )
}

export default App
