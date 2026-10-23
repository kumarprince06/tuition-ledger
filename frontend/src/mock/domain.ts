// What the backend computes and enforces, run in memory. Each mutation mirrors an endpoint in docs/06-api.md.
import {
  TODAY,
  addDays,
  dDay,
  dShort,
  daysBetween,
  daysIn,
  first,
  listJoin,
  monthName,
  pad,
  parse,
  roundRupee,
  rup,
  stamp,
  uid,
  DOW,
} from '../shared/lib/format'
import { commit, store } from './store'
import type {
  Batch,
  Charge,
  Consent,
  Day,
  Enrolment,
  Mark,
  Message,
  Method,
  Payment,
  Role,
  Session,
  Settings,
  Student,
  User,
} from './types'

const db = () => store.db
const me = () => store.session

/* ---------- lookups ---------- */
export const B = (id: string | null | undefined) => db().batches.find((b) => b.id === id)
export const St = (id: string | null | undefined) => db().students.find((s) => s.id === id)
export const Us = (id: string | null | undefined) => db().users.find((u) => u.id === id)
export const userName = (id: string) => (id === 'system' ? 'System' : Us(id)?.name || '—')
export const roleLabel = (r: Role) =>
  ({ OWNER: 'Owner', TEACHER: 'Teacher', ACCOUNTANT: 'Accountant' })[r]
export const methodLabel = (m: Method) =>
  ({ cash: 'cash', upi_manual: 'UPI', razorpay: 'Razorpay link' })[m]
export const consentOf = (ph: string): Consent => db().consents[ph] || 'pending'
export const phonesOf = (list: Student[]) => [...new Set(list.map((s) => s.parentPhone))]
export const activeOn = (e: Enrolment, date: string) => e.from <= date && (!e.to || e.to >= date)
export const enrolmentsOf = (sid: string) => db().enrolments.filter((e) => e.studentId === sid)
export const activeBatchesOf = (sid: string) =>
  enrolmentsOf(sid)
    .filter((e) => activeOn(e, TODAY))
    .map((e) => B(e.batchId))
    .filter((b): b is Batch => !!b)
export const siblingsOf = (s: Student) =>
  db().students.filter((x) => x.parentPhone === s.parentPhone && x.id !== s.id && !x.deleted)
export const balance = (sid: string) =>
  db().ledger.reduce((a, l) => (l.studentId === sid ? a + l.amount : a), 0)
export const sesById = (id: string | undefined) => db().sessions.find((s) => s.id === id)

export function statusOn(s: Student, date: string) {
  let st: Student['status'] = 'active'
  db()
    .statusChanges.filter((c) => c.studentId === s.id && c.effectiveOn <= date)
    .sort((a, b) => a.effectiveOn.localeCompare(b.effectiveOn))
    .forEach((c) => (st = c.status))
  return st
}
/** ATT-1: enrolment active on the date and status active on the date. */
export function roster(se: { batchId: string; date: string }) {
  return db()
    .enrolments.filter((e) => e.batchId === se.batchId && activeOn(e, se.date))
    .map((e) => St(e.studentId))
    .filter((s): s is Student => !!s && !s.deleted && statusOn(s, se.date) === 'active')
    .sort((a, b) => a.name.localeCompare(b.name))
}
export const pausedOnRoster = (se: Session) =>
  db()
    .enrolments.filter((e) => e.batchId === se.batchId && activeOn(e, se.date))
    .map((e) => St(e.studentId))
    .filter((s): s is Student => !!s && statusOn(s, se.date) !== 'active')
export const currentMarks = (sessionId: string) =>
  Object.fromEntries(
    db()
      .attendance.filter((a) => a.sessionId === sessionId && !a.superseded)
      .map((a) => [a.studentId, a]),
  )
export const sessionsOf = (bid: string) =>
  db()
    .sessions.filter((s) => s.batchId === bid)
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
export const myBatchIds = () =>
  db()
    .batches.filter(
      (b) => b.status === 'active' && (me().role !== 'TEACHER' || b.teacherId === me().userId),
    )
    .map((b) => b.id)
export const myBatches = () => myBatchIds().map((id) => B(id) as Batch)
export const todaySessions = () =>
  db()
    .sessions.filter((s) => s.date === TODAY && myBatchIds().includes(s.batchId))
    .sort((a, b) => a.start.localeCompare(b.start))
export const inScope = (s: Student) =>
  me().role !== 'TEACHER' ||
  enrolmentsOf(s.id).some((e) => activeOn(e, TODAY) && myBatchIds().includes(e.batchId))
export const visibleStudents = () => db().students.filter(inScope)
export const currentMarkRows = (testId: string) =>
  Object.fromEntries(
    db()
      .marks.filter((m) => m.testId === testId && !m.superseded)
      .map((m) => [m.studentId, m]),
  )

const inWindow = (se: Session | undefined, days: number) =>
  !!se && se.date < TODAY && se.date >= addDays(TODAY, -days)
/** Attendance stats; late counts as attended (decision recorded in ATT-1). */
function attStats(filter: (a: { sessionId: string; studentId: string }) => boolean) {
  let P = 0,
    A = 0,
    L = 0
  db().attendance.forEach((a) => {
    if (a.superseded || !filter(a)) return
    if (a.mark === 'P') P++
    else if (a.mark === 'A') A++
    else L++
  })
  const t = P + A + L
  return { P, A, L, t, rate: t ? Math.round(((P + L) / t) * 100) : null }
}
export const batchAtt = (bid: string, days = 30) =>
  attStats((a) => {
    const se = sesById(a.sessionId)
    return !!se && se.batchId === bid && inWindow(se, days)
  })
