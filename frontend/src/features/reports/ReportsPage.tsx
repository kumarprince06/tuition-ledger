import { batchAtt, can } from '../../mock/domain'
import { useStore } from '../../mock/store'
import { TODAY, monthName, rup, rup2 } from '../../shared/lib/format'
import { PageHead, Pill } from '../../shared/ui/kit'
import { useToast } from '../../shared/ui/overlay'
import { NotFound } from '../NotFound'

export function ReportsPage() {
  const { db, session } = useStore()
  const toast = useToast()
  if (!can('REPORTS_READ')) return <NotFound />
  const months = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10']
  const vals = months.map((m) =>
    db.payments.filter((p) => p.receivedOn.startsWith(m)).reduce((a, p) => a + p.amount, 0),
  )
  const max = Math.max(1, ...vals)
  const period = TODAY.slice(0, 7),
    start = `${period}-01`
  const inMonth = (at: string) => at >= start && at.startsWith(period)
  const opening = db.ledger.filter((l) => l.at < start).reduce((a, l) => a + l.amount, 0)
  const charges = db.ledger
    .filter((l) => inMonth(l.at) && l.kind === 'charge')
    .reduce((a, l) => a + l.amount, 0)
  const pays = -db.ledger
    .filter((l) => inMonth(l.at) && l.kind === 'payment')
    .reduce((a, l) => a + l.amount, 0)
  const adj = db.ledger
    .filter((l) => inMonth(l.at) && !['charge', 'payment'].includes(l.kind))
    .reduce((a, l) => a + l.amount, 0)
  const closing = db.ledger
    .filter((l) => l.at.slice(0, 7) <= period)
    .reduce((a, l) => a + l.amount, 0)
  const balances = opening + charges - pays + adj === closing
  const exports =
    session.role === 'OWNER'
      ? ['students', 'attendance', 'ledger', 'payments']
      : ['ledger', 'payments']
  return (
    <>
      <PageHead
        title="Reports"
        sub="Everything here is worked out from the ledger and attendance; the statement always balances."
        actions={exports.map((k) => (
          <button
            key={k}
            className="btn"
            onClick={() =>
              toast(
                `Exporting ${k}.csv for ${monthName(period)}. It streams; large files are fine.`,
              )
            }
          >
            {k[0].toUpperCase() + k.slice(1)} CSV
          </button>
        ))}
      />
      <div className="grid g2">
        <section className="card card-bd">
          <h2>Collections by month</h2>
          <p className="tiny" style={{ marginBottom: 12 }}>
            cash, UPI and payment links
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5,1fr)',
              gap: 10,
              alignItems: 'end',
              height: 150,
              borderBottom: '1px solid var(--line)',
            }}
          >
            {vals.map((v, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <span className="tiny tnum">{v ? rup(v) : '—'}</span>
                <div
                  title={`${monthName(months[i])}: ${rup(v)}`}
                  style={{
                    width: '64%',
                    height: `${Math.max(2, Math.round((v / max) * 100))}%`,
                    background: i === 4 ? 'var(--accent)' : 'var(--indigo)',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className="tiny"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', textAlign: 'center' }}
          >
            {months.map((m) => (
              <span key={m}>{monthName(m).slice(0, 3)}</span>
            ))}
          </div>
        </section>
        <section className="card card-bd">
          <h2>Attendance by batch</h2>
          <p className="tiny" style={{ marginBottom: 12 }}>
            last 30 days · flag below {db.settings.lowAttendance}% · late counts as attended
          </p>
          {db.batches.length ? (
            db.batches.map((b) => {
              const a = batchAtt(b.id)
              const low = a.rate != null && a.rate < db.settings.lowAttendance
              return (
                <div key={b.id} className="row" style={{ padding: '6px 0' }}>
                  <span style={{ width: 150 }} className="small">
                    {b.name}
                  </span>
                  <div className="bar grow">
                    <i
                      style={{
                        width: `${a.rate || 0}%`,
                        background: low ? 'var(--amber)' : 'var(--green)',
                      }}
                    />
                  </div>
                  <b className="num small" style={{ width: 44 }}>
                    {a.rate != null ? a.rate + '%' : '—'}
                  </b>
                </div>
              )
            })
          ) : (
            <p className="muted">No batches yet.</p>
          )}
        </section>
      </div>
      <section className="card">
        <div className="card-hd">
          <h2>{monthName(period)} statement</h2>
          <Pill tone={balances ? 'green' : 'red'}>
            {balances ? 'balances' : 'does not balance'}
          </Pill>
        </div>
        <table>
          <tbody>
            <tr>
              <td>Opening dues, 1 {monthName(period).slice(0, 3)}</td>
              <td className="num">{rup2(opening)}</td>
            </tr>
            <tr>
              <td>+ Charges raised</td>
              <td className="num">{rup2(charges)}</td>
            </tr>
            <tr>
              <td>− Payments received</td>
              <td className="num">{rup2(pays)}</td>
            </tr>
            <tr>
              <td>± Adjustments, credits and refunds</td>
              <td className="num">{rup2(adj)}</td>
            </tr>
            <tr>
              <td>
                <b>Closing dues</b>
              </td>
              <td className="num strong">{rup2(closing)}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </>
  )
}
