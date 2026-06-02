import { useState, useEffect, useRef, useCallback } from 'react'
import { Focus, Play, Pause, Volume2, VolumeX, Star } from 'lucide-react'
import { useTimer } from '../../hooks/useTimer'
import { useTrackerStore } from '../../store/trackerStore'
import {
  formatTimerDisplay,
  formatDate,
  getTodayKey,
  generateId,
} from '../../utils'
import type { FocusSession } from '../../types'

const SESSION_DURATIONS = [30, 45, 60, 90, 120] as const

type AmbientSound = 'rain' | 'cafe' | 'lofi' | 'white' | 'brown'
const AMBIENT_SOUNDS: { id: AmbientSound; label: string }[] = [
  { id: 'rain', label: 'Rain' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'lofi', label: 'Lo-fi' },
  { id: 'white', label: 'White Noise' },
  { id: 'brown', label: 'Brown Noise' },
]

const STORAGE_KEY = 'focus-sessions'

function loadSessions(): FocusSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveSessions(sessions: FocusSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

function generateNoiseBuffer(
  ctx: AudioContext,
  length: number,
  filter: 'none' | 'lowpass' | 'bandpass',
  cutoff: number
): AudioBuffer {
  const sampleRate = ctx.sampleRate
  const buffer = ctx.createBuffer(1, length, sampleRate)
  const data = buffer.getChannelData(0)

  if (filter === 'none') {
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1
    }
  } else if (filter === 'lowpass') {
    let lastOut = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      lastOut = lastOut + cutoff * (white - lastOut)
      data[i] = lastOut * 3.5
    }
  } else {
    let lastOut = 0
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1
      lastOut = lastOut + cutoff * (white - lastOut)
      data[i] = lastOut
    }
  }

  return buffer
}