export const studentAtt = (sid: string, days = 30) =>
  attStats((a) => a.studentId === sid && inWindow(sesById(a.sessionId), days))
export const studentAbsences = (sid: string, days = 30) =>
  db()
    .attendance.filter(
      (a) =>
        !a.superseded &&
        a.studentId === sid &&
        a.mark === 'A' &&
        inWindow(sesById(a.sessionId), days),
    )
    .map((a) => sesById(a.sessionId)!.date)
    .sort()

export const monthlyFee = (s: Student) =>
  activeBatchesOf(s.id).reduce(
    (a, b) => a + roundRupee(Math.round((b.feePaise * (10000 - s.discountBps)) / 10000)),
    0,
  )
export const openCharges = (sid: string) =>
  db()
    .charges.filter((c) => c.studentId === sid && c.net > 0)
    .map((c) => ({ c, open: c.net - c.allocated }))
    .filter((x) => x.open > 0)
    .sort((a, b) => a.c.dueOn.localeCompare(b.c.dueOn))
export const daysOverdue = (sid: string) => {
  const o = openCharges(sid)[0]
  return o ? Math.max(0, daysBetween(o.c.dueOn, TODAY)) : 0
}
export const lastReminder = (ph: string) =>
  db()
    .messages.filter((m) => m.phone === ph && m.kind === 'reminder' && m.status !== 'skipped')
    .map((m) => m.at)
    .sort()
    .pop()

/* ---------- permissions (07-tenant-admin.md §1) ---------- */
const ROLE_PERMS: Record<'ACCOUNTANT' | 'TEACHER', Set<string>> = {
  ACCOUNTANT: new Set([
    'BATCH_READ',
    'ATTENDANCE_READ',
    'STUDENT_WRITE',
    'STUDENT_READ',
    'ENROLMENT_WRITE',
    'CHARGE_WRITE',
    'PAYMENT_CASH_WRITE',
    'PAYMENT_UPI_WRITE',
    'PAYMENT_LINK_CREATE',
    'PAYMENT_REFUND',
    'LEDGER_READ',
    'LEDGER_BALANCE',
    'REMINDER_SEND_NOW',
    'MESSAGE_LOG_READ',
    'REPORTS_READ',
    'EXPORT_FINANCE',
  ]),
  TEACHER: new Set([
    'BATCH_READ',
    'SESSION_WRITE',
    'ATTENDANCE_WRITE',
    'ATTENDANCE_READ',
    'STUDENT_READ',
    'PAYMENT_CASH_WRITE',
    'LEDGER_BALANCE',
    'TEST_WRITE',
    'RESULTS_SEND',
    'RESULTS_READ',
    'ANNOUNCE',
    'SESSION_RESCHEDULE',
  ]),
}
export function can(p: string) {
  const r = me().role
  if (r === 'OWNER') return true
  return ROLE_PERMS[r].has(p) && (p !== 'ANNOUNCE' || db().settings.announcers === 'owner_teachers')
}

/* ---------- message templates (English; ADR-0010) ---------- */
export const T = {
  optin: (kids: string[]) =>
    `${db().centre.name}: we will send fee reminders, receipts, attendance and test results for ${listJoin(kids)} on this number. Reply YES to confirm, or STOP to opt out.`,
  reminder: (items: { id: string; name: string; amount: number }[], lead = '') =>
    `${lead}${db().centre.name}: fee due for ${items.map((i) => `${i.name} ${rup(i.amount)}`).join(', ')}. Pay here: rzp.io/l/${db().centre.prefix.toLowerCase()}-${items[0].id.slice(-4)}. Already paid? Reply RECEIPT. Questions? Reply HELP.`,
  receipt: (kid: string, amt: number, date: string, method: string, rno: string, bal: number) =>
    `${db().centre.name}: received ${rup(amt)} for ${kid} on ${dShort(date)} (${method}, receipt ${rno}). Balance now ${rup(Math.max(0, bal))}. Thank you.${db().settings.receiptPdf ? ' Receipt PDF: tl.in/r/' + rno.slice(-6) : ''}`,
  result: (
    kid: string,
    m: number,
    max: number,
    subject: string,
    test: string,
    date: string,
    avg: number | null,
  ) =>
    `${db().centre.name}: ${kid} scored ${m}/${max} in ${subject} ${test} (${dShort(date)}).${avg != null ? ` Batch average ${avg}/${max}.` : ''} Reply RESULTS for recent results.`,
  absentTest: (kid: string, test: string, date: string) =>
    `${db().centre.name}: ${kid} was absent for ${test} (${dShort(date)}).`,
  correction: (kid: string, test: string, val: string | number, max: number) =>
    `${db().centre.name}: corrected result for ${kid}, ${test}: ${val}/${max}. Sorry for the confusion.`,
  announce: (batchName: string, body: string) =>
    `${db().centre.name}${batchName ? ' · ' + batchName : ''}: ${body}`,
}

