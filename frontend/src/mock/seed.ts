import {
  TODAY,
  addDays,
  daysBetween,
  first,
  pad,
  parse,
  stamp,
  uid,
  DOW,
} from '../shared/lib/format'
import {
  computeCharge,
  logMsg,
  methodLabel,
  phonesOf,
  postCharge,
  postPayment,
  postStatusAdjustment,
  roster,
  T,
} from './domain'
import { commit, store } from './store'
import type { DB, Day, Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  dueDay: 5,
  reminderOffsets: [0, 3, 7],
  quietFrom: '20:00',
  quietTo: '08:00',
  digestOn: true,
  digestDay: 'SUN',
  siblingPct: 10,
  language: 'English',
  linkFee: 'absorb',
  editWindow: 7,
  marksWindow: 14,
  lowAttendance: 75,
  dupWindow: 24,
  feeds: true,
  nudgeMin: 10,
  avgInResults: true,
  absentNotice: false,
  autoAnnounce: true,
  announcers: 'owner_teachers',
  receiptPdf: true,
  dailyQuote: false,
}

function blankDB(): DB {
  return {
    centre: {
      id: '',
      name: '',
      address: '',
      timezone: 'Asia/Kolkata',
      prefix: 'TL',
      whatsapp: 'not_connected',
      razorpay: 'not_connected',
      plan: 'Starter',
      trialEndsOn: null,
      createdOn: TODAY,
    },
    settings: { ...DEFAULT_SETTINGS, reminderOffsets: [0, 3, 7] },
    onboarding: { settingsConfirmed: false, feePreviewed: false, cashOnly: false },
    users: [],
    batches: [],
    holidays: [],
    students: [],
    enrolments: [],
    statusChanges: [],
    consents: {},
    sessions: [],
    attendance: [],
    charges: [],
    payments: [],
    ledger: [],
    tests: [],
    marks: [],
    messages: [],
    announcements: [],
    audit: [],
    links: [],
    receiptNext: 1,
    feeRuns: {},
    badPhones: new Set(),
  }
}

