import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { signOut, switchDemoRole } from '../mock/auth'
import {
  can,
  consentOf,
  currentMarks,
  phonesOf,
  roleLabel,
  sesById,
  todaySessions,
  Us,
} from '../mock/domain'
import { resetDemo } from '../mock/seed'
import { store, useStore } from '../mock/store'
import type { Role } from '../mock/types'
import { TODAY, daysBetween, plural } from '../shared/lib/format'
import { Icon, type IconName } from '../shared/ui/Icon'
import { Sheet, useSheet, useToast } from '../shared/ui/overlay'
import { ParentDrawer, useParentDrawer } from '../features/parent/ParentDrawer'

type Item = [to: string, label: string, icon: IconName]
export function navItems(): Item[] {
  const items: Item[] = [
    ['/', 'Today', 'home'],
    ['/classes', 'Classes', 'cal'],
    ['/students', 'Students', 'users'],
  ]
  if (can('LEDGER_READ')) items.push(['/fees', 'Fees', 'rupee'])
  if (can('TEST_WRITE')) items.push(['/tests', 'Tests', 'check'])
  if (can('ANNOUNCE')) items.push(['/announce', 'Announcements', 'mega'])
  if (can('REPORTS_READ')) items.push(['/reports', 'Reports', 'chart'])
  if (store.session.role === 'OWNER') items.push(['/settings', 'Settings', 'gear'])
  items.push(['/account', 'My account', 'user'])
  return items
}

function Badge({ to }: { to: string }) {
  let n = 0
  if (to === '/classes' && can('ATTENDANCE_WRITE'))
    n = todaySessions().filter(
      (s) => s.status === 'scheduled' && !Object.keys(currentMarks(s.id)).length,
    ).length
  if (to === '/students' && store.session.role !== 'TEACHER')
    n = phonesOf(store.db.students.filter((s) => !s.deleted)).filter(
      (p) => consentOf(p) === 'pending',
    ).length
  return n ? (
    <span className="badge" aria-label={`${n} pending`}>
      {n}
    </span>
  ) : null
}

const FOCUS = /^\/(attendance|tests\/[^/]+)/

export function DemoBox() {
  const nav = useNavigate()
  const toast = useToast()
  const { close } = useSheet()
  const drawer = useParentDrawer()
  const switchRole = (role: Role) => {
    const u = store.db.users.find((x) => x.role === role && x.status === 'active')
    if (!u) return toast(`No active ${roleLabel(role).toLowerCase()} in this centre yet.`)
    switchDemoRole(u)
    close()
    nav('/')
  }
  return (
    <div className="demo-box" aria-label="Prototype controls">
      <b style={{ color: 'var(--ink2)' }}>Prototype controls</b>
      <div className="row">
        {(['OWNER', 'TEACHER', 'ACCOUNTANT'] as Role[]).map((r) => (
          <button
            key={r}
            className="chip"
            aria-pressed={store.session.role === r}
            onClick={() => switchRole(r)}
          >
            {roleLabel(r)}
          </button>
        ))}
      </div>
      <button
        className="btn btn-sm"
        onClick={() => {
          close()
          drawer.open()
        }}
      >
        <Icon name="wa" size={16} /> Parent's WhatsApp
      </button>
      <div className="row">
        <Link
          to="/signup"
          onClick={() => {
            signOut()
            close()
          }}
        >
          Register a centre
        </Link>
        <span>·</span>
        <button
          className="linkbtn"
          onClick={() => {
            resetDemo()
            close()
            toast('Demo reset to Bright Minds Academy.')
            nav('/')
          }}
        >
          Reset demo
        </button>
      </div>
    </div>
  )
}

function MoreSheet({ items }: { items: Item[] }) {
  const { close } = useSheet()
  const nav = useNavigate()
  return (
    <Sheet title="More">
      <div className="list card" style={{ boxShadow: 'none' }}>
        {items.map(([to, l, ic]) => (
          <Link key={to} className="li" to={to} onClick={close}>
            <Icon name={ic} />
            <span className="grow t">{l}</span>
          </Link>
        ))}
        <button
          className="li link"
          style={{
            width: '100%',
            border: 0,
            background: 'none',
            textAlign: 'left',
            cursor: 'pointer',
          }}
          onClick={() => {
            close()
            signOut()
            nav('/login')
          }}
        >
          <Icon name="back" />
          <span className="grow t">Sign out</span>
        </button>
      </div>
    </Sheet>
  )
}