/* ---------- fees, ledger, payments ---------- */
export type ChargeDraft = Omit<Charge, 'id' | 'allocated' | 'createdBy'>
/** FEE-2: fee × active days ÷ days in month, discount after, one rounding. */
export function computeCharge(e: Enrolment, period: string): ChargeDraft | null {
  const [y, m] = period.split('-').map(Number)
  const dim = daysIn(y, m),
    f = `${period}-01`,
    l = `${period}-${pad(dim)}`
  if (e.from > l || (e.to && e.to < f)) return null
  const s = St(e.studentId),
    b = B(e.batchId)
  if (!s || !b) return null
  if (statusOn(s, f) !== 'active' && statusOn(s, l) !== 'active') return null
  const from = e.from > f ? e.from : f
  const to = e.to && e.to < l ? e.to : l
  const days = daysBetween(from, to) + 1
  const gross = Math.round((b.feePaise * days) / dim)
  const disc = Math.round((gross * s.discountBps) / 10000)
  const net = roundRupee(gross - disc)
  const due = `${period}-${pad(db().settings.dueDay)}`
  return {
    studentId: s.id,
    batchId: b.id,
    period,
    kind: 'monthly',
    description: `${b.name} · ${monthName(period)}`,
    gross,
    disc,
    net,
    dueOn: from > due ? from : due,
    computation: { fee: b.feePaise, days, dim, bps: s.discountBps },
  }
}
export const compText = (c: {
  computation?: { fee: number; days: number; dim: number; bps: number }
  net: number
}) =>
  c.computation
    ? `${rup(c.computation.fee)} × ${c.computation.days}/${c.computation.dim} days${c.computation.bps ? ` − ${c.computation.bps / 100}%` : ''} = ${rup(c.net)}`
    : ''
export function postCharge(ch: ChargeDraft, at: string, by = 'system') {
  const c: Charge = { id: uid('chg'), allocated: 0, createdBy: by, ...ch }
  db().charges.push(c)
  db().ledger.push({
    id: uid('led'),
    studentId: c.studentId,
    kind: 'charge',
    amount: c.net,
    ref: c.description,
    chargeId: c.id,
    by,
    at,
  })
  return c
}
export function postStatusAdjustment(s: Student, from: string, reason: string, by: string) {
  const [y, m] = from.split('-').map(Number)
  const dim = daysIn(y, m),
    period = from.slice(0, 7),
    rem = dim - parse(from).getDate() + 1
  enrolmentsOf(s.id)
    .filter((e) => activeOn(e, from))
    .forEach((e) => {
      const b = B(e.batchId)!
      if (
        !db().charges.some(
          (c) =>
            c.studentId === s.id &&
            c.batchId === b.id &&
            c.period === period &&
            c.kind === 'monthly',
        )
      )
        return
      const amt = roundRupee(
        Math.round((((b.feePaise * rem) / dim) * (10000 - s.discountBps)) / 10000),
      )
      db().ledger.push({
        id: uid('led'),
        studentId: s.id,
        kind: 'adjustment',
        amount: -amt,
        ref: `${b.name} · ${reason} (${rem}/${dim} days)`,
        by,
        at: from,
      })
    })
}
export function postPayment(p: {
  studentId: string
  amount: number
  method: Method
  utr: string | null
  receivedOn: string
  by: string
  notify?: boolean
}) {
  const rno = `${db().centre.prefix}-2026-${String(db().receiptNext++).padStart(6, '0')}`
  const allocations: Payment['allocations'] = []
  let left = p.amount
  for (const { c, open } of openCharges(p.studentId)) {
    if (left <= 0) break
    const a = Math.min(open, left)
    c.allocated += a
    allocations.push({ chargeId: c.id, amount: a })
    left -= a
  }
  const pay: Payment = {
    id: uid('pay'),
    studentId: p.studentId,
    amount: p.amount,
    method: p.method,
    utr: p.utr,
    receivedOn: p.receivedOn,
    by: p.by,
    receiptNo: rno,
    allocations,
    refunded: 0,
    createdAt: stamp(),
  }
  db().payments.push(pay)
  db().ledger.push({
    id: uid('led'),
    studentId: p.studentId,
    kind: 'payment',
    amount: -p.amount,
    ref: `${rno} · ${methodLabel(p.method)}`,
    paymentId: pay.id,
    by: p.by,
    at: p.receivedOn,
  })
  if (p.notify !== false) {
    const s = St(p.studentId)!
    sendMsg(
      s.parentPhone,
      'receipt',
      T.receipt(
        first(s.name),
        p.amount,
        p.receivedOn,
        methodLabel(p.method),
        rno,
        balance(p.studentId),
      ),
    )
  }
  return pay
}
export function logMsg(
  m: Omit<Message, 'id' | 'dir' | 'reason'> & Partial<Pick<Message, 'dir' | 'reason'>>,
) {
  const msg: Message = { id: uid('msg'), dir: 'out', reason: '', ...m }
  db().messages.push(msg)
  return msg
}
/** Outbox decision, as PreSendChecks would make it (CEN-7, MSG-7). */
export function sendMsg(phone: string, kind: string, text: string) {
  const consent = consentOf(phone)
  let status: Message['status'] = 'delivered',
    reason = ''
  if (db().centre.whatsapp !== 'connected') {
    status = 'held'
    reason = "Waiting for the centre's WhatsApp number"
  } else if (kind === 'receipt' ? consent === 'pending' : kind !== 'optin' && consent !== 'given') {
    status = 'skipped'
    reason = consent === 'opted_out' ? 'Parent opted out' : 'Awaiting consent'
  } else if (db().badPhones.has(phone)) {
    status = 'failed'
    reason = 'Number is not on WhatsApp'
  }
  return logMsg({ phone, kind, text, status, reason, at: stamp() })
}
export const audit = (action: string) =>
  db().audit.unshift({ at: stamp(), by: me().userId, action })

