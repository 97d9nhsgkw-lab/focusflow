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
} from 'lucide-react'
import { usePomodoroStore } from '../../store/pomodoroStore'
import { useAIStore } from '../../store/aiStore'
import { useTrackerStore } from '../../store/trackerStore'
import { useHabitStore } from '../../store/habitStore'

const AI_MODELS = [
  { provider: 'openai' as const, value: 'gpt-4o', label: 'GPT-4o' },
  { provider: 'openai' as const, value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { provider: 'anthropic' as const, value: 'claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { provider: 'anthropic' as const, value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
]

type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error'

export function Settings() {
  const { settings: pomodoroSettings, updateSettings: updatePomodoro } = usePomodoroStore()
  const { settings: aiSettings, updateSettings: updateAI } = useAIStore()
  const { entries } = useTrackerStore()
  const { habits, logs } = useHabitStore()

  const [showApiKey, setShowApiKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [darkMode, setDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filteredModels = aiSettings.provider
    ? AI_MODELS.filter((m) => m.provider === aiSettings.provider)
    : AI_MODELS

  const handleTestConnection = async () => {
    if (!aiSettings.apiKey || !aiSettings.provider) return

    setConnectionStatus('testing')
    try {
      const baseUrl =
        aiSettings.provider === 'openai'
          ? 'https://api.openai.com/v1/chat/completions'
          : 'https://api.anthropic.com/v1/messages'

      const headers: Record<string, string> =
        aiSettings.provider === 'openai'
          ? { Authorization: `Bearer ${aiSettings.apiKey}`, 'Content-Type': 'application/json' }
          : { 'x-api-key': aiSettings.apiKey, 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01' }

      const body =
        aiSettings.provider === 'openai'
          ? JSON.stringify({
              model: aiSettings.model,
              messages: [{ role: 'user', content: 'Say "Connection successful" in exactly two words.' }],
              max_tokens: 20,
            })
          : JSON.stringify({
              model: aiSettings.model,
              max_tokens: 20,
              messages: [{ role: 'user', content: 'Say "Connection successful" in exactly two words.' }],
            })

      const res = await fetch(baseUrl, { method: 'POST', headers, body })
      if (res.ok) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('error')
      }
    } catch {
      setConnectionStatus('error')
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
                  model: provider
                    ? AI_MODELS.find((m) => m.provider === provider)?.value ?? ''
                    : '',
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
            <select
              value={aiSettings.model}
              onChange={(e) => updateAI({ model: e.target.value })}
              disabled={!aiSettings.provider}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {!aiSettings.provider && <option value="">Select provider first...</option>}
              {filteredModels.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
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


