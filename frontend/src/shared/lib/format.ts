// Formatting helpers. Money is always integer paise (ADR-0004).
export const TODAY = '2026-10-23' // mock clock; the real app takes "today" from the centre's timezone

export const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s: string, n: number) => {
  const d = parse(s)
  d.setDate(d.getDate() + n)
  return iso(d)
}
export const daysBetween = (a: string, b: string) =>
  Math.round((parse(b).getTime() - parse(a).getTime()) / 864e5)
export const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate()
export const dShort = (s: string) =>
  parse(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const dDay = (s: string) =>
  parse(s).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
export const monthName = (p: string) =>
  parse(p + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
export const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const
export const DAYNAME: Record<string, string> = {
  MON: 'Mon',
  TUE: 'Tue',
  WED: 'Wed',
  THU: 'Thu',
  FRI: 'Fri',
  SAT: 'Sat',
  SUN: 'Sun',
}

export const rup = (p: number) =>
  (p < 0 ? '−' : '') + '₹' + Math.abs(p / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })
export const rup2 = (p: number) =>
  (p < 0 ? '−' : '') +
  '₹' +
  Math.abs(p / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const first = (n: string) => n.split(' ')[0]
export const initials = (n: string) =>
  n
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
export const listJoin = (a: string[]) =>
  a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]
export const phoneFmt = (p: string) =>
  p?.startsWith('+91') ? `+91 ${p.slice(3, 8)} ${p.slice(8)}` : p || '—'
export const phoneMask = (p: string) =>
  p?.startsWith('+91') ? `+91 ${p.slice(3, 5)}••• ••${p.slice(-2)}` : '—'
export const nowT = () => new Date().toTimeString().slice(0, 5)
export const stamp = () => `${TODAY} ${nowT()}`
export const plural = (n: number, w: string, ws?: string) => `${n} ${n === 1 ? w : ws || w + 's'}`
export const uid = (p: string) => p + '_' + Math.random().toString(36).slice(2, 9)
export const newKey = () =>
  globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : uid('idem')

/** One HALF_EVEN rounding to the rupee (FEE-2). */
export function roundRupee(p: number) {
  const sign = p < 0 ? -1 : 1
  const a = Math.abs(p)
  const rupees = Math.floor(a / 100)
  const rem = a % 100
  const r = rem > 50 ? rupees + 1 : rem < 50 ? rupees : rupees % 2 === 0 ? rupees : rupees + 1
  return sign * r * 100
}

export const validMobile = (v: string | undefined) => /^[6-9]\d{9}$/.test(v || '')
export const emailOk = (e: string | undefined) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e || '')
const COMMON_PW = [
  'password',
  'password1',
  'password123',
  '12345678',
  '123456789',
  'qwerty123',
  'iloveyou',
  '11111111',
  'tuition123',
  'abcd1234',
]
export const pwProblem = (p: string | undefined) =>
  !p
    ? ''
    : p.length < 8
      ? 'At least 8 characters'
      : COMMON_PW.includes(p.toLowerCase())
        ? "Too common. Try a short phrase you'll remember"
        : ''
export const pwScore = (p: string | undefined) => {
  if (!p) return 0
  if (pwProblem(p)) return 1
  let n = 1
  if (p.length >= 12) n++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) n++
  if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) n++
  return Math.min(4, n)
}
export const suggestPrefix = (n: string) => {
  const w = n
    .replace(/[^A-Za-z ]/g, ' ')
    .split(' ')
    .filter((x) => x && !['the', 'of', 'and'].includes(x.toLowerCase()))
  const p = (
    w.length >= 2
      ? w
          .slice(0, 3)
          .map((x) => x[0])
          .join('')
      : (w[0] || '').slice(0, 3)
  ).toUpperCase()
  return p.length >= 2 ? p : ''
}
