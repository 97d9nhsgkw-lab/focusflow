import { useState, useRef } from 'react'
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Brain,
  Database,
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
  Palette,
  Cloud,
  LogIn,
  LogOut,
  UserPlus,
} from 'lucide-react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useAIStore } from '../../store/aiStore'
import { useTrackerStore } from '../../store/trackerStore'
import { useHabitStore } from '../../store/habitStore'
import { useSyncStore } from '../../store/syncStore'
import AuthModal from '../auth/AuthModal'

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error'

export function Settings() {
  const { settings: pomodoroSettings, updateSettings: updatePomodoro } = usePomodoroStore()
  const { settings: aiSettings, updateSettings: updateAI } = useAIStore()
  const { entries } = useTrackerStore()
  const { habits, logs } = useHabitStore()
  const { user, signIn, signOut } = useSyncStore()

  const [showApiKey, setShowApiKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [connectionError, setConnectionError] = useState('')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTestConnection = async () => {
    if (!aiSettings.apiKey || !aiSettings.provider) return

    setConnectionStatus('testing')
    setConnectionError('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiSettings.provider,
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
          messages: [{ role: 'user', content: 'Say "Connection successful" in exactly two words.' }],
          maxTokens: 20,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setConnectionStatus('connected')
        setConnectionError('')
      } else {
        setConnectionStatus('error')
        setConnectionError(data.error || `HTTP ${res.status}`)
      }
    } catch (e) {
      setConnectionStatus('error')
      setConnectionError(e instanceof Error ? e.message : 'Network error — check your connection')
    }
  }

  const handleExportData = () => {
    const data = {
      pomodoro: usePomodoroStore.getState(),
      tracker: { entries },
      habits: { habits, logs },
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-management-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.pomodoro?.settings) {
          updatePomodoro(data.pomodoro.settings)
        }
        if (data.tracker?.entries) {
          useTrackerStore.setState({ entries: data.tracker.entries })
        }
        if (data.habits) {
          useHabitStore.setState({
            habits: data.habits.habits || [],
            logs: data.habits.logs || [],
          })
        }
      } catch {
        alert('Failed to import data. Please check the file format.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleClearAllData = () => {
    localStorage.removeItem('pomodoro-storage')
    localStorage.removeItem('tracker-storage')
    localStorage.removeItem('habit-storage')
    localStorage.removeItem('ai-storage')
    window.location.reload()
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon size={24} className="text-gray-700 dark:text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      <Section icon={<Cloud size={18} />} title="Cloud Sync">
        <div className="space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Signed in as <strong>{user.displayName || user.email}</strong>
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your data syncs automatically across all devices.
              </p>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sign in to sync your data across devices.
              </p>
              <button
                onClick={() => setAuthModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 transition-colors"
              >
                <UserPlus size={16} />
                Sign In / Sign Up
              </button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>
              <button
                onClick={() => signIn()}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>
            </>
          )}
        </div>
      </Section>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      <Section icon={<Timer size={18} />} title="Pomodoro">
        <SliderField
          label="Work Duration"
          value={pomodoroSettings.workDuration}
          min={5}
          max={120}
          unit="min"
          onChange={(v) => updatePomodoro({ workDuration: v })}
        />
        <SliderField
          label="Short Break"
          value={pomodoroSettings.shortBreakDuration}
          min={1}
          max={30}
          unit="min"
          onChange={(v) => updatePomodoro({ shortBreakDuration: v })}
        />
        <SliderField
          label="Long Break"
          value={pomodoroSettings.longBreakDuration}
          min={5}
          max={60}
          unit="min"
          onChange={(v) => updatePomodoro({ longBreakDuration: v })}
        />
        <SliderField
          label="Sessions Before Long Break"
          value={pomodoroSettings.sessionsBeforeLongBreak}
          min={1}
          max={10}
          unit=""
          onChange={(v) => updatePomodoro({ sessionsBeforeLongBreak: v })}
        />
        <ToggleField
          label="Auto-start Breaks"
          checked={pomodoroSettings.autoStartBreaks}
          onChange={(v) => updatePomodoro({ autoStartBreaks: v })}
        />
        <ToggleField
          label="Auto-start Pomodoros"
          checked={pomodoroSettings.autoStartPomodoros}
          onChange={(v) => updatePomodoro({ autoStartPomodoros: v })}
        />
        <SliderField
          label="Daily Goal"
          value={pomodoroSettings.dailyGoal}
          min={1}
          max={20}
          unit="pomodoros"
          onChange={(v) => updatePomodoro({ dailyGoal: v })}
        />
      </Section>

      <Section icon={<Brain size={18} />} title="AI Settings">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Provider
            </label>
            <select
              value={aiSettings.provider ?? ''}
              onChange={(e) => {
                const provider = (e.target.value || null) as 'openai' | 'anthropic' | null
                updateAI({
                  provider,
                   model: provider === 'anthropic' ? 'claude-haiku-4-5-20251001' : provider === 'openai' ? 'gpt-4o-mini' : '',
                })
              }}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select provider...</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={aiSettings.apiKey}
                onChange={(e) => updateAI({ apiKey: e.target.value })}
                placeholder="Enter your API key..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <input
              type="text"
              value={aiSettings.model}
              onChange={(e) => updateAI({ model: e.target.value })}
              disabled={!aiSettings.provider}
              placeholder={aiSettings.provider === 'anthropic' ? 'e.g. claude-haiku-4-5-20251001' : 'e.g. gpt-4o-mini'}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {aiSettings.provider === 'anthropic'
                ? 'Try: claude-haiku-4-5-20251001 or claude-sonnet-4-6'
                : 'Try: gpt-4o-mini or gpt-4o'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={!aiSettings.apiKey || !aiSettings.provider || !aiSettings.model || connectionStatus === 'testing'}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {connectionStatus === 'testing' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Brain size={16} />
              )}
              Test Connection
            </button>
            <ConnectionBadge status={connectionStatus} />
          </div>
          {connectionError && (
            <div className="mt-2 space-y-1">
              <p className="text-sm text-red-500 dark:text-red-400">{connectionError}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Check your key and billing at{' '}
                <a
                  href={aiSettings.provider === 'anthropic' ? 'https://console.anthropic.com/settings/billing' : 'https://platform.openai.com/settings/organization/billing'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {aiSettings.provider === 'anthropic' ? 'console.anthropic.com' : 'platform.openai.com'}
                </a>
              </p>
            </div>
          )}
        </div>
      </Section>

      <Section icon={<Database size={18} />} title="Data Management">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportData}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Download size={16} />
            Export Data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Upload size={16} />
            Import Data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportData}
            className="hidden"
          />
          <button
            onClick={() => setShowClearConfirm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <Trash2 size={16} />
            Clear All Data
          </button>
        </div>
      </Section>

      <Section icon={<Palette size={18} />} title="Appearance">
        <ToggleField
          label="Dark Mode"
          checked={darkMode}
          onChange={toggleDarkMode}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Language
          </label>
          <select
            value="en"
            disabled
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="en">English</option>
          </select>
        </div>
      </Section>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Clear All Data?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently delete all your pomodoro settings, time entries, habits, and AI
              configuration. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary-500">{icon}</span>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function SliderField({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  unit: string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <span className="text-sm font-semibold text-primary-500">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
      />
    </div>
  )
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

function ConnectionBadge({ status }: { status: ConnectionStatus }) {
  if (status === 'idle') return null

  const config = {
    testing: { icon: <Loader2 size={14} className="animate-spin" />, text: 'Testing...', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
    connected: { icon: <CheckCircle2 size={14} />, text: 'Connected', color: 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
    error: { icon: <XCircle size={14} />, text: 'Error', color: 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/30' },
  }[status]

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.text}
    </span>
  )
}