export type PaymentResult =
  | { payment: Payment; replay?: boolean }
  | { error: 'duplicate-utr' | 'near-duplicate'; detail: string }
/** POST /payments with the server-side rules (PAY-1, PAY-3, ADR-0006). */
export function recordPayment(req: {
  key: string
  studentId: string
  amount: number
  method: Method
  utr: string
  receivedOn: string
  confirmDuplicate: boolean
}): PaymentResult {
  if (store.idem[req.key]) return { replay: true, payment: store.idem[req.key] }
  if (req.method === 'upi_manual') {
    const ex = db().payments.find((p) => p.utr && p.utr === req.utr.trim())
    if (ex)
      return {
        error: 'duplicate-utr',
        detail: `UTR ${req.utr.trim()} is already on receipt ${ex.receiptNo} (${St(ex.studentId)!.name}, ${rup(ex.amount)}, ${dShort(ex.receivedOn)}). Nothing was saved.`,
      }
  }
  if (!req.confirmDuplicate) {
    const dup = db().payments.find(
      (p) =>
        p.studentId === req.studentId &&
        p.amount === req.amount &&
        p.receivedOn === req.receivedOn &&
        p.method === req.method,
    )
    if (dup)
      return {
        error: 'near-duplicate',
        detail: `A ${rup(req.amount)} ${methodLabel(req.method)} payment for ${first(St(req.studentId)!.name)} on ${dShort(req.receivedOn)} is already recorded (${dup.receiptNo}, by ${userName(dup.by)}). Record it again only if this is a second, separate payment.`,
      }
  }
  const p = postPayment({
    studentId: req.studentId,
    amount: req.amount,
    method: req.method,
    utr: req.method === 'upi_manual' ? req.utr.trim() : null,
    receivedOn: req.receivedOn,
    by: me().userId,
  })
  store.idem[req.key] = p
  audit(`Payment ${rup(p.amount)} from ${St(p.studentId)!.name} · ${p.receiptNo}`)
  commit()
  return { payment: p }
}
export const feePreview = (period: string) =>
  db()
    .enrolments.map((e) => computeCharge(e, period))
    .filter((c): c is ChargeDraft => !!c && statusOn(St(c.studentId)!, `${period}-01`) === 'active')

export const remindersSentToday = (phone: string) =>
  db().messages.some(
    (m) =>
      m.phone === phone &&
      m.kind === 'reminder' &&
      m.at.startsWith(TODAY) &&
      m.status !== 'skipped',
  )
export const dueItemsFor = (phone: string) =>
  db()
    .students.filter((x) => x.parentPhone === phone && balance(x.id) > 0)
    .map((k) => ({ id: k.id, name: first(k.name), amount: balance(k.id) }))
export function remindNow(studentId: string) {
  const s = St(studentId)!
  const m = sendMsg(s.parentPhone, 'reminder', T.reminder(dueItemsFor(s.parentPhone), 'Reminder: '))
  audit(`Manual reminder to ${s.parentName}`)
  commit()
  return m
}
export function addAdjustment(
  studentId: string,
  kind: 'charge' | 'credit',
  amount: number,
  reason: string,
) {
  const s = St(studentId)!
  if (kind === 'charge')
    postCharge(
      {
        studentId: s.id,
        batchId: null,
        period: TODAY.slice(0, 7),
        kind: 'one_off',
        description: reason,
        gross: amount,
        disc: 0,
        net: amount,
        dueOn: TODAY,
      },
      TODAY,
      me().userId,
    )
  else
    db().ledger.push({
      id: uid('led'),
      studentId: s.id,
      kind: 'credit',
      amount: -amount,
      ref: reason,
      by: me().userId,
      at: TODAY,
    })
  audit(
    `${kind === 'charge' ? 'One-off charge' : 'Credit'} ${rup(amount)} on ${s.name} · ${reason}`,
  )
  commit()
}
export function refund(paymentId: string, amount: number, reason: string) {
  const p = db().payments.find((x) => x.id === paymentId)!
  p.refunded += amount
  db().ledger.push({
    id: uid('led'),
    studentId: p.studentId,
    kind: 'refund',
    amount,
    ref: `${p.receiptNo} · ${reason}`,
    by: me().userId,
    at: TODAY,
  })
  audit(`Refund ${rup(amount)} on ${p.receiptNo} · ${reason}`)
  commit()
}
export function paymentLink(studentId: string) {
  const bal = balance(studentId)
  let l = db().links.find((x) => x.studentId === studentId && x.amount === bal)
  if (!l) {
    l = {
      id: uid('lnk'),
      studentId,
      amount: bal,
      url: `rzp.io/l/${db().centre.prefix.toLowerCase()}-${Math.random().toString(36).slice(2, 7)}`,
    }
    db().links.push(l)
    audit(`Payment link ${rup(bal)} for ${St(studentId)!.name}`)
  }
  return l
}

