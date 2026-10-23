import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  activeOn,
  balance,
  batchAtt,
  can,
  currentMarks,
  myBatches,
  myBatchIds,
  roster,
  sessionsOf,
  statusOn,
  St,
  studentAtt,
  userName,
  B,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import type { Session } from '../../mock/types'
import { TODAY, DAYNAME, dDay, dShort, plural, rup } from '../../shared/lib/format'
import { Empty, Kpi, PageHead, Pill, Tabs } from '../../shared/ui/kit'
import { useSheet } from '../../shared/ui/overlay'
import { ConsentPill, StatusPill } from '../../shared/ui/pills'
import {
  BatchSheet,
  CancelSessionSheet,
  ExtraSessionSheet,
  RescheduleSheet,
  TestSheet,
} from '../sheets/classes'
import { EndEnrolSheet, EnrolSheet } from '../sheets/students'
import { NotFound } from '../NotFound'
import { TestRow } from './TestRow'

export function ClassesPage() {
  const { db, session } = useStore()
  const sheet = useSheet()
  const bs = myBatches()
  return (
    <>
      <PageHead
        title="Classes"
        sub={
          session.role === 'TEACHER'
            ? 'Your batches. Tap one to see sessions, students and tests.'
            : `${plural(bs.length, 'batch', 'batches')} · tap one to see sessions, students and tests.`
        }
        actions={
          session.role === 'OWNER' && (
            <button className="btn btn-primary" onClick={() => sheet.open(<BatchSheet />)}>
              New batch
            </button>
          )
        }
      />
      {bs.length ? (
        <div className="grid g2">
          {bs.map((b) => {
            const n = db.enrolments.filter(
              (e) =>
                e.batchId === b.id &&
                activeOn(e, TODAY) &&
                statusOn(St(e.studentId)!, TODAY) === 'active',
            ).length
            const a = batchAtt(b.id)
            const t = db.sessions.find((s) => s.batchId === b.id && s.date === TODAY)
            const next = sessionsOf(b.id).find((s) => s.date > TODAY && s.status === 'scheduled')
            const low = a.rate != null && a.rate < db.settings.lowAttendance
            return (
              <Link
                key={b.id}
                className="card card-bd stack"
                to={`/classes/${b.id}`}
                style={{ color: 'var(--ink)', textDecoration: 'none', gap: 10 }}
              >
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div>
                    <h2>{b.name}</h2>
                    <div className="small muted">
                      {userName(b.teacherId)} · {b.days.map((d) => DAYNAME[d]).join(' ')} ·{' '}
                      {b.start}–{b.end}
                    </div>
                  </div>
                  {t ? (
                    t.status === 'cancelled' ? (
                      <Pill tone="grey">today cancelled</Pill>
                    ) : Object.keys(currentMarks(t.id)).length ? (
                      <Pill tone="green">today marked</Pill>
                    ) : (
                      <Pill tone="accent">mark today</Pill>
                    )
                  ) : (
                    <Pill tone="grey">{next ? 'next ' + dShort(next.date) : 'no upcoming'}</Pill>
                  )}
                </div>
                <div className="row small" style={{ gap: 18, color: 'var(--ink2)' }}>
                  <span>
                    <b>{n}</b> students
                  </span>
                  <span>
                    attendance{' '}
                    <b className={low ? 'c-amber' : ''}>{a.rate != null ? a.rate + '%' : '—'}</b>
                  </span>
                  <span>
                    <b>{db.tests.filter((x) => x.batchId === b.id).length}</b> tests
                  </span>
                  {session.role !== 'TEACHER' && <span>{rup(b.feePaise)}/month</span>}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <section className="card">
          <Empty
            title="No batches yet"
            sub={
              session.role === 'OWNER'
                ? 'A batch is a class group with a subject, days, time and monthly fee.'
                : "Your centre owner hasn't assigned you a batch yet."
            }
            action={
              session.role === 'OWNER' ? (
                <button className="btn btn-primary" onClick={() => sheet.open(<BatchSheet />)}>
                  Create a batch
                </button>
              ) : undefined
            }
          />
        </section>
      )}
    </>
  )
}

export function ClassPage() {
  const { batchId } = useParams()
  const { db, session } = useStore()
  const sheet = useSheet()
  const [tab, setTab] = useState<'sessions' | 'students' | 'tests'>('sessions')
  const b = B(batchId)
  if (!b || !myBatchIds().includes(b.id)) return <NotFound />
  const enrs = db.enrolments.filter((e) => e.batchId === b.id && activeOn(e, TODAY))
  const tests = db.tests
    .filter((t) => t.batchId === b.id)
    .sort((x, y) => y.heldOn.localeCompare(x.heldOn))
  const ses = sessionsOf(b.id)
  const past = ses
    .filter((s) => s.date <= TODAY)
    .reverse()
    .slice(0, 12)
  const upcoming = ses.filter((s) => s.date > TODAY).slice(0, 8)
  const canSes = can('SESSION_WRITE')
  const a = batchAtt(b.id)
  const low = a.rate != null && a.rate < db.settings.lowAttendance
  const owed = enrs.reduce((x, e) => x + Math.max(0, balance(e.studentId)), 0)
  const row = (se: Session) => {
    const ms = Object.values(currentMarks(se.id))
    return (
      <tr key={se.id}>
        <td className="c-main">
          <b>{dDay(se.date)}</b> {se.date === TODAY && <Pill tone="accent">today</Pill>}{' '}
          {se.kind === 'extra' && <Pill tone="indigo">extra</Pill>}
        </td>
        <td data-label="Time" className="tnum">
          {se.start}–{se.end}
        </td>
        <td data-label="Attendance">
          {se.status === 'cancelled' ? (
            <span className="muted">Cancelled · {se.cancelReason}</span>
          ) : ms.length ? (
            <>
              {ms.filter((x) => x.mark === 'P').length} present ·{' '}
              <span className="c-red">{ms.filter((x) => x.mark === 'A').length} absent</span> ·{' '}
              {ms.filter((x) => x.mark === 'L').length} late
            </>
          ) : se.date > TODAY ? (
            <span className="muted">{roster(se).length} on the list</span>
          ) : (
            <span className="c-amber">not marked</span>
          )}
        </td>
        <td className="c-act num">
          {se.status === 'cancelled' ? null : se.date <= TODAY ? (
            <Link className="btn btn-sm" to={`/attendance/${se.id}`}>
              {ms.length || !can('ATTENDANCE_WRITE') ? 'View' : 'Mark'}
            </Link>
          ) : (
            <>
              {can('SESSION_RESCHEDULE') && (
                <button
                  className="btn btn-sm"
                  onClick={() => sheet.open(<RescheduleSheet sessionId={se.id} />)}
                >
                  Move
                </button>
              )}{' '}
              {canSes && (
                <button
                  className="btn btn-sm"
                  onClick={() => sheet.open(<CancelSessionSheet sessionId={se.id} />)}
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </td>
      </tr>
    )
  }
  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/classes">Classes</Link>
            <span>/</span>
          </>
        }
        title={b.name}
        sub={`${userName(b.teacherId)} · ${b.days.map((d) => DAYNAME[d]).join(', ')} · ${b.start}–${b.end}${session.role !== 'TEACHER' ? ` · ${rup(b.feePaise)} a month` : ''} · capacity ${b.capacity}`}
        actions={
          <>
            {can('ANNOUNCE') && (
              <Link className="btn" to={`/announce/${b.id}`}>
                Announce
              </Link>
            )}
            {session.role === 'OWNER' && (
              <button className="btn" onClick={() => sheet.open(<BatchSheet batchId={b.id} />)}>
                Edit batch
              </button>
            )}
          </>
        }
      />
      <div className="grid g3">
        <Kpi
          label="Students"
          value={String(enrs.filter((e) => statusOn(St(e.studentId)!, TODAY) === 'active').length)}
          sub={`${enrs.filter((e) => statusOn(St(e.studentId)!, TODAY) !== 'active').length} paused`}
        />
        <Kpi
          label="Attendance, 30 days"
          value={a.rate != null ? a.rate + '%' : '—'}
          sub={low ? `below the ${db.settings.lowAttendance}% flag` : 'late counts as attended'}
          tone={low ? 'c-amber' : 'c-green'}
        />
        {can('LEDGER_BALANCE') ? (
          <Kpi
            label="Owed by this batch"
            value={rup(owed)}
            sub={`${plural(enrs.filter((e) => balance(e.studentId) > 0).length, 'student')} with dues`}
            tone={owed ? 'c-amber' : ''}
          />
        ) : (
          <Kpi
            label="Tests"
            value={String(tests.length)}
            sub={`${tests.filter((t) => !t.sentAt).length} not sent`}
          />
        )}
      </div>
      <section className="card">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            ['sessions', 'Classes'],
            ['students', `Students · ${enrs.length}`],
            ['tests', `Tests · ${tests.length}`],
          ]}
        />
        {tab === 'sessions' && (
          <>
            <div className="card-bd small muted" style={{ paddingBottom: 0 }}>
              Upcoming
            </div>
            <table className="rtable">
              <tbody>
                {upcoming.length ? (
                  upcoming.map(row)
                ) : (
                  <tr>
                    <td className="muted">No upcoming classes.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div
              className="card-bd small muted"
              style={{ paddingBottom: 0, borderTop: '1px solid var(--line)' }}
            >
              Recent
            </div>
            <table className="rtable">
              <tbody>
                {past.length ? (
                  past.map(row)
                ) : (
                  <tr>
                    <td className="muted">No classes yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
            {canSes && (
              <div className="card-ft">
                <button
                  className="btn"
                  onClick={() => sheet.open(<ExtraSessionSheet batchId={b.id} />)}
                >
                  Add an extra class
                </button>
                <span className="tiny">
                  Holidays are set in Settings; classes on those days are skipped.
                </span>
              </div>
            )}
          </>
        )}
        {tab === 'students' &&
          (enrs.length ? (
            <>
              <table className="rtable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Since</th>
                    <th>Parent</th>
                    {can('LEDGER_BALANCE') && <th className="num">Balance</th>}
                    <th className="num">Attendance</th>
                    {can('ENROLMENT_WRITE') && <th />}
                  </tr>
                </thead>
                <tbody>
                  {enrs.map((e) => {
                    const s = St(e.studentId)!
                    const sa = studentAtt(s.id)
                    const bal = balance(s.id)
                    return (
                      <tr key={e.id}>
                        <td className="c-main">
                          <Link to={`/students/${s.id}`}>
                            <b>{s.name}</b>
                          </Link>{' '}
                          <StatusPill s={s} />
                        </td>
                        <td data-label="Since">{dShort(e.from)}</td>
                        <td data-label="Parent">
                          {s.parentName} <ConsentPill phone={s.parentPhone} />
                        </td>
                        {can('LEDGER_BALANCE') && (
                          <td
                            data-label="Balance"
                            className={`num ${bal > 0 ? 'c-amber strong' : ''}`}
                          >
                            {bal < 0 ? 'credit ' + rup(-bal) : rup(bal)}
                          </td>
                        )}
                        <td data-label="Attendance" className="num">
                          {sa.rate != null ? sa.rate + '%' : '—'}
                        </td>
                        {can('ENROLMENT_WRITE') && (
                          <td className="c-act num">
                            <button
                              className="btn btn-sm"
                              onClick={() => sheet.open(<EndEnrolSheet enrolmentId={e.id} />)}
                            >
                              End
                            </button>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {can('ENROLMENT_WRITE') && (
                <div className="card-ft">
                  <button className="btn" onClick={() => sheet.open(<EnrolSheet batchId={b.id} />)}>
                    Enrol a student
                  </button>
                  <span className="tiny">
                    {enrs.length} of {b.capacity} places used
                  </span>
                </div>
              )}
            </>
          ) : (
            <Empty
              title="No students in this batch"
              sub="Enrol existing students, or add a new student and choose this batch."
              action={
                can('ENROLMENT_WRITE') ? (
                  <button
                    className="btn btn-primary"
                    onClick={() => sheet.open(<EnrolSheet batchId={b.id} />)}
                  >
                    Enrol a student
                  </button>
                ) : undefined
              }
            />
          ))}
        {tab === 'tests' && (
          <>
            {tests.length ? (
              <table className="rtable">
                <thead>
                  <tr>
                    <th>Test</th>
                    <th>Date</th>
                    <th className="num">Entered</th>
                    <th className="num">Average</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <TestRow key={t.id} t={t} />
                  ))}
                </tbody>
              </table>
            ) : (
              <Empty
                title="No tests yet"
                sub="Create a test, enter marks on your phone, and send each parent their child's result."
              />
            )}
            {can('TEST_WRITE') && (
              <div className="card-ft">
                <button className="btn" onClick={() => sheet.open(<TestSheet batchId={b.id} />)}>
                  Create a test
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  )
}