/** Bright Minds Academy, Belur: the PRD's worked example, four weeks of history around 23 Oct 2026. */
export function seedBrightMinds(): DB {
  const db = blankDB()
  store.db = db
  db.centre = {
    id: 'cen_01J9BM',
    name: 'Bright Minds Academy',
    address: '12 GT Road, Belur, Howrah',
    timezone: 'Asia/Kolkata',
    prefix: 'BM',
    whatsapp: 'connected',
    razorpay: 'connected',
    plan: 'Starter',
    trialEndsOn: null,
    createdOn: '2026-06-01',
  }
  db.onboarding = { settingsConfirmed: true, feePreviewed: true, cashOnly: false }
  db.users = [
    {
      id: 'u_owner',
      name: 'Pranab Dutta',
      phone: '+919830000001',
      role: 'OWNER',
      status: 'active',
      email: 'dutta@brightminds.in',
      emailVerified: true,
      pw: 'Tuition@2026',
    },
    { id: 'u_t1', name: 'Anita Sen', phone: '+919830000002', role: 'TEACHER', status: 'active' },
    { id: 'u_t2', name: 'Bikash Roy', phone: '+919830000003', role: 'TEACHER', status: 'active' },
    {
      id: 'u_acc',
      name: 'Sumit Ghosh',
      phone: '+919830000004',
      role: 'ACCOUNTANT',
      status: 'active',
      email: 'sumit@brightminds.in',
      emailVerified: true,
      pw: 'Tuition@2026',
    },
  ]
  db.batches = [
    {
      id: 'b1',
      name: 'Class 11 Physics',
      subject: 'Physics',
      cls: '11',
      teacherId: 'u_t1',
      days: ['MON', 'WED', 'FRI'],
      start: '17:00',
      end: '18:30',
      feePaise: 180000,
      capacity: 30,
      status: 'active',
    },
    {
      id: 'b2',
      name: 'Class 10 Maths',
      subject: 'Maths',
      cls: '10',
      teacherId: 'u_t2',
      days: ['TUE', 'THU', 'SAT'],
      start: '16:00',
      end: '17:30',
      feePaise: 120000,
      capacity: 30,
      status: 'active',
    },
    {
      id: 'b3',
      name: 'Class 10 Science',
      subject: 'Science',
      cls: '10',
      teacherId: 'u_owner',
      days: ['MON', 'WED', 'FRI'],
      start: '15:30',
      end: '17:00',
      feePaise: 120000,
      capacity: 30,
      status: 'active',
    },
    {
      id: 'b4',
      name: 'Class 11 Chemistry',
      subject: 'Chemistry',
      cls: '11',
      teacherId: 'u_t1',
      days: ['TUE', 'THU', 'SAT'],
      start: '18:30',
      end: '20:00',
      feePaise: 180000,
      capacity: 25,
      status: 'active',
    },
  ]
  db.holidays = [
    { day: '2026-10-20', reason: 'Kali Puja' },
    { day: '2026-11-11', reason: 'Bhai Phonta' },
  ]
  const names = [
    'Arjun Sen',
    'Riya Das',
    'Rohan Das',
    'Sneha Pal',
    'Ishaan Roy',
    'Priya Ghosh',
    'Aditya Bose',
    'Ananya Dutta',
    'Kabir Mitra',
    'Tanvi Saha',
    'Dev Chatterjee',
    'Meher Khan',
    'Ritwik Nag',
    'Pooja Mondal',
    'Sahil Dey',
    'Oishi Basu',
    'Rahul Hazra',
    'Nilanjana Kar',
    'Ayaan Ali',
    'Diya Roy',
    'Soham Paul',
    'Megha Sarkar',
    'Arnab Guha',
    'Trisha Das',
  ]
  const bi = ['b1', 'b2', 'b3', 'b4']
  names.forEach((n, i) => {
    const surname = n.split(' ')[1]
    const id = 'stu_' + pad(i + 1)
    const phone =
      n === 'Rohan Das'
        ? db.students[1].parentPhone
        : '+919000' + String(10001 + i * 7).padStart(6, '0')
    const joined = i === 7 ? '2026-10-19' : i === 13 ? '2026-10-12' : '2026-06-01'
    const b = db.batches.find((x) => x.id === bi[i % 4])!
    db.students.push({
      id,
      name: n,
      cls: b.cls,
      parentName: (n.endsWith('Das') ? 'Mrs ' : i % 2 ? 'Mrs ' : 'Mr ') + surname,
      parentPhone: phone,
      joinedOn: joined,
      discountBps: n === 'Rohan Das' ? 1000 : 0,
      status: 'active',
      deleted: false,
    })
    db.enrolments.push({
      id: 'enr_' + pad(i + 1),
      studentId: id,
      batchId: b.id,
      from: joined,
      to: null,
    })
    if ([0, 4, 8].includes(i))
      db.enrolments.push({
        id: 'enr_' + pad(i + 1) + 'b',
        studentId: id,
        batchId: 'b4',
        from: '2026-06-01',
        to: null,
      })
    if (i === 1)
      db.enrolments.push({
        id: 'enr_02b',
        studentId: id,
        batchId: 'b3',
        from: '2026-06-01',
        to: null,
      })
  })
  db.students.forEach(
    (s, i) =>
      (db.consents[s.parentPhone] = i === 21 ? 'pending' : i === 22 ? 'opted_out' : 'given'),
  )
  db.badPhones = new Set([db.students[23].parentPhone])
  db.statusChanges.push({
    id: 'sc1',
    studentId: 'stu_20',
    status: 'paused',
    effectiveOn: '2026-10-16',
    reason: 'Family travel; back in November',
    by: 'u_owner',
    at: '2026-10-15 18:10',
  })
  db.students[19].status = 'paused'
  for (let d = -28; d <= 10; d++) {
    const date = addDays(TODAY, d)
    if (db.holidays.some((h) => h.day === date)) continue
    for (const b of db.batches)
      if (b.days.includes(DOW[parse(date).getDay()] as Day))
        db.sessions.push({
          id: `ses_${b.id}_${date}`,
          batchId: b.id,
          date,
          start: b.start,
          end: b.end,
          status: 'scheduled',
          kind: 'regular',
        })
  }
  const c = db.sessions.find((s) => s.id === 'ses_b2_2026-10-24')
  if (c) Object.assign(c, { status: 'cancelled', cancelReason: 'Teacher unwell' })
  db.sessions.push({
    id: 'ses_b1_2026-10-25x',
    batchId: 'b1',
    date: '2026-10-25',
    start: '10:00',
    end: '11:30',
    status: 'scheduled',
    kind: 'extra',
  })

  for (const se of db.sessions) {
    if (se.date >= TODAY || se.status !== 'scheduled') continue
    const b = db.batches.find((x) => x.id === se.batchId)!,
      k0 = daysBetween('2026-01-01', se.date)
    roster(se).forEach((s, k) => {
      const mark = (k * 7 + k0) % 11 === 0 ? 'A' : (k * 5 + k0) % 17 === 0 ? 'L' : 'P'
      db.attendance.push({
        id: uid('att'),
        sessionId: se.id,
        studentId: s.id,
        mark,
        by: b.teacherId,
        at: `${se.date} ${se.end}`,
        superseded: false,
      })
    })
  }
  const row = db.attendance.find((a) => a.sessionId === 'ses_b1_2026-10-21')
  if (row) {
    row.superseded = true
    db.attendance.push({
      id: uid('att'),
      sessionId: row.sessionId,
      studentId: row.studentId,
      mark: row.mark === 'A' ? 'L' : 'A',
      by: 'u_owner',
      at: '2026-10-22 09:14',
      superseded: false,
      prevMark: row.mark,
    })
  }
  for (const period of ['2026-09', '2026-10']) {
    db.enrolments.forEach((e) => {
      const ch = computeCharge(e, period)
      if (ch) postCharge(ch, `${period}-01`)
    })
    db.feeRuns[period] = {
      status: 'completed',
      at: `${period}-01 00:10`,
      count: db.charges.filter((x) => x.period === period && x.kind === 'monthly').length,
    }
  }
  postStatusAdjustment(db.students[19], '2026-10-16', 'Paused from 16 Oct', 'u_owner')
  db.students.forEach((s, k) => {
    const sep = db.charges
      .filter((x) => x.studentId === s.id && x.period === '2026-09')
      .reduce((a, x) => a + x.net, 0)
    if (sep && k % 6 !== 5)
      postPayment({
        studentId: s.id,
        amount: sep,
        method: k % 3 === 0 ? 'cash' : 'upi_manual',
        utr: k % 3 === 0 ? null : '4' + String(726100000 + k * 1373).padStart(11, '0'),
        receivedOn: `2026-09-${pad(3 + (k % 9))}`,
        by: k % 2 ? 'u_acc' : 'u_owner',
        notify: false,
      })
    const oct = db.charges
      .filter((x) => x.studentId === s.id && x.period === '2026-10')
      .reduce((a, x) => a + x.net, 0)
    if (oct && k % 2 === 0 && k % 5 !== 0)
      postPayment({
        studentId: s.id,
        amount: oct + (k === 10 ? 50000 : 0),
        method: k % 4 === 0 ? 'razorpay' : 'cash',
        utr: null,
        receivedOn: `2026-10-${pad(2 + (k % 6))}`,
        by: k % 4 === 0 ? 'system' : 'u_t1',
        notify: false,
      })
  })
  phonesOf(db.students).forEach((ph) => {
    const kids = db.students.filter((s) => s.parentPhone === ph).map((s) => first(s.name))
    const bad = db.badPhones.has(ph)
    logMsg({
      phone: ph,
      kind: 'optin',
      text: T.optin(kids),
      status: bad ? 'failed' : 'delivered',
      reason: bad ? 'Number is not on WhatsApp' : '',
      at: '2026-06-02 10:00',
    })
  })
  phonesOf(db.students).forEach((ph) => {
    const kids = db.students.filter((s) => s.parentPhone === ph)
    const due = kids
      .map((s) => ({
        id: s.id,
        name: first(s.name),
        amount:
          db.charges
            .filter((x) => x.studentId === s.id && x.period === '2026-10')
            .reduce((a, x) => a + x.net, 0) -
          db.payments
            .filter(
              (p) =>
                p.studentId === s.id && p.receivedOn < '2026-10-05' && p.receivedOn >= '2026-10-01',
            )
            .reduce((a, p) => a + p.amount, 0),
      }))
      .filter((x) => x.amount > 0)
    const consent = db.consents[ph]
    const at = '2026-10-05 08:00'
    if (!due.length)
      return void logMsg({
        phone: ph,
        kind: 'reminder',
        text: '(reminder for October)',
        status: 'skipped',
        reason: 'Paid before send',
        at,
      })
    if (consent !== 'given')
      return void logMsg({
        phone: ph,
        kind: 'reminder',
        text: T.reminder(due),
        status: 'skipped',
        reason: consent === 'opted_out' ? 'Parent opted out' : 'Awaiting consent',
        at,
      })
    const bad = db.badPhones.has(ph)
    logMsg({
      phone: ph,
      kind: 'reminder',
      text: T.reminder(due),
      status: bad ? 'failed' : 'delivered',
      reason: bad ? 'Number is not on WhatsApp' : '',
      at,
    })
  })
  db.payments
    .filter((p) => p.receivedOn >= '2026-10-01')
    .forEach((p) => {
      const s = db.students.find((x) => x.id === p.studentId)!
      const pending = db.consents[s.parentPhone] === 'pending'
      logMsg({
        phone: s.parentPhone,
        kind: 'receipt',
        text: T.receipt(
          first(s.name),
          p.amount,
          p.receivedOn,
          methodLabel(p.method),
          p.receiptNo,
          0,
        ),
        status: pending ? 'skipped' : 'delivered',
        reason: pending ? 'Awaiting consent' : '',
        at: `${p.receivedOn} 11:20`,
      })
    })
  db.tests.push(
    {
      id: 'tst_1',
      batchId: 'b1',
      name: 'Unit Test 2',
      heldOn: '2026-10-14',
      max: 50,
      topic: 'Kinematics',
      sentAt: '2026-10-15 19:05',
      sentBy: 'u_t1',
    },
    {
      id: 'tst_2',
      batchId: 'b2',
      name: 'Algebra Test',
      heldOn: '2026-10-16',
      max: 40,
      topic: 'Quadratics',
      sentAt: null,
    },
    {
      id: 'tst_3',
      batchId: 'b1',
      name: 'Unit Test 3',
      heldOn: '2026-10-21',
      max: 50,
      topic: 'Laws of motion',
      sentAt: null,
    },
  )
  roster({ batchId: 'b1', date: '2026-10-14' }).forEach((s, k) =>
    db.marks.push({
      id: uid('mk'),
      testId: 'tst_1',
      studentId: s.id,
      marks: 28 + ((k * 7) % 22),
      absent: false,
      by: 'u_t1',
      at: '2026-10-15 18:00',
      superseded: false,
    }),
  )
  roster({ batchId: 'b2', date: '2026-10-16' }).forEach((s, k) =>
    db.marks.push({
      id: uid('mk'),
      testId: 'tst_2',
      studentId: s.id,
      marks: k === 2 ? null : 18 + ((k * 6) % 22),
      absent: k === 2,
      by: 'u_t2',
      at: '2026-10-17 20:00',
      superseded: false,
    }),
  )
  roster({ batchId: 'b1', date: '2026-10-21' })
    .slice(0, 3)
    .forEach((s, k) =>
      db.marks.push({
        id: uid('mk'),
        testId: 'tst_3',
        studentId: s.id,
        marks: 30 + ((k * 5) % 20),
        absent: false,
        by: 'u_t1',
        at: '2026-10-22 21:00',
        superseded: false,
      }),
    )
  db.announcements.push(
    {
      id: 'ann_1',
      batchId: 'b2',
      body: 'No Maths class on Tue 20 Oct (Kali Puja). Regular classes from Thursday.',
      kind: 'manual',
      by: 'u_t2',
      at: '2026-10-18 11:20',
      recipients: 6,
    },
    {
      id: 'ann_2',
      batchId: 'b2',
      body: 'Class on Sat 24 Oct is cancelled (Teacher unwell).',
      kind: 'auto',
      by: 'u_t2',
      at: '2026-10-22 18:40',
      recipients: 6,
    },
    {
      id: 'ann_3',
      batchId: 'b1',
      body: 'Extra Physics class on Sun 25 Oct, 10:00–11:30, for Unit Test 3 doubts.',
      kind: 'manual',
      by: 'u_t1',
      at: '2026-10-22 20:05',
      recipients: 6,
    },
  )
  db.audit.push(
    {
      at: '2026-10-22 18:40',
      by: 'u_t2',
      action: 'Cancelled Class 10 Maths on Sat 24 Oct · Teacher unwell',
    },
    {
      at: '2026-10-22 09:14',
      by: 'u_owner',
      action: 'Corrected attendance for Class 11 Physics · Wed 21 Oct',
    },
    {
      at: '2026-10-15 18:10',
      by: 'u_owner',
      action: 'Diya Roy paused from 16 Oct · Family travel; back in November',
    },
    {
      at: '2026-10-01 00:10',
      by: 'system',
      action: 'October fee run completed · ' + db.feeRuns['2026-10'].count + ' charges',
    },
  )
  return db
}

/** A freshly registered centre (CEN-6): owner only, trial running, WhatsApp not connected. */
export function emptyCentre(f: {
  centreName: string
  ownerName: string
  phone: string
  email: string
  pw: string
  prefix: string
  city: string
}): DB {
  const db = blankDB()
  db.centre = {
    ...db.centre,
    id: uid('cen'),
    name: f.centreName,
    address: f.city,
    prefix: f.prefix,
    trialEndsOn: addDays(TODAY, 30),
    createdOn: TODAY,
  }
  db.users = [
    {
      id: 'u_new',
      name: f.ownerName,
      phone: f.phone,
      role: 'OWNER',
      status: 'active',
      email: f.email,
      emailVerified: false,
      pw: f.pw,
    },
  ]
  db.audit.push({
    at: stamp(),
    by: 'u_new',
    action: `Centre registered · ${f.centreName} · 30-day Starter trial`,
  })
  return db
}

export function resetDemo() {
  store.db = seedBrightMinds()
  store.idem = {}
  const s = store.session
  if (s.signedIn) {
    const u = store.db.users.find((x) => x.role === s.role) || store.db.users[0]
    store.session = { signedIn: true, role: u.role, userId: u.id }
  }
  commit()
}