/* ---------- attendance, marks, results ---------- */
export function saveAttendance(sessionId: string, marks: Record<string, Mark>) {
  const se = sesById(sessionId)!
  const cm = currentMarks(sessionId)
  const before = db().attendance.map((a) => ({ ...a }))
  const cnt = { P: 0, A: 0, L: 0 }
  roster(se).forEach((s) => {
    const m = marks[s.id] || 'P',
      old = cm[s.id]
    cnt[m]++
    if (old && old.mark === m) return
    if (old) old.superseded = true
    db().attendance.push({
      id: uid('att'),
      sessionId,
      studentId: s.id,
      mark: m,
      by: me().userId,
      at: stamp(),
      superseded: false,
      prevMark: old?.mark,
    })
  })
  audit(
    `Attendance ${Object.keys(cm).length ? 'corrected' : 'saved'} · ${B(se.batchId)!.name} · ${dShort(se.date)} · ${cnt.A} absent`,
  )
  commit()
  return {
    cnt,
    undo: () => {
      db().attendance = before
      commit()
    },
  }
}
export function saveMarks(testId: string, values: Record<string, string>) {
  const t = db().tests.find((x) => x.id === testId)!
  const cm = currentMarkRows(testId)
  const changed: string[] = []
  Object.entries(values).forEach(([sid, v]) => {
    if (v === '') return
    const old = cm[sid]
    const nv = v === 'A' ? { marks: null, absent: true } : { marks: Number(v), absent: false }
    if (old && old.absent === nv.absent && old.marks === nv.marks) return
    if (old) {
      old.superseded = true
      changed.push(sid)
    }
    db().marks.push({
      id: uid('mk'),
      testId,
      studentId: sid,
      ...nv,
      by: me().userId,
      at: stamp(),
      superseded: false,
    })
  })
  audit(`Marks saved · ${t.name}`)
  commit()
  return { changed: t.sentAt ? changed : [] }
}
export function sendCorrections(testId: string, studentIds: string[]) {
  const t = db().tests.find((x) => x.id === testId)!
  studentIds.forEach((id) => {
    const s = St(id)!,
      m = currentMarkRows(testId)[id]
    sendMsg(
      s.parentPhone,
      'result',
      T.correction(first(s.name), t.name, m.absent ? 'absent' : (m.marks ?? 0), t.max),
    )
  })
  audit(`Corrected ${studentIds.length} marks in ${t.name}; corrections sent`)
  commit()
}
export function batchAverage(testId: string) {
  const pres = Object.values(currentMarkRows(testId)).filter((m) => !m.absent)
  return pres.length
    ? Math.round((pres.reduce((a, m) => a + (m.marks ?? 0), 0) / pres.length) * 10) / 10
    : null
}
export function sendResults(testId: string) {
  const t = db().tests.find((x) => x.id === testId)!
  const b = B(t.batchId)!
  const cm = currentMarkRows(testId)
  const avg = batchAverage(testId)
  let n = 0
  roster({ batchId: t.batchId, date: t.heldOn }).forEach((s) => {
    const m = cm[s.id]
    if (!m) return
    const text = m.absent
      ? T.absentTest(first(s.name), t.name, t.heldOn)
      : T.result(
          first(s.name),
          m.marks ?? 0,
          t.max,
          b.subject,
          t.name,
          t.heldOn,
          db().settings.avgInResults ? avg : null,
        )
    if (m.absent && !db().settings.absentNotice) return
    if (sendMsg(s.parentPhone, 'result', text).status === 'delivered') n++
  })
  t.sentAt = stamp()
  t.sentBy = me().userId
  audit(`Results of ${t.name} (${b.name}) sent · ${n} parents`)
  commit()
  return n
}
export function createTest(
  batchId: string,
  name: string,
  heldOn: string,
  max: number,
  topic: string,
) {
  const t = { id: uid('tst'), batchId, name, heldOn, max, topic, sentAt: null }
  db().tests.push(t)
  audit(`Created test ${name}`)
  commit()
  return t
}

