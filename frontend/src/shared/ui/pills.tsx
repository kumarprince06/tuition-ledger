import { consentOf } from '../../mock/domain'
import type { Message, Student } from '../../mock/types'
import { Pill } from './kit'

export function ConsentPill({ phone }: { phone: string }) {
  const c = consentOf(phone)
  return c === 'given' ? (
    <Pill tone="green">opted in</Pill>
  ) : c === 'pending' ? (
    <Pill tone="amber">awaiting YES</Pill>
  ) : (
    <Pill tone="grey">opted out</Pill>
  )
}
export function StatusPill({ s }: { s: Student }) {
  if (s.deleted) return <Pill tone="grey">data deleted</Pill>
  return s.status === 'active' ? null : <Pill tone="grey">{s.status}</Pill>
}
const MSG_TONE = {
  delivered: 'green',
  sent: 'indigo',
  queued: 'grey',
  held: 'amber',
  skipped: 'grey',
  failed: 'red',
  received: 'indigo',
} as const
export const MsgPill = ({ m }: { m: Message }) => (
  <Pill tone={MSG_TONE[m.status]}>{m.status === 'received' ? 'reply' : m.status}</Pill>
)
