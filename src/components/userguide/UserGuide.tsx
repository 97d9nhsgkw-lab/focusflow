import { useState } from 'react'
import {
  BookOpen,
  Timer,
  Focus,
  CalendarDays,
  CheckSquare,
  Clock,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  Keyboard,
  Lightbulb,
  Zap,
} from 'lucide-react'

interface GuideSection {
  id: string
  icon: React.ElementType
  title: string
  content: GuideItem[]
}

interface GuideItem {
  title: string
  description: string
  tips?: string[]
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    icon: Zap,
    title: 'Getting Started',
    content: [
      {
        title: 'Welcome to FocusFlow',
        description:
          'FocusFlow is a personal productivity app that helps you manage your time, build habits, and stay focused. Create an account with email/password or sign in with Google to sync your data across all devices.',
      },
      {
        title: 'Quick Start',
        description:
          'Open the sidebar (click the menu icon on mobile) and navigate between features. Create an account or sign in with Google in Settings to sync across devices.',
        tips: [
          'Start with the Dashboard to see your daily overview',
          'Use the Pomodoro Timer for structured work sessions',
          'Track habits to build consistency over time',
        ],
      },
    ],
  },
  {
    id: 'pomodoro',
    icon: Timer,
    title: 'Pomodoro Timer',
    content: [
      {
        title: 'What is the Pomodoro Technique?',
        description:
          'A time management method where you work in focused intervals (typically 25 minutes) followed by short breaks. After 4 sessions, take a longer break.',
      },
      {
        title: 'How to Use',
        description:
          'Select a preset or customize your durations, then click Start. The timer counts down and automatically switches between work and break phases.',
        tips: [
          'Classic (25/5) — Standard pomodoro for most tasks',
          'Sprint (15/3) — Quick sessions for light tasks',
          'Deep Work (45/10) — Extended focus for complex work',
          '52/17 — Research-backed optimal work/rest rhythm',
        ],
      },
      {
        title: 'Keyboard Shortcuts',
        description:
          'Press Space to start/pause the timer, and R to reset it. These work anywhere on the Pomodoro page.',
      },
      {
        title: 'Daily Goal',
        description:
          'Set a daily target of pomodoros to complete. Track your progress on the Dashboard and in the progress bar below the timer.',
      },
    ],
  },
  {
    id: 'focus',
    icon: Focus,
    title: 'Focus Mode',
    content: [
      {
        title: 'Distraction-Free Sessions',
        description:
          'Focus Mode provides a full-screen, immersive environment for deep work. Declare your ONE focus before starting.',
      },
      {
        title: 'Ambient Sounds',
        description:
          'Choose from built-in sounds to block distractions: Rain, Cafe, Lo-fi, White Noise, or Brown Noise. Adjust volume with the slider.',
        tips: [
          'Rain and Brown Noise are great for concentration',
          'Lo-fi works well for creative tasks',
          'Cafe sounds simulate a productive coffee shop vibe',
        ],
      },
      {
        title: 'Session History & Heatmap',
        description:
          'Your focus sessions are tracked in a GitHub-style heatmap. Darker cells mean more focus time that day. Build consistency by keeping the heatmap active.',
      },
      {
        title: 'Post-Session Reflection',
        description:
          'After completing a session, rate it 1-5 stars. This helps you track which sessions were most productive.',
      },
    ],
  },
  {
    id: 'planner',
    icon: CalendarDays,
    title: 'Daily Planner',
    content: [
      {
        title: 'Time Blocking',
        description:
          'Plan your day by assigning tasks to specific hours. The timeline shows 6am to 11pm with hourly slots.',
      },
      {
        title: 'Adding Tasks',
        description:
          'Type a task name, select a category and time slot, then click the + button. Tasks appear on the timeline at their scheduled hour.',
      },
      {
        title: 'Drag & Drop',
        description:
          'Grab a task by its handle (⋮⋮) and drag it to a different time slot to reschedule.',
      },
      {
        title: 'Eisenhower Matrix',
        description:
          'Prioritize tasks using the 4-quadrant matrix on the right: Do First (urgent+important), Schedule, Delegate, or Eliminate.',
        tips: [
          'Click a priority button to categorize your next unmarked task',
          'Tasks in the matrix show up in their respective quadrants',
          'Use this to identify what truly matters vs. what can wait',
        ],
      },
      {
        title: 'Auto-Rollover',
        description:
          'Unfinished tasks from yesterday automatically appear at the top of today\'s planner so nothing falls through the cracks.',
      },
    ],
  },
  {
    id: 'habits',
    icon: CheckSquare,
    title: 'Habit Tracker',
    content: [
      {
        title: 'Creating Habits',
        description:
          'Click "New Habit" and choose a name, type, schedule, and color. Three types are available:',
        tips: [
          'Boolean — Simple done/not done check (e.g., "Meditated")',
          'Count — Track a number (e.g., "Glasses of water")',
          'Duration — Track minutes (e.g., "Reading time")',
        ],
      },
      {
        title: 'Checking In',
        description:
          'Tap the check button to mark a boolean habit complete. For count/duration habits, use the +/- buttons or type a value.',
      },
      {
        title: 'Streaks & Consistency',
        description:
          'Each habit shows your current streak (consecutive days), total completions, and 30-day consistency percentage. The mini heatmap shows the last 7 days at a glance.',
      },
      {
        title: '30-Day Heatmap',
        description:
          'Expand the "30-Day Overview" to see a GitHub-style contribution grid for each habit. This visualizes your consistency over time.',
      },
    ],
  },
  {
    id: 'tracker',
    icon: Clock,
    title: 'Time Tracker',
    content: [
      {
        title: 'Live Timer',
        description:
          'Type what you\'re working on, select a category, and click Start. The timer runs in real-time with a pulsing display.',
      },
      {
        title: 'Manual Entry',
        description:
          'Click "Manual Entry" to log time retroactively. Enter start time, end time, description, and category.',
      },
      {
        title: 'Categories',
        description:
          'Organize entries by category: Work, Learning, Exercise, Personal, or Break. Each has a distinct color for easy identification.',
      },
      {
        title: 'Week Summary',
        description:
          'See a bar chart of your tracked time across the current week (Mon–Sun). The category breakdown shows how your time is distributed.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    content: [
      {
        title: 'Date Ranges',
        description:
          'Filter data by Today, This Week, This Month, or Last 30 Days. The summary cards update based on your selection.',
      },
      {
        title: 'Charts & Insights',
        description:
          'View daily focus bar charts, category pie charts, a 90-day productivity heatmap, and weekly trend comparisons.',
      },
      {
        title: 'Export Data',
        description:
          'Click "Export JSON" to download your analytics data as a file. Use this for backups or external analysis.',
      },
    ],
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Settings',
    content: [
      {
        title: 'Pomodoro Settings',
        description:
          'Customize work duration, break durations, sessions before long break, and daily goals using the sliders.',
      },
      {
        title: 'AI Settings (Optional)',
        description:
          'Add your own OpenAI or Anthropic API key to unlock AI features like smart task breakdown and natural language scheduling.',
        tips: [
          'Your API key stays in your browser — it\'s never sent to our servers',
          'The app works fully without an API key',
          'Supported models: GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, Claude 3 Haiku',
        ],
      },
      {
        title: 'Data Management',
        description:
          'Export all your data as JSON for backup, import from a previous export, or clear everything to start fresh.',
      },
      {
        title: 'Dark Mode',
        description:
          'Toggle between light and dark themes. The app also respects your system preference by default.',
      },
    ],
  },
  {
    id: 'cloud-sync',
    icon: Zap,
    title: 'Cloud Sync',
    content: [
      {
        title: 'Sync Across Devices',
        description:
          'Sign in with email/password or Google in Settings to automatically sync your data across all your devices in real time.',
        tips: [
          'Click "Sign In / Sign Up" in the Cloud Sync section of Settings',
          'Create an account with your email, password, and display name',
          'Or use "Sign in with Google" for quick access',
          'Sign in with the same account on any device to access your data',
          'Changes sync automatically — no manual refresh needed',
          'Your data is stored securely in Firebase Firestore',
        ],
      },
      {
        title: 'Email Verification',
        description:
          'When you sign up with email/password, a verification email is sent automatically. Verify your email to keep your account secure, but you can start using the app right away.',
      },
      {
        title: 'How It Works',
        description:
          'When signed in, all your pomodoro settings, time entries, habits, AI config, and planner data are backed up to the cloud. Sign in on another device and your data appears instantly.',
      },
      {
        title: 'Signing Out',
        description:
          'Click "Sign Out" in Settings to stop syncing. Your local data remains intact but will no longer sync across devices.',
      },
    ],
  },
  {
    id: 'shortcuts',
    icon: Keyboard,
    title: 'Keyboard Shortcuts',
    content: [
      {
        title: 'Global',
        description:
          'Navigate the sidebar with the mouse or touch. All views are accessible from the left sidebar.',
      },
      {
        title: 'Pomodoro Timer',
        description: 'Space — Start or pause the timer. R — Reset the current timer.',
      },
      {
        title: 'Quick Tips',
        description:
          'Most forms support Enter to submit. Use Tab to move between inputs. Press Escape to close modals.',
      },
    ],
  },
  {
    id: 'tips',
    icon: Lightbulb,
    title: 'Productivity Tips',
    content: [
      {
        title: 'Start Small',
        description:
          'Begin with just 1-2 habits and a daily goal of 4 pomodoros. Build consistency before adding more.',
      },
      {
        title: 'Protect Your Focus',
        description:
          'Use Focus Mode with ambient sounds for deep work. Declare your ONE thing before starting to stay on track.',
      },
      {
        title: 'Review Weekly',
        description:
          'Check Analytics every Sunday to see patterns. Identify when you\'re most productive and schedule deep work then.',
      },
      {
        title: 'Don\'t Break the Chain',
        description:
          'Your heatmap and streaks are powerful motivators. Even 1 minute of a habit counts — the goal is consistency, not perfection.',
      },
    ],
  },
]

