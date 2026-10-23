import { Link } from 'react-router'
import { phoneMask } from '../../shared/lib/format'
import { Kpi, PageHead, Pill } from '../../shared/ui/kit'
import { useSheet } from '../../shared/ui/overlay'
import { PlatformCentreSheet, SupportSheet } from '../sheets/settings'

// Platform console (07 §5): counts only, never a student's name, phone, mark or amount.
const CENTRES = [
  {
    n: 'Bright Minds Academy',
    owner: '+919830000001',
    plan: 'Starter',
    st: 'active',
    s: 24,
    m: 412,
    run: true,
  },
  {
    n: 'Sunrise Tutorials',
    owner: '+919831122334',
    plan: 'Starter trial',
    st: 'trial',
    s: 18,
    m: 0,
    run: false,
    note: 'WhatsApp in review for 6 days',
  },
  {
    n: 'Vidya Niketan',
    owner: '+919874455667',
    plan: 'Standard',
    st: 'active',
    s: 212,
    m: 2140,
    run: true,
  },
  {
    n: 'Alpha Coaching, Liluah',
    owner: '+919836677889',
    plan: 'Starter',
    st: 'readonly',
    s: 64,
    m: 0,
    run: true,
  },
  {
    n: 'New Horizon Classes',
    owner: '+919800011122',
    plan: 'Starter trial',
    st: 'trial',
    s: 0,
    m: 0,
    run: false,
    note: 'No activity for 8 days since sign-up',
  },
]

export function PlatformPage() {
  const sheet = useSheet()
  return (
    <div className="layout">
      <nav
        className="side"
        style={{ background: 'var(--ink)', color: 'var(--paper)', border: 0 }}
        aria-label="Platform"
      >
        <div className="brand">
          <span className="mark">TL</span>
          <b>Platform</b>
        </div>
        {['Centres', 'Health', 'Billing', 'Templates'].map((x, i) => (
          <a
            key={x}
            className="nl"
            href="#"
            style={{
              color: i ? 'rgba(255,255,255,.75)' : '#fff',
              background: i ? undefined : 'rgba(255,255,255,.12)',
            }}
            onClick={(e) => e.preventDefault()}
          >
            {x}
          </a>
        ))}
        <div className="side-foot">
          <div className="who" style={{ borderColor: 'rgba(255,255,255,.2)' }}>
            Platform admin
            <div className="tiny">
              <Link to="/login" style={{ color: 'var(--accent)' }}>
                Sign out
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <main className="main">
        <PageHead
          title="Centres"
          sub="Counts only. The platform never shows a student's name, a parent's number, a mark or an amount per student."
          actions={
            <button className="btn btn-primary" onClick={() => sheet.open(<PlatformCentreSheet />)}>
              Create centre
            </button>
          }
        />
        <div className="grid g4">
          <Kpi label="Centres" value="5" sub="2 active · 2 trial · 1 read-only" />
          <Kpi label="Students under management" value="318" sub="all centres" />
          <Kpi label="Messages today" value="1,204" sub="98.6% delivered" tone="c-green" />
          <Kpi label="Oldest queued message" value="12 s" sub="outbox healthy" tone="c-green" />
        </div>
        <section className="card">
          <table className="rtable">
            <thead>
              <tr>
                <th>Centre</th>
                <th>Owner</th>
                <th>Plan</th>
                <th>Status</th>
                <th className="num">Students</th>
                <th className="num">Messages · Oct</th>
                <th>Last fee run</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {CENTRES.map((c) => (
                <tr key={c.n}>
                  <td className="c-main">
                    <b>{c.n}</b>
                    {c.note && <div className="tiny c-amber">{c.note}</div>}
                  </td>
                  <td data-label="Owner" className="tnum small">
                    {phoneMask(c.owner)}
                  </td>
                  <td data-label="Plan">{c.plan}</td>
                  <td data-label="Status">
                    {c.st === 'active' ? (
                      <Pill tone="green">Active</Pill>
                    ) : c.st === 'trial' ? (
                      <Pill tone="indigo">Trial</Pill>
                    ) : (
                      <Pill tone="red">Read-only · unpaid</Pill>
                    )}
                  </td>
                  <td data-label="Students" className="num">
                    {c.s}
                  </td>
                  <td data-label="Messages" className="num">
                    {c.m}
                  </td>
                  <td data-label="Last fee run">
                    {c.run ? <Pill tone="green">1 Oct · complete</Pill> : '—'}
                  </td>
                  <td className="c-act num">
                    <button
                      className="btn btn-sm"
                      onClick={() => sheet.open(<SupportSheet centre={c.n} />)}
                    >
                      Support session
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card card-bd small">
          <b>Health</b> · fee runs complete for every centre on 1 Oct · 0 webhook signature failures
          · reconciliation difference ₹0.00 · templates: 9 approved, 2 pending (Bengali result,
          Bengali assessment).
        </section>
      </main>
    </div>
  )
}
