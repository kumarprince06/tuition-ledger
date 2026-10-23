import { useEffect, useState, type ReactNode } from 'react'
import { pad, plural } from '../../shared/lib/format'

export function AuthLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="auth">
      <section className="auth-aside">
        <div className="row" style={{ position: 'relative' }}>
          <span className="mark">TL</span>
          <b style={{ fontSize: 18 }}>Tuition Ledger</b>
        </div>
        <h1>{title}</h1>
        <ul>
          <li>Attendance in under a minute, on a phone</li>
          <li>Fees that are pro-rated and never double-counted</li>
          <li>Receipts and reminders on WhatsApp, in your centre's name</li>
          <li>Nothing for parents to install</li>
        </ul>
        <div className="verse">
          <div className="dev">न हि ज्ञानेन सदृशं पवित्रमिह विद्यते</div>
          <div style={{ marginTop: 6 }}>Nothing in this world purifies like knowledge.</div>
          <div className="tiny" style={{ color: 'rgba(255,255,255,.7)', marginTop: 6 }}>
            Bhagavad Gītā 4.38
          </div>
        </div>
      </section>
      <main className="auth-main">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  )
}

/** Code entry with resend timer and attempts left (3 per code, 5-minute expiry server-side). */
export function OtpStep({
  phone10,
  onVerify,
  onBack,
  error,
}: {
  phone10: string
  onVerify: (code: string) => void
  onBack: () => void
  error: ReactNode
}) {
  const [code, setCode] = useState('')
  const [sentAt, setSentAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = Math.max(0, 30 - Math.floor((now - sentAt) / 1000))
  return (
    <div className="stack">
      <p className="muted">
        Sent on WhatsApp to <b>+91 {phone10.replace(/(\d{5})(\d{5})/, '$1 $2')}</b>.{' '}
        <button className="linkbtn" onClick={onBack}>
          Change number
        </button>
      </p>
      <form
        className="stack"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onVerify(code)
          setCode('')
        }}
      >
        <label className="field">
          6-digit code
          <input
            className="inp otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            autoFocus
          />
        </label>
        {error && (
          <div className="alert alert-red" role="alert">
            <span>{error}</span>
          </div>
        )}
        <button className="btn btn-primary btn-lg" disabled={!/^\d{6}$/.test(code)}>
          Continue
        </button>
        <div className="row between small">
          <span className="muted">{left ? `Resend code in 0:${pad(left)}` : "Didn't get it?"}</span>
          {!left && (
            <button type="button" className="linkbtn" onClick={() => setSentAt(now)}>
              Resend code
            </button>
          )}
        </div>
        <div className="demo-hint">
          Demo code <b>123456</b> · {plural(3, 'attempt')} per code
        </div>
      </form>
    </div>
  )
}
