import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { Link } from 'react-router'
import { Icon } from './Icon'

export const Pill = ({
  tone,
  children,
}: {
  tone: 'green' | 'amber' | 'red' | 'indigo' | 'grey' | 'accent'
  children: ReactNode
}) => <span className={`pill p-${tone}`}>{children}</span>

export function Kpi({
  label,
  value,
  sub,
  tone,
  to,
}: {
  label: string
  value: ReactNode
  sub: ReactNode
  tone?: string
  to?: string
}) {
  const inner = (
    <>
      <span className="l">{label}</span>
      <span className={`v ${tone || ''}`}>{value}</span>
      <span className="s">{sub}</span>
    </>
  )
  return to ? (
    <Link className="card kpi" to={to}>
      {inner}
    </Link>
  ) : (
    <div className="card kpi">{inner}</div>
  )
}

export function PageHead({
  title,
  sub,
  actions,
  crumbs,
}: {
  title: ReactNode
  sub?: ReactNode
  actions?: ReactNode
  crumbs?: ReactNode
}) {
  return (
    <>
      {crumbs && <div className="crumbs">{crumbs}</div>}
      <div className="ph">
        <div className="grow">
          <h1>{title}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </>
  )
}

export function Empty({
  title,
  sub,
  action,
}: {
  title: string
  sub: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <Icon name="check" size={36} />
      <b>{title}</b>
      <div className="small">{sub}</div>
      {action}
    </div>
  )
}

export function Tabs<K extends string>({
  items,
  value,
  onChange,
}: {
  items: [K, string][]
  value: K
  onChange: (k: K) => void
}) {
  return (
    <div className="tabs" role="tablist">
      {items.map(([k, t]) => (
        <button
          key={k}
          className="chip"
          role="tab"
          aria-selected={value === k}
          aria-pressed={value === k}
          onClick={() => onChange(k)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

export function Seg<K extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: [K, string][]
  value: K
  onChange: (k: K) => void
  label: string
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {items.map(([k, t]) => (
        <button key={k} type="button" aria-pressed={value === k} onClick={() => onChange(k)}>
          {t}
        </button>
      ))}
    </div>
  )
}

/** Label wraps the control; hint or error sits outside the label and is linked with aria-describedby. */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  children: ReactElement<{ 'aria-describedby'?: string; 'aria-invalid'?: boolean }>
}) {
  const id = useId()
  const note = error || hint
  return (
    <div className="field-wrap">
      <label className="field">
        {label}
        {note && isValidElement(children)
          ? cloneElement(children, {
              'aria-describedby': id,
              ...(error ? { 'aria-invalid': true } : {}),
            })
          : children}
      </label>
      {error ? (
        <span className="err" id={id}>
          {error}
        </span>
      ) : hint ? (
        <span className="hint" id={id}>
          {hint}
        </span>
      ) : null}
    </div>
  )
}

/** +91 mobile input that keeps digits only. */
export function PhoneInput({
  value,
  onChange,
  maxLength = 10,
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  maxLength?: number
  placeholder?: string
  autoFocus?: boolean
  'aria-label'?: string
}) {
  return (
    <div className="phone-in">
      <span className="cc" aria-hidden="true">
        +91
      </span>
      <input
        inputMode="numeric"
        autoComplete="tel-national"
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        {...rest}
      />
    </div>
  )
}

export function PasswordInput({
  value,
  onChange,
  autoComplete = 'new-password',
  label = 'Password',
  'aria-describedby': describedBy,
}: {
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  label?: string
  'aria-describedby'?: string
}) {
  const [shown, setShown] = useState(false)
  return (
    <div className="phone-in">
      <input
        type={shown ? 'text' : 'password'}
        aria-label={label}
        aria-describedby={describedBy}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={{ fontSize: 15 }}
      />
      <button
        type="button"
        style={{
          border: 0,
          background: 'none',
          padding: '0 12px',
          cursor: 'pointer',
          color: 'var(--indigo)',
          fontWeight: 600,
        }}
        onClick={() => setShown(!shown)}
        aria-label={shown ? 'Hide password' : 'Show password'}
      >
        {shown ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

export const Check = ({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  children: ReactNode
}) => (
  <label className="check">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{children}</span>
  </label>
)
