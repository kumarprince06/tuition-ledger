import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  activeOn,
  addStudent,
  B,
  changeStatus,
  deletePersonalData,
  endEnrolment,
  enrol,
  enrolmentsOf,
  myBatches,
  recordConsent,
  St,
} from '../../mock/domain'
import { store } from '../../mock/store'
import { TODAY, first, monthName, rup, validMobile } from '../../shared/lib/format'
import { Field, PhoneInput, Seg } from '../../shared/ui/kit'
import { CancelButton, Sheet, useSheet, useToast } from '../../shared/ui/overlay'

export function StudentSheet() {
  const toast = useToast()
  const nav = useNavigate()
  const { close } = useSheet()
  const [f, setF] = useState({
    name: '',
    batchId: myBatches()[0]?.id || '',
    joined: TODAY,
    parent: '',
    phone: '',
  })
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v })
  const sib =
    validMobile(f.phone) &&
    store.db.students.find((s) => s.parentPhone === '+91' + f.phone && !s.deleted)
  const ok =
    f.name.trim().length >= 2 && validMobile(f.phone) && f.batchId && f.parent.trim().length >= 2
  return (
    <Sheet
      title="Add a student"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const r = addStudent({
                name: f.name.trim(),
                batchId: f.batchId,
                joined: f.joined,
                parent: f.parent.trim(),
                phone10: f.phone,
              })
              close()
              const c = r.charged?.computation
              toast(
                `${r.student.name} added${c ? ` · ${monthName(TODAY.slice(0, 7)).split(' ')[0]} charged ${rup(r.charged!.net)} (${c.days}/${c.dim} days)` : ''}${r.sibling ? '' : ' · opt-in ' + (store.db.centre.whatsapp === 'connected' ? 'sent' : 'queued')}.`,
              )
              nav(`/students/${r.student.id}`)
            }}
          >
            Add student
          </button>
        </>
      }
    >
      <Field label="Student's full name">
        <input
          className="inp"
          value={f.name}
          onChange={(e) => set('name')(e.target.value)}
          autoComplete="off"
          autoFocus
        />
      </Field>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Batch" hint="More batches can be added on their page">
          <select
            className="inp"
            value={f.batchId}
            onChange={(e) => set('batchId')(e.target.value)}
          >
            {myBatches().map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Joined on" hint="This month is charged from this date">
          <input
            className="inp"
            type="date"
            value={f.joined}
            onChange={(e) => set('joined')(e.target.value)}
          />
        </Field>
      </div>
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Parent's name">
          <input className="inp" value={f.parent} onChange={(e) => set('parent')(e.target.value)} />
        </Field>
        <Field
          label="Parent's WhatsApp"
          error={f.phone.length === 10 && !validMobile(f.phone) ? 'Check the number' : undefined}
        >
          <PhoneInput value={f.phone} onChange={set('phone')} />
        </Field>
      </div>
      {sib && (
        <div className="alert alert-green small">
          Sibling found: {sib.name}.{' '}
          {store.db.settings.siblingPct
            ? `${store.db.settings.siblingPct}% sibling discount will apply, and `
            : ''}
          one message will cover both children.
        </div>
      )}
      <p className="tiny">
        An opt-in message goes to the parent
        {store.db.centre.whatsapp === 'connected'
          ? ' now'
          : ' once your WhatsApp number is connected'}
        . Reminders start only after they reply YES.
      </p>
    </Sheet>
  )
}

export function StatusSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const s = St(studentId)!
  const active = s.status === 'active'
  const [to, setTo] = useState<'paused' | 'left'>('paused')
  const [from, setFrom] = useState(TODAY)
  const [reason, setReason] = useState('')
  return (
    <Sheet
      title={`${active ? 'Pause or leave' : 'Resume'} · ${s.name}`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={reason.trim().length < 3}
            onClick={() => {
              const target = active ? to : 'active'
              changeStatus(studentId, target, from, reason.trim())
              close()
              toast(
                `${s.name} ${target === 'active' ? 'resumed' : target} from ${from === TODAY ? 'today' : from}.`,
              )
            }}
          >
            Confirm
          </button>
        </>
      }
    >
      {active && (
        <Seg
          label="Change"
          value={to}
          onChange={setTo}
          items={[
            ['paused', 'Pause'],
            ['left', 'Left the centre'],
          ]}
        />
      )}
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="From">
          <input
            className="inp"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </Field>
        <Field label="Reason" hint="Shown on the ledger">
          <input className="inp" value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
      <p className="tiny">
        {active
          ? 'This month is adjusted by day: the original charge stays and a correction line is added. They leave attendance lists from that date.'
          : 'Charges start again from the next fee run; this month is pro-rated from the date.'}
      </p>
    </Sheet>
  )
}

