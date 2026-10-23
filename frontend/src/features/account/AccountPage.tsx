import { useState } from 'react'
import { useNavigate } from 'react-router'
import { signOut, verifyEmail } from '../../mock/auth'
import { roleLabel, Us } from '../../mock/domain'
import { useStore } from '../../mock/store'
import { initials, phoneFmt } from '../../shared/lib/format'
import { Field, PageHead, Pill } from '../../shared/ui/kit'
import { useSheet, useToast } from '../../shared/ui/overlay'
import { CredentialsSheet, PasswordSheet, RotateFeedSheet } from '../sheets/settings'

export function AccountPage() {
  const { db, session } = useStore()
  const nav = useNavigate()
  const sheet = useSheet()
  const toast = useToast()
  const me = Us(session.userId)!
  const [token, setToken] = useState(() => Math.random().toString(36).slice(2, 12))
  const url = `https://app.tuitionledger.in/cal/${token}.ics`
  return (
    <>
      <PageHead title="My account" sub={`${roleLabel(me.role)} at ${db.centre.name}`} />
      <div className="grid g2">
        <section className="card card-bd stack">
          <h2>Profile</h2>
          <div className="row">
            <span className="av" style={{ width: 48, height: 48, fontSize: 16 }}>
              {initials(me.name)}
            </span>
            <span>
              <b>{me.name}</b>
              <div className="small muted">{roleLabel(me.role)}</div>
            </span>
          </div>
          <div>
            <button
              className="btn"
              onClick={() => {
                signOut()
                nav('/login')
              }}
            >
              Sign out
            </button>
          </div>
        </section>
        <section className="card">
          <div className="card-hd">
            <h2>Sign-in methods</h2>
          </div>
          <ul className="list">
            <li className="li">
              <span className="grow">
                <span className="t">WhatsApp code</span>
                <div className="d tnum">{phoneFmt(me.phone)} · a 6-digit code each time</div>
              </span>
              <Pill tone="green">on</Pill>
            </li>
            <li className="li">
              <span className="grow">
                <span className="t">Email and password</span>
                <div className="d">{me.email || 'Sign in from a laptop without your phone'}</div>
              </span>
              {!me.email ? (
                <Pill tone="grey">not set up</Pill>
              ) : me.emailVerified ? (
                <Pill tone="green">verified</Pill>
              ) : (
                <Pill tone="amber">not verified</Pill>
              )}
            </li>
          </ul>
          <div className="card-ft">
            {!me.email ? (
              <button className="btn btn-primary" onClick={() => sheet.open(<CredentialsSheet />)}>
                Add email and password
              </button>
            ) : (
              <>
                {!me.emailVerified && (
                  <button
                    className="btn"
                    onClick={() => {
                      verifyEmail(me.id)
                      toast(`Email ${me.email} verified.`)
                    }}
                  >
                    Open verification link (prototype)
                  </button>
                )}
                <button className="btn" onClick={() => sheet.open(<PasswordSheet />)}>
                  Change password
                </button>
              </>
            )}
            <span className="tiny">To change your WhatsApp number, ask your centre owner.</span>
          </div>
        </section>
        <section className="card card-bd stack">
          <h2>Calendar</h2>
          {db.settings.feeds ? (
            <>
              <p className="small">
                Subscribe in Google Calendar or your phone's calendar to see{' '}
                {session.role === 'OWNER' ? 'every batch' : 'your classes'} for the next 60 days.
                Each event links straight to its attendance screen.
              </p>
              <Field label="Your private feed link">
                <input
                  className="inp tnum"
                  value={url}
                  readOnly
                  onFocus={(e) => e.target.select()}
                />
              </Field>
              <div className="row">
                <button
                  className="btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(url).catch(() => {})
                    toast('Link copied.')
                  }}
                >
                  Copy link
                </button>
                <button
                  className="btn"
                  onClick={() =>
                    sheet.open(
                      <RotateFeedSheet
                        onRotate={() => setToken(Math.random().toString(36).slice(2, 12))}
                      />,
                    )
                  }
                >
                  Make a new link
                </button>
              </div>
              <p className="tiny">
                {db.settings.nudgeMin
                  ? `You also get a WhatsApp reminder ${db.settings.nudgeMin} minutes before each class.`
                  : 'Class reminders are off for this centre.'}
              </p>
            </>
          ) : (
            <p className="small muted">Calendar feeds are turned off for this centre.</p>
          )}
        </section>
      </div>
    </>
  )
}
