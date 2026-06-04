import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { onAuthChange, listenToUserData, saveUserData, signInWithGoogle, logOut } from '../firebase'

interface User {
  uid: string
  displayName: string | null
  email: string | null
}

interface SyncState {
  user: User | null
  syncEnabled: boolean
  loading: boolean
  setUser: (user: User | null) => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  initSync: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      user: null,
      syncEnabled: false,
      loading: true,

      setUser: (user) => set({ user, syncEnabled: !!user, loading: false }),

      signIn: async () => {
        try {
          await signInWithGoogle()
        } catch (e) {
          console.error('Sign in failed:', e)
          throw e
        }
      },

      signOut: async () => {
        await logOut()
        set({ user: null, syncEnabled: false })
      },

      initSync: () => {
        onAuthChange((user) => {
          set({ user, syncEnabled: !!user, loading: false })
        })
      },
    }),
    { name: 'sync-storage', partialize: (state) => ({ syncEnabled: state.syncEnabled }) }
  )
)

export function startSync(uid: string) {
  const paths = ['pomodoro', 'tracker', 'habits', 'ai']

  const unsubscribers = paths.map((path) =>
    listenToUserData(uid, path, (data) => {
      if (!data) return
      const event = new CustomEvent('sync-data', { detail: { path, data } })
      window.dispatchEvent(event)
    })
  )

  return () => unsubscribers.forEach((unsub) => unsub())
}

export async function syncToCloud(uid: string, path: string, data: unknown) {
  await saveUserData(uid, path, data)
}
