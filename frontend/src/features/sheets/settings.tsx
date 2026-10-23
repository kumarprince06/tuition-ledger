import { useState } from 'react'
import { DEMO_OTP, changePassword, setCredentials } from '../../mock/auth'
import {
  addHoliday,
  currentMarks,
  inviteUser,
  setUserStatus,
  startWhatsApp,
  Us,
} from '../../mock/domain'
import { store } from '../../mock/store'
import type { Role } from '../../mock/types'
import {
  TODAY,
  addDays,
  emailOk,
  first,
  listJoin,
  plural,
  pwProblem,
  validMobile,
} from '../../shared/lib/format'
import { Field, PasswordInput, PhoneInput, Seg } from '../../shared/ui/kit'
import { CancelButton, Sheet, useSheet, useToast } from '../../shared/ui/overlay'

export function InviteSheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [f, setF] = useState({ name: '', phone: '', role: 'TEACHER' as Role })
  const taken = validMobile(f.phone) && store.db.users.some((u) => u.phone === '+91' + f.phone)
  const ok = f.name.trim().length >= 2 && validMobile(f.phone) && !taken
  return (
    <Sheet
      title="Invite staff"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              inviteUser(f.name.trim(), f.phone, f.role)
              close()
              toast(`Invite sent to ${f.name.trim()} on WhatsApp.`)
            }}
          >
            Send invite on WhatsApp
          </button>
        </>
      }
    >
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Name">
          <input
            className="inp"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            autoFocus
          />
        </Field>
        <Field
          label="WhatsApp number"
          error={
            taken ? 'This number already has an account. One number = one account.' : undefined
          }
          hint="They sign in with a code on this number"
        >
          <PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
        </Field>
      </div>
      <div className="field">
        Role
        <Seg
          label="Role"
          value={f.role as 'TEACHER' | 'ACCOUNTANT'}
          onChange={(r) => setF({ ...f, role: r })}
          items={[
            ['TEACHER', 'Teacher'],
            ['ACCOUNTANT', 'Accountant'],
          ]}
        />
        <span className="hint">
          {f.role === 'TEACHER'
            ? 'Marks attendance and enters marks for their own batches; can record cash.'
            : 'Payments, ledgers, refunds and adjustments; can see attendance but not mark it.'}
        </span>
      </div>
    </Sheet>
  )
}

export function DeactivateSheet({ userId }: { userId: string }) {
  const toast = useToast()
  const { close } = useSheet()
  const u = Us(userId)!
  const teaches = store.db.batches.filter((b) => b.teacherId === userId && b.status === 'active')
  return (
    <Sheet
      title={`Deactivate ${u.name}?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-danger"
            onClick={() => {
              setUserStatus(userId, 'deactivated')
              close()
              toast(`${u.name} deactivated and signed out.`)
            }}
          >
            Deactivate
          </button>
        </>
      }
    >
      <p className="small">
        {first(u.name)} is signed out within a minute and can't sign in again until reactivated.
        Their past attendance, marks and payments keep their name.
        {teaches.length > 0 && (
          <b>
            {' '}
            They teach {listJoin(teaches.map((b) => b.name))}; assign another teacher afterwards.
          </b>
        )}
      </p>
    </Sheet>
  )
}

export function HolidaySheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [day, setDay] = useState(addDays(TODAY, 7))
  const [reason, setReason] = useState('')
  const n = store.db.sessions.filter(
    (s) => s.date === day && !Object.keys(currentMarks(s.id)).length,
  ).length
  const ok =
    reason.trim().length >= 2 && day >= TODAY && !store.db.holidays.some((h) => h.day === day)
  return (
    <Sheet
      title="Add a holiday"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              const gone = addHoliday(day, reason.trim())
              close()
              toast(`Holiday added; ${plural(gone, 'class', 'classes')} removed.`)
            }}
          >
            Add holiday
          </button>
        </>
      }
    >
      <div className="grid g2" style={{ gap: 12 }}>
        <Field label="Date">
          <input
            className="inp"
            type="date"
            min={TODAY}
            value={day}
            onChange={(e) => setDay(e.target.value)}
          />
        </Field>
        <Field label="Reason">
          <input
            className="inp"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Diwali"
          />
        </Field>
      </div>
      <p className="tiny">
        {plural(n, 'class', 'classes')} on that day will be removed.
        {store.db.settings.autoAnnounce ? ' Parents are told.' : ''}
      </p>
    </Sheet>
  )
}

export function WhatsAppSheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [phone, setPhone] = useState('')
  return (
    <Sheet
      title="Connect your WhatsApp number"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!/^\d{10,11}$/.test(phone)}
            onClick={() => {
              startWhatsApp()
              close()
              toast('Submitted to Meta. Review usually takes 2–5 days.')
            }}
          >
            Continue with Facebook
          </button>
        </>
      }
    >
      <ol
        className="small"
        style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}
      >
        <li>Use a number that isn't on the WhatsApp app (a new SIM or a landline).</li>
        <li>
          Meta shows <b>{store.db.centre.name}</b> as the sender name.
        </li>
        <li>Facebook will ask for your business details in a pop-up.</li>
        <li>
          Review takes 2–5 days. You'll get a WhatsApp message on your own number when it's done.
        </li>
      </ol>
      <Field label="Business number">
        <PhoneInput value={phone} onChange={setPhone} maxLength={11} />
      </Field>
    </Sheet>
  )
}

export function RotateFeedSheet({ onRotate }: { onRotate: () => void }) {
  const toast = useToast()
  const { close } = useSheet()
  return (
    <Sheet
      title="Make a new calendar link?"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            onClick={() => {
              onRotate()
              close()
              toast('New link made; the old one no longer works.')
            }}
          >
            Make a new link
          </button>
        </>
      }
    >
      <p className="small">
        Your old link stops working straight away. Calendars subscribed with it stop updating until
        you add the new link.
      </p>
    </Sheet>
  )
}

export function CredentialsSheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [f, setF] = useState({ email: '', pw: '', code: '' })
  const prob = pwProblem(f.pw)
  const taken =
    emailOk(f.email) &&
    store.db.users.some(
      (u) =>
        u.id !== store.session.userId && u.email?.toLowerCase() === f.email.trim().toLowerCase(),
    )
  const ok = emailOk(f.email) && !taken && !!f.pw && !prob && f.code === DEMO_OTP
  return (
    <Sheet
      title="Add email and password"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!ok}
            onClick={() => {
              setCredentials(store.session.userId, f.email, f.pw)
              close()
              toast(`Password set. We've emailed a link to verify ${f.email.trim().toLowerCase()}.`)
            }}
          >
            Save
          </button>
        </>
      }
    >
      <Field
        label="Email"
        error={taken ? 'This email already has an account' : undefined}
        hint="We'll send a link to verify it"
      >
        <input
          className="inp"
          type="email"
          value={f.email}
          onChange={(e) => setF({ ...f, email: e.target.value })}
          autoComplete="email"
          autoFocus
        />
      </Field>
      <Field label="Password" error={prob || undefined} hint="At least 8 characters">
        <PasswordInput value={f.pw} onChange={(v) => setF({ ...f, pw: v })} />
      </Field>
      <Field label="Code sent to your WhatsApp" hint="Confirms it's you. Prototype code: 123456">
        <input
          className="inp otp"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          value={f.code}
          onChange={(e) => setF({ ...f, code: e.target.value.replace(/\D/g, '') })}
          style={{ fontSize: 20 }}
        />
      </Field>
    </Sheet>
  )
}

