import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  activeBatchesOf,
  addAdjustment,
  balance,
  can,
  consentOf,
  dueItemsFor,
  methodLabel,
  paymentLink,
  recordPayment,
  refund,
  remindNow,
  remindersSentToday,
  St,
  T,
  visibleStudents,
} from '../../mock/domain'
import { store, useStore } from '../../mock/store'
import type { Method } from '../../mock/types'
import {
  TODAY,
  dShort,
  first,
  initials,
  listJoin,
  newKey,
  rup,
  rup2,
} from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import { Field, Seg } from '../../shared/ui/kit'
import { Bubble, CancelButton, Sheet, useSheet, useToast } from '../../shared/ui/overlay'

const toPaise = (v: string) => Math.round(Number(v) * 100)

export function PaymentSheet({ studentId }: { studentId?: string }) {
  useStore()
  const { open } = useSheet()
  const [sid, setSid] = useState(studentId || '')
  const [q, setQ] = useState('')
  const s = St(sid)
  const bal = s ? balance(s.id) : 0
  const [amount, setAmount] = useState(() => (s && bal > 0 ? String(bal / 100) : ''))
  const [date, setDate] = useState(TODAY)
  const [method, setMethod] = useState<Method>('cash')
  const [utr, setUtr] = useState('')
  const [key, setKey] = useState(newKey)
  const [err, setErr] = useState<{ type: string; detail: string } | null>(null)
  const canUpi = can('PAYMENT_UPI_WRITE')
  const utrOk = method !== 'upi_manual' || /^\d{12}$/.test(utr.trim())
  const ok = !!s && toPaise(amount) > 0 && utrOk && date <= TODAY
  const pick = (id: string) => {
    setSid(id)
    const b = balance(id)
    setAmount(b > 0 ? String(b / 100) : '')
    setErr(null)
  }
  const save = (confirmDuplicate: boolean) => {
    const r = recordPayment({
      key,
      studentId: sid,
      amount: toPaise(amount),
      method,
      utr,
      receivedOn: date,
      confirmDuplicate,
    })
    if ('error' in r) {
      setErr({ type: r.error, detail: r.detail })
      if (r.error === 'near-duplicate') setKey(newKey())
      return
    }
    open(<ReceiptSheet paymentId={r.payment.id} />)
  }
  const cands = visibleStudents()
    .filter(
      (x) =>
        !x.deleted &&
        (!q ||
          x.name.toLowerCase().includes(q.toLowerCase()) ||
          x.parentName.toLowerCase().includes(q.toLowerCase()) ||
          x.parentPhone.includes(q)),
    )
    .sort((a, b) => balance(b.id) - balance(a.id))
    .slice(0, 6)
  return (
    <Sheet
      title="Record a payment"
      footer={
        err?.type === 'near-duplicate' ? (
          <>
            <CancelButton />
            <button className="btn btn-primary" onClick={() => save(true)}>
              Record as a second payment
            </button>
          </>
        ) : (
          <>
            <CancelButton />
            <button className="btn btn-primary" disabled={!ok} onClick={() => save(false)}>
              Save and send receipt
            </button>
          </>
        )
      }
    >
      {s ? (
        <div className="card card-bd row" style={{ boxShadow: 'none' }}>
          <span className="av">{initials(s.name)}</span>
          <span className="grow">
            <b>{s.name}</b>
            <div className="tiny">
              {activeBatchesOf(s.id)
                .map((b) => b.name)
                .join(', ')}
            </div>
          </span>
          <b className={`num ${bal > 0 ? 'c-amber' : 'c-green'}`}>
            {bal > 0 ? rup(bal) + ' due' : bal < 0 ? rup(-bal) + ' credit' : 'nothing due'}
          </b>
          {!studentId && (
            <button className="btn btn-sm" onClick={() => setSid('')}>
              Change
            </button>
          )}
        </div>
      ) : (
        <div className="field">
          Student
          <div className="phone-in">
            <span className="cc" style={{ background: 'transparent', border: 0 }}>
              <Icon name="search" size={18} />
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Type a name, parent or phone"
              autoComplete="off"
              role="combobox"
              aria-expanded="true"
              aria-controls="pay-cands"
              autoFocus
            />
          </div>
          <ul className="combo-list" id="pay-cands" role="listbox">
            {cands.map((x) => (
              <li key={x.id}>
                <button role="option" aria-selected={false} onClick={() => pick(x.id)}>
                  <span>
                    <b>{x.name}</b>
                    <span className="tiny" style={{ display: 'block' }}>
                      {x.parentName} ·{' '}
                      {activeBatchesOf(x.id)
                        .map((b) => b.name.replace(/^Class \d+ /, ''))
                        .join(', ')}
                    </span>
                  </span>
                  <span className={`num small ${balance(x.id) > 0 ? 'c-amber' : 'muted'}`}>
                    {balance(x.id) > 0 ? rup(balance(x.id)) : 'paid up'}
                  </span>
                </button>
              </li>
            ))}
            {!cands.length && (
              <li className="tiny" style={{ padding: 8 }}>
                No match
              </li>
            )}
          </ul>
        </div>
      )}
      {s && (
        <>
          <div className="grid g2" style={{ gap: 12 }}>
            <Field label="Amount (₹)">
              <input
                className="inp tnum"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{ fontSize: 18 }}
              />
            </Field>
            <Field label="Received on" hint={date !== TODAY ? 'Backdated entry' : undefined}>
              <input
                className="inp"
                type="date"
                max={TODAY}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </div>
          <div className="field">
            Method
            <Seg
              label="Method"
              value={method}
              onChange={(m) => {
                setMethod(m)
                setErr(null)
              }}
              items={
                canUpi
                  ? [
                      ['cash', 'Cash'],
                      ['upi_manual', 'UPI (paid to the centre)'],
                    ]
                  : [['cash', 'Cash']]
              }
            />
            {!canUpi && (
              <span className="hint">
                Teachers can record cash. UPI and refunds are for the owner and accountant.
              </span>
            )}
          </div>
          {method === 'upi_manual' && (
            <Field
              label="UTR / reference number"
              error={utr && !utrOk ? 'UTR has 12 digits' : undefined}
              hint="The 12-digit number from the parent's UPI app"
            >
              <input
                className="inp tnum"
                inputMode="numeric"
                maxLength={12}
                value={utr}
                onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
              />
            </Field>
          )}
          <div className="tiny">
            {bal > 0
              ? 'Goes to the oldest charge first; anything extra stays as credit for next month. '
              : bal < 0
                ? 'This student already has credit. '
                : ''}
            The receipt goes to {s.parentName} on WhatsApp
            {consentOf(s.parentPhone) === 'pending' ? ' once they reply YES' : ''}.
          </div>
          {err && (
            <div
              className={`alert ${err.type === 'near-duplicate' ? 'alert-amber' : 'alert-red'}`}
              role="alert"
            >
              <span>
                <b>
                  {err.type === 'near-duplicate' ? 'This looks like a duplicate.' : 'Not saved.'}
                </b>{' '}
                {err.detail}
              </span>
            </div>
          )}
        </>
      )}
    </Sheet>
  )
}

