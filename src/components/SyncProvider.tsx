import { useEffect } from 'react'
import { useSyncStore, startSync, syncToCloud } from '../store/syncStore'
import { usePomodoroStore } from '../store/pomodoroStore'
import { useTrackerStore } from '../store/trackerStore'
import { useHabitStore } from '../store/habitStore'
import { useAIStore } from '../store/aiStore'

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user, initSync } = useSyncStore()

  useEffect(() => {
    initSync()
  }, [])

  useEffect(() => {
    if (!user) return

    const unsub = startSync(user.uid)

    window.addEventListener('sync-data', ((e: CustomEvent) => {
      const { path, data } = e.detail
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
    }) as EventListener)

    return () => {
      unsub()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    const unsubPomodoro = usePomodoroStore.subscribe((state) => {
      syncToCloud(user.uid, 'pomodoro', { settings: state.settings })
    })

    const unsubTracker = useTrackerStore.subscribe((state) => {
      syncToCloud(user.uid, 'tracker', { entries: state.entries })
    })

    const unsubHabits = useHabitStore.subscribe((state) => {
      syncToCloud(user.uid, 'habits', { habits: state.habits, logs: state.logs })
    })

    const unsubAI = useAIStore.subscribe((state) => {
      syncToCloud(user.uid, 'ai', { settings: state.settings })
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
