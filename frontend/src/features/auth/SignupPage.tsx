import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { DEMO_OTP, registerCentre, userByEmail, userByPhone } from '../../mock/auth'
import {
  dShort,
  emailOk,
  initials,
  plural,
  pwProblem,
  pwScore,
  suggestPrefix,
  validMobile,
} from '../../shared/lib/format'
import { Check, Field, PasswordInput, PhoneInput } from '../../shared/ui/kit'
import { useToast } from '../../shared/ui/overlay'
import { AuthLayout, OtpStep } from './AuthLayout'

type Step = 'centre' | 'account' | 'otp'
const STEPS: [Step, string][] = [
  ['centre', 'Your centre'],
  ['account', 'Your account'],
  ['otp', 'Verify phone'],
]

export function SignupPage() {
  const nav = useNavigate()
  const toast = useToast()
  const [step, setStep] = useState<Step>('centre')
  const [f, setF] = useState({
    centreName: '',
    city: '',
    ownerName: '',
    email: '',
    phone: '',
    pw: '',
    terms: false,
  })
  const [err, setErr] = useState<ReactNode>(null)
  const [attempts, setAttempts] = useState(3)
  const set = (k: keyof typeof f) => (v: string | boolean) => setF({ ...f, [k]: v })
  const at = STEPS.findIndex(([k]) => k === step)
  const prefix = suggestPrefix(f.centreName) || 'TL'
  const prob = pwProblem(f.pw),
    score = pwScore(f.pw)

  let body: ReactNode
  if (step === 'centre')
    body = (
      <>
        <div>
          <h1>Let's set up your centre</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Free for 30 days with every Starter feature. No card needed.
          </p>
        </div>
        <form
          className="form-card"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            setStep('account')
          }}
        >
          <Field
            label="Coaching centre name"
            hint="Parents see this name on every WhatsApp message and receipt."
          >
            <input
              className="inp"
              value={f.centreName}
              onChange={(e) => set('centreName')(e.target.value)}
              placeholder="e.g. Bright Minds Academy"
              autoComplete="organization"
              autoFocus
            />
          </Field>
          <Field
            label={
              <span>
                City <span className="hint">(optional)</span>
              </span>
            }
          >
            <input
              className="inp"
              value={f.city}
              onChange={(e) => set('city')(e.target.value)}
              placeholder="e.g. Howrah"
              autoComplete="address-level2"
            />
          </Field>
          <div className="receipt-prev" aria-label="Receipt preview">
            <span className="mark" style={{ width: 40, height: 40 }}>
              {f.centreName ? initials(f.centreName) : 'TL'}
            </span>
            <span className="grow">
              <span className="tiny">Your receipts will be numbered</span>
              <div className="no">{prefix}-2026-000001</div>
              <div className="small muted">
                You can change the letters in Settings before your first receipt.
              </div>
            </span>
          </div>
          <button className="btn btn-primary btn-lg" disabled={f.centreName.trim().length < 3}>
            Next: your account
          </button>
        </form>
        <p className="center">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </>
    )
  else if (step === 'account') {
    const ok =
      f.ownerName.trim().length >= 2 &&
      emailOk(f.email) &&
      validMobile(f.phone) &&
      f.pw &&
      !prob &&
      f.terms
    body = (
      <>
        <div>
          <h1>Create your account</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            You'll be the owner of <b>{f.centreName}</b>. You can invite teachers later.
          </p>
        </div>
        <form
          className="form-card"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (userByPhone(f.phone))
              return setErr(
                <>
                  This WhatsApp number already has an account. One person = one account.{' '}
                  <Link to="/login">Sign in instead</Link>.
                </>,
              )
            if (userByEmail(f.email))
              return setErr(
                <>
                  This email already has an account. <Link to="/login">Sign in instead</Link>, or
                  use another email.
                </>,
              )
            setErr(null)
            setAttempts(3)
            setStep('otp')
          }}
        >
          <Field label="Your full name">
            <input
              className="inp"
              value={f.ownerName}
              onChange={(e) => set('ownerName')(e.target.value)}
              autoComplete="name"
              autoFocus
            />
          </Field>
          <div className="two">
            <Field
              label="Email"
              hint="We'll send a link to verify it"
              error={f.email && !emailOk(f.email) ? 'Check the email address' : undefined}
            >
              <input
                className="inp"
                type="email"
                value={f.email}
                onChange={(e) => set('email')(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </Field>
            <Field
              label="WhatsApp number"
              hint="We'll send a code to check it"
              error={
                f.phone.length === 10 && !validMobile(f.phone)
                  ? 'Starts with 6, 7, 8 or 9'
                  : undefined
              }
            >
              <PhoneInput value={f.phone} onChange={set('phone')} placeholder="98765 43210" />
            </Field>
          </div>
          <div className="field">
            Password
            <PasswordInput value={f.pw} onChange={set('pw')} />
            <div className={`meter s${score}`} aria-hidden="true">
              <i />
              <i />
              <i />
              <i />
            </div>
            {prob ? (
              <span className="err">{prob}</span>
            ) : (
              <span className="hint">
                {f.pw
                  ? ['', 'Weak', 'Okay', 'Good', 'Strong'][score] + ' password'
                  : 'At least 8 characters. A short phrase is easy to remember.'}
              </span>
            )}
          </div>
          <Check checked={f.terms} onChange={set('terms')}>
            I agree to the terms and privacy policy. Parents will be asked for consent before they
            get messages.
          </Check>
          {err && (
            <div className="alert alert-red" role="alert">
              <span>{err}</span>
            </div>
          )}
          <div className="row" style={{ gap: 12 }}>
            <button type="button" className="btn btn-lg" onClick={() => setStep('centre')}>
              Back
            </button>
            <button className="btn btn-primary btn-lg grow" disabled={!ok}>
              Create account
            </button>
          </div>
        </form>
      </>
    )
  } else
    body = (
      <>
        <h1>Check your WhatsApp</h1>
        <div className="form-card">
          <OtpStep
            phone10={f.phone}
            error={err}
            onBack={() => {
              setErr(null)
              setStep('account')
            }}
            onVerify={(code) => {
              const left = attempts - 1
              setAttempts(left)
              if (code !== DEMO_OTP)
                return setErr(
                  left > 0
                    ? `That code didn't work. ${plural(left, 'attempt')} left.`
                    : 'Too many wrong codes. Ask for a new code.',
                )
              const db = registerCentre({
                centreName: f.centreName.trim(),
                ownerName: f.ownerName.trim(),
                phone10: f.phone,
                email: f.email,
                pw: f.pw,
                city: f.city.trim(),
              })
              toast(
                `Welcome! ${db.centre.name} is ready, with a free trial until ${dShort(db.centre.trialEndsOn!)}. We've emailed a link to verify ${db.users[0].email}.`,
              )
              nav('/')
            }}
          />
        </div>
      </>
    )
  return (
    <AuthLayout title="Set up your centre in five minutes. Your first month is free.">
      <ol className="stepper" aria-label="Registration steps">
        {STEPS.map(([k, l], i) => (
          <li
            key={k}
            className={i < at ? 'done' : i === at ? 'on' : ''}
            aria-current={i === at ? 'step' : undefined}
          >
            {i + 1}. {l}
          </li>
        ))}
      </ol>
      {body}
    </AuthLayout>
  )
}