function Banners() {
  const { db, session } = useStore()
  const loc = useLocation()
  const out = []
  if (session.role === 'OWNER' && db.centre.trialEndsOn)
    out.push(
      <div key="trial" className="banner alert-indigo">
        <span className="grow">
          <b>Starter trial</b> · {plural(daysBetween(TODAY, db.centre.trialEndsOn), 'day')} left.
          Your data stays when you choose a plan.
        </span>
        <Link className="btn btn-sm" to="/settings/plan">
          Choose a plan
        </Link>
      </div>,
    )
  if (
    db.centre.whatsapp !== 'connected' &&
    /^\/(students|announce|fees)?/.test(loc.pathname) &&
    !/^\/(classes|attendance|tests|reports|settings|account)/.test(loc.pathname)
  ) {
    const held = db.messages.filter((m) => m.status === 'held').length
    out.push(
      <div key="wa" className="banner alert-amber">
        <span className="grow">
          <b>Messages to parents are on hold.</b>{' '}
          {db.centre.whatsapp === 'pending'
            ? 'Meta is reviewing your WhatsApp number (usually 2–5 days).'
            : "Connect your centre's WhatsApp number so parents see your name."}
          {held ? ` ${plural(held, 'message')} waiting.` : ''}
        </span>
        {session.role === 'OWNER' && (
          <Link className="btn btn-sm" to="/settings/whatsapp">
            {db.centre.whatsapp === 'pending' ? 'See status' : 'Connect WhatsApp'}
          </Link>
        )}
      </div>,
    )
  }
  return <>{out}</>
}

export function AppShell() {
  const { db, session } = useStore()
  const loc = useLocation()
  const nav = useNavigate()
  const sheet = useSheet()
  const drawer = useParentDrawer()
  if (!session.signedIn) return <Navigate to="/login" replace />
  const me = Us(session.userId)!
  const items = navItems()
  const primary = items.slice(0, 4),
    rest = items.slice(4)
  const focus = FOCUS.test(loc.pathname)
  const isActive = (to: string) =>
    to === '/'
      ? loc.pathname === '/'
      : loc.pathname.startsWith(to) || (to === '/classes' && loc.pathname.startsWith('/attendance'))
  const back = loc.pathname.startsWith('/attendance')
    ? `/classes/${sesById(loc.pathname.split('/')[2])?.batchId || ''}`
    : '/tests'
  return (
    <div className={`layout ${focus ? 'focus-route' : ''}`}>
      <nav className="side" aria-label="Main">
        <div className="brand">
          <span className="mark">TL</span>
          <b>Tuition Ledger</b>
        </div>
        <div className="centre-box">
          <span className="tiny">Centre</span>
          <b>{db.centre.name}</b>
        </div>
        {items.map(([to, l, ic]) => (
          <NavLink
            key={to}
            className="nl"
            to={to}
            end={to === '/'}
            aria-current={isActive(to) ? 'page' : undefined}
          >
            <Icon name={ic} />
            <span>{l}</span>
            <Badge to={to} />
          </NavLink>
        ))}
        <div className="side-foot">
          <div className="who">
            <b>{me.name}</b>
            <div className="tiny">
              {roleLabel(session.role)} · <Link to="/account">account</Link> ·{' '}
              <button
                className="linkbtn"
                onClick={() => {
                  signOut()
                  nav('/login')
                }}
              >
                sign out
              </button>
            </div>
          </div>
          <DemoBox />
        </div>
      </nav>
      <div className="grow">
        <header className="topbar">
          {focus ? (
            <Link className="icon-btn" to={back} aria-label="Back">
              <Icon name="back" size={22} />
            </Link>
          ) : (
            <span className="mark" style={{ width: 30, height: 30, fontSize: 13 }}>
              TL
            </span>
          )}
          <span className="t">{db.centre.name}</span>
          <button
            className="btn btn-sm"
            onClick={() =>
              sheet.open(
                <Sheet title="Prototype controls">
                  <DemoBox />
                </Sheet>,
              )
            }
          >
            Demo
          </button>
          <Link className="icon-btn" to="/account" aria-label="My account">
            <Icon name="user" size={22} />
          </Link>
        </header>
        <main className="main" id="main">
          <Banners />
          <Outlet />
        </main>
        <nav className="bottomnav" aria-label="Main">
          {primary.map(([to, l, ic]) => (
            <Link key={to} to={to} aria-current={isActive(to) ? 'page' : undefined}>
              <Icon name={ic} size={22} />
              <span>{l}</span>
              <Badge to={to} />
            </Link>
          ))}
          <button
            onClick={() => sheet.open(<MoreSheet items={rest} />)}
            aria-current={rest.some(([to]) => isActive(to)) ? 'page' : undefined}
          >
            <Icon name="more" size={22} />
            <span>More</span>
          </button>
        </nav>
      </div>
      {drawer.isOpen && <ParentDrawer />}
    </div>
  )
}
