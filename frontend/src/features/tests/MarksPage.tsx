import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  B,
  can,
  currentMarkRows,
  myBatchIds,
  roster,
  saveMarks,
  sendCorrections,
  St,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import {
  TODAY,
  dDay,
  dShort,
  daysBetween,
  initials,
  listJoin,
  plural,
} from '../../shared/lib/format'
import { Empty, PageHead } from '../../shared/ui/kit'
import { useConfirm, useToast } from '../../shared/ui/overlay'
import { NotFound } from '../NotFound'

/** Marks entry (ASM-2): Next on the keypad moves to the next student; edits after sending offer corrections. */
export function MarksPage() {
  const { testId } = useParams()
  const { db } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const t = db.tests.find((x) => x.id === testId)
  const list = t ? roster({ batchId: t.batchId, date: t.heldOn }) : []
  const cm = t ? currentMarkRows(t.id) : {}
  const [vals, setVals] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      list.map((s) => [s.id, cm[s.id] ? (cm[s.id].absent ? 'A' : String(cm[s.id].marks)) : '']),
    ),
  )
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  if (!t || !myBatchIds().includes(t.batchId)) return <NotFound />
  const b = B(t.batchId)!
  const locked = daysBetween(t.heldOn, TODAY) > db.settings.marksWindow
  const ro = !can('TEST_WRITE') || locked
  const bad = (id: string) => {
    const v = vals[id]
    return v !== '' && v !== 'A' && (isNaN(Number(v)) || Number(v) < 0 || Number(v) > t.max)
  }
  const entered = list.filter((s) => vals[s.id] !== '').length
  const nbad = list.filter((s) => bad(s.id)).length
  const changed = list.filter(
    (s) =>
      vals[s.id] !== '' &&
      (!cm[s.id] || (cm[s.id].absent ? 'A' : String(cm[s.id].marks)) !== vals[s.id]),
  ).length
  const save = () => {
    const r = saveMarks(t.id, vals)
    if (r.changed.length) {
      confirm({
        title: `Send ${plural(r.changed.length, 'correction')}?`,
        body: `Results were already sent. ${listJoin(r.changed.map((id) => St(id)!.name))} ${r.changed.length === 1 ? 'has' : 'have'} a new mark. Only ${r.changed.length === 1 ? 'that parent gets' : 'those parents get'} a corrected result.`,
        confirm: 'Send corrections',
        cancel: "Don't send",
        onConfirm: () => {
          sendCorrections(t.id, r.changed)
          toast('Marks saved; corrections sent.')
          nav('/tests')
        },
      })
      return
    }
    toast(t.sentAt ? 'Marks saved.' : 'Marks saved. Send results when everyone is entered.')
    nav('/tests')
  }
  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/tests">Tests</Link>
            <span>/</span>
          </>
        }
        title={t.name}
        sub={`${b.name} · ${dDay(t.heldOn)} · out of ${t.max}${t.topic ? ' · ' + t.topic : ''}`}
      />
      {t.sentAt && (
        <div className="alert alert-indigo">
          Results were sent on {dShort(t.sentAt.slice(0, 10))}. If you change a mark, only that
          parent gets a corrected result.
        </div>
      )}
      {locked && (
        <div className="alert alert-amber">
          Locked: marks can be changed for {db.settings.marksWindow} days after the test.
        </div>
      )}
      <section className="card">
        <div className="card-hd">
          <h2>{plural(list.length, 'student')}</h2>
          <span className="small muted">Type the mark and press Next, or tap Absent.</span>
        </div>
        {list.length ? (
          list.map((s, i) => {
            const v = vals[s.id]
            const err = bad(s.id)
            return (
              <div key={s.id} className="mk-row">
                <span className="av">{initials(s.name)}</span>
                <label className="att-name" htmlFor={`mk-${s.id}`}>
                  {s.name}
                </label>
                <input
                  id={`mk-${s.id}`}
                  ref={(el) => {
                    inputs.current[i] = el
                  }}
                  className="inp mk-in"
                  inputMode="decimal"
                  enterKeyHint={i === list.length - 1 ? 'done' : 'next'}
                  value={v === 'A' ? '' : v}
                  placeholder={`0–${t.max}`}
                  disabled={v === 'A' || ro}
                  aria-invalid={err}
                  aria-describedby={err ? `mkerr-${s.id}` : undefined}
                  onChange={(e) => setVals({ ...vals, [s.id]: e.target.value.trim() })}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return
                    e.preventDefault()
                    const next = inputs.current.slice(i + 1).find((x) => x && !x.disabled)
                    if (next) next.focus()
                    else e.currentTarget.blur()
                  }}
                />
                <button
                  className="btn btn-sm"
                  disabled={ro}
                  aria-pressed={v === 'A'}
                  style={
                    v === 'A'
                      ? {
                          background: 'var(--red-bg)',
                          color: 'var(--red)',
                          borderColor: 'var(--red)',
                        }
                      : undefined
                  }
                  onClick={() => setVals({ ...vals, [s.id]: v === 'A' ? '' : 'A' })}
                >
                  {v === 'A' ? 'Absent ✓' : 'Absent'}
                </button>
                {err && (
                  <span className="sr" id={`mkerr-${s.id}`}>
                    Must be between 0 and {t.max}
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <Empty title="No students on the list" sub="" />
        )}
        <div className="sticky-bar">
          <span className={`small grow ${nbad ? 'c-red' : ''}`}>
            {nbad
              ? `${plural(nbad, 'mark')} outside 0–${t.max}`
              : `${entered} of ${list.length} entered`}
          </span>
          {ro ? (
            <Link className="btn" to="/tests">
              Back
            </Link>
          ) : (
            <button
              className="btn btn-primary btn-lg"
              disabled={nbad > 0 || !changed}
              onClick={save}
            >
              Save marks
            </button>
          )}
        </div>
      </section>
    </>
  )
}
