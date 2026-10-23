import { useEffect, useState } from 'react'
import { Link, NavLink, useBlocker, useParams } from 'react-router'
import {
  approveWhatsApp,
  connectRazorpay,
  removeHoliday,
  roleLabel,
  saveSettings,
  setCashOnly,
  setUserRole,
  setUserStatus,
} from '../../mock/domain'
import { store, useStore } from '../../mock/store'
import type { Role, Settings } from '../../mock/types'
import { TODAY, DAYNAME, dDay, dShort, phoneFmt, plural } from '../../shared/lib/format'
import { Check, Field, PageHead, Pill } from '../../shared/ui/kit'
import { useConfirm, useSheet, useToast } from '../../shared/ui/overlay'
import { DeactivateSheet, HolidaySheet, InviteSheet, WhatsAppSheet } from '../sheets/settings'
import { NotFound } from '../NotFound'

const SECTIONS = [
  ['centre', 'Centre'],
  ['whatsapp', 'WhatsApp & payments'],
  ['fees', 'Fees & reminders'],
  ['attendance', 'Classes & attendance'],
  ['results', 'Results'],
  ['staff', 'Staff'],
  ['plan', 'Plan & data'],
] as const
type Draft = {
  centre: { name: string; address: string; timezone: string; prefix: string }
  settings: Settings
}
const makeDraft = (): Draft =>
  JSON.parse(
    JSON.stringify({
      centre: {
        name: store.db.centre.name,
        address: store.db.centre.address,
        timezone: store.db.centre.timezone,
        prefix: store.db.centre.prefix,
      },
      settings: store.db.settings,
    }),
  )