export function ReceiptSheet({ paymentId }: { paymentId: string }) {
  const { db } = useStore()
  const toast = useToast()
  const { close } = useSheet()
  const p = db.payments.find((x) => x.id === paymentId)!
  const s = St(p.studentId)!
  const m = db.messages.filter((x) => x.phone === s.parentPhone && x.kind === 'receipt').pop()
  const allocated = p.allocations.reduce((a, x) => a + x.amount, 0)
  const bal = balance(s.id)
  return (
    <Sheet
      title="Payment recorded"
      footer={
        <>
          <button
            className="btn"
            onClick={() =>
              toast(`Receipt PDF ${p.receiptNo} opens from a signed link valid for 90 days.`)
            }
          >
            Receipt PDF
          </button>
          <button className="btn btn-primary" onClick={close}>
            Done
          </button>
        </>
      }
    >
      <div className="center stack" style={{ gap: 6 }}>
        <div
          className="av"
          style={{
            width: 56,
            height: 56,
            margin: '0 auto',
            background: 'var(--green-bg)',
            color: 'var(--green)',
            fontSize: 24,
          }}
        >
          ✓
        </div>
        <div className="tnum" style={{ fontSize: 28, fontWeight: 700 }}>
          {rup(p.amount)}
        </div>
        <div className="small">
          {s.name} · {methodLabel(p.method)} · {dShort(p.receivedOn)}
        </div>
        <div className="tnum strong">Receipt {p.receiptNo}</div>
      </div>
      <table>
        <tbody>
          {p.allocations.map((al) => (
            <tr key={al.chargeId}>
              <td className="small">{db.charges.find((c) => c.id === al.chargeId)!.description}</td>
              <td className="num">{rup2(al.amount)}</td>
            </tr>
          ))}
          {p.amount > allocated && (
            <tr>
              <td className="small">Kept as credit</td>
              <td className="num">{rup2(p.amount - allocated)}</td>
            </tr>
          )}
          <tr>
            <td>
              <b>Balance now</b>
            </td>
            <td className="num strong">{bal < 0 ? 'credit ' + rup2(-bal) : rup2(bal)}</td>
          </tr>
        </tbody>
      </table>
      {m && (
        <div className={`alert ${m.status === 'delivered' ? 'alert-green' : 'alert-amber'} small`}>
          {m.status === 'delivered'
            ? `Receipt sent to ${s.parentName} on WhatsApp.`
            : `Receipt ${m.status}: ${m.reason}.`}
        </div>
      )}
    </Sheet>
  )
}

