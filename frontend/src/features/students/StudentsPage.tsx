import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import {
  activeBatchesOf,
  balance,
  can,
  consentOf,
  studentAtt,
  visibleStudents,
} from '../../mock/domain'
import { useStore } from '../../mock/store'
import { phoneFmt, plural, rup } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import { Empty, PageHead } from '../../shared/ui/kit'
import { useSheet, useToast } from '../../shared/ui/overlay'
import { ConsentPill, StatusPill } from '../../shared/ui/pills'
import { StudentSheet } from '../sheets/students'

type Filter = 'all' | 'due' | 'consent' | 'paused'

export function StudentsPage() {
  const { db, session } = useStore()
  const [params] = useSearchParams()
  const nav = useNavigate()
  const sheet = useSheet()
  const toast = useToast()
  const [filter, setFilter] = useState<Filter>((params.get('filter') as Filter) || 'all')
  const [q, setQ] = useState('')
  const all = visibleStudents()
  const ql = q.trim().toLowerCase()
  const list = all
    .filter(
      (s) =>
        filter === 'all' ||
        (filter === 'due' && balance(s.id) > 0) ||
        (filter === 'consent' && consentOf(s.parentPhone) !== 'given') ||
        (filter === 'paused' && (s.status !== 'active' || s.deleted)),
    )
    .filter(
      (s) =>
        !ql ||
        s.name.toLowerCase().includes(ql) ||
        s.parentName.toLowerCase().includes(ql) ||
        s.parentPhone.includes(ql.replace(/\s/g, '')),
    )
    .sort((a, b) => a.name.localeCompare(b.name))
  const filters: [Filter, string][] = [['all', 'All']]
  if (can('LEDGER_BALANCE')) filters.push(['due', 'Fees due'])
  if (session.role !== 'TEACHER') filters.push(['consent', 'No consent'])
  filters.push(['paused', 'Paused or left'])
  const teacher = session.role === 'TEACHER'
  return (
    <>
      <PageHead
        title="Students"
        sub={
          teacher
            ? 'Students in your batches.'
            : `${plural(all.length, 'student')} · siblings share a parent number and get one message.`
        }
        actions={
          can('STUDENT_WRITE') && (
            <>
              <button
                className="btn"
                onClick={() =>
                  toast(
                    'CSV import (Starter): upload, preview every row, fix errors, then import. Coming in phase 2.',
                  )
                }
              >
                Import CSV
              </button>
              <button
                className="btn btn-primary"
                disabled={!db.batches.length}
                title={db.batches.length ? undefined : 'Create a batch first'}
                onClick={() => sheet.open(<StudentSheet />)}
              >
                Add student
              </button>
            </>
          )
        }
      />
      <section className="card">
        <div className="card-hd" style={{ gap: 12 }}>
          <label className="phone-in" style={{ flex: '1 1 260px', maxWidth: 420 }}>
            <span className="cc" style={{ background: 'transparent', border: 0 }}>
              <Icon name="search" size={18} />
            </span>
            <input
              type="search"
              placeholder="Name, parent or phone"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search students"
            />
          </label>
          <div className="row">
            {filters.map(([k, t]) => (
              <button
                key={k}
                className="chip"
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="small muted">{list.length} shown</span>
        </div>
        {list.length ? (
          <table className="rtable">
            <thead>
              <tr>
                <th>Student</th>
                <th>Batches</th>
                <th>Parent</th>
                {!teacher && <th>Consent</th>}
                {can('LEDGER_BALANCE') && <th className="num">Balance</th>}
                <th className="num">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const bal = balance(s.id)
                const a = studentAtt(s.id)
                return (
                  <tr
                    key={s.id}
                    className="link"
                    onClick={(e) =>
                      !(e.target as HTMLElement).closest('a,button') && nav(`/students/${s.id}`)
                    }
                  >
                    <td className="c-main">
                      <Link to={`/students/${s.id}`}>
                        <b>{s.name}</b>
                      </Link>{' '}
                      <StatusPill s={s} />
                      <div className="tiny">
                        Class {s.cls}
                        {s.discountBps ? ` · ${s.discountBps / 100}% sibling discount` : ''}
                      </div>
                    </td>
                    <td data-label="Batches">
                      {activeBatchesOf(s.id)
                        .map((b) => b.name.replace(/^Class \d+ /, ''))
                        .join(', ') || '—'}
                    </td>
                    <td data-label="Parent">
                      {s.parentName}
                      <div className="tiny tnum">{phoneFmt(s.parentPhone)}</div>
                    </td>
                    {!teacher && (
                      <td data-label="Consent">
                        <ConsentPill phone={s.parentPhone} />
                      </td>
                    )}
                    {can('LEDGER_BALANCE') && (
                      <td
                        data-label="Balance"
                        className={`num strong ${bal > 0 ? 'c-amber' : bal < 0 ? 'c-green' : ''}`}
                      >
                        {bal < 0 ? 'credit ' + rup(-bal) : rup(bal)}
                      </td>
                    )}
                    <td data-label="Attendance" className="num">
                      {a.rate != null ? a.rate + '%' : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ) : all.length ? (
          <Empty
            title="No students match"
            sub="Clear the search or the filter."
            action={
              <button
                className="btn btn-sm"
                onClick={() => {
                  setQ('')
                  setFilter('all')
                }}
              >
                Clear
              </button>
            }
          />
        ) : (
          <Empty
            title="No students yet"
            sub="Add your first student. Their parent gets an opt-in message on WhatsApp."
            action={
              can('STUDENT_WRITE') && db.batches.length ? (
                <button className="btn btn-primary" onClick={() => sheet.open(<StudentSheet />)}>
                  Add student
                </button>
              ) : undefined
            }
          />
        )}
      </section>
    </>
  )
}
