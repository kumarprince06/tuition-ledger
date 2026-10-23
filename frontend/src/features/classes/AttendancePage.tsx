import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { useStore } from '../../mock/store'
import type { Mark } from '../../mock/types'
import { TODAY, dDay, dShort, daysBetween, initials, plural } from '../../shared/lib/format'
import { Empty, PageHead } from '../../shared/ui/kit'
import { useSheet, useToast } from '../../shared/ui/overlay'
import {
  B,
  can,
  currentMarks,
  myBatchIds,
  pausedOnRoster,
  roster,
  saveAttendance,
  sesById,
  userName,
} from '../../mock/domain'
import { HistorySheet } from '../sheets/classes'
import { NotFound } from '../NotFound'

/** Phone-first attendance (ATT-1, ATT-2): everyone present; tap a name to mark absent; Late is a separate button. */
export function AttendancePage() {
  const { sessionId } = useParams()
  const { db, session } = useStore()
  const sheet = useSheet()
  const toast = useToast()
  const se = sesById(sessionId)
  const list = se ? roster(se) : []
  const cm = se ? currentMarks(se.id) : {}
  const [marks, setMarks] = useState<Record<string, Mark>>(() =>
    Object.fromEntries(list.map((s) => [s.id, cm[s.id]?.mark || 'P'])),
  )
  if (!se || !myBatchIds().includes(se.batchId)) return <NotFound />
  const b = B(se.batchId)!
  const saved = Object.keys(cm).length > 0
  const age = daysBetween(se.date, TODAY)
  const future = age < 0,
    locked = age > db.settings.editWindow,
    cancelled = se.status === 'cancelled',
    writer = can('ATTENDANCE_WRITE')
  const ro = !writer || locked || future || cancelled
  const dirty = saved && list.some((s) => (marks[s.id] || 'P') !== (cm[s.id]?.mark || 'P'))
  const cnt = { P: 0, A: 0, L: 0 }
  list.forEach((s) => cnt[marks[s.id] || 'P']++)
  const hist = db.attendance.filter((a) => a.sessionId === se.id && a.superseded).length
  const lastBy = saved ? Object.values(cm).sort((x, y) => y.at.localeCompare(x.at))[0] : null
  const paused = pausedOnRoster(se)
  const set = (id: string, m: Mark) => setMarks({ ...marks, [id]: m })
  const save = () => {
    const r = saveAttendance(se.id, marks)
    toast(`Saved: ${r.cnt.P} present, ${r.cnt.A} absent, ${r.cnt.L} late.`, () => {
      r.undo()
      toast('Attendance restored.')
    })
  }
  let banner = null
  if (cancelled)
    banner = (
      <div className="alert alert-indigo">
        This class was cancelled ({se.cancelReason || 'no reason'}). There's nothing to mark.
      </div>
    )
  else if (future)
    banner = (
      <div className="alert alert-indigo">
        Attendance opens on the day of the class ({dDay(se.date)}).
      </div>
    )
  else if (!writer)
    banner = (
      <div className="alert alert-indigo">
        View only.{' '}
        {session.role === 'ACCOUNTANT' ? 'Accountants can see attendance but not mark it.' : ''}
      </div>
    )
  else if (locked)
    banner = (
      <div className="alert alert-amber">
        <span>
          Locked: classes can be edited for {db.settings.editWindow} days.{' '}
          {session.role === 'OWNER' ? (
            <Link to="/settings/attendance">Change the edit window</Link>
          ) : (
            'Ask the owner if this needs a correction.'
          )}
        </span>
      </div>
    )
  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/classes">Classes</Link>
            <span>/</span>
            <Link to={`/classes/${b.id}`}>{b.name}</Link>
            <span>/</span>
            <span>{dShort(se.date)}</span>
          </>
        }
        title={b.name}
        sub={`${dDay(se.date)} · ${se.start}–${se.end}${se.kind === 'extra' ? ' · extra class' : ''} · ${lastBy ? `marked by ${userName(lastBy.by)}` : 'not marked yet'}`}
        actions={
          <>
            {!ro && (
              <button
                className="btn"
                onClick={() => setMarks(Object.fromEntries(list.map((s) => [s.id, 'P' as Mark])))}
              >
                Everyone present
              </button>
            )}
            {session.role === 'OWNER' && hist > 0 && (
              <button
                className="btn"
                onClick={() => sheet.open(<HistorySheet sessionId={se.id} />)}
              >
                History · {hist}
              </button>
            )}
          </>
        }
      />
      {banner}
      <section className="card">
        <div className="card-hd">
          <h2>{plural(list.length, 'student')}</h2>
          {!ro && (
            <span className="small muted">
              Tap a name to mark absent. Everyone else is present.
            </span>
          )}
        </div>
        {list.length ? (
          <ul className="att">
            {list.map((s) => {
              const m = marks[s.id] || 'P'
              return (
                <li
                  key={s.id}
                  className={`att-row ${m === 'A' ? 'is-absent' : m === 'L' ? 'is-late' : ''}`}
                >
                  <button
                    className="att-main"
                    disabled={ro}
                    onClick={() => set(s.id, m === 'P' ? 'A' : 'P')}
                    aria-label={`${s.name}: ${m === 'P' ? 'present' : m === 'A' ? 'absent' : 'late'}. Tap to mark ${m === 'A' ? 'present' : 'absent'}.`}
                  >
                    <span className="av">{initials(s.name)}</span>
                    <span className="att-name">{s.name}</span>
                    <span className="att-state">
                      {m === 'P' ? 'Present' : m === 'A' ? 'Absent' : 'Late'}
                    </span>
                  </button>
                  <button
                    className="att-late"
                    disabled={ro}
                    aria-pressed={m === 'L'}
                    aria-label={`Mark ${s.name} late`}
                    onClick={() => set(s.id, m === 'L' ? 'P' : 'L')}
                  >
                    Late
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <Empty
            title="No one on the list"
            sub="Students appear here when they have an enrolment in this batch on this date."
          />
        )}
        {paused.length > 0 && (
          <div className="card-bd tiny">
            {plural(paused.length, 'paused student')} not listed:{' '}
            {paused.map((s) => s.name).join(', ')}.
          </div>
        )}
        <div className="sticky-bar">
          <span className="small grow">
            <b className="c-green">{cnt.P} present</b> · <b className="c-red">{cnt.A} absent</b> ·{' '}
            <b className="c-amber">{cnt.L} late</b>
            {dirty ? (
              <>
                {' · '}
                <span className="c-amber">unsaved changes</span>
              </>
            ) : !saved && !ro ? (
              ' · not saved yet'
            ) : (
              ''
            )}
          </span>
          {ro ? (
            <Link className="btn" to={`/classes/${b.id}`}>
              Back
            </Link>
          ) : (
            <button className="btn btn-primary btn-lg" disabled={saved && !dirty} onClick={save}>
              {saved ? 'Save changes' : 'Save attendance'}
            </button>
          )}
        </div>
      </section>
    </>
  )
}
