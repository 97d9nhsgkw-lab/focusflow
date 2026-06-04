import {
  Timer,
  Focus,
  CalendarDays,
  CheckSquare,
  Clock,
  Brain,
  Sparkles,
  Share2,
  Smartphone,
  LogIn,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'

interface WelcomeProps {
  isSignedIn: boolean
  userName: string | null
}

const FEATURES = [
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Stay focused with customizable work sessions',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Focus,
    title: 'Focus Mode',
    description: 'Immersive deep work with ambient sounds',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: CalendarDays,
    title: 'Daily Planner',
    description: 'Plan your day with time blocking',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: CheckSquare,
    title: 'Habit Tracker',
    description: 'Build consistency with streak tracking',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Clock,
    title: 'Time Tracker',
    description: 'Track how you spend your time',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Brain,
    title: 'AI Assistant',
    description: 'Smart scheduling with your own API key',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
]

export default function Welcome({ isSignedIn, userName }: WelcomeProps) {
  const { setView } = useAppStore()
  const firstName = userName?.split(' ')[0] || null

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/25">
          <Sparkles size={40} className="text-white" />
        </div>

        {isSignedIn ? (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600">
                {firstName || 'there'}
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Ready to stay productive today?
            </p>
          </>
        ) : (
          <>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-violet-600">
                FocusFlow
              </span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
              Your personal productivity companion. Manage time, build habits, and stay focused.
            </p>
            <button
              onClick={() => setView('settings')}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all hover:scale-105"
            >
              <LogIn size={20} />
              Get Started
            </button>
          </>
        )}
      </div>

      {/* Features Grid */}
      <div className="px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-6">
            {isSignedIn ? 'Your tools' : 'Everything you need'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((feature) => (
              <button
                key={feature.title}
                onClick={() => {
                  const viewMap: Record<string, string> = {
                    'Pomodoro Timer': 'pomodoro',
                    'Focus Mode': 'focus',
                    'Daily Planner': 'planner',
                    'Habit Tracker': 'habits',
                    'Time Tracker': 'tracker',
                    'AI Assistant': 'ai',
                  }
                  setView(viewMap[feature.title] as 'pomodoro' | 'focus' | 'planner' | 'habits' | 'tracker' | 'ai')
                }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all hover:scale-105 text-left"
              >
                <div className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center mb-3`}>
                  <feature.icon size={20} className={feature.color} />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {feature.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {feature.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Info */}
      <div className="px-4 pb-8">
        <div className="max-w-md mx-auto flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <Smartphone size={16} />
            <span>Works on all devices</span>
          </div>
          <div className="flex items-center gap-2">
            <Share2 size={16} />
            <span>Sync across devices</span>
          </div>
        </div>
      </div>
    </div>
  )
}
