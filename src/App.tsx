import { Layout } from './components/layout/Layout'
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
import { useSyncStore } from './store/syncStore'
import { SyncProvider } from './components/SyncProvider'

function App() {
  const { currentView } = useAppStore()
  const { user } = useSyncStore()

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Welcome isSignedIn={!!user} userName={user?.displayName || user?.email?.split('@')[0] || null} />
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
        return <Welcome isSignedIn={!!user} userName={user?.displayName || user?.email?.split('@')[0] || null} />
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