export function LinkSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const s = St(studentId)!
  const nav = useNavigate()
  const { close } = useSheet()
  const [link] = useState(() =>
    store.db.centre.razorpay === 'connected' ? paymentLink(studentId) : null,
  )
  if (!link)
    return (
      <Sheet title="Payment link" footer={<CancelButton label="Close" />}>
        <div className="alert alert-amber">
          <span>
            Payment links need a connected Razorpay account.{' '}
            {store.session.role === 'OWNER' ? (
              <button
                className="linkbtn"
                onClick={() => {
                  close()
                  nav('/settings/whatsapp')
                }}
              >
                Connect Razorpay
              </button>
            ) : (
              'Ask the owner to connect Razorpay.'
            )}
          </span>
        </div>
      </Sheet>
    )
  const url = `https://${link.url}`
  const copy = () => {
    navigator.clipboard?.writeText(url).catch(() => {})
    toast('Link copied.')
  }
  return (
    <Sheet
      title={`Payment link · ${s.name}`}
      footer={
        <>
          <button className="btn" onClick={copy}>
            Copy link
          </button>
          <button
            className="btn btn-primary"
            onClick={() => (navigator.share ? navigator.share({ url }).catch(() => {}) : copy())}
          >
            Share…
          </button>
        </>
      }
    >
      <p className="small">
        A secure Razorpay page for <b>{rup(link.amount)}</b>. When it's paid, the payment is
        recorded once and the receipt goes out automatically.
      </p>
      <Field label="Link">
        <input className="inp tnum" value={url} readOnly onFocus={(e) => e.target.select()} />
      </Field>
      <p className="tiny">
        The same link is included in the next automatic reminder. Share it yourself if the parent
        asks.
      </p>
    </Sheet>
  )
}

export function RemindSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const s = St(studentId)!
  const items = dueItemsFor(s.parentPhone)
  if (remindersSentToday(s.parentPhone))
    return (
      <Sheet title={`Send a reminder to ${s.parentName}?`} footer={<CancelButton label="Close" />}>
        <div className="alert alert-amber">
          Already reminded today. One manual reminder per parent per day.
        </div>
      </Sheet>
    )
  return (
    <Sheet
      title={`Send a reminder to ${s.parentName}?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            onClick={() => {
              const m = remindNow(studentId)
              close()
              toast(
                m.status === 'delivered'
                  ? `Reminder sent to ${s.parentName}.`
                  : `Reminder ${m.status}: ${m.reason}.`,
              )
            }}
          >
            Send reminder
          </button>
        </>
      }
    >
      <p className="small">
        One message covers {listJoin(items.map((i) => i.name))}. It counts toward this month's
        messages.
      </p>
      <Bubble text={T.reminder(items, 'Reminder: ')} />
    </Sheet>
  )
}

export function AdjustSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const s = St(studentId)!
  const [kind, setKind] = useState<'charge' | 'credit'>('charge')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const ok = toPaise(amount) > 0 && reason.trim().length >= 3
  return (
    <Sheet
      title={`Charge or credit · ${s.name}`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              addAdjustment(studentId, kind, toPaise(amount), reason.trim())
              close()
              toast(kind === 'charge' ? 'Charge added.' : 'Credit added.')
            }}
          >
            Add to ledger
          </button>
        </>
      }
    >
      <Seg
        label="Kind"
        value={kind}
        onChange={setKind}
        items={[
          ['charge', 'One-off charge'],
          ['credit', 'Discount or credit'],
        ]}
      />
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Amount (₹)">
          <input
            className="inp tnum"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Reason" hint="Shown on the ledger and the statement">
          <input
            className="inp"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={kind === 'charge' ? 'Books, exam fee…' : 'Goodwill, fee waiver…'}
          />
        </Field>
      </div>
      <p className="tiny">
        {kind === 'charge'
          ? 'Appears in reminders like any other charge.'
          : 'A negative line; nothing earlier is edited.'}{' '}
        Your name is recorded.
      </p>
    </Sheet>
  )
}

export function RefundSheet({ paymentId }: { paymentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const p = store.db.payments.find((x) => x.id === paymentId)!
  const max = p.amount - p.refunded
  const [amount, setAmount] = useState(String(max / 100))
  const [reason, setReason] = useState('')
  const amt = toPaise(amount)
  const ok = amt > 0 && amt <= max && reason.trim().length >= 3
  return (
    <Sheet
      title={`Refund from ${p.receiptNo}`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-danger"
            disabled={!ok}
            onClick={() => {
              refund(paymentId, amt, reason.trim())
              close()
              toast(`Refund of ${rup(amt)} recorded.`)
            }}
          >
            Record refund
          </button>
        </>
      }
    >
      <p className="small">
        {first(St(p.studentId)!.name)} paid {rup(p.amount)} on {dShort(p.receivedOn)}
        {p.refunded ? `; ${rup(p.refunded)} already refunded` : ''}.
      </p>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Refund amount (₹)" error={amt > max ? `At most ${rup(max)}` : undefined}>
          <input
            className="inp tnum"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Reason" hint="Required">
          <input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <p className="tiny">
        The original payment stays as it is; a refund line is added that points to it.
      </p>
    </Sheet>
  )
}