/* ---------- students and enrolments ---------- */
export function addStudent(f: {
  name: string
  batchId: string
  joined: string
  parent: string
  phone10: string
}) {
  const phone = '+91' + f.phone10
  const sib = db().students.some((s) => s.parentPhone === phone && !s.deleted)
  const b = B(f.batchId)!
  const s: Student = {
    id: uid('stu'),
    name: f.name,
    cls: b.cls,
    parentName: f.parent,
    parentPhone: phone,
    joinedOn: f.joined,
    discountBps: sib ? db().settings.siblingPct * 100 : 0,
    status: 'active',
    deleted: false,
  }
  db().students.push(s)
  const e: Enrolment = { id: uid('enr'), studentId: s.id, batchId: b.id, from: f.joined, to: null }
  db().enrolments.push(e)
  const ch = computeCharge(e, TODAY.slice(0, 7))
  const charged =
    ch && db().feeRuns[TODAY.slice(0, 7)] ? postCharge(ch, f.joined, me().userId) : null
  if (!sib) {
    db().consents[phone] = 'pending'
    sendMsg(phone, 'optin', T.optin([first(s.name)]))
  }
  audit(`Added ${s.name} to ${b.name}`)
  commit()
  return { student: s, charged, sibling: sib }
}
export function changeStatus(
  studentId: string,
  to: Student['status'],
  from: string,
  reason: string,
) {
  const s = St(studentId)!
  db().statusChanges.push({
    id: uid('sc'),
    studentId,
    status: to,
    effectiveOn: from,
    reason,
    by: me().userId,
    at: stamp(),
  })
  if (from <= TODAY) s.status = to
  if (to !== 'active')
    postStatusAdjustment(
      s,
      from,
      `${to === 'paused' ? 'Paused' : 'Left'} from ${dShort(from)}`,
      me().userId,
    )
  audit(`${s.name} → ${to} from ${dShort(from)} · ${reason}`)
  commit()
}
export function deletePersonalData(studentId: string) {
  const s = St(studentId)!
  s.name = 'Student ' + s.id.slice(-4).toUpperCase()
  s.parentName = 'Parent (deleted)'
  s.parentPhone = '+91deleted' + s.id.slice(-4)
  s.deleted = true
  s.status = 'left'
  audit('Personal data deleted for a student')
  commit()
}
export function recordConsent(studentId: string) {
  const s = St(studentId)!
  db().consents[s.parentPhone] = 'given'
  audit(`Verbal consent recorded for ${s.parentName}`)
  commit()
}
export function resendOptin(studentId: string) {
  const s = St(studentId)!
  const m = sendMsg(
    s.parentPhone,
    'optin',
    T.optin(
      db()
        .students.filter((x) => x.parentPhone === s.parentPhone)
        .map((x) => first(x.name)),
    ),
  )
  commit()
  return m
}
export function enrol(studentId: string, batchId: string, from: string, override: string) {
  const e: Enrolment = { id: uid('enr'), studentId, batchId, from, to: null }
  db().enrolments.push(e)
  const ch = computeCharge(e, TODAY.slice(0, 7))
  if (ch && db().feeRuns[TODAY.slice(0, 7)]) postCharge(ch, from, me().userId)
  audit(
    `Enrolled ${St(studentId)!.name} in ${B(batchId)!.name}${override ? ' · over capacity: ' + override : ''}`,
  )
  commit()
}
export function endEnrolment(enrolmentId: string, to: string) {
  const e = db().enrolments.find((x) => x.id === enrolmentId)!
  e.to = to
  const [y, m] = to.split('-').map(Number)
  const dim = daysIn(y, m),
    rem = dim - parse(to).getDate()
  if (rem > 0 && to.startsWith(TODAY.slice(0, 7))) {
    const s = St(e.studentId)!,
      b = B(e.batchId)!
    db().ledger.push({
      id: uid('led'),
      studentId: s.id,
      kind: 'adjustment',
      amount: -roundRupee(
        Math.round((((b.feePaise * rem) / dim) * (10000 - s.discountBps)) / 10000),
      ),
      ref: `${b.name} · ended ${dShort(to)} (${rem}/${dim} days)`,
      by: me().userId,
      at: to,
    })
  }
  audit(`Ended ${St(e.studentId)!.name} in ${B(e.batchId)!.name} on ${dShort(to)}`)
  commit()
}

/* ---------- sessions, batches, announcements ---------- */
function tellParents(se: Session, body: string, kind: 'manual' | 'auto') {
  const b = B(se.batchId)!
  let n = 0
  phonesOf(roster(se)).forEach((p) => {
    if (sendMsg(p, 'announce', T.announce(b.name, body)).status === 'delivered') n++
  })
  db().announcements.push({
    id: uid('ann'),
    batchId: b.id,
    body: body[0].toUpperCase() + body.slice(1),
    kind,
    by: me().userId,
    at: stamp(),
    recipients: n,
  })
  return n
}
export function cancelSession(sessionId: string, reason: string) {
  const se = sesById(sessionId)!
  se.status = 'cancelled'
  se.cancelReason = reason
  const n = db().settings.autoAnnounce
    ? tellParents(se, `class on ${dDay(se.date)} is cancelled (${reason}).`, 'auto')
    : 0
  audit(`Cancelled ${B(se.batchId)!.name} on ${dShort(se.date)} · ${reason}`)
  commit()
  return n
}
export function addExtraSession(
  batchId: string,
  date: string,
  start: string,
  end: string,
  tell: boolean,
) {
  const se: Session = {
    id: `ses_${batchId}_${date}x${Math.random().toString(36).slice(2, 5)}`,
    batchId,
    date,
    start,
    end,
    status: 'scheduled',
    kind: 'extra',
  }
  db().sessions.push(se)
  const n = tell ? tellParents(se, `extra class on ${dDay(date)}, ${start}–${end}.`, 'manual') : 0
  audit(`Extra class for ${B(batchId)!.name} on ${dShort(date)}`)
  commit()
  return n
}
export function reschedule(sessionId: string, date: string, start: string, reason: string) {
  const se = sesById(sessionId)!
  const old = `${dDay(se.date)} ${se.start}`
  se.date = date
  se.start = start
  const n = db().settings.autoAnnounce
    ? tellParents(se, `class on ${old} moves to ${dDay(date)} ${start} (${reason}).`, 'auto')
    : 0
  audit(`Moved ${B(se.batchId)!.name} from ${old} to ${dShort(date)} ${start}`)
  commit()
  return n
}
export function saveBatch(
  id: string | null,
  f: {
    name: string
    teacherId: string
    days: Day[]
    start: string
    end: string
    feePaise: number
    capacity: number
  },
) {
  if (id) {
    Object.assign(B(id)!, f)
    audit(`Edited batch ${f.name}`)
    commit()
    return B(id)!
  }
  const b: Batch = {
    id: uid('bat'),
    subject: f.name.split(' ').pop() || '',
    cls: (f.name.match(/\d+/) || [''])[0],
    status: 'active',
    ...f,
  }
  db().batches.push(b)
  for (let d = 0; d <= 30; d++) {
    const date = addDays(TODAY, d)
    if (
      b.days.includes(DOW[parse(date).getDay()] as Day) &&
      !db().holidays.some((h) => h.day === date)
    )
      db().sessions.push({
        id: `ses_${b.id}_${date}`,
        batchId: b.id,
        date,
        start: b.start,
        end: b.end,
        status: 'scheduled',
        kind: 'regular',
      })
  }
  if (!db().feeRuns[TODAY.slice(0, 7)])
    db().feeRuns[TODAY.slice(0, 7)] = {
      status: 'completed',
      at: `${TODAY.slice(0, 7)}-01 00:10`,
      count: 0,
    }
  audit(`Created batch ${b.name}`)
  commit()
  return b
}
export const announceTargets = (batchId: string) =>
  (batchId === 'all'
    ? db().students
    : db()
        .enrolments.filter((e) => e.batchId === batchId && activeOn(e, TODAY))
        .map((e) => St(e.studentId))
  ).filter((s): s is Student => !!s && !s.deleted)
