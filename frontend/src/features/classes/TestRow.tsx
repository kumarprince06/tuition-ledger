import { Link } from 'react-router'
import { B, can, currentMarkRows, roster } from '../../mock/domain'
import { store } from '../../mock/store'
import type { Test } from '../../mock/types'
import { dShort } from '../../shared/lib/format'
import { Pill } from '../../shared/ui/kit'
import { useSheet } from '../../shared/ui/overlay'
import { SendResultsSheet } from '../sheets/classes'

export function TestRow({ t }: { t: Test }) {
  const sheet = useSheet()
  const r = roster({ batchId: t.batchId, date: t.heldOn })
  const vals = Object.values(currentMarkRows(t.id))
  const pres = vals.filter((m) => !m.absent)
  const avg = pres.length
    ? Math.round((pres.reduce((a, m) => a + (m.marks ?? 0), 0) / pres.length) * 10) / 10
    : null
  return (
    <tr>
      <td className="c-main">
        <b>{t.name}</b>
        <div className="tiny">
          {B(t.batchId)!.name}
          {t.topic ? ' · ' + t.topic : ''}
        </div>
      </td>
      <td data-label="Date">{dShort(t.heldOn)}</td>
      <td data-label="Entered" className="num">
        {vals.length} / {r.length}
      </td>
      <td data-label="Average" className="num">
        {avg != null ? `${avg} / ${t.max}` : '—'}
      </td>
      <td data-label="Status">
        {t.sentAt ? (
          <Pill tone="green">sent {dShort(t.sentAt.slice(0, 10))}</Pill>
        ) : vals.length >= r.length && r.length ? (
          <Pill tone="amber">ready to send</Pill>
        ) : (
          <Pill tone="grey">marks pending</Pill>
        )}
      </td>
      <td className="c-act num">
        <Link className="btn btn-sm" to={`/tests/${t.id}`}>
          {vals.length ? 'Marks' : 'Enter marks'}
        </Link>{' '}
        {!t.sentAt && vals.length > 0 && can('RESULTS_SEND') ? (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => sheet.open(<SendResultsSheet testId={t.id} />)}
          >
            Send results
          </button>
        ) : t.sentAt && store.session.role === 'OWNER' ? (
          <button
            className="btn btn-sm"
            onClick={() => sheet.open(<SendResultsSheet testId={t.id} />)}
          >
            Resend…
          </button>
        ) : null}
      </td>
    </tr>
  )
}
