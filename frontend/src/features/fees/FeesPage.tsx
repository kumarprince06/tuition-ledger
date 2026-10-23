import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
  B,
  balance,
  can,
  compText,
  consentOf,
  daysOverdue,
  feePreview,
  lastReminder,
  markFeePreviewChecked,
  methodLabel,
  St,
  userName,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import { TODAY, addDays, dShort, monthName, plural, rup, rup2 } from '../../shared/lib/format'
import { Empty, Kpi, PageHead, Pill, Tabs } from '../../shared/ui/kit'
import { useSheet, useToast } from '../../shared/ui/overlay'
import { PaymentSheet, RefundSheet, RemindSheet } from '../sheets/payments'
import { NotFound } from '../NotFound'

type Tab = 'outstanding' | 'payments' | 'run'

export function FeesPage() {
  const { db, session } = useStore()
  const { tab: tabParam } = useParams()
  const sheet = useSheet()
  const toast = useToast()
  const [tab, setTab] = useState<Tab>(
    tabParam === 'run' && session.role === 'OWNER' ? 'run' : 'outstanding',
  )
  if (!can('LEDGER_READ')) return <NotFound />
  const period = TODAY.slice(0, 7)
  const charges = db.charges.filter((c) => c.period === period && c.net > 0)
  const due = charges.reduce((a, c) => a + c.net, 0)
  const coll = db.payments
    .filter((p) => p.receivedOn.startsWith(period))
    .reduce((a, p) => a + p.amount, 0)
  const outst = db.students
    .filter((s) => balance(s.id) > 0)
    .sort((a, b) => daysOverdue(b.id) - daysOverdue(a.id))
  const credit = db.students.filter((s) => balance(s.id) < 0).reduce((a, s) => a - balance(s.id), 0)
  const pays = db.payments
    .slice()
    .sort((a, b) => (b.receivedOn + b.createdAt).localeCompare(a.receivedOn + a.createdAt))
  const offsets = db.settings.reminderOffsets.map((o) => (o ? `+${o}` : 'due day')).join(', ')
  const pdf = (rno: string) =>
    toast(`Receipt PDF ${rno} opens from a signed link valid for 90 days.`)
  const tabs: [Tab, string][] = [
    ['outstanding', `Outstanding · ${outst.length}`],
    ['payments', `Payments · ${pays.length}`],
  ]
  if (session.role === 'OWNER') tabs.push(['run', 'Next fee run'])
  const next = addDays(`${period}-01`, 40).slice(0, 7)
  return (
    <>
      <PageHead
        title="Fees"
        sub={`${monthName(period)}: ${rup(coll)} collected of ${rup(due)} due. Balances come from the ledger; nothing is ever overwritten.`}
        actions={
          <>
            <Link className="btn" to="/reports">
              Statement
            </Link>
            {db.students.length > 0 && (
              <button className="btn btn-primary" onClick={() => sheet.open(<PaymentSheet />)}>
                Record a payment
              </button>
            )}
          </>
        }
      />
      <div className="grid g4">
        <Kpi label="Due this month" value={rup(due)} sub={plural(charges.length, 'charge')} />
        <Kpi
          label="Collected"
          value={rup(coll)}
          sub={`${due ? Math.round((coll / due) * 100) : 0}%`}
          tone="c-green"
        />
        <Kpi
          label="Outstanding"
          value={rup(outst.reduce((a, s) => a + balance(s.id), 0))}
          sub={plural(outst.length, 'student')}
          tone="c-amber"
        />
        <Kpi
          label="Credit held"
          value={rup(credit)}
          sub="used up by the next charges automatically"
        />
      </div>
      <section className="card">
        <Tabs items={tabs} value={tab} onChange={setTab} />
        {tab === 'outstanding' &&
          (outst.length ? (
            <>
              <table className="rtable">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th className="num">Due</th>
                    <th>Overdue</th>
                    <th>Last reminder</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {outst.map((s) => {
                    const od = daysOverdue(s.id),
                      lr = lastReminder(s.parentPhone),
                      c = consentOf(s.parentPhone)
                    return (
                      <tr key={s.id}>
                        <td className="c-main">
                          <Link to={`/students/${s.id}`}>
                            <b>{s.name}</b>
                          </Link>
                          <div className="tiny">
                            {s.parentName} ·{' '}
                            {c === 'given'
                              ? 'opted in'
                              : c === 'pending'
                                ? 'awaiting YES'
                                : 'opted out'}
                          </div>
                        </td>
                        <td data-label="Due" className="num strong c-amber">
                          {rup(balance(s.id))}
                        </td>
                        <td data-label="Overdue">
                          {od ? (
                            <Pill tone={od > 14 ? 'red' : 'amber'}>{plural(od, 'day')}</Pill>
                          ) : (
                            <Pill tone="grey">not yet due</Pill>
                          )}
                        </td>
                        <td data-label="Last reminder" className="small muted">
                          {lr
                            ? dShort(lr.slice(0, 10))
                            : c === 'given'
                              ? 'none yet'
                              : 'not allowed'}
                        </td>
                        <td className="c-act num">
                          {can('REMINDER_SEND_NOW') && (
                            <button
                              className="btn btn-sm"
                              disabled={c !== 'given'}
                              title={c !== 'given' ? "Parent hasn't opted in" : undefined}
                              onClick={() => sheet.open(<RemindSheet studentId={s.id} />)}
                            >
                              Remind
                            </button>
                          )}{' '}
                          <button
                            className="btn btn-sm"
                            onClick={() => sheet.open(<PaymentSheet studentId={s.id} />)}
                          >
                            Record payment
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div className="card-ft tiny">
                Automatic reminders: {offsets} at 08:00, one message per parent for all children,
                skipped if paid before sending, never in quiet hours ({db.settings.quietFrom}–
                {db.settings.quietTo}). Use “Remind” only for a one-off nudge; it's limited to one
                per parent per day.
              </div>
            </>
          ) : (
            <Empty title="Nothing outstanding" sub="Every student is paid up." />
          ))}
        {tab === 'payments' &&
          (pays.length ? (
            <table className="rtable">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Student</th>
                  <th>Received</th>
                  <th>Method</th>
                  <th className="num">Amount</th>
                  <th>Recorded by</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pays.slice(0, 40).map((p) => {
                  const s = St(p.studentId)!
                  return (
                    <tr key={p.id}>
                      <td className="c-main tnum">
                        <b>{p.receiptNo}</b>
                      </td>
                      <td data-label="Student">
                        <Link to={`/students/${s.id}`}>{s.name}</Link>
                      </td>
                      <td data-label="Received">{dShort(p.receivedOn)}</td>
                      <td data-label="Method">
                        {methodLabel(p.method)}
                        {p.utr && <div className="tiny tnum">UTR {p.utr}</div>}
                      </td>
                      <td data-label="Amount" className="num">
                        {rup2(p.amount)}
                        {p.refunded > 0 && (
                          <div className="tiny c-red">refunded {rup(p.refunded)}</div>
                        )}
                      </td>
                      <td data-label="Recorded by" className="small muted">
                        {userName(p.by)}
                      </td>
                      <td className="c-act num">
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
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <Empty title="No payments yet" sub="Record cash or UPI, or send a payment link." />
          ))}
        {tab === 'run' && <FeeRun period={period} next={next} />}
      </section>
    </>
  )
}

function FeeRun({ period, next }: { period: string; next: string }) {
  const { db } = useStore()
  const prev = feePreview(next)
  const total = prev.reduce((a, c) => a + c.net, 0)
  const run = db.feeRuns[period]
  return (
    <>
      <div className="card-bd stack">
        <div className="alert alert-indigo">
          <span className="grow">
            <b>{monthName(next)} fee run</b> runs automatically on 1 {monthName(next).slice(0, 3)}{' '}
            at 00:10: {plural(prev.length, 'charge')}, {rup(total)}. Running it twice never charges
            twice.{' '}
            {run &&
              `${monthName(period)}: ${run.count} charges created ${dShort(run.at.slice(0, 10))}.`}
          </span>
        </div>
        <div className="row">
          <button
            className="btn btn-indigo"
            disabled={db.onboarding.feePreviewed}
            onClick={markFeePreviewChecked}
          >
            {db.onboarding.feePreviewed ? 'Preview checked' : 'Mark preview as checked'}
          </button>
          <button className="btn" disabled title="Opens on the 1st">
            Run now
          </button>
          <span className="tiny">GET /fee-runs/{next}/preview · nothing is written</span>
        </div>
      </div>
      {prev.length ? (
        <table className="rtable">
          <thead>
            <tr>
              <th>Student</th>
              <th>Batch</th>
              <th>How it's worked out</th>
              <th className="num">Charge</th>
            </tr>
          </thead>
          <tbody>
            {prev.map((c, i) => (
              <tr key={i}>
                <td className="c-main">{St(c.studentId)!.name}</td>
                <td data-label="Batch">{B(c.batchId)!.name}</td>
                <td data-label="Calculation" className="small muted">
                  {compText(c)}
                </td>
                <td data-label="Charge" className="num">
                  {rup2(c.net)}
                </td>
              </tr>
            ))}
            <tr>
              <td className="c-main">
                <b>Total</b>
              </td>
              <td />
              <td />
              <td className="num strong">{rup2(total)}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <Empty
          title="Nothing to charge"
          sub="Add students to batches and their charges appear here."
        />
      )}
    </>
  )
}
