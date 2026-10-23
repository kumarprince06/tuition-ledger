import { useState } from 'react'
import { useParams } from 'react-router'
import {
  announce,
  announceTargets,
  B,
  can,
  consentOf,
  myBatches,
  phonesOf,
  T,
  userName,
} from '../../mock/domain'
import { store, useStore } from '../../mock/store'
import { dShort, plural } from '../../shared/lib/format'
import { Empty, PageHead } from '../../shared/ui/kit'
import { Bubble, useConfirm, useToast } from '../../shared/ui/overlay'
import { NotFound } from '../NotFound'

export function AnnouncePage() {
  const { db, session } = useStore()
  const { batchId } = useParams()
  const toast = useToast()
  const confirm = useConfirm()
  const bs = myBatches()
  const [to, setTo] = useState(
    batchId && bs.some((b) => b.id === batchId)
      ? batchId
      : session.role === 'OWNER'
        ? 'all'
        : bs[0]?.id || '',
  )
  const [body, setBody] = useState('')
  if (!can('ANNOUNCE')) return <NotFound />
  const phones = to ? phonesOf(announceTargets(to)) : []
  const ok = phones.filter((p) => consentOf(p) === 'given')
  const bName = to === 'all' ? '' : B(to)?.name || ''
  const send = () =>
    confirm({
      title: `Send to ${plural(ok.length, 'parent')}?`,
      body: `${bName || 'All batches'} · one private message per parent. This can't be unsent.`,
      preview: T.announce(bName, body.trim()),
      confirm: 'Send now',
      cancel: 'Edit',
      onConfirm: () => {
        const n = announce(to, body.trim())
        setBody('')
        toast(
          store.db.centre.whatsapp === 'connected'
            ? `Sent to ${plural(n, 'parent')}.`
            : 'Saved. It goes out when your WhatsApp number is approved.',
        )
      },
    })
  return (
    <>
      <PageHead
        title="Announcements"
        sub="Replaces the WhatsApp group: one private message per parent, from your centre's number, logged on each student."
      />
      {bs.length ? (
        <div className="grid split-grid">
          <section className="card card-bd stack">
            <label className="field">
              To
              <select className="inp" value={to} onChange={(e) => setTo(e.target.value)}>
                {session.role === 'OWNER' && <option value="all">All batches</option>}
                {bs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Message
              <textarea
                className="inp"
                maxLength={300}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="No class tomorrow (Kali Puja). Extra class on Saturday at 5 pm."
              />
              <span className="hint">{300 - body.length} characters left</span>
            </label>
            <div className="field">
              Preview
              <Bubble text={T.announce(bName, body.trim() || '…')} />
            </div>
            <div className="small">
              <b>{plural(ok.length, 'parent')}</b> will receive this
              {phones.length - ok.length
                ? ` · ${phones.length - ok.length} skipped (no consent or opted out)`
                : ''}
              .
            </div>
            <button
              className="btn btn-primary btn-lg"
              disabled={body.trim().length < 5 || !ok.length}
              onClick={send}
            >
              Review and send
            </button>
          </section>
          <section className="card">
            <div className="card-hd">
              <h2>Sent</h2>
            </div>
            {db.announcements.length ? (
              <ul className="list">
                {db.announcements
                  .slice()
                  .sort((a, b) => b.at.localeCompare(a.at))
                  .map((a) => (
                    <li
                      key={a.id}
                      className="li"
                      style={{ flexDirection: 'column', alignItems: 'stretch', gap: 4 }}
                    >
                      <div className="row between tiny">
                        <span>
                          {a.batchId ? B(a.batchId)?.name : 'All batches'} · {userName(a.by)}
                          {a.kind === 'auto' ? ' · automatic' : ''}
                        </span>
                        <span>
                          {dShort(a.at.slice(0, 10))} · {plural(a.recipients, 'parent')}
                        </span>
                      </div>
                      <div className="small">{a.body}</div>
                    </li>
                  ))}
              </ul>
            ) : (
              <Empty title="Nothing sent yet" sub="" />
            )}
          </section>
        </div>
      ) : (
        <section className="card">
          <Empty title="No batches yet" sub="Announcements go to the parents of a batch." />
        </section>
      )}
    </>
  )
}