export function DeleteSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const s = St(studentId)!
  const [typed, setTyped] = useState('')
  return (
    <Sheet
      title={`Delete ${s.name}'s personal data?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-danger"
            disabled={typed.trim().toLowerCase() !== first(s.name).toLowerCase()}
            onClick={() => {
              deletePersonalData(studentId)
              close()
              toast('Personal data deleted. Financial records stay.')
            }}
          >
            Delete personal data
          </button>
        </>
      }
    >
      <p className="small">
        Name, parent name and phone number are replaced with placeholders. Ledger lines, receipts
        and statements stay, because the centre must keep financial records. This can't be undone.
      </p>
      <Field
        label={
          <span>
            Type <b>{first(s.name)}</b> to confirm
          </span>
        }
      >
        <input
          className="inp"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
        />
      </Field>
    </Sheet>
  )
}

export function ConsentSheet({ studentId }: { studentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const s = St(studentId)!
  return (
    <Sheet
      title={`Record verbal consent for ${s.parentName}`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            onClick={() => {
              recordConsent(studentId)
              close()
              toast(`Consent recorded for ${s.parentName}.`)
            }}
          >
            Record consent
          </button>
        </>
      }
    >
      <p className="small">
        Only if {s.parentName} told you in person or on a call that they agree to receive reminders,
        receipts, attendance and results on WhatsApp. The time and your name are recorded.
      </p>
    </Sheet>
  )
}

/** Enrol from a student page (pick a batch) or from a batch page (pick a student). ENR-2 capacity override. */
export function EnrolSheet({ studentId, batchId }: { studentId?: string; batchId?: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const db = store.db
  const opts = studentId
    ? db.batches
        .filter(
          (b) =>
            b.status === 'active' &&
            !enrolmentsOf(studentId).some((e) => e.batchId === b.id && activeOn(e, TODAY)),
        )
        .map((b) => ({ id: b.id, label: `${b.name} · ${rup(b.feePaise)}/mo` }))
    : db.students
        .filter(
          (s) =>
            !s.deleted &&
            s.status === 'active' &&
            !db.enrolments.some(
              (e) => e.studentId === s.id && e.batchId === batchId && activeOn(e, TODAY),
            ),
        )
        .map((s) => ({ id: s.id, label: s.name }))
  const [pick, setPick] = useState(opts[0]?.id || '')
  const [from, setFrom] = useState(TODAY)
  const [override, setOverride] = useState('')
  const b = B(studentId ? pick : batchId)
  const used = b ? db.enrolments.filter((e) => e.batchId === b.id && activeOn(e, TODAY)).length : 0
  const full = !!b && used >= b.capacity
  const ok = !!pick && (!full || override.trim().length >= 3)
  const title = studentId
    ? `Enrol ${St(studentId)!.name}`
    : `Enrol a student in ${B(batchId)!.name}`
  if (!opts.length)
    return (
      <Sheet title={title} footer={<CancelButton label="Close" />}>
        <p className="muted">
          Nothing to enrol: everyone is already in this batch or there are no other batches.
        </p>
      </Sheet>
    )
  return (
    <Sheet
      title={title}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const sid = studentId || pick,
                bid = batchId || pick
              enrol(sid, bid, from, override.trim())
              close()
              toast(`${St(sid)!.name} enrolled in ${B(bid)!.name}.`)
            }}
          >
            Enrol
          </button>
        </>
      }
    >
      <Field label={studentId ? 'Batch' : 'Student'}>
        <select className="inp" value={pick} onChange={(e) => setPick(e.target.value)}>
          {opts.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="From" hint="This month is charged from this date, pro-rated by day.">
        <input className="inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
      </Field>
      {full ? (
        <>
          <div className="alert alert-amber">
            {b!.name} is full ({used} of {b!.capacity}).
          </div>
          <Field label="Reason to go over capacity" hint="Recorded in the audit log">
            <input className="inp" value={override} onChange={(e) => setOverride(e.target.value)} />
          </Field>
        </>
      ) : (
        b && (
          <p className="tiny">
            {used} of {b.capacity} places used.
          </p>
        )
      )}
    </Sheet>
  )
}

export function EndEnrolSheet({ enrolmentId }: { enrolmentId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const e = store.db.enrolments.find((x) => x.id === enrolmentId)!
  const [to, setTo] = useState(TODAY)
  return (
    <Sheet
      title={`End ${St(e.studentId)!.name}'s enrolment in ${B(e.batchId)!.name}?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-danger"
            onClick={() => {
              endEnrolment(enrolmentId, to)
              close()
              toast('Enrolment ended.')
            }}
          >
            End enrolment
          </button>
        </>
      }
    >
      <Field label="Last day">
        <input
          className="inp"
          type="date"
          min={e.from}
          value={to}
          onChange={(ev) => setTo(ev.target.value)}
        />
      </Field>
      <p className="tiny">The rest of this month is credited by day. History stays.</p>
    </Sheet>
  )
}