export function announce(batchId: string, body: string) {
  const bName = batchId === 'all' ? '' : B(batchId)!.name
  let n = 0
  phonesOf(announceTargets(batchId)).forEach((p) => {
    if (sendMsg(p, 'announce', T.announce(bName, body)).status === 'delivered') n++
  })
  db().announcements.push({
    id: uid('ann'),
    batchId: batchId === 'all' ? null : batchId,
    body,
    kind: 'manual',
    by: me().userId,
    at: stamp(),
    recipients: n,
  })
  audit(`Announcement to ${bName || 'all batches'} · ${n} parents`)
  commit()
  return n
}

/* ---------- settings, staff, centre ---------- */
export function saveSettings(
  centre: { name: string; address: string; timezone: string; prefix: string },
  settings: Settings,
) {
  const d = db()
  const changes = Object.keys(settings).filter(
    (k) =>
      JSON.stringify(settings[k as keyof Settings]) !==
      JSON.stringify(d.settings[k as keyof Settings]),
  )
  Object.assign(d.centre, {
    ...centre,
    prefix: d.payments.length ? d.centre.prefix : centre.prefix,
  })
  d.settings = JSON.parse(JSON.stringify(settings))
  d.onboarding.settingsConfirmed = true
  audit(`Settings changed: ${changes.join(', ') || 'confirmed'}`)
  commit()
}
export function addHoliday(day: string, reason: string) {
  db().holidays.push({ day, reason })
  const gone = db().sessions.filter(
    (s) => s.date === day && !Object.keys(currentMarks(s.id)).length,
  )
  db().sessions = db().sessions.filter((s) => !gone.includes(s))
  audit(`Holiday ${dShort(day)} · ${reason} · ${gone.length} classes removed`)
  commit()
  return gone.length
}
export function removeHoliday(day: string) {
  db().holidays = db().holidays.filter((x) => x.day !== day)
  db().batches.forEach((b) => {
    if (
      b.days.includes(DOW[parse(day).getDay()] as Day) &&
      !db().sessions.some((s) => s.batchId === b.id && s.date === day)
    )
      db().sessions.push({
        id: `ses_${b.id}_${day}`,
        batchId: b.id,
        date: day,
        start: b.start,
        end: b.end,
        status: 'scheduled',
        kind: 'regular',
      })
  })
  audit(`Removed holiday ${dShort(day)}`)
  commit()
}
export function inviteUser(name: string, phone10: string, role: Role) {
  const u: User = { id: uid('usr'), name, phone: '+91' + phone10, role, status: 'active' }
  db().users.push(u)
  audit(`Invited ${name} as ${roleLabel(role)}`)
  commit()
}
export function setUserStatus(id: string, status: User['status']) {
  const u = Us(id)!
  u.status = status
  audit(`${status === 'active' ? 'Reactivated' : 'Deactivated'} ${u.name}`)
  commit()
}
export function setUserRole(id: string, role: Role) {
  const u = Us(id)!
  u.role = role
  audit(`Changed ${u.name}'s role to ${roleLabel(role)}`)
  commit()
}
export function startWhatsApp() {
  db().centre.whatsapp = 'pending'
  audit('Started WhatsApp Business connection')
  commit()
}
export function approveWhatsApp() {
  db().centre.whatsapp = 'connected'
  let n = 0
  db().messages.forEach((m) => {
    if (m.status !== 'held') return
    const c = consentOf(m.phone)
    if (
      (m.kind !== 'optin' && m.kind !== 'receipt' && c !== 'given') ||
      (m.kind === 'receipt' && c === 'pending')
    ) {
      m.status = 'skipped'
      m.reason = c === 'opted_out' ? 'Parent opted out' : 'Awaiting consent'
    } else {
      m.status = 'delivered'
      m.reason = ''
      n++
    }
  })
  audit('WhatsApp Business number approved')
  commit()
  return n
}
export function connectRazorpay() {
  db().centre.razorpay = 'connected'
  audit('Razorpay connected')
  commit()
}
export function setCashOnly(v: boolean) {
  db().onboarding.cashOnly = v
  commit()
}
export function markFeePreviewChecked() {
  db().onboarding.feePreviewed = true
  audit('Next fee run preview checked')
  commit()
}

