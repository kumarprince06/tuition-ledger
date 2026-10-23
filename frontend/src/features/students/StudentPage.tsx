import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  activeBatchesOf,
  activeOn,
  B,
  balance,
  can,
  compText,
  consentOf,
  currentMarkRows,
  daysOverdue,
  enrolmentsOf,
  inScope,
  monthlyFee,
  resendOptin,
  sesById,
  siblingsOf,
  St,
  studentAtt,
  userName,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import {
  TODAY,
  dDay,
  dShort,
  first,
  initials,
  phoneFmt,
  plural,
  rup,
  rup2,
} from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import { Empty, Kpi, PageHead, Pill, Tabs } from '../../shared/ui/kit'
import { useSheet, useToast } from '../../shared/ui/overlay'
import { ConsentPill, MsgPill, StatusPill } from '../../shared/ui/pills'
import { useParentDrawer } from '../parent/ParentDrawer'
import { AdjustSheet, LinkSheet, PaymentSheet, RefundSheet, RemindSheet } from '../sheets/payments'
import {
  ConsentSheet,
  DeleteSheet,
  EndEnrolSheet,
  EnrolSheet,
  StatusSheet,
} from '../sheets/students'
import { NotFound } from '../NotFound'

type Tab = 'ledger' | 'enrol' | 'att' | 'results' | 'msgs'

