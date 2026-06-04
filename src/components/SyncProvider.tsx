import { useEffect, useRef } from 'react'
import { useSyncStore, startSync, syncToCloud } from '../store/syncStore'
import { usePomodoroStore } from '../store/pomodoroStore'
import { useTrackerStore } from '../store/trackerStore'
import { useHabitStore } from '../store/habitStore'
import { useAIStore } from '../store/aiStore'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, initSync } = useSyncStore()
  const initialLoadDone = useRef(false)

  useEffect(() => {
    initSync()
  }, [])

  // Listen for incoming cloud data
  useEffect(() => {
    if (!user) return

    const unsub = startSync(user.uid)

    const handleSync = (e: Event) => {
      const { path, data } = (e as CustomEvent).detail
      console.log('[Sync] Received cloud data for:', path, data)
      
      // Always apply cloud data - this ensures phone gets computer's data
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
      initialLoadDone.current = true
    }

    window.addEventListener('sync-data', handleSync as EventListener)

    // Mark initial load done after 1 second (so we don't immediately overwrite cloud with empty local)
    const timer = setTimeout(() => {
      initialLoadDone.current = true
    }, 1000)

    return () => {
      unsub()
      window.removeEventListener('sync-data', handleSync as EventListener)
      clearTimeout(timer)
    }
  }, [user])

  // Sync local changes to cloud
  useEffect(() => {
    if (!user) return

    const unsubPomodoro = usePomodoroStore.subscribe((state) => {
      if (initialLoadDone.current) {
        console.log('[Sync] Saving pomodoro to cloud')
        syncToCloud(user.uid, 'pomodoro', { settings: state.settings }).catch(console.error)
      }
    })

    const unsubTracker = useTrackerStore.subscribe((state) => {
      if (initialLoadDone.current) {
        console.log('[Sync] Saving tracker to cloud')
        syncToCloud(user.uid, 'tracker', { entries: state.entries }).catch(console.error)
      }
    })

    const unsubHabits = useHabitStore.subscribe((state) => {
      if (initialLoadDone.current) {
        console.log('[Sync] Saving habits to cloud')
        syncToCloud(user.uid, 'habits', { habits: state.habits, logs: state.logs }).catch(console.error)
      }
    })

    const unsubAI = useAIStore.subscribe((state) => {
      if (initialLoadDone.current) {
        console.log('[Sync] Saving AI settings to cloud')
        syncToCloud(user.uid, 'ai', { settings: state.settings }).catch(console.error)
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
