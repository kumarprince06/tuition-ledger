import { useSyncExternalStore } from 'react'
import type { DB, Payment, SessionState } from './types'

// In-memory stand-in for the backend. Screens read through useStore(); mutations call commit().
// Swap for TanStack Query + the generated API client when the endpoints exist (S1-13b).
export const store = {
  db: null as unknown as DB,
  session: { signedIn: false, role: 'OWNER', userId: 'u_owner' } as SessionState,
  idem: {} as Record<string, Payment>,
}

let version = 0
const listeners = new Set<() => void>()
const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}
export function commit() {
  version++
  listeners.forEach((l) => l())
}
export function useStore() {
  useSyncExternalStore(subscribe, () => version)
  return store
}
