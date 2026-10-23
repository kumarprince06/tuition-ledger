// Mock sign-in and registration (CEN-2, CEN-6, CEN-8). The real calls are POST /auth/verify, /auth/login, /signup.
import { suggestPrefix } from '../shared/lib/format'
import { emptyCentre } from './seed'
import { commit, store } from './store'
import type { User } from './types'

export const DEMO_OTP = '123456'

export function signIn(user: User) {
  store.session = { signedIn: true, role: user.role, userId: user.id }
  commit()
}
export function switchDemoRole(user: User) {
  store.session = { signedIn: true, role: user.role, userId: user.id }
  commit()
}
export function signOut() {
  store.session = { ...store.session, signedIn: false }
  commit()
}
export const userByPhone = (phone10: string) =>
  store.db.users.find((u) => u.phone === '+91' + phone10)
export const userByEmail = (email: string) =>
  store.db.users.find((u) => u.email && u.email.toLowerCase() === email.trim().toLowerCase())

export type LoginResult =
  | { ok: true; user: User }
  | {
      ok: false
      error: 'wrong' | 'locked' | 'unverified' | 'deactivated'
      minutes?: number
      user?: User
    }
/** POST /auth/login: one message for wrong email or password; lock after 5 failures. */
export function loginWithPassword(email: string, pw: string): LoginResult {
  const u = userByEmail(email)
  if (u?.lockedUntil && u.lockedUntil > Date.now())
    return { ok: false, error: 'locked', minutes: Math.ceil((u.lockedUntil - Date.now()) / 60000) }
  if (!u || !u.pw || u.pw !== pw) {
    if (u?.pw) {
      u.failed = (u.failed || 0) + 1
      if (u.failed >= 5) {
        u.lockedUntil = Date.now() + 15 * 60000
        u.failed = 0
        return { ok: false, error: 'locked', minutes: 15 }
      }
    }
    return { ok: false, error: 'wrong' }
  }
  if (!u.emailVerified) return { ok: false, error: 'unverified', user: u }
  if (u.status !== 'active') return { ok: false, error: 'deactivated' }
  u.failed = 0
  return { ok: true, user: u }
}
export function resetPassword(email: string, pw: string) {
  const u = userByEmail(email)
  if (u) Object.assign(u, { pw, lockedUntil: null, failed: 0 })
}
export function verifyEmail(userId: string) {
  const u = store.db.users.find((x) => x.id === userId)
  if (u) u.emailVerified = true
  commit()
}
export function setCredentials(userId: string, email: string, pw: string) {
  const u = store.db.users.find((x) => x.id === userId)!
  Object.assign(u, { email: email.trim().toLowerCase(), pw, emailVerified: false })
  commit()
}
export function changePassword(userId: string, current: string, pw: string) {
  const u = store.db.users.find((x) => x.id === userId)!
  if (u.pw !== current) return false
  u.pw = pw
  commit()
  return true
}
export function registerCentre(f: {
  centreName: string
  ownerName: string
  phone10: string
  email: string
  pw: string
  city: string
}) {
  store.db = emptyCentre({
    centreName: f.centreName,
    ownerName: f.ownerName,
    phone: '+91' + f.phone10,
    email: f.email.trim().toLowerCase(),
    pw: f.pw,
    prefix: suggestPrefix(f.centreName) || 'TL',
    city: f.city,
  })
  store.idem = {}
  store.session = { signedIn: true, role: 'OWNER', userId: 'u_new' }
  commit()
  return store.db
}
