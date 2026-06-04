import { useEffect, useRef } from 'react'
import { useSyncStore, startSync, syncToCloud } from '../store/syncStore'
import { usePomodoroStore } from '../store/pomodoroStore'
import { useTrackerStore } from '../store/trackerStore'
import { useHabitStore } from '../store/habitStore'
import { useAIStore } from '../store/aiStore'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, initSync } = useSyncStore()
  const cloudLoaded = useRef(false)

  useEffect(() => {
    initSync()
  }, [])

  useEffect(() => {
    if (!user) return

    const unsub = startSync(user.uid)

    const handleSync = (e: Event) => {
      const { path, data } = (e as CustomEvent).detail
      switch (path) {
        case 'pomodoro':
          usePomodoroStore.setState(data)
          break
        case 'tracker':
          useTrackerStore.setState(data)
          break
        case 'habits':
          useHabitStore.setState(data)
          break
        case 'ai':
          useAIStore.setState(data)
          break
      }
      cloudLoaded.current = true
    }

    window.addEventListener('sync-data', handleSync as EventListener)

    // Allow cloud to load before enabling sync to cloud
    const timer = setTimeout(() => {
      cloudLoaded.current = true
    }, 2000)

    return () => {
      unsub()
      window.removeEventListener('sync-data', handleSync as EventListener)
      clearTimeout(timer)
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const unsubPomodoro = usePomodoroStore.subscribe((state) => {
      if (cloudLoaded.current) {
        syncToCloud(user.uid, 'pomodoro', { settings: state.settings })
      }
    })

    const unsubTracker = useTrackerStore.subscribe((state) => {
      if (cloudLoaded.current) {
        syncToCloud(user.uid, 'tracker', { entries: state.entries })
      }
    })

    const unsubHabits = useHabitStore.subscribe((state) => {
      if (cloudLoaded.current) {
        syncToCloud(user.uid, 'habits', { habits: state.habits, logs: state.logs })
      }
    })

    const unsubAI = useAIStore.subscribe((state) => {
      if (cloudLoaded.current) {
        syncToCloud(user.uid, 'ai', { settings: state.settings })
      }
    })

    return () => {
      unsubPomodoro()
      unsubTracker()
      unsubHabits()
      unsubAI()
    }
  }, [user])

  return <>{children}</>
}
