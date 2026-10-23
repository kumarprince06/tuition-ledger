import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  addExtraSession,
  B,
  batchAverage,
  cancelSession,
  consentOf,
  createTest,
  currentMarkRows,
  myBatches,
  phonesOf,
  reschedule,
  roster,
  saveBatch,
  sendResults,
  sesById,
  St,
  T,
  userName,
} from '../../mock/domain'
import { store } from '../../mock/store'
import type { Day } from '../../mock/types'
import { TODAY, addDays, dDay, dShort, DAYNAME, first, plural } from '../../shared/lib/format'
import { Check, Field } from '../../shared/ui/kit'
import { Bubble, CancelButton, Sheet, useSheet, useToast } from '../../shared/ui/overlay'

const ALL_DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

export function BatchSheet({ batchId }: { batchId?: string }) {
  const toast = useToast()
  const nav = useNavigate()
  const { close } = useSheet()
  const b = B(batchId)
  const [f, setF] = useState(() =>
    b
      ? {
          name: b.name,
          teacherId: b.teacherId,
          days: [...b.days],
          start: b.start,
          end: b.end,
          fee: String(b.feePaise / 100),
          cap: String(b.capacity),
        }
      : {
          name: '',
          teacherId:
            store.db.users.find((u) => u.role === 'TEACHER' && u.status === 'active')?.id ||
            store.session.userId,
          days: ['MON', 'WED', 'FRI'] as Day[],
          start: '17:00',
          end: '18:30',
          fee: '1200',
          cap: '30',
        },
  )
  const ok =
    f.name.trim().length >= 3 &&
    f.days.length > 0 &&
    f.end > f.start &&
    Number(f.fee) > 0 &&
    Number(f.cap) > 0
  return (
    <Sheet
      title={b ? 'Edit batch' : 'New batch'}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const saved = saveBatch(b?.id || null, {
                name: f.name.trim(),
                teacherId: f.teacherId,
                days: f.days,
                start: f.start,
                end: f.end,
                feePaise: Math.round(Number(f.fee) * 100),
                capacity: Number(f.cap),
              })
              close()
              if (b) toast('Batch saved. A fee change applies from next month.')
              else {
                toast(
                  `${saved.name} created with ${plural(store.db.sessions.filter((s) => s.batchId === saved.id).length, 'class', 'classes')} for the next 30 days.`,
                )
                nav(`/classes/${saved.id}`)
              }
            }}
          >
            {b ? 'Save' : 'Create batch'}
          </button>
        </>
      }
    >
      <Field label="Name">
        <input
          className="inp"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          placeholder="Class 10 English"
          autoFocus
        />
      </Field>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Teacher">
          <select
            className="inp"
            value={f.teacherId}
            onChange={(e) => setF({ ...f, teacherId: e.target.value })}
          >
            {store.db.users
              .filter((u) => u.role !== 'ACCOUNTANT' && u.status === 'active')
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                  {u.role === 'OWNER' ? ' (owner)' : ''}
                </option>
              ))}
          </select>
        </Field>
        <Field
          label="Monthly fee (₹)"
          hint={b ? "A change applies from next month; this month's charges stay." : undefined}
        >
          <input
            className="inp tnum"
            inputMode="numeric"
            value={f.fee}
            onChange={(e) => setF({ ...f, fee: e.target.value })}
          />
        </Field>
      </div>
      <div className="field">
        Days
        <div className="row">
          {ALL_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              className="chip"
              aria-pressed={f.days.includes(d)}
              onClick={() =>
                setF({
                  ...f,
                  days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d],
                })
              }
            >
              {DAYNAME[d]}
            </button>
          ))}
        </div>
      </div>
      <div className="grid g3" style={{ gap: 12 }}>
        <Field label="Starts">
          <input
            className="inp"
            type="time"
            value={f.start}
            onChange={(e) => setF({ ...f, start: e.target.value })}
          />
        </Field>
        <Field label="Ends" error={f.end <= f.start ? 'Ends after it starts' : undefined}>
          <input
            className="inp"
            type="time"
            value={f.end}
            onChange={(e) => setF({ ...f, end: e.target.value })}
          />
        </Field>
        <Field label="Capacity">
          <input
            className="inp tnum"
            inputMode="numeric"
            value={f.cap}
            onChange={(e) => setF({ ...f, cap: e.target.value })}
          />
        </Field>
      </div>
      <p className="tiny">Classes are created 30 days ahead; holidays are skipped.</p>
    </Sheet>
  )
}

