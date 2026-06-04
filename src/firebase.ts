import { initializeApp } from 'firebase/app'
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyDRmaST9h_zMxIF9N3LL2i9rVnLlNUQOYM',
  authDomain: 'focusflow-sync.firebaseapp.com',
  projectId: 'focusflow-sync',
  storageBucket: 'focusflow-sync.firebasestorage.app',
  messagingSenderId: '537074610402',
  appId: '1:537074610402:web:f657bd909d37d93d8feebb',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider)
  return result.user
}

export async function logOut() {
  await signOut(auth)
}

export function onAuthChange(callback: (user: { uid: string; displayName: string | null; email: string | null } | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    callback(user ? { uid: user.uid, displayName: user.displayName, email: user.email } : null)
  })
}

export function listenToUserData<T>(uid: string, path: string, callback: (data: T | null) => void) {
  const ref = doc(db, 'users', uid, 'data', path)
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? (snap.data() as T) : null)
  })
}

export async function saveUserData<T>(uid: string, path: string, data: T) {
  const ref = doc(db, 'users', uid, 'data', path)
  await setDoc(ref, data)
}
