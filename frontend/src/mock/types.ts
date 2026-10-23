// Shapes follow docs/05-data-model.md and docs/api/openapi.yaml so screens can switch to the API later.
export type Role = 'OWNER' | 'TEACHER' | 'ACCOUNTANT'
export type Consent = 'pending' | 'given' | 'opted_out'
export type Mark = 'P' | 'A' | 'L'
export type Method = 'cash' | 'upi_manual' | 'razorpay'
export type MsgStatus = 'delivered' | 'sent' | 'queued' | 'held' | 'skipped' | 'failed' | 'received'
export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

export interface Centre {
  id: string
  name: string
  address: string
  timezone: string
  prefix: string
  whatsapp: 'not_connected' | 'pending' | 'connected'
  razorpay: 'not_connected' | 'connected'
  plan: string
  trialEndsOn: string | null
  createdOn: string
}

export interface Settings {
  dueDay: number
  reminderOffsets: number[]
  quietFrom: string
  quietTo: string
  digestOn: boolean
  digestDay: string
  siblingPct: number
  language: string
  linkFee: string
  editWindow: number
  marksWindow: number
  lowAttendance: number
  dupWindow: number
  feeds: boolean
  nudgeMin: number
  avgInResults: boolean
  absentNotice: boolean
  autoAnnounce: boolean
  announcers: 'owner_teachers' | 'owner'
  receiptPdf: boolean
  dailyQuote: boolean
}

export interface User {
  id: string
  name: string
  phone: string
  role: Role
  status: 'active' | 'deactivated'
  email?: string
  emailVerified?: boolean
  pw?: string // prototype only; the backend stores an Argon2id hash
  failed?: number
  lockedUntil?: number | null
}

export interface Batch {
  id: string
  name: string
  subject: string
  cls: string
  teacherId: string
  days: Day[]
  start: string
  end: string
  feePaise: number
  capacity: number
  status: 'active' | 'archived'
}

export interface Student {
  id: string
  name: string
  cls: string
  parentName: string
  parentPhone: string
  joinedOn: string
  discountBps: number
  status: 'active' | 'paused' | 'left'
  deleted: boolean
}

export interface Enrolment {
  id: string
  studentId: string
  batchId: string
  from: string
  to: string | null
}

export interface StatusChange {
  id: string
  studentId: string
  status: Student['status']
  effectiveOn: string
  reason: string
  by: string
  at: string
}

export interface Session {
  id: string
  batchId: string
  date: string
  start: string
  end: string
  status: 'scheduled' | 'cancelled'
  kind: 'regular' | 'extra'
  cancelReason?: string
}

export interface AttendanceRow {
  id: string
  sessionId: string
  studentId: string
  mark: Mark
  by: string
  at: string
  superseded: boolean
  prevMark?: Mark
}

export interface Computation {
  fee: number
  days: number
  dim: number
  bps: number
}

export interface Charge {
  id: string
  studentId: string
  batchId: string | null
  period: string
  kind: 'monthly' | 'one_off' | 'adjustment'
  description: string
  gross: number
  disc: number
  net: number
  dueOn: string
  computation?: Computation
  allocated: number
  createdBy: string
}

export interface Payment {
  id: string
  studentId: string
  amount: number
  method: Method
  utr: string | null
  receivedOn: string
  by: string
  receiptNo: string
  allocations: { chargeId: string; amount: number }[]
  refunded: number
  createdAt: string
}

export interface LedgerLine {
  id: string
  studentId: string
  kind: 'charge' | 'payment' | 'adjustment' | 'refund' | 'credit'
  amount: number
  ref: string
  chargeId?: string
  paymentId?: string
  by: string
  at: string
}

export interface Test {
  id: string
  batchId: string
  name: string
  heldOn: string
  max: number
  topic: string
  sentAt: string | null
  sentBy?: string
}

export interface MarkRow {
  id: string
  testId: string
  studentId: string
  marks: number | null
  absent: boolean
  by: string
  at: string
  superseded: boolean
}

export interface Message {
  id: string
  phone: string
  dir: 'out' | 'in'
  kind: string
  text: string
  status: MsgStatus
  reason: string
  at: string
}

export interface Announcement {
  id: string
  batchId: string | null
  body: string
  kind: 'manual' | 'auto'
  by: string
  at: string
  recipients: number
}

export interface AuditEntry {
  at: string
  by: string
  action: string
}

export interface PaymentLink {
  id: string
  studentId: string
  amount: number
  url: string
}

export interface DB {
  centre: Centre
  settings: Settings
  onboarding: { settingsConfirmed: boolean; feePreviewed: boolean; cashOnly: boolean }
  users: User[]
  batches: Batch[]
  holidays: { day: string; reason: string }[]
  students: Student[]
  enrolments: Enrolment[]
  statusChanges: StatusChange[]
  consents: Record<string, Consent>
  sessions: Session[]
  attendance: AttendanceRow[]
  charges: Charge[]
  payments: Payment[]
  ledger: LedgerLine[]
  tests: Test[]
  marks: MarkRow[]
  messages: Message[]
  announcements: Announcement[]
  audit: AuditEntry[]
  links: PaymentLink[]
  receiptNext: number
  feeRuns: Record<string, { status: string; at: string; count: number }>
  badPhones: Set<string>
}

export interface SessionState {
  signedIn: boolean
  role: Role
  userId: string
}
