import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { parentReply, phonesOf } from '../../mock/domain'
import { useStore } from '../../mock/store'
import { dShort, first, initials } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'

// Prototype-only: a parent's WhatsApp, to try keyword replies (YES, DUES, ATTENDANCE…). Never ships.
type Api = {
  isOpen: boolean
  phone: string | null
  open: (phone?: string) => void
  close: () => void
  setPhone: (p: string) => void
}
const Ctx = createContext<Api>({
  isOpen: false,
  phone: null,
  open: () => {},
  close: () => {},
  setPhone: () => {},
})
export const useParentDrawer = () => useContext(Ctx)

export function ParentDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  return (
    <Ctx.Provider
      value={{
        isOpen,
        phone,
        setPhone,
        open: (p) => {
          if (p) setPhone(p)
          setOpen(true)
        },
        close: () => setOpen(false),
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function ParentDrawer() {
  const { db } = useStore()
  const d = useParentDrawer()
  const msgsRef = useRef<HTMLDivElement>(null)
  const phones = phonesOf(db.students.filter((s) => !s.deleted))
  const ph = d.phone && phones.includes(d.phone) ? d.phone : phones[0]
  const msgs = db.messages.filter(
    (m) => m.phone === ph && (m.dir === 'in' || ['delivered', 'sent', 'failed'].includes(m.status)),
  )
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs.length, ph])
  if (!ph) return null
  const kids = db.students.filter((s) => s.parentPhone === ph)
  return (
    <aside className="drawer" role="dialog" aria-label="Parent's WhatsApp (prototype)">
      <div className="wa-hd">
        <span className="av" style={{ background: '#128C7E', color: '#fff' }}>
          {initials(db.centre.name)}
        </span>
        <span className="grow">
          <b>{db.centre.name}</b>
          <div style={{ fontSize: 11.5, opacity: 0.85 }}>Business account · prototype</div>
        </span>
        <select aria-label="Choose parent" value={ph} onChange={(e) => d.setPhone(e.target.value)}>
          {phones.map((p) => (
            <option key={p} value={p}>
              {db.students.find((s) => s.parentPhone === p)!.parentName}
            </option>
          ))}
        </select>
        <button className="icon-btn" style={{ color: '#fff' }} onClick={d.close} aria-label="Close">
          <Icon name="x" />
        </button>
      </div>
      <div className="wa-msgs" ref={msgsRef}>
        {msgs.length ? (
          msgs.map((m) => (
            <div key={m.id} className={m.dir === 'in' ? 'wa-out' : 'wa-in'}>
              {m.text}
              <span className="wa-t">
                {dShort(m.at.slice(0, 10))} {m.at.slice(11)}
                {m.dir === 'out' ? (m.status === 'failed' ? ' · not delivered' : ' ✓✓') : ''}
              </span>
            </div>
          ))
        ) : (
          <div className="wa-in" style={{ alignSelf: 'center', background: '#FFF5C2' }}>
            {db.centre.whatsapp === 'connected'
              ? 'No messages for this parent yet.'
              : "The centre's WhatsApp number isn't connected yet, so nothing has been delivered."}
          </div>
        )}
      </div>
      <div className="wa-bar">
        <span style={{ fontSize: 11, color: '#555', width: '100%' }}>
          {kids.map((k) => first(k.name)).join(', ')}'s parent replies:
        </span>
        {['YES', 'DUES', 'ATTENDANCE', 'RESULTS', 'RECEIPT', 'HELP', 'STOP'].map((k) => (
          <button key={k} onClick={() => parentReply(ph, k)}>
            {k}
          </button>
        ))}
      </div>
    </aside>
  )
}