export function PasswordSheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [cur, setCur] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const prob = pwProblem(pw)
  return (
    <Sheet
      title="Change password"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={!cur || !pw || !!prob}
            onClick={() => {
              if (!changePassword(store.session.userId, cur, pw))
                return setErr('Current password is wrong.')
              close()
              toast('Password changed. Your other devices are signed out.')
            }}
          >
            Change password
          </button>
        </>
      }
    >
      <Field label="Current password">
        <PasswordInput
          value={cur}
          onChange={setCur}
          autoComplete="current-password"
          label="Current password"
        />
      </Field>
      <Field
        label="New password"
        error={prob || undefined}
        hint="At least 8 characters. Your other devices are signed out."
      >
        <PasswordInput value={pw} onChange={setPw} label="New password" />
      </Field>
      {err && (
        <div className="alert alert-red" role="alert">
          {err}
        </div>
      )}
      <p className="tiny">
        Forgot the current one? Sign out and use “Forgot password”, or sign in with a WhatsApp code.
      </p>
    </Sheet>
  )
}

export function PlatformCentreSheet() {
  const toast = useToast()
  const { close } = useSheet()
  const [f, setF] = useState({ name: '', phone: '', plan: 'Starter trial' })
  return (
    <Sheet
      title="Create a centre"
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            disabled={f.name.trim().length < 3 || !validMobile(f.phone)}
            onClick={() => {
              close()
              toast(`Centre created; invite sent to +91 ${f.phone}.`)
            }}
          >
            Create and invite owner
          </button>
        </>
      }
    >
      <Field label="Centre name">
        <input
          className="inp"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          autoFocus
        />
      </Field>
      <Field label="Owner's WhatsApp" hint="The owner gets an invite and signs in with a code">
        <PhoneInput value={f.phone} onChange={(v) => setF({ ...f, phone: v })} />
      </Field>
      <Field label="Plan">
        <select
          className="inp"
          value={f.plan}
          onChange={(e) => setF({ ...f, plan: e.target.value })}
        >
          {['Starter trial', 'Free', 'Starter', 'Standard'].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>
      <p className="tiny">Same provisioning as self-registration (POST /platform/centres).</p>
    </Sheet>
  )
}

export function SupportSheet({ centre }: { centre: string }) {
  const toast = useToast()
  const { close } = useSheet()
  return (
    <Sheet
      title={`Open a support session on ${centre}?`}
      footer={
        <>
          <CancelButton />
          <button
            className="btn btn-primary"
            onClick={() => {
              close()
              toast(`Support session open on ${centre} for 30 minutes, read-only and logged.`)
            }}
          >
            Open session
          </button>
        </>
      }
    >
      <p className="small">
        Read-only for 30 minutes, recorded in the centre's audit log, and the owner is notified.
        Student names, phone numbers and amounts stay hidden.
      </p>
    </Sheet>
  )
}