export function StudentPage() {
  const { studentId } = useParams()
  const { db, session } = useStore()
  const sheet = useSheet()
  const toast = useToast()
  const drawer = useParentDrawer()
  const s = St(studentId)
  const tabList: [Tab, string][] = []
  if (can('LEDGER_READ')) tabList.push(['ledger', 'Fees & payments'])
  tabList.push(['enrol', 'Batches'], ['att', 'Attendance'])
  if (can('RESULTS_READ')) tabList.push(['results', 'Results'])
  if (can('MESSAGE_LOG_READ')) tabList.push(['msgs', 'Messages'])
  const [tab, setTab] = useState<Tab>(tabList[0][0])
  if (!s || !inScope(s)) return <NotFound />
  const bal = balance(s.id)
  const a = studentAtt(s.id)
  const sibs = siblingsOf(s)
  const teacher = session.role === 'TEACHER'
  const lastTest = db.tests
    .filter((t) => currentMarkRows(t.id)[s.id])
    .sort((x, y) => x.heldOn.localeCompare(y.heldOn))
    .pop()
  const lm = lastTest && currentMarkRows(lastTest.id)[s.id]
  const pdf = (rno: string) =>
    toast(`Receipt PDF ${rno} opens from a signed link valid for 90 days.`)

  let body = null
  if (tab === 'ledger') {
    const lines = db.ledger
      .filter((l) => l.studentId === s.id)
      .sort((x, y) => x.at.localeCompare(y.at))
    const running = lines.reduce<number[]>(
      (acc, l) => [...acc, (acc[acc.length - 1] ?? 0) + l.amount],
      [],
    )
    body = (
      <>
        <table className="rtable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Entry</th>
              <th className="num">Amount</th>
              <th className="num">Balance</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const run = running[i]
              const c = l.chargeId ? db.charges.find((x) => x.id === l.chargeId) : undefined
              const p = l.paymentId ? db.payments.find((x) => x.id === l.paymentId) : undefined
              return (
                <tr key={l.id}>
                  <td data-label="Date">{dShort(l.at.slice(0, 10))}</td>
                  <td className="c-main">
                    {l.kind === 'charge' ? (
                      <>
                        <b>{l.ref}</b>
                        {c?.computation && <div className="tiny">{compText(c)}</div>}
                      </>
                    ) : l.kind === 'payment' ? (
                      <>
                        Payment · <span className="tnum">{l.ref}</span>
                        {p && (
                          <div className="tiny">
                            recorded by {userName(p.by)}
                            {p.utr ? ' · UTR ' + p.utr : ''}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {l.kind === 'refund'
                          ? 'Refund'
                          : l.kind === 'credit'
                            ? 'Credit'
                            : 'Adjustment'}{' '}
                        · {l.ref}
                        <div className="tiny">by {userName(l.by)}</div>
                      </>
                    )}
                  </td>
                  <td data-label="Amount" className={`num ${l.amount < 0 ? 'c-green' : ''}`}>
                    {l.amount < 0 ? '−' : ''}
                    {rup2(Math.abs(l.amount))}
                  </td>
                  <td data-label="Balance" className="num strong">
                    {run < 0 ? 'credit ' + rup2(-run) : rup2(run)}
                  </td>
                  <td className="c-act num">
                    {p && (
                      <>
                        <button className="btn btn-sm" onClick={() => pdf(p.receiptNo)}>
                          PDF
                        </button>
                        {can('PAYMENT_REFUND') && p.refunded < p.amount && (
                          <>
                            {' '}
                            <button
                              className="btn btn-sm"
                              onClick={() => sheet.open(<RefundSheet paymentId={p.id} />)}
                            >
                              Refund
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              )
            })}
            {!lines.length && (
              <tr>
                <td className="muted">No entries yet.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="card-ft">
          {can('PAYMENT_CASH_WRITE') && (
            <button
              className="btn btn-primary"
              onClick={() => sheet.open(<PaymentSheet studentId={s.id} />)}
            >
              Record payment
            </button>
          )}
          {can('PAYMENT_LINK_CREATE') && (
            <button
              className="btn"
              disabled={bal <= 0}
              onClick={() => sheet.open(<LinkSheet studentId={s.id} />)}
            >
              Payment link
            </button>
          )}
          {can('REMINDER_SEND_NOW') && (
            <button
              className="btn"
              disabled={bal <= 0}
              onClick={() => sheet.open(<RemindSheet studentId={s.id} />)}
            >
              Send reminder now
            </button>
          )}
          {can('CHARGE_WRITE') && (
            <button className="btn" onClick={() => sheet.open(<AdjustSheet studentId={s.id} />)}>
              Charge or credit
            </button>
          )}
        </div>
      </>
    )
  }
  if (tab === 'enrol') {
    const es = enrolmentsOf(s.id).sort((x, y) => y.from.localeCompare(x.from))
    body = (
      <>
        <table className="rtable">
          <thead>
            <tr>
              <th>Batch</th>
              <th>From</th>
              <th>To</th>
              <th className="num">Fee</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {es.map((e) => {
              const b = B(e.batchId)!
              const act = activeOn(e, TODAY)
              return (
                <tr key={e.id}>
                  <td className="c-main">
                    <b>{b.name}</b>{' '}
                    {act ? (
                      <Pill tone="green">active</Pill>
                    ) : (
                      <Pill tone="grey">
                        {e.from > TODAY ? 'starts ' + dShort(e.from) : 'ended'}
                      </Pill>
                    )}
                  </td>
                  <td data-label="From">{dShort(e.from)}</td>
                  <td data-label="To">{e.to ? dShort(e.to) : '—'}</td>
                  <td data-label="Fee" className="num">
                    {teacher ? '—' : rup(b.feePaise) + '/mo'}
                  </td>
                  <td className="c-act num">
                    {can('ENROLMENT_WRITE') && act && (
                      <button
                        className="btn btn-sm"
                        onClick={() => sheet.open(<EndEnrolSheet enrolmentId={e.id} />)}
                      >
                        End
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {can('ENROLMENT_WRITE') && (
          <div className="card-ft">
            <button className="btn" onClick={() => sheet.open(<EnrolSheet studentId={s.id} />)}>
              Enrol in another batch
            </button>
            <span className="tiny">Each batch is charged separately and pro-rated by day.</span>
          </div>
        )}
      </>
    )
  }
  if (tab === 'att') {
    const rows = db.attendance
      .filter((x) => !x.superseded && x.studentId === s.id)
      .map((x) => ({ x, se: sesById(x.sessionId)! }))
      .filter((y) => y.se)
      .sort((p, q) => q.se.date.localeCompare(p.se.date))
      .slice(0, 15)
    body = (
      <>
        <div className="card-bd row small" style={{ gap: 18 }}>
          <span>
            <b className="c-green">{a.P}</b> present
          </span>
          <span>
            <b className="c-red">{a.A}</b> absent
          </span>
          <span>
            <b className="c-amber">{a.L}</b> late
          </span>
          <span className="muted">last 30 days · {a.rate != null ? a.rate + '%' : '—'}</span>
        </div>
        <table className="rtable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Batch</th>
              <th>Mark</th>
              <th>Marked by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ x, se }) => (
              <tr key={x.id}>
                <td className="c-main">{dDay(se.date)}</td>
                <td data-label="Batch">{B(se.batchId)!.name}</td>
                <td data-label="Mark">
                  {x.mark === 'P' ? (
                    <Pill tone="green">Present</Pill>
                  ) : x.mark === 'A' ? (
                    <Pill tone="red">Absent</Pill>
                  ) : (
                    <Pill tone="amber">Late</Pill>
                  )}
                </td>
                <td data-label="Marked by" className="small muted">
                  {userName(x.by)}
                  {x.prevMark ? ' · corrected' : ''}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="muted">No attendance yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </>
    )
  }
  if (tab === 'results') {
    const ts = db.tests
      .filter((t) => currentMarkRows(t.id)[s.id])
      .sort((x, y) => x.heldOn.localeCompare(y.heldOn))
    const pcts = ts
      .map((t) => currentMarkRows(t.id)[s.id])
      .flatMap((m, i) => (m.absent ? [] : [Math.round(((m.marks ?? 0) / ts[i].max) * 100)]))
    const d = pcts.length >= 2 ? pcts[pcts.length - 1] - pcts[0] : 0
    const trend =
      pcts.length < 2
        ? 'Not enough tests for a trend yet.'
        : d >= 5
          ? `Up ${d} points since the first test.`
          : d <= -5
            ? `Down ${-d} points since the first test; worth a word with the parent.`
            : 'Steady.'
    body = ts.length ? (
      <>
        <table className="rtable">
          <thead>
            <tr>
              <th>Test</th>
              <th>Date</th>
              <th className="num">Marks</th>
              <th className="num">%</th>
              <th>Sent to parent</th>
            </tr>
          </thead>
          <tbody>
            {ts.map((t) => {
              const m = currentMarkRows(t.id)[s.id]
              return (
                <tr key={t.id}>
                  <td className="c-main">
                    <b>{t.name}</b>
                    <div className="tiny">{B(t.batchId)!.name}</div>
                  </td>
                  <td data-label="Date">{dShort(t.heldOn)}</td>
                  <td data-label="Marks" className="num">
                    {m.absent ? 'absent' : `${m.marks} / ${t.max}`}
                  </td>
                  <td data-label="%" className="num">
                    {m.absent ? '—' : Math.round(((m.marks ?? 0) / t.max) * 100)}
                  </td>
                  <td data-label="Sent">
                    {t.sentAt ? <Pill tone="green">sent</Pill> : <Pill tone="grey">not yet</Pill>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="card-bd small">{trend}</div>
      </>
    ) : (
      <Empty title="No results yet" sub="Results appear after a teacher enters marks." />
    )
  }
  if (tab === 'msgs') {
    const ms = db.messages
      .filter((m) => m.phone === s.parentPhone)
      .slice()
      .reverse()
    body = ms.length ? (
      <ul className="list">
        {ms.map((m) => (
          <li key={m.id} className="li" style={{ alignItems: 'flex-start' }}>
            <span className="tnum muted small" style={{ whiteSpace: 'nowrap', width: 86 }}>
              {dShort(m.at.slice(0, 10))} {m.at.slice(11)}
            </span>
            <span className="grow small">
              {m.dir === 'in' && <b>Parent: </b>}
              {m.text}
              {m.reason && <div className="tiny">{m.reason}</div>}
            </span>
            <MsgPill m={m} />
          </li>
        ))}
      </ul>
    ) : (
      <Empty
        title="No messages yet"
        sub="Receipts, reminders, results and announcements to this parent appear here with their delivery status."
      />
    )
  }
  return (
    <>
      <PageHead
        crumbs={
          <>
            <Link to="/students">Students</Link>
            <span>/</span>
          </>
        }
        title={
          <>
            {s.name} <StatusPill s={s} />
          </>
        }
        sub={`Class ${s.cls} · joined ${dShort(s.joinedOn)} · ${
          activeBatchesOf(s.id)
            .map((b) => b.name)
            .join(', ') || 'no active batch'
        }`}
        actions={
          <>
            {!teacher && (
              <button className="btn" onClick={() => drawer.open(s.parentPhone)}>
                <Icon name="wa" size={16} /> Parent's chat
              </button>
            )}
            {can('STUDENT_WRITE') && !s.deleted && (
              <button className="btn" onClick={() => sheet.open(<StatusSheet studentId={s.id} />)}>
                {s.status === 'active' ? 'Pause or leave' : 'Resume'}
              </button>
            )}
            {session.role === 'OWNER' && !s.deleted && (
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--red)' }}
                onClick={() => sheet.open(<DeleteSheet studentId={s.id} />)}
              >
                Delete personal data
              </button>
            )}
          </>
        }
      />
      <div className="card card-bd row" style={{ gap: 14 }}>
        <span className="av">{initials(s.parentName)}</span>
        <span className="grow">
          <b>{s.parentName}</b> <span className="tnum muted small">{phoneFmt(s.parentPhone)}</span>
          <div className="small">
            {!teacher && <ConsentPill phone={s.parentPhone} />}{' '}
            {sibs.length > 0 && (
              <>
                Also parent of{' '}
                {sibs.map((x, i) => (
                  <span key={x.id}>
                    {i > 0 && ', '}
                    {inScope(x) ? (
                      <Link to={`/students/${x.id}`}>{first(x.name)}</Link>
                    ) : (
                      first(x.name)
                    )}
                  </span>
                ))}{' '}
                · one message covers all children
              </>
            )}
          </div>
        </span>
        {!teacher && consentOf(s.parentPhone) === 'pending' && (
          <>
            <button
              className="btn btn-sm"
              onClick={() => sheet.open(<ConsentSheet studentId={s.id} />)}
            >
              Record verbal consent
            </button>
            <button
              className="btn btn-sm"
              onClick={() => {
                const m = resendOptin(s.id)
                toast(
                  m.status === 'delivered'
                    ? 'Opt-in sent again.'
                    : `Opt-in ${m.status}: ${m.reason}.`,
                )
              }}
            >
              Resend opt-in
            </button>
          </>
        )}
      </div>
      <div className="grid g4">
        {can('LEDGER_BALANCE') && (
          <Kpi
            label="Balance"
            value={bal < 0 ? 'credit ' + rup(-bal) : rup(bal)}
            sub={
              bal > 0
                ? daysOverdue(s.id)
                  ? plural(daysOverdue(s.id), 'day') + ' overdue'
                  : 'not yet due'
                : 'nothing due'
            }
            tone={bal > 0 ? 'c-amber' : 'c-green'}
          />
        )}
        <Kpi
          label="Attendance, 30 days"
          value={a.rate != null ? a.rate + '%' : '—'}
          sub={`${a.P} present · ${a.A} absent · ${a.L} late`}
        />
        <Kpi
          label="Last test"
          value={lm ? (lm.absent ? 'absent' : `${lm.marks}/${lastTest!.max}`) : '—'}
          sub={lastTest ? lastTest.name : 'no tests yet'}
        />
        {!teacher && (
          <Kpi
            label="Monthly fees"
            value={rup(monthlyFee(s))}
            sub={
              s.discountBps
                ? `${s.discountBps / 100}% sibling discount`
                : plural(activeBatchesOf(s.id).length, 'batch', 'batches')
            }
          />
        )}
      </div>
      <section className="card">
        <Tabs items={tabList} value={tab} onChange={setTab} />
        {body}
      </section>
    </>
  )
}