export function CancelSessionSheet({ sessionId }: { sessionId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const se = sesById(sessionId)!
  const [reason, setReason] = useState('')
  const n = phonesOf(roster(se)).filter((p) => consentOf(p) === 'given').length
  return (
    <Sheet
      title={`Cancel ${B(se.batchId)!.name} on ${dDay(se.date)}?`}
      footer={
        <>
          <CancelButton label="Keep the class" />
          <button
            className="btn btn-danger"
            disabled={reason.trim().length < 3}
            onClick={() => {
              const told = cancelSession(sessionId, reason.trim())
              close()
              toast(
                `Class cancelled${store.db.settings.autoAnnounce ? `; ${plural(told, 'parent')} told` : ''}.`,
              )
            }}
          >
            Cancel class
          </button>
        </>
      }
    >
      <Field label="Reason" hint="Parents see this">
        <input
          className="inp"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Teacher unwell"
          autoFocus
        />
      </Field>
      <p className="small">
        {store.db.settings.autoAnnounce
          ? `${plural(n, 'parent')} and the teacher are told automatically; the calendar updates.`
          : "Automatic announcements are off; parents won't be told."}
      </p>
    </Sheet>
  )
}

export function ExtraSessionSheet({ batchId }: { batchId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const b = B(batchId)!
  const [f, setF] = useState({ date: addDays(TODAY, 1), start: b.start, end: b.end, tell: true })
  const ok = f.date >= TODAY && f.end > f.start
  return (
    <Sheet
      title={`Extra class · ${b.name}`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const n = addExtraSession(batchId, f.date, f.start, f.end, f.tell)
              close()
              toast(`Extra class added${f.tell ? `; ${plural(n, 'parent')} told` : ''}.`)
            }}
          >
            Add class
          </button>
        </>
      }
    >
      <div className="grid g3" style={{ gap: 12 }}>
        <Field label="Date">
          <input
            className="inp"
            type="date"
            min={TODAY}
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="Starts">
          <input
            className="inp"
            type="time"
            value={f.start}
            onChange={(e) => setF({ ...f, start: e.target.value })}
          />
        </Field>
        <Field label="Ends" error={f.end <= f.start ? 'Ends after it starts' : undefined}>
          <input
            className="inp"
            type="time"
            value={f.end}
            onChange={(e) => setF({ ...f, end: e.target.value })}
          />
        </Field>
      </div>
      <Check checked={f.tell} onChange={(v) => setF({ ...f, tell: v })}>
        Tell parents
      </Check>
    </Sheet>
  )
}

