import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { seedBrightMinds } from '../mock/seed'
import { store } from '../mock/store'
import type { Role } from '../mock/types'
import { routes } from './routes'

const USER: Record<Role, string> = { OWNER: 'u_owner', TEACHER: 'u_t1', ACCOUNTANT: 'u_acc' }

function renderAt(path: string, role?: Role) {
  store.db = seedBrightMinds()
  store.idem = {}
  store.session = role
    ? { signedIn: true, role, userId: USER[role] }
    : { signedIn: false, role: 'OWNER', userId: 'u_owner' }
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }))
const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } })

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('static frontend', () => {
  it('signs in with a WhatsApp code and lands on Today', () => {
    renderAt('/login')
    type(screen.getByLabelText(/your whatsapp number/i), '9830000001')
    click('Send code on WhatsApp')
    type(screen.getByLabelText('6-digit code'), '000000')
    click('Continue')
    expect(screen.getByRole('alert')).toHaveTextContent("That code didn't work. 2 attempts left.")
    type(screen.getByLabelText('6-digit code'), '123456')
    click('Continue')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Pranab/)
    expect(store.session).toMatchObject({ signedIn: true, role: 'OWNER' })
  })

  it('signs in with email and password and locks after 5 wrong attempts', () => {
    renderAt('/login')
    click('Email and password')
    type(screen.getByLabelText('Email'), 'dutta@brightminds.in')
    for (let i = 0; i < 5; i++) {
      type(screen.getByLabelText('Password'), 'wrong-pass')
      click('Sign in')
    }
    expect(screen.getByRole('alert')).toHaveTextContent(/paused for 15 minutes/)
  })

  it('lets a teacher mark attendance, save it and undo', () => {
    renderAt('/attendance/ses_b1_2026-10-23', 'TEACHER')
    const first = screen.getAllByRole('button', { name: /tap to mark absent/i })[0]
    fireEvent.click(first)
    click('Save attendance')
    const saved = store.db.attendance.filter((a) => a.sessionId === 'ses_b1_2026-10-23')
    expect(saved.length).toBe(6)
    expect(saved.filter((a) => a.mark === 'A')).toHaveLength(1)
    expect(screen.getByRole('status')).toHaveTextContent('Saved: 5 present, 1 absent, 0 late.')
    click('Undo')
    expect(store.db.attendance.some((a) => a.sessionId === 'ses_b1_2026-10-23')).toBe(false)
  })

  it('shows attendance as view-only for the accountant', () => {
    renderAt('/attendance/ses_b1_2026-10-21', 'ACCOUNTANT')
    expect(screen.getByText(/Accountants can see attendance but not mark it/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /save/i })).not.toBeInTheDocument()
  })

  it('records a payment, then flags the same payment as a near-duplicate', () => {
    renderAt('/students/stu_02', 'OWNER')
    const pay = () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'Record payment' })[0])
      const dialog = screen.getByRole('dialog')
      type(within(dialog).getByLabelText('Amount (₹)'), '500')
      fireEvent.click(within(dialog).getByRole('button', { name: 'Save and send receipt' }))
      return screen.getByRole('dialog')
    }
    expect(pay()).toHaveTextContent('Payment recorded')
    click('Done')
    const second = pay()
    expect(second).toHaveTextContent('This looks like a duplicate.')
    fireEvent.click(within(second).getByRole('button', { name: 'Record as a second payment' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Payment recorded')
    expect(
      store.db.payments.filter((p) => p.studentId === 'stu_02' && p.amount === 50000),
    ).toHaveLength(2)
  })

  it('registers a centre and shows the onboarding checklist', () => {
    renderAt('/signup')
    type(screen.getByLabelText('Coaching centre name'), 'Sunrise Tutorials')
    expect(screen.getByLabelText('Receipt preview')).toHaveTextContent('ST-2026-000001')
    click('Next: your account')
    type(screen.getByLabelText('Your full name'), 'Rina Bose')
    type(screen.getByLabelText('Email'), 'rina@sunrise.in')
    type(screen.getByRole('textbox', { name: 'WhatsApp number' }), '9876543210')
    type(screen.getByLabelText('Password'), 'Sunrise#Tuition1')
    fireEvent.click(screen.getByRole('checkbox'))
    click('Create account')
    type(screen.getByLabelText('6-digit code'), '123456')
    click('Continue')
    expect(store.db.centre).toMatchObject({
      name: 'Sunrise Tutorials',
      prefix: 'ST',
      whatsapp: 'not_connected',
    })
    expect(screen.getByText('Set up Sunrise Tutorials')).toBeInTheDocument()
  })

  it('asks before leaving settings with unsaved changes', async () => {
    const router = renderAt('/settings/fees', 'OWNER')
    type(screen.getByLabelText('Sibling discount (%)'), '15')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    await act(() => router.navigate('/'))
    expect(screen.getByRole('dialog')).toHaveTextContent('Leave without saving?')
  })
})