export function onboardingSteps() {
  const d = db(),
    o = d.onboarding
  return [
    {
      k: 'settings',
      t: 'Confirm centre settings',
      d: 'Due day, quiet hours, receipt prefix',
      done: o.settingsConfirmed,
      to: '/settings',
    },
    {
      k: 'whatsapp',
      t: 'Connect your WhatsApp number',
      d:
        d.centre.whatsapp === 'pending'
          ? 'Meta is reviewing it (2–5 days). Messages wait until approval.'
          : "Parents see your centre's name. Until then messages are held.",
      done: d.centre.whatsapp === 'connected',
      to: '/settings/whatsapp',
      state: d.centre.whatsapp === 'pending' ? 'In review' : '',
    },
    {
      k: 'batch',
      t: 'Create your first batch',
      d: 'Subject, days, time and monthly fee',
      done: d.batches.length > 0,
      sheet: 'batch',
    },
    {
      k: 'teacher',
      t: 'Invite a teacher',
      d: 'They sign in with a WhatsApp code',
      done: d.users.some((u) => u.role !== 'OWNER'),
      to: '/settings/staff',
    },
    {
      k: 'students',
      t: 'Add students',
      d: 'One by one, or CSV import on Starter',
      done: d.students.length > 0,
      sheet: 'student',
    },
    {
      k: 'consent',
      t: "Get the first parent's YES",
      d: 'Opt-in goes out when you add a student',
      done: Object.values(d.consents).includes('given'),
      to: '/students',
    },
    {
      k: 'payments',
      t: 'Connect Razorpay or choose cash and UPI only',
      d: 'Payment links need a verified account',
      done: d.centre.razorpay === 'connected' || o.cashOnly,
      to: '/settings/whatsapp',
    },
    {
      k: 'testpay',
      t: 'Record a test payment',
      d: 'Check the receipt arrives on your own phone',
      done: d.payments.length > 0,
      sheet: 'payment',
    },
    {
      k: 'feerun',
      t: 'Preview the next fee run',
      d: 'See every charge before the 1st',
      done: o.feePreviewed,
      to: '/fees/run',
    },
  ]
}

/* ---------- parent WhatsApp replies (prototype only) ---------- */
export function parentReply(ph: string, text: string) {
  const kids = db().students.filter((s) => s.parentPhone === ph && !s.deleted)
  const k = text.toUpperCase()
  logMsg({ phone: ph, dir: 'in', kind: 'inbound', text, status: 'received', at: stamp() })
  let out: string
  if (k === 'YES') {
    db().consents[ph] = 'given'
    out = `Thank you. You'll receive fee reminders, receipts, attendance and test results for ${listJoin(kids.map((s) => first(s.name)))}.`
    audit(`${kids[0].parentName} opted in`)
  } else if (k === 'STOP') {
    db().consents[ph] = 'opted_out'
    out = 'Reminders are off. You will still receive receipts. Reply YES to turn them back on.'
    audit(`${kids[0].parentName} opted out (STOP)`)
  } else if (k === 'DUES')
    out = kids
      .map(
        (s) =>
          `${first(s.name)}: ${balance(s.id) > 0 ? `balance ${rup(balance(s.id))} · pay: rzp.io/l/${db().centre.prefix.toLowerCase()}-${s.id.slice(-2)}` : 'nothing due'}`,
      )
      .join('\n')
  else if (k === 'ATTENDANCE')
    out = kids
      .map((s) => {
        const a = studentAtt(s.id),
          ab = studentAbsences(s.id)
        return `${first(s.name)}, last 30 days: ${a.P} present, ${a.A} absent, ${a.L} late${ab.length ? '. Absent: ' + ab.map(dShort).join(', ') : ''}`
      })
      .join('\n')
  else if (k === 'RESULTS')
    out = kids
      .map((s) => {
        const r = db()
          .tests.filter((t) => t.sentAt && currentMarkRows(t.id)[s.id])
          .slice(-3)
          .map((t) => {
            const m = currentMarkRows(t.id)[s.id]
            return `${t.name}: ${m.absent ? 'absent' : m.marks + '/' + t.max}`
          })
        return `${first(s.name)}: ${r.length ? r.join('; ') : 'no results yet'}`
      })
      .join('\n')
  else if (k === 'RECEIPT')
    out =
      kids
        .flatMap((s) =>
          db()
            .payments.filter((p) => p.studentId === s.id)
            .slice(-3)
            .map(
              (p) =>
                `${p.receiptNo} · ${rup(p.amount)} · ${dShort(p.receivedOn)} · ${first(s.name)}`,
            ),
        )
        .join('\n') || 'No receipts yet.'
  else if (k === 'HELP') {
    out = `${db().centre.name}: call +91 33 4000 1200 (10 am–7 pm). We've also passed your message to the owner.`
    audit(`Help request from ${kids[0].parentName}`)
  } else {
    out = `We've passed this to ${db().centre.name}. They'll reply soon.`
    audit(`Message from ${kids[0].parentName} forwarded to the owner`)
  }
  logMsg({ phone: ph, kind: 'auto', text: out, status: 'delivered', at: stamp() })
  commit()
}