export function SettingsPage() {
  const { db, session } = useStore()
  const { section = 'centre' } = useParams()
  const toast = useToast()
  const confirm = useConfirm()
  const sheet = useSheet()
  const [d, setD] = useState<Draft>(makeDraft)
  const dirty = JSON.stringify(d) !== JSON.stringify(makeDraft())
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty &&
      !nextLocation.pathname.startsWith('/settings') &&
      currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (blocker.state === 'blocked')
      confirm({
        title: 'Leave without saving?',
        body: 'You have unsaved settings. If you leave now, those changes are discarded.',
        confirm: 'Discard and leave',
        danger: true,
        onConfirm: () => blocker.proceed(),
      })
  }, [blocker, confirm])
  if (session.role !== 'OWNER') return <NotFound />
  const st = d.settings
  const setS = <K extends keyof Settings>(k: K, v: Settings[K]) =>
    setD({ ...d, settings: { ...st, [k]: v } })
  const setC = (k: keyof Draft['centre'], v: string) =>
    setD({ ...d, centre: { ...d.centre, [k]: v } })
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setS(k, (e.target.value === '' ? '' : Number(e.target.value)) as never)
  const toggle = (k: keyof Settings, label: string, hint?: string) => (
    <Check checked={!!st[k]} onChange={(v) => setS(k, v as never)}>
      {label}
      {hint && (
        <span className="tiny" style={{ display: 'block' }}>
          {hint}
        </span>
      )}
    </Check>
  )
  const prefOk = /^[A-Z]{2,4}$/.test(d.centre.prefix)
  const save = () => {
    if (!prefOk) return toast('Receipt prefix needs 2–4 capital letters.')
    const s = {
      ...st,
      dueDay: Math.min(28, Math.max(1, Number(st.dueDay) || 5)),
      editWindow: Math.min(30, Math.max(1, Number(st.editWindow) || 7)),
    }
    saveSettings(d.centre, s)
    setD(makeDraft())
    toast('Settings saved and recorded in the audit log.')
  }
  const toggleOffset = (o: number) => {
    const cur = st.reminderOffsets
    if (cur.includes(o))
      return cur.length > 1
        ? setS(
            'reminderOffsets',
            cur.filter((x) => x !== o),
          )
        : toast('Keep at least one reminder day.')
    if (cur.length >= 4) return toast('Up to 4 reminder days.')
    setS(
      'reminderOffsets',
      [...cur, o].sort((a, b) => a - b),
    )
  }

  let body = null
  if (section === 'centre')
    body = (
      <div className="grid g2">
        <Field label="Centre name" hint="Shown in every message and receipt.">
          <input
            className="inp"
            value={d.centre.name}
            onChange={(e) => setC('name', e.target.value)}
          />
        </Field>
        <Field label="Address">
          <input
            className="inp"
            value={d.centre.address}
            onChange={(e) => setC('address', e.target.value)}
          />
        </Field>
        <Field label="Timezone" hint="Sets the fee month, quiet hours and digests.">
          <select
            className="inp"
            value={d.centre.timezone}
            onChange={(e) => setC('timezone', e.target.value)}
          >
            {['Asia/Kolkata', 'Asia/Dubai', 'Asia/Kathmandu', 'Asia/Dhaka'].map((z) => (
              <option key={z}>{z}</option>
            ))}
          </select>
        </Field>
        {db.payments.length ? (
          <Field
            label="Receipt prefix"
            hint={`Locked after the first receipt. Next: ${db.centre.prefix}-2026-${String(db.receiptNext).padStart(6, '0')}`}
          >
            <input className="inp tnum" value={db.centre.prefix} disabled />
          </Field>
        ) : (
          <Field
            label="Receipt prefix"
            error={!prefOk ? '2–4 capital letters' : undefined}
            hint={`Receipts will be ${d.centre.prefix}-2026-000001, … You can change this until the first receipt.`}
          >
            <input
              className="inp tnum"
              maxLength={4}
              value={d.centre.prefix}
              onChange={(e) => setC('prefix', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
            />
          </Field>
        )}
        <Field label="Message language">
          <select
            className="inp"
            value={st.language}
            onChange={(e) => setS('language', e.target.value)}
          >
            <option>English</option>
            <option>Bengali (templates pending approval)</option>
            <option disabled>Hindi (later)</option>
          </select>
        </Field>
      </div>
    )
  if (section === 'whatsapp') {
    const w = db.centre.whatsapp
    const held = db.messages.filter((m) => m.status === 'held').length
    body = (
      <div className="stack">
        <div className="card card-bd stack" style={{ boxShadow: 'none' }}>
          <div className="row between">
            <h3>WhatsApp Business number</h3>
            {w === 'connected' ? (
              <Pill tone="green">connected</Pill>
            ) : w === 'pending' ? (
              <Pill tone="amber">in review</Pill>
            ) : (
              <Pill tone="grey">not connected</Pill>
            )}
          </div>
          {w === 'connected' ? (
            <p className="small">
              Parents see messages from <b>{db.centre.name}</b>. Messages delivered this month:{' '}
              {
                db.messages.filter(
                  (m) => m.at.startsWith(TODAY.slice(0, 7)) && m.status === 'delivered',
                ).length
              }
              .
            </p>
          ) : w === 'pending' ? (
            <>
              <p className="small">
                Meta is reviewing your number and display name “{db.centre.name}”. This usually
                takes 2–5 days.{' '}
                {held ? (
                  <b>{plural(held, 'message')} will go out as soon as it's approved.</b>
                ) : null}
              </p>
              <div className="row">
                <button
                  className="btn"
                  onClick={() =>
                    toast(`WhatsApp connected. ${plural(approveWhatsApp(), 'held message')} sent.`)
                  }
                >
                  Simulate approval (demo)
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="small">
                Use a number that isn't already on the WhatsApp app (a new SIM or a landline works).
                You'll need your centre's business details. Until it's approved, you can use
                everything else; messages wait in the queue.
              </p>
              <div className="row">
                <button className="btn btn-primary" onClick={() => sheet.open(<WhatsAppSheet />)}>
                  Connect WhatsApp number
                </button>
              </div>
            </>
          )}
        </div>
        <div className="card card-bd stack" style={{ boxShadow: 'none' }}>
          <div className="row between">
            <h3>Razorpay (payment links)</h3>
            {db.centre.razorpay === 'connected' ? (
              <Pill tone="green">connected</Pill>
            ) : db.onboarding.cashOnly ? (
              <Pill tone="grey">cash and UPI only</Pill>
            ) : (
              <Pill tone="grey">not connected</Pill>
            )}
          </div>
          {db.centre.razorpay === 'connected' ? (
            <Field label="Payment link fee">
              <select
                className="inp"
                value={st.linkFee}
                onChange={(e) => setS('linkFee', e.target.value)}
              >
                <option value="absorb">Centre absorbs the fee</option>
                <option value="pass">Add it to the parent's charge as a line</option>
              </select>
            </Field>
          ) : (
            <div className="row">
              <button
                className="btn"
                onClick={() => {
                  connectRazorpay()
                  toast('Razorpay connected (demo; real KYC takes about a week).')
                }}
              >
                Connect Razorpay
              </button>
              <Check checked={db.onboarding.cashOnly} onChange={setCashOnly}>
                I only take cash and UPI for now
              </Check>
            </div>
          )}
        </div>
      </div>
    )
  }
  if (section === 'fees')
    body = (
      <>
        <div className="grid g2">
          <Field label="Fee due day" hint="Day of the month, 1–28.">
            <input
              className="inp tnum"
              type="number"
              min={1}
              max={28}
              value={st.dueDay}
              onChange={num('dueDay')}
            />
          </Field>
          <Field
            label="Sibling discount (%)"
            hint="Applied when a new student shares a parent number."
          >
            <input
              className="inp tnum"
              type="number"
              min={0}
              max={50}
              value={st.siblingPct}
              onChange={num('siblingPct')}
            />
          </Field>
        </div>
        <div className="field">
          Reminder days{' '}
          <span className="hint">Pick 1–4. Sent at 08:00, skipped if already paid.</span>
          <div className="row">
            {[0, 1, 2, 3, 5, 7, 10, 14, 21].map((o) => (
              <button
                key={o}
                type="button"
                className="chip"
                aria-pressed={st.reminderOffsets.includes(o)}
                onClick={() => toggleOffset(o)}
              >
                {o ? `+${o} days` : 'Due day'}
              </button>
            ))}
          </div>
        </div>
        <div className="grid g2">
          <Field label="Quiet hours from">
            <input
              className="inp"
              type="time"
              value={st.quietFrom}
              onChange={(e) => setS('quietFrom', e.target.value)}
            />
          </Field>
          <Field label="to">
            <input
              className="inp"
              type="time"
              value={st.quietTo}
              onChange={(e) => setS('quietTo', e.target.value)}
            />
          </Field>
          <Field label="Duplicate-payment warning window">
            <select
              className="inp"
              value={st.dupWindow}
              onChange={(e) => setS('dupWindow', Number(e.target.value))}
            >
              {[12, 24, 48].map((h) => (
                <option key={h} value={h}>
                  {h} hours
                </option>
              ))}
            </select>
          </Field>
          <Field label="Weekly attendance digest">
            <select
              className="inp"
              value={st.digestOn ? st.digestDay : 'off'}
              onChange={(e) =>
                setD({
                  ...d,
                  settings: {
                    ...st,
                    digestOn: e.target.value !== 'off',
                    digestDay: e.target.value === 'off' ? st.digestDay : e.target.value,
                  },
                })
              }
            >
              <option value="off">Off</option>
              {['SUN', 'SAT'].map((x) => (
                <option key={x} value={x}>
                  {DAYNAME[x]}day 10:00
                </option>
              ))}
            </select>
          </Field>
        </div>
        {toggle(
          'receiptPdf',
          'Add a receipt PDF link to receipt messages',
          'Signed link, valid for 90 days',
        )}
      </>
    )
  if (section === 'attendance')
    body = (
      <>
        <div className="grid g2">
          <Field label="Attendance can be edited for (days)">
            <input
              className="inp tnum"
              type="number"
              min={1}
              max={30}
              value={st.editWindow}
              onChange={num('editWindow')}
            />
          </Field>
          <Field label="Low-attendance flag below (% over 30 days)">
            <input
              className="inp tnum"
              type="number"
              min={50}
              max={95}
              value={st.lowAttendance}
              onChange={num('lowAttendance')}
            />
          </Field>
          <Field label="Teacher reminder before class (minutes, 0 = off)">
            <input
              className="inp tnum"
              type="number"
              min={0}
              max={60}
              value={st.nudgeMin}
              onChange={num('nudgeMin')}
            />
          </Field>
          <Field label="Who can send announcements">
            <select
              className="inp"
              value={st.announcers}
              onChange={(e) => setS('announcers', e.target.value as Settings['announcers'])}
            >
              <option value="owner_teachers">Owner and teachers (own batches)</option>
              <option value="owner">Owner only</option>
            </select>
          </Field>
        </div>
        {toggle('autoAnnounce', 'Tell parents automatically when a class is cancelled or moved')}
        {toggle('feeds', 'Calendar feeds for staff', 'Each person subscribes from My account')}
        {toggle('dailyQuote', "Show a daily quote on the owner's Today page")}
        <div className="field">
          Holidays{' '}
          <span className="hint">
            Classes on these days are skipped. Unmarked classes already scheduled are removed.
          </span>
          <ul className="list card" style={{ boxShadow: 'none' }}>
            {db.holidays
              .slice()
              .sort((a, b) => a.day.localeCompare(b.day))
              .map((h) => (
                <li key={h.day} className="li">
                  <span className="grow">
                    <b>{dDay(h.day)}</b> · {h.reason}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() =>
                      confirm({
                        title: `Remove ${h.reason}?`,
                        body: `Classes on ${dDay(h.day)} will be scheduled again.`,
                        confirm: 'Remove holiday',
                        onConfirm: () => {
                          removeHoliday(h.day)
                          toast('Holiday removed.')
                        },
                      })
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            {!db.holidays.length && <li className="li muted">No holidays.</li>}
          </ul>
          <div>
            <button className="btn btn-sm" onClick={() => sheet.open(<HolidaySheet />)}>
              Add a holiday
            </button>
          </div>
        </div>
      </>
    )
  if (section === 'results')
    body = (
      <>
        {toggle(
          'avgInResults',
          'Include the batch average in result messages',
          '“Batch average 31/50.” Never a rank.',
        )}
        {toggle('absentNotice', 'Tell parents when their child misses a test')}
        <Field label="Marks can be changed for (days after the test)">
          <input
            className="inp tnum"
            type="number"
            min={1}
            max={30}
            value={st.marksWindow}
            onChange={num('marksWindow')}
            style={{ maxWidth: 120 }}
          />
        </Field>
      </>
    )
  if (section === 'staff')
    body = (
      <>
        <table className="rtable">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {db.users.map((u) => (
              <tr key={u.id}>
                <td className="c-main">
                  <b>{u.name}</b>
                  <div className="tiny tnum">{phoneFmt(u.phone)}</div>
                </td>
                <td data-label="Role">
                  {u.id === session.userId ? (
                    <Pill tone="indigo">Owner</Pill>
                  ) : (
                    <select
                      className="inp"
                      style={{ minHeight: 36, padding: '4px 8px', width: 'auto' }}
                      aria-label={`Role for ${u.name}`}
                      value={u.role}
                      onChange={(e) => {
                        const to = e.target.value as Role
                        confirm({
                          title: `Change ${u.name} to ${roleLabel(to)}?`,
                          body: `${u.name.split(' ')[0]} is signed out and sees the ${roleLabel(to).toLowerCase()} menus next time they sign in.${to === 'OWNER' ? ' Owners can change every setting, including staff and billing.' : ''}`,
                          confirm: 'Change role',
                          onConfirm: () => {
                            setUserRole(u.id, to)
                            toast('Role changed.')
                          },
                        })
                      }}
                    >
                      {(['TEACHER', 'ACCOUNTANT', 'OWNER'] as Role[]).map((r) => (
                        <option key={r} value={r}>
                          {roleLabel(r)}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td data-label="Status">
                  {u.status === 'active' ? (
                    <Pill tone="green">active</Pill>
                  ) : (
                    <Pill tone="grey">deactivated</Pill>
                  )}
                </td>
                <td className="c-act num">
                  {u.id === session.userId ? null : u.status === 'active' ? (
                    <button
                      className="btn btn-sm"
                      onClick={() => sheet.open(<DeactivateSheet userId={u.id} />)}
                    >
                      Deactivate
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => {
                        setUserStatus(u.id, 'active')
                        toast(`${u.name} can sign in again.`)
                      }}
                    >
                      Reactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="row">
          <button className="btn btn-primary" onClick={() => sheet.open(<InviteSheet />)}>
            Invite staff
          </button>
          <span className="tiny">
            Role changes and deactivation sign the person out within a minute. Their past attendance
            and payments keep their name.
          </span>
        </div>
      </>
    )
  if (section === 'plan') {
    const active = db.students.filter((s) => s.status === 'active' && !s.deleted).length
    const msgs = db.messages.filter(
      (m) =>
        m.at.startsWith(TODAY.slice(0, 7)) && ['delivered', 'sent', 'failed'].includes(m.status),
    ).length
    body = (
      <div className="stack">
        <div className="row between">
          <h3>
            {db.centre.plan}
            {db.centre.trialEndsOn ? ' trial' : ''}
          </h3>
          {db.centre.trialEndsOn ? (
            <Pill tone="indigo">trial ends {dShort(db.centre.trialEndsOn)}</Pill>
          ) : (
            <Pill tone="green">active</Pill>
          )}
        </div>
        <div>
          <div className="row between small">
            <span>Students</span>
            <b>{active} of 100 included</b>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, active)}%` }} />
          </div>
        </div>
        <div>
          <div className="row between small">
            <span>WhatsApp messages this month</span>
            <b>{msgs} of 1,000</b>
          </div>
          <div className="bar">
            <i style={{ width: `${Math.min(100, msgs / 10)}%`, background: 'var(--green)' }} />
          </div>
          <span className="tiny">At 90% you're warned; at 100% only receipts are sent.</span>
        </div>
        <div className="row between small">
          <span>Next invoice</span>
          <b>{db.centre.trialEndsOn ? 'none during the trial' : '₹199 + GST on 1 Nov'}</b>
        </div>
        <div className="row">
          <button
            className="btn"
            onClick={() =>
              toast(
                'Free (30 students) · Starter ₹199 (100 students, links, CSV import) · Standard ₹499 (300 students, Google Calendar, accountant exports). Changes apply from the next bill.',
              )
            }
          >
            Compare plans
          </button>
          <button
            className="btn"
            onClick={() =>
              toast(
                'Export started: students, enrolments, attendance, charges, payments and ledger as CSV. The link arrives on your WhatsApp.',
              )
            }
          >
            Export all my data
          </button>
          <button
            className="btn"
            onClick={() =>
              toast(
                'Audit log: every settings change, role change, refund, adjustment and deletion, with before and after.',
              )
            }
          >
            Audit log
          </button>
        </div>
      </div>
    )
  }
  const showBar = dirty || !['staff', 'plan', 'whatsapp'].includes(section)
  return (
    <>
      <PageHead
        title="Settings"
        sub={`${db.centre.name} · every change is recorded in the audit log.`}
      />
      <div className="grid settings-grid">
        <nav className="card" style={{ padding: 8 }} aria-label="Settings sections">
          {SECTIONS.map(([k, l]) => (
            <NavLink
              key={k}
              className="nl"
              to={`/settings/${k}`}
              aria-current={section === k ? 'page' : undefined}
            >
              {l}
            </NavLink>
          ))}
        </nav>
        <section className="card">
          <div className="card-hd">
            <h2>{SECTIONS.find(([k]) => k === section)?.[1] || 'Settings'}</h2>
          </div>
          <div className="card-bd stack">{body}</div>
          {showBar && (
            <div className="sticky-bar">
              <span className="small grow">
                {dirty ? <b className="c-amber">Unsaved changes</b> : 'All changes saved'}
              </span>
              <button
                className="btn"
                disabled={!dirty}
                onClick={() => {
                  setD(makeDraft())
                  toast('Changes discarded.')
                }}
              >
                Discard
              </button>
              <button className="btn btn-primary" disabled={!dirty} onClick={save}>
                Save settings
              </button>
            </div>
          )}
        </section>
      </div>
      <p className="tiny">
        Looking for your own sign-in or calendar? <Link to="/account">My account</Link>
      </p>
    </>
  )
}
