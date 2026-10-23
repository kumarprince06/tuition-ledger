# 07 — Tenant administration and permissions

A centre owner controls everything about their centre without contacting Tuition Ledger. The platform admin can suspend a centre or change its plan, and can never see student names, phones or money details.

## 1. Permission matrix

| Permission | OWNER | ACCOUNTANT | TEACHER |
|---|---|---|---|
| CENTRE_SETTINGS_WRITE (due day, quiet hours, prefix, holidays, templates language) | ✓ | | |
| USER_MANAGE (invite, role, deactivate) | ✓ | | |
| BATCH_WRITE (create, edit fee, assign teacher, archive) | ✓ | | |
| BATCH_READ | ✓ | ✓ | own batches |
| SESSION_WRITE (extra, cancel) | ✓ | | own batches |
| ATTENDANCE_WRITE | ✓ | | own batches |
| ATTENDANCE_READ | ✓ | ✓ | own batches |
| STUDENT_WRITE (add, edit, status, discount, delete personal data) | ✓ | add/edit, no delete | |
| STUDENT_READ | ✓ | ✓ | own batches |
| ENROLMENT_WRITE | ✓ | ✓ | |
| CHARGE_WRITE (one-off, adjustment) | ✓ | ✓ | |
| FEE_RUN (manual run/resume) | ✓ | | |
| PAYMENT_CASH_WRITE | ✓ | ✓ | ✓ (own batches' students) |
| PAYMENT_UPI_WRITE, PAYMENT_LINK_CREATE | ✓ | ✓ | |
| PAYMENT_REFUND, ALLOCATION_WRITE | ✓ | ✓ | |
| LEDGER_READ | ✓ | ✓ | balance of own batches' students only |
| REMINDER_SEND_NOW | ✓ | ✓ | |
| MESSAGE_LOG_READ | ✓ | ✓ | |
| REPORTS_READ, EXPORT | ✓ | statement + ledger exports | own attendance export |
| AUDIT_READ | ✓ | | |
| TEST_WRITE (create test, enter marks) | ✓ | | own batches |
| RESULTS_SEND | ✓ | | own batches (first send only; resend needs OWNER) |
| ASSESSMENT_WRITE (comments, drafts) | ✓ | | own batches |
| ASSESSMENT_SEND | ✓ | | |
| RESULTS_READ | ✓ | | own batches |
| ANNOUNCE (batch announcements) | ✓ | | own batches (if setting allows) |
| SESSION_RESCHEDULE | ✓ | | own batches |
| SUBSCRIPTION_MANAGE | ✓ | | |

Rules: permissions are an enum in code; the matrix above is the single source and is reproduced in a unit test that fails if code and document diverge. Teacher "own batches" means `batches.teacher_id = user.id`; an owner who also teaches sees everything.

## 2. What the owner controls (Settings area in the web app)

| Setting | Default | Effect | Audited |
|---|---|---|---|
| Centre name, address, logo text | — | appears in every WhatsApp message and receipt | ✓ |
| Timezone | Asia/Kolkata | fee month boundaries, quiet hours, digests | ✓ |
| Fee due day | 5 | reminder schedule anchor | ✓ |
| Reminder schedule | due day, +3, +7 | any 1–4 offsets between 0 and 21 days | ✓ |
| Quiet hours | 20:00–08:00 | no sends inside | ✓ |
| Weekly digest | on, Sunday 10:00 | can be off or a different day | ✓ |
| Sibling discount | off | % applied when parent numbers match | ✓ |
| Receipt prefix | generated from the centre name at registration | editable in Settings until the first receipt, then immutable | ✓ |
| Message language | English | Bengali/Hindi when templates exist | ✓ |
| Payment link fee handling | absorb | absorb or pass through as a line | ✓ |
| Holidays | national list | sessions skipped | ✓ |
| Attendance edit window | 7 days | 1–30 | ✓ |
| Low-attendance threshold | 75% | dashboard flag | ✓ |
| Cash near-duplicate window | 24 h | confirmation prompt | ✓ |
| Calendar feeds | on | per-user iCal feed URLs; owner can revoke any | ✓ |
| Teacher nudge lead time | 10 min | WhatsApp nudge before each session with the attendance link; 0 = off | ✓ |
| Google Calendar sync (Standard) | off | push sessions, free/busy conflict warnings | ✓ |
| Include batch average in result messages | on | adds "Batch average X/Y" | ✓ |
| Notify parent when student absent for a test | off | sends "absent for test" | ✓ |
| Monthly assessment day | last day of month | generation and send day | ✓ |
| Teacher comments require owner review | on | drafts wait for owner | ✓ |
| Auto-announce cancellations and reschedules | on | message to batch parents and teacher | ✓ |
| Who may send announcements | owner and teachers | owner only / owner and teachers | ✓ |
| Receipt PDF | on | link in receipt message, 90-day validity | ✓ |
| Recordings add-on (phase 4) | off | per batch, student price, free grants | ✓ |

## 3. Owner tools that make the centre self-sufficient

- **Audit log**: every settings change, role change, refund, adjustment, data deletion, with before/after and who.
- **Message log per student**: what was sent, when, delivered or not, and the exact text.
- **Export everything**: students, enrolments, attendance, charges, payments, ledger, as CSV; the centre's data is theirs.
- **Data deletion**: per student, with the retention rule shown before confirming.
- **Plan and usage page**: students used of included, messages used of cap, next invoice estimate, upgrade/downgrade.
- **Support**: a Help link opens WhatsApp to the Tuition Ledger support number with the centre ID pre-filled.

## 4. Onboarding checklist (shown to a new owner until complete)

1. Centre settings confirmed (timezone, due day, quiet hours)
2. WhatsApp Business number connected in the centre's name (Meta review takes 2–5 days; until then parent messages are held, everything else works)
3. First batch created with a fee
4. First teacher invited
5. Students added (CSV import on Starter and above)
6. Opt-in messages sent and at least one consent received
7. Payment account connected (Razorpay) or marked "cash and UPI only"
8. Test payment recorded and receipt message received on the owner's own phone
9. First fee run previewed (dry run shows every charge before the 1st)

## 5. Platform admin console (what Tuition Ledger staff see)

| Screen | Shows | Can do |
|---|---|---|
| Centres | name, plan, status, students count, messages this month, last fee run status, owner phone (masked) | create, suspend, reactivate, change plan, open support session (read-only, audited, 30 min) |
| Health | outbox backlog, relay errors, webhook failures, fee runs incomplete, breaker states | retry a stuck relay batch |
| Billing | usage per centre, invoices, failed subscription charges | mark paid manually, extend grace |
| Templates | WhatsApp templates per language and approval status | submit new template |

The console never lists students, parents, amounts per student or message contents.