export const FocusMode = () => {
  const [sessions, setSessions] = useState<FocusSession[]>(loadSessions)
  const [declaration, setDeclaration] = useState('')
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [activeSound, setActiveSound] = useState<AmbientSound | null>(null)
  const [volume, setVolume] = useState(0.3)
  const [isMuted, setIsMuted] = useState(false)
  const [sessionStarted, setSessionStarted] = useState(false)
  const [showReflection, setShowReflection] = useState(false)
  const [rating, setRating] = useState(0)
  const [completedSession, setCompletedSession] = useState<FocusSession | null>(
    null
  )
  const [isFullscreen, setIsFullscreen] = useState(false)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const sourceNodesRef = useRef<AudioNode[]>([])
  const gainNodeRef = useRef<GainNode | null>(null)

  const addEntry = useTrackerStore((s) => s.addManualEntry)

  const stopAmbientSound = useCallback(() => {
    sourceNodesRef.current.forEach((node) => {
      try {
        if ('stop' in node) (node as AudioBufferSourceNode).stop()
      } catch {
        // already stopped
      }
    })
    sourceNodesRef.current = []
    setActiveSound(null)
  }, [])

  const onTimerComplete = useCallback(() => {
    if (sessionStarted && declaration.trim()) {
      const session: FocusSession = {
        id: generateId(),
        date: getTodayKey(),
        declaration: declaration.trim(),
        duration: selectedDuration,
        completed: true,
      }
      const updated = [...sessions, session]
      setSessions(updated)
      saveSessions(updated)
      setCompletedSession(session)
      setShowReflection(true)
      addEntry({
        description: `[Focus] ${declaration.trim()}`,
        category: 'Work',
        startTime: new Date(Date.now() - selectedDuration * 60000).toISOString(),
        endTime: new Date().toISOString(),
        duration: selectedDuration,
        date: getTodayKey(),
      })
    }
    stopAmbientSound()
    setSessionStarted(false)
  }, [sessionStarted, declaration, selectedDuration, sessions, addEntry, stopAmbientSound])

  const {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    progress,
  } = useTimer(selectedDuration * 60, onTimerComplete)

  useEffect(() => {
    return () => {
      stopAmbientSound()
    }
  }, [stopAmbientSound])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const getOrCreateAudioContext = (): AudioContext => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    return audioCtxRef.current
  }

  const playAmbientSound = (sound: AmbientSound) => {
    stopAmbientSound()
    const ctx = getOrCreateAudioContext()
    const gain = ctx.createGain()
    gain.gain.value = isMuted ? 0 : volume
    gain.connect(ctx.destination)
    gainNodeRef.current = gain

    const duration = 10
    const length = ctx.sampleRate * duration
    const nodes: AudioNode[] = []

    if (sound === 'white') {
      const buffer = generateNoiseBuffer(ctx, length, 'none', 0)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()
      nodes.push(source)
    } else if (sound === 'brown') {
      const buffer = generateNoiseBuffer(ctx, length, 'lowpass', 0.005)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      source.connect(gain)
      source.start()
      nodes.push(source)
    } else if (sound === 'rain') {
      for (let i = 0; i < 3; i++) {
        const buffer = generateNoiseBuffer(ctx, length, 'bandpass', 0.001 + i * 0.001)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 800 + i * 400
        filter.Q.value = 0.5
        source.connect(filter)
        filter.connect(gain)
        source.start()
        nodes.push(source)
      }
    } else if (sound === 'cafe') {
      for (let i = 0; i < 3; i++) {
        const buffer = generateNoiseBuffer(ctx, length, 'bandpass', 0.002 + i * 0.002)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.loop = true
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 300 + i * 300
        filter.Q.value = 1
        const lfo = ctx.createOscillator()
        lfo.frequency.value = 0.1 + i * 0.05
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.15
        lfo.connect(lfoGain)
        lfoGain.connect(filter.frequency)
        lfo.start()
        source.connect(filter)
        filter.connect(gain)
        source.start()
        nodes.push(source)
      }
    } else if (sound === 'lofi') {
      const buffer = generateNoiseBuffer(ctx, length, 'lowpass', 0.008)
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 2000
      source.connect(filter)
      filter.connect(gain)
      source.start()
      nodes.push(source)

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 220
      const oscGain = ctx.createGain()
      oscGain.gain.value = 0.02
      osc.connect(oscGain)
      oscGain.connect(gain)
      osc.start()
      nodes.push(osc as unknown as AudioNode)
    }

    sourceNodesRef.current = nodes
    setActiveSound(sound)
  }

  const handleSoundToggle = (sound: AmbientSound) => {
    if (activeSound === sound) {
      stopAmbientSound()
    } else {
      playAmbientSound(sound)
    }
  }

  const handleStartSession = () => {
    if (!declaration.trim()) return
    reset(selectedDuration * 60)
    setSessionStarted(true)
    start()
  }

  const handlePauseResume = () => {
    if (isRunning) {
      pause()
    } else {
      start()
    }
  }

  const handleReset = () => {
    pause()
    reset(selectedDuration * 60)
    setSessionStarted(false)
    stopAmbientSound()
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const handleReflectionSubmit = () => {
    if (completedSession && rating > 0) {
      const updated = sessions.map((s) =>
        s.id === completedSession.id ? { ...s, rating } : s
      )
      setSessions(updated)
      saveSessions(updated)
    }
    setShowReflection(false)
    setRating(0)
    setCompletedSession(null)
    setDeclaration('')
  }

  const getHeatmapData = () => {
    const data: { date: string; count: number }[] = []
    const today = new Date()
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = formatDate(d)
      const count = sessions.filter((s) => s.date === key && s.completed).length
      data.push({ date: key, count })
    }
    return data
  }

  const getIntensityColor = (count: number): string => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900/40'
    if (count <= 4) return 'bg-emerald-400 dark:bg-emerald-700/60'
    return 'bg-emerald-600 dark:bg-emerald-500/80'
  }

  const heatmapData = getHeatmapData()
  const weeks: (typeof heatmapData)[] = []
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7))
  }

  const totalFocusTime = sessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration, 0)

  const totalSessions = sessions.filter((s) => s.completed).length

  const recentSessions = [...sessions]
    .filter((s) => s.completed)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
          <Focus className="text-indigo-600 dark:text-indigo-400" size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Focus Mode
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Deep work, distraction-free
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Timer Card */}
          <div
            className={`rounded-2xl border p-8 transition-all ${
              isFullscreen
                ? 'fixed inset-0 z-50 rounded-none flex flex-col items-center justify-center bg-gray-950 dark:bg-black border-0'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 shadow-sm'
            }`}
          >
            {sessionStarted && (
              <div className="w-full max-w-lg mb-8">
                <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div
              className={`font-mono font-bold tracking-wider mb-8 ${
                isFullscreen ? 'text-[120px]' : 'text-7xl'
              } text-gray-900 dark:text-white`}
            >
              {formatTimerDisplay(timeLeft)}
            </div>

            {!sessionStarted ? (
              <div className="w-full max-w-md space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    What's the ONE thing I'm working on?
                  </label>
                  <input
                    type="text"
                    value={declaration}
                    onChange={(e) => setDeclaration(e.target.value)}
                    placeholder="Deep focus on..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg"
                    onKeyDown={(e) => e.key === 'Enter' && handleStartSession()}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Duration
                  </label>
                  <div className="flex gap-2 justify-center">
                    {SESSION_DURATIONS.map((d) => (
                      <button
                        key={d}
                        onClick={() => {
                          setSelectedDuration(d)
                          reset(d * 60)
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedDuration === d
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {d}m
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleStartSession}
                  disabled={!declaration.trim()}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
                >
                  <Play size={18} />
                  Start Focus Session
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePauseResume}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  {isRunning ? <Pause size={18} /> : <Play size={18} />}
                  {isRunning ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleToggleFullscreen}
                  className="px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
                >
                  {isFullscreen ? 'Exit Full' : 'Fullscreen'}
                </button>
              </div>
            )}

            {sessionStarted && (
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                {declaration}
              </p>
            )}
          </div>

          {/* Ambient Sounds */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Ambient Sounds
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {AMBIENT_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  onClick={() => handleSoundToggle(sound.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSound === sound.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {sound.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
                {Math.round(volume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Total Sessions
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {totalSessions}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Focus Time
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {Math.floor(totalFocusTime / 60)}h{' '}
                {totalFocusTime % 60}m
              </p>
            </div>
          </div>

          {/* Heatmap */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Focus Consistency
            </h3>
            <div className="flex gap-[3px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} session(s)`}
                      className={`w-3 h-3 rounded-sm ${getIntensityColor(
                        day.count
                      )}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500 dark:text-gray-400">
              <span>Less</span>
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/40" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500/80" />
              <span>More</span>
            </div>
          </div>

          {/* Session History */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Recent Sessions
            </h3>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                No sessions yet. Start your first focus session!
              </p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.declaration}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {session.duration}m · {session.date}
                      </p>
                    </div>
                    {session.rating && (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < session.rating!
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reflection Modal */}
      {showReflection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 w-full max-w-md shadow-xl mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Session Complete!
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              How did that session go?
            </p>
            {completedSession && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                "{completedSession.declaration}" — {completedSession.duration} min
              </p>
            )}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  onClick={() => setRating(value)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={32}
                    className={
                      value <= rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                </button>
              ))}
            </div>
            <button
              onClick={handleReflectionSubmit}
              disabled={rating === 0}
              className="w-full px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
            >
              Save Reflection
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