function AccordionItem({
  section,
  isOpen,
  onToggle,
}: {
  section: GuideSection
  isOpen: boolean
  onToggle: () => void
}) {
  const Icon = section.icon
  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <Icon size={20} className="text-primary-500 shrink-0" />
        <span className="flex-1 font-semibold text-gray-900 dark:text-white">
          {section.title}
        </span>
        {isOpen ? (
          <ChevronDown size={18} className="text-gray-400" />
        ) : (
          <ChevronRight size={18} className="text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {section.content.map((item, i) => (
            <div key={i} className="pt-3 border-t border-gray-200 dark:border-gray-800 first:border-0 first:pt-0">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {item.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
              {item.tips && item.tips.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {item.tips.map((tip, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400"
                    >
                      <span className="text-primary-500 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function UserGuide() {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(['getting-started'])
  )

  const toggleSection = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    setOpenSections(new Set(GUIDE_SECTIONS.map((s) => s.id)))
  }

  const collapseAll = () => {
    setOpenSections(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen size={24} className="text-primary-500" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              User Guide
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Learn how to use every feature in FocusFlow
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800">
        <p className="text-sm text-primary-700 dark:text-primary-300">
          <strong>Tip:</strong> Click any section below to expand it. All data is stored locally in your browser — no account required.
        </p>
      </div>

      <div className="space-y-3">
        {GUIDE_SECTIONS.map((section) => (
          <AccordionItem
            key={section.id}
            section={section}
            isOpen={openSections.has(section.id)}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </div>
  )
}