export function RescheduleSheet({ sessionId }: { sessionId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const se = sesById(sessionId)!
  const [f, setF] = useState({ date: se.date, start: se.start, reason: '' })
  const ok =
    f.reason.trim().length >= 3 && (f.date !== se.date || f.start !== se.start) && f.date >= TODAY
  return (
    <Sheet
      title="Move class"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const n = reschedule(sessionId, f.date, f.start, f.reason.trim())
              close()
              toast(
                `Moved to ${dDay(f.date)} ${f.start}${store.db.settings.autoAnnounce ? `; ${plural(n, 'parent')} told` : ''}.`,
              )
            }}
          >
            Move class
          </button>
        </>
      }
    >
      <p className="small">
        {B(se.batchId)!.name} · now {dDay(se.date)} {se.start}
      </p>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="New date">
          <input
            className="inp"
            type="date"
            min={TODAY}
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field label="New start">
          <input
            className="inp"
            type="time"
            value={f.start}
            onChange={(e) => setF({ ...f, start: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Reason">
        <input
          className="inp"
          value={f.reason}
          onChange={(e) => setF({ ...f, reason: e.target.value })}
        />
      </Field>
      <p className="tiny">
        {store.db.settings.autoAnnounce
          ? "Parents and the teacher are told; the calendar and the teacher's reminder follow the new time."
          : 'Parents are not told automatically.'}
      </p>
    </Sheet>
  )
}

export function HistorySheet({ sessionId }: { sessionId: string }) {
  const rows = store.db.attendance.filter((a) => a.sessionId === sessionId && a.prevMark)
  return (
    <Sheet title="Attendance history" footer={<CancelButton label="Close" />}>
      {rows.length ? (
        <ul className="list">
          {rows.map((r) => (
            <li key={r.id} className="li">
              <span className="grow">
                <b>{St(r.studentId)!.name}</b>
                <div className="d">
                  {r.prevMark} → {r.mark} · {userName(r.by)} · {dShort(r.at.slice(0, 10))}{' '}
                  {r.at.slice(11)}
                </div>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">No corrections.</p>
      )}
    </Sheet>
  )
}

export function TestSheet({ batchId }: { batchId?: string }) {
  const nav = useNavigate()
  const { close } = useSheet()
  const [f, setF] = useState({
    batchId: batchId || myBatches()[0]?.id || '',
    name: '',
    date: TODAY,
    max: '50',
    topic: '',
  })
  const ok = f.name.trim().length >= 2 && Number(f.max) > 0 && !!f.batchId
  return (
    <Sheet
      title="Create a test"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const t = createTest(f.batchId, f.name.trim(), f.date, Number(f.max), f.topic.trim())
              close()
              nav(`/tests/${t.id}`)
            }}
          >
            Create and enter marks
          </button>
        </>
      }
    >
      <Field label="Batch">
        <select
          className="inp"
          value={f.batchId}
          onChange={(e) => setF({ ...f, batchId: e.target.value })}
        >
          {myBatches().map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Test name">
          <input
            className="inp"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            placeholder="Unit Test 4"
            autoFocus
          />
        </Field>
        <Field label="Out of">
          <input
            className="inp tnum"
            inputMode="decimal"
            value={f.max}
            onChange={(e) => setF({ ...f, max: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Date">
          <input
            className="inp"
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
        </Field>
        <Field
          label={
            <span>
              Topic <span className="hint">(optional)</span>
            </span>
          }
        >
          <input
            className="inp"
            value={f.topic}
            onChange={(e) => setF({ ...f, topic: e.target.value })}
          />
        </Field>
      </div>
    </Sheet>
  )
}

export function SendResultsSheet({ testId }: { testId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const t = store.db.tests.find((x) => x.id === testId)!
  const b = B(t.batchId)!
  const cm = currentMarkRows(testId)
  const all = roster({ batchId: t.batchId, date: t.heldOn })
  const list = all.filter((s) => cm[s.id])
  const recips = list.filter(
    (s) =>
      consentOf(s.parentPhone) === 'given' && (!cm[s.id].absent || store.db.settings.absentNotice),
  )
  const ex = list.find((s) => !cm[s.id].absent)
  const preview = ex
    ? T.result(
        first(ex.name),
        cm[ex.id].marks ?? 0,
        t.max,
        b.subject,
        t.name,
        t.heldOn,
        store.db.settings.avgInResults ? batchAverage(testId) : null,
      )
    : ''
  return (
    <Sheet
      title={t.sentAt ? `Send ${t.name} results again?` : `Send ${t.name} results?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            onClick={() => {
              const n = sendResults(testId)
              close()
              toast(`Results sent: ${plural(n, 'message')}, one per child.`)
            }}
          >
            {t.sentAt ? 'Send again' : `Send ${plural(recips.length, 'message')}`}
          </button>
        </>
      }
    >
      {t.sentAt && (
        <div className="alert alert-amber">
          These results were already sent. Sending again sends every parent the same message twice.
          Use this only if the first send failed.
        </div>
      )}
      <p className="small">
        <b>{plural(recips.length, 'message')}</b>, one per child, to parents who opted in.{' '}
        {all.length - list.length
          ? `${plural(all.length - list.length, 'student')} without marks won't get anything.`
          : ''}{' '}
        Never a rank.
      </p>
      {preview && <Bubble text={preview} />}
    </Sheet>
  )
}
