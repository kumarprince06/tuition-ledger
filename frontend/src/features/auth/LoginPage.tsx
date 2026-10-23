import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  DEMO_OTP,
  loginWithPassword,
  resetPassword,
  signIn,
  userByPhone,
  verifyEmail,
} from '../../mock/auth'
import { emailOk, plural, pwProblem, validMobile } from '../../shared/lib/format'
import { useToast } from '../../shared/ui/overlay'
import { Field, PasswordInput, PhoneInput, Seg } from '../../shared/ui/kit'
import { AuthLayout, OtpStep } from './AuthLayout'

type Mode = 'whatsapp' | 'email' | 'forgot' | 'reset'

export function LoginPage() {
  const nav = useNavigate()
  const toast = useToast()
  const [mode, setMode] = useState<Mode>('whatsapp')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [attempts, setAttempts] = useState(3)
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState<ReactNode>(null)
  const switchTo = (m: Mode) => {
    setMode(m)
    setErr(null)
    setSent(false)
    setOtpSent(false)
  }
  const go = (u: Parameters<typeof signIn>[0]) => {
    signIn(u)
    nav('/')
  }

  const seg = (
    <Seg
      label="Sign-in method"
      items={[
        ['whatsapp', 'WhatsApp code'],
        ['email', 'Email and password'],
      ]}
      value={mode === 'email' ? 'email' : 'whatsapp'}
      onChange={switchTo}
    />
  )
  const head = (
    <div>
      <h1>Sign in</h1>
      <p className="muted" style={{ marginTop: 6 }}>
        For centre owners, teachers and accountants. Parents never sign in; everything reaches them
        on WhatsApp.
      </p>
    </div>
  )
  const register = (
    <p className="center">
      New coaching centre? <Link to="/signup">Register your centre</Link>
    </p>
  )

  let body: ReactNode
  if (mode === 'whatsapp' && otpSent)
    body = (
      <>
        <h1>Enter the code</h1>
        <OtpStep
          phone10={phone}
          error={err}
          onBack={() => switchTo('whatsapp')}
          onVerify={(code) => {
            const left = attempts - 1
            setAttempts(left)
            if (code !== DEMO_OTP)
              return setErr(
                left > 0
                  ? `That code didn't work. ${plural(left, 'attempt')} left.`
                  : 'Too many wrong codes. Ask for a new code.',
              )
            const u = userByPhone(phone)
            if (!u)
              return setErr(
                <>
                  We couldn't sign you in with this number. Staff: ask your centre owner to invite
                  you. Starting a coaching centre? <Link to="/signup">Register it</Link>.
                </>,
              )
            if (u.status !== 'active')
              return setErr('This account is deactivated. Ask your centre owner to reactivate it.')
            go(u)
          }}
        />
      </>
    )
  else if (mode === 'whatsapp')
    body = (
      <>
        {head}
        {seg}
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setAttempts(3)
            setOtpSent(true)
          }}
        >
          <Field
            label="Your WhatsApp number"
            hint="We'll send a 6-digit code on WhatsApp."
            error={
              phone.length === 10 && !validMobile(phone)
                ? 'Indian mobile numbers start with 6, 7, 8 or 9.'
                : undefined
            }
          >
            <PhoneInput value={phone} onChange={setPhone} placeholder="98300 00001" />
          </Field>
          <button className="btn btn-primary btn-lg" disabled={!validMobile(phone)}>
            Send code on WhatsApp
          </button>
        </form>
        <div className="demo-hint">
          Demo numbers:{' '}
          {[
            ['9830000001', 'owner'],
            ['9830000002', 'teacher'],
            ['9830000004', 'accountant'],
          ].map(([p, r]) => (
            <span key={p}>
              <button className="linkbtn" onClick={() => setPhone(p)}>
                {p.slice(0, 5)} {p.slice(5)}
              </button>{' '}
              {r} ·{' '}
            </span>
          ))}
        </div>
        {register}
        <p className="center tiny">
          <Link to="/platform">Tuition Ledger staff</Link>
        </p>
      </>
    )
  else if (mode === 'email')
    body = (
      <>
        {head}
        {seg}
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            const r = loginWithPassword(email, pw)
            setPw('')
            if (r.ok) return go(r.user)
            if (r.error === 'locked')
              return setErr(
                <>
                  Too many wrong passwords. Password sign-in is paused for {r.minutes} minutes, and
                  we've told you on WhatsApp. You can{' '}
                  <button type="button" className="linkbtn" onClick={() => switchTo('whatsapp')}>
                    sign in with a WhatsApp code
                  </button>{' '}
                  now.
                </>,
              )
            if (r.error === 'unverified')
              return setErr(
                <>
                  Verify your email first. We've sent a new link to {r.user!.email}.{' '}
                  <button
                    type="button"
                    className="linkbtn"
                    onClick={() => {
                      verifyEmail(r.user!.id)
                      setErr(null)
                      toast('Email verified. You can sign in with it now.')
                    }}
                  >
                    Open it (prototype)
                  </button>
                </>,
              )
            if (r.error === 'deactivated')
              return setErr('This account is deactivated. Ask your centre owner to reactivate it.')
            setErr(
              <>
                That email and password don't match. Check both, or use{' '}
                <button type="button" className="linkbtn" onClick={() => switchTo('forgot')}>
                  Forgot password
                </button>
                .
              </>,
            )
          }}
        >
          <Field label="Email">
            <input
              className="inp"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <div className="field">
            Password
            <PasswordInput value={pw} onChange={setPw} autoComplete="current-password" />
          </div>
          {err && (
            <div className="alert alert-red" role="alert">
              <span>{err}</span>
            </div>
          )}
          <button className="btn btn-primary btn-lg" disabled={!emailOk(email) || !pw}>
            Sign in
          </button>
          <div className="small">
            <button type="button" className="linkbtn" onClick={() => switchTo('forgot')}>
              Forgot password?
            </button>
          </div>
        </form>
        <div className="demo-hint">
          Demo:{' '}
          <button className="linkbtn" onClick={() => setEmail('dutta@brightminds.in')}>
            dutta@brightminds.in
          </button>{' '}
          (owner) or{' '}
          <button className="linkbtn" onClick={() => setEmail('sumit@brightminds.in')}>
            sumit@brightminds.in
          </button>{' '}
          (accountant), password <b>Tuition@2026</b>. Teachers here use WhatsApp codes.
        </div>
        {register}
      </>
    )
  else if (mode === 'forgot')
    body = sent ? (
      <>
        <div>
          <h1>Check your email</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            If an account uses <b>{email}</b>, we've sent a link to set a new password. It works
            once, for 30 minutes.
          </p>
        </div>
        <div className="demo-hint">
          Prototype:{' '}
          <button className="linkbtn" onClick={() => setMode('reset')}>
            open the reset link
          </button>
        </div>
        <p className="small">
          No email?{' '}
          <button className="linkbtn" onClick={() => switchTo('whatsapp')}>
            Sign in with a WhatsApp code
          </button>{' '}
          and change your password from My account.
        </p>
      </>
    ) : (
      <>
        <div>
          <h1>Forgot your password?</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            We'll email you a link to set a new one.
          </p>
        </div>
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <Field label="Email">
            <input
              className="inp"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <button className="btn btn-primary btn-lg" disabled={!emailOk(email)}>
            Send reset link
          </button>
        </form>
        <p className="small">
          Or{' '}
          <button className="linkbtn" onClick={() => switchTo('whatsapp')}>
            sign in with a WhatsApp code
          </button>{' '}
          instead.
        </p>
      </>
    )
  else
    body = (
      <>
        <div>
          <h1>Set a new password</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            For {email}. Every other device is signed out.
          </p>
        </div>
        <form
          className="stack"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            resetPassword(email, newPw)
            setNewPw('')
            switchTo('email')
            toast(
              'Password changed. Every other device is signed out. Sign in with the new password.',
            )
          }}
        >
          <Field
            label="New password"
            error={pwProblem(newPw) || undefined}
            hint="At least 8 characters"
          >
            <PasswordInput value={newPw} onChange={setNewPw} label="New password" />
          </Field>
          <button className="btn btn-primary btn-lg" disabled={!newPw || !!pwProblem(newPw)}>
            Save password
          </button>
        </form>
      </>
    )
  return (
    <AuthLayout title="Attendance, fees and progress for your coaching centre, in one book parents can read.">
      {body}
    </AuthLayout>
  )
}
