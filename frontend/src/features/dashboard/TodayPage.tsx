import { useState } from 'react'
import { Link } from 'react-router'
import {
  B,
  balance,
  can,
  consentOf,
  currentMarkRows,
  currentMarks,
  daysOverdue,
  lastReminder,
  myBatchIds,
  onboardingSteps,
  phonesOf,
  roster,
  studentAtt,
  todaySessions,
  userName,
  Us,
  visibleStudents,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import { TODAY, dDay, dShort, first, monthName, plural, rup } from '../../shared/lib/format'
import { Empty, Kpi, PageHead, Pill } from '../../shared/ui/kit'
import { useSheet } from '../../shared/ui/overlay'
import { BatchSheet } from '../sheets/classes'
import { PaymentSheet } from '../sheets/payments'
import { StudentSheet } from '../sheets/students'

export function TodayPage() {
  const { db, session } = useStore()
  const sheet = useSheet()
  const me = Us(session.userId)!
  const [hr] = useState(() => new Date().getHours())
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'
  const isTeacher = session.role === 'TEACHER'
  const period = TODAY.slice(0, 7)
  const sheets = { batch: <BatchSheet />, student: <StudentSheet />, payment: <PaymentSheet /> }

  const steps = session.role === 'OWNER' ? onboardingSteps() : []
  const done = steps.filter((s) => s.done).length
  const ses = todaySessions()

  return (
    <>
      <PageHead
        title={`${greet}, ${first(me.name)}`}
        sub={`${dDay(TODAY)} · ${db.centre.name}`}
        actions={
          <>
            {can('PAYMENT_CASH_WRITE') && db.students.length > 0 && (
              <button className="btn" onClick={() => sheet.open(<PaymentSheet />)}>
                Record a payment
              </button>
            )}
            {can('ANNOUNCE') && db.batches.length > 0 && (
              <Link className="btn btn-primary" to="/announce">
                Send an announcement
              </Link>
            )}
          </>
        }
      />
      {steps.length > 0 && done < steps.length && (
        <section className="card">
          <div className="card-hd">
            <h2>Set up {db.centre.name}</h2>
            <span className="small muted">
              {done} of {steps.length} done
            </span>
            <div className="bar" style={{ width: '100%' }}>
              <i style={{ width: `${Math.round((done / steps.length) * 100)}%` }} />
            </div>
          </div>
          <ol className="list">
            {steps.map((s, i) => (
              <li key={s.k} className="li">
                <span
                  className="av"
                  style={
                    s.done ? { background: 'var(--green-bg)', color: 'var(--green)' } : undefined
                  }
                >
                  {s.done ? '✓' : i + 1}
                </span>
                <span className="grow">
                  <span
                    className="t"
                    style={
                      s.done ? { textDecoration: 'line-through', color: 'var(--muted)' } : undefined
                    }
                  >
                    {s.t}
                  </span>
                  {!s.done && <div className="d">{s.d}</div>}
                </span>
                {!s.done &&
                  (s.state ? (
                    <Pill tone="amber">{s.state}</Pill>
                  ) : s.to ? (
                    <Link className="btn btn-sm" to={s.to}>
                      Start
                    </Link>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => sheet.open(sheets[s.sheet as keyof typeof sheets])}
                    >
                      Start
                    </button>
                  ))}
              </li>
            ))}
          </ol>
        </section>
      )}
      {!isTeacher && db.students.length > 0 && <Figures period={period} />}
      <div className="grid dash-grid">
        <section className="card">
          <div className="card-hd">
            <h2>Today's classes</h2>
            {ses.length > 0 && (
              <span className="small muted">
                {plural(
                  ses.filter(
                    (s) => s.status === 'scheduled' && !Object.keys(currentMarks(s.id)).length,
                  ).length,
                  'class',
                  'classes',
                )}{' '}
                to mark
              </span>
            )}
          </div>
          {ses.length ? (
            <div className="list">
              {ses.map((se) => {
                const b = B(se.batchId)!
                const cm = currentMarks(se.id)
                const n = roster(se).length
                const marked = Object.keys(cm).length
                const present = Object.values(cm).filter((a) => a.mark !== 'A').length
                return (
                  <Link key={se.id} className="li" to={`/attendance/${se.id}`}>
                    <span className="tnum muted" style={{ width: 96, fontSize: 13.5 }}>
                      {se.start}–{se.end}
                    </span>
                    <span className="grow">
                      <span className="t">{b.name}</span>{' '}
                      {se.kind === 'extra' && <Pill tone="indigo">extra</Pill>}
                      <div className="d">
                        {userName(b.teacherId)} · {plural(n, 'student')}
                      </div>
                    </span>
                    {se.status === 'cancelled' ? (
                      <Pill tone="grey">cancelled</Pill>
                    ) : marked ? (
                      <Pill tone="green">
                        {present}/{n} present
                      </Pill>
                    ) : can('ATTENDANCE_WRITE') && myBatchIds().includes(b.id) ? (
                      <Pill tone="accent">Mark attendance</Pill>
                    ) : (
                      <Pill tone="grey">not marked</Pill>
                    )}
                  </Link>
                )
              })}
            </div>
          ) : (
            <Empty
              title="No classes today"
              sub={
                db.batches.length
                  ? "Enjoy the day. Tomorrow's classes appear here in the morning."
                  : 'Create a batch and its classes appear here.'
              }
              action={
                session.role === 'OWNER' && !db.batches.length ? (
                  <button className="btn btn-primary" onClick={() => sheet.open(<BatchSheet />)}>
                    Create a batch
                  </button>
                ) : undefined
              }
            />
          )}
        </section>
        <div className="stack">
          {can('LEDGER_READ') && db.students.length > 0 && <Overdue />}
          {!isTeacher && <LowAttendance />}
          {isTeacher && <TestsToFinish />}
          {session.role === 'OWNER' && db.audit.length > 0 && (
            <section className="card">
              <div className="card-hd">
                <h2>Recent activity</h2>
              </div>
              <ul className="list">
                {db.audit.slice(0, 5).map((a, i) => (
                  <li key={i} className="li" style={{ alignItems: 'flex-start' }}>
                    <span className="tnum muted small" style={{ whiteSpace: 'nowrap' }}>
                      {dShort(a.at.slice(0, 10))}
                    </span>
                    <span className="small">
                      {a.action}
                      <div className="tiny">{userName(a.by)}</div>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function Figures({ period }: { period: string }) {
  const { db } = useStore()
  const charges = db.charges.filter((c) => c.period === period && c.net > 0)
  const due = charges.reduce((a, c) => a + c.net, 0)
  const coll = db.payments
    .filter((p) => p.receivedOn.startsWith(period))
    .reduce((a, p) => a + p.amount, 0)
  const outst = db.students.filter((s) => balance(s.id) > 0)
  const pend = phonesOf(db.students.filter((s) => !s.deleted)).filter(
    (p) => consentOf(p) === 'pending',
  ).length
  return (
    <div className="grid g4">
      <Kpi
        label={`Due in ${monthName(period).split(' ')[0]}`}
        value={rup(due)}
        sub={plural(charges.length, 'charge')}
      />
      <Kpi
        label="Collected"
        value={rup(coll)}
        sub={`${due ? Math.round((coll / due) * 100) : 0}% of this month`}
        tone="c-green"
      />
      <Kpi
        label="Outstanding"
        value={rup(outst.reduce((a, s) => a + balance(s.id), 0))}
        sub={`${plural(outst.length, 'student')} · see list`}
        tone="c-amber"
        to={can('LEDGER_READ') ? '/fees' : undefined}
      />
      <Kpi
        label="Awaiting consent"
        value={String(pend)}
        sub={pend ? 'parents yet to reply YES' : 'every parent opted in'}
        to="/students?filter=consent"
      />
    </div>
  )
}

function Overdue() {
  const { db } = useStore()
  const outst = db.students
    .filter((s) => balance(s.id) > 0)
    .sort((a, b) => daysOverdue(b.id) - daysOverdue(a.id))
    .slice(0, 5)
  return (
    <section className="card">
      <div className="card-hd">
        <h2>Overdue fees</h2>
        <Link className="small" to="/fees">
          All outstanding
        </Link>
      </div>
      {outst.length ? (
        <div className="list">
          {outst.map((s) => {
            const lr = lastReminder(s.parentPhone)
            return (
              <Link key={s.id} className="li" to={`/students/${s.id}`}>
                <span className="grow">
                  <span className="t">{s.name}</span>
                  <div className="d">
                    {daysOverdue(s.id)
                      ? plural(daysOverdue(s.id), 'day') + ' overdue'
                      : 'not yet due'}{' '}
                    ·{' '}
                    {consentOf(s.parentPhone) === 'given'
                      ? 'last reminder ' + (lr ? dShort(lr.slice(0, 10)) : 'none')
                      : 'no consent'}
                  </div>
                </span>
                <b className="num">{rup(balance(s.id))}</b>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card-bd muted">Everyone is paid up.</div>
      )}
      <div className="card-ft tiny">
        Reminders go automatically on the due day, +3 and +7 days at 08:00. Anyone who pays first is
        skipped.
      </div>
    </section>
  )
}

function LowAttendance() {
  const { db } = useStore()
  const low = visibleStudents()
    .filter((s) => !s.deleted && s.status === 'active')
    .map((s) => ({ s, a: studentAtt(s.id) }))
    .filter((x) => x.a.rate != null && x.a.rate < db.settings.lowAttendance)
    .slice(0, 4)
  if (!low.length) return null
  return (
    <section className="card">
      <div className="card-hd">
        <h2>Low attendance</h2>
        <span className="small muted">below {db.settings.lowAttendance}%, 30 days</span>
      </div>
      <div className="list">
        {low.map(({ s, a }) => (
          <Link key={s.id} className="li" to={`/students/${s.id}`}>
            <span className="grow">
              <span className="t">{s.name}</span>
              <div className="d">
                {a.A} absent of {a.t}
              </div>
            </span>
            <b className="num c-amber">{a.rate}%</b>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TestsToFinish() {
  const { db } = useStore()
  const ts = db.tests.filter((t) => myBatchIds().includes(t.batchId) && !t.sentAt)
  return (
    <section className="card">
      <div className="card-hd">
        <h2>Tests to finish</h2>
        <Link className="small" to="/tests">
          All tests
        </Link>
      </div>
      {ts.length ? (
        <div className="list">
          {ts.map((t) => {
            const r = roster({ batchId: t.batchId, date: t.heldOn })
            const n = Object.keys(currentMarkRows(t.id)).length
            return (
              <Link key={t.id} className="li" to={`/tests/${t.id}`}>
                <span className="grow">
                  <span className="t">{t.name}</span>
                  <div className="d">
                    {B(t.batchId)!.name} · {n} of {r.length} marks
                  </div>
                </span>
                {n >= r.length ? (
                  <Pill tone="amber">ready to send</Pill>
                ) : (
                  <Pill tone="grey">enter marks</Pill>
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card-bd muted">All results are sent.</div>
      )}
    </section>
  )
}
