# 06 — API contract

Base URL `/v1`. JSON. Auth: `Authorization: Bearer <access token>`; the centre comes from the token, never from the URL. Errors: RFC 9457 problem details. Lists are cursor-paginated (`?cursor=&limit=` ≤ 100). All write endpoints accept `Idempotency-Key` and return `Idempotent-Replay: true` on a replay. Full schemas in `api/openapi.yaml`.

| Method and path | Role | Purpose | Notes |
|---|---|---|---|
| POST /auth/otp | public | start OTP | 5 per hour per phone |
| POST /auth/verify | public | exchange OTP for tokens | sets refresh cookie |
| POST /auth/refresh | cookie | rotate refresh, new access | |
| POST /auth/logout | any | revoke refresh | |
| GET /me | any | user, centre, role, permissions, plan snapshot | SPA bootstrap |
| GET/PATCH /centre | OWNER | settings | audited |
| GET/POST /users, PATCH /users/{id} | OWNER | staff management | role change bumps token version |
| GET/POST /batches, GET/PATCH /batches/{id} | OWNER (read: all staff) | batches | fee change applies next month |
| GET /batches/{id}/sessions?from&to | staff | sessions | |
| POST /sessions, PATCH /sessions/{id} | TEACHER own / OWNER | extra session, cancel | |
| GET /sessions/{id}/attendance, PUT /sessions/{id}/attendance | TEACHER own / OWNER | read and mark | PUT is full replacement; within 7 days |
| GET/POST /students, GET/PATCH /students/{id} | OWNER, ACCOUNTANT (read: TEACHER own batches) | students | PATCH status → status_changes |
| POST /students/import | OWNER | CSV import with dry-run flag | plan feature |
| DELETE /students/{id}/personal-data | OWNER | anonymise | audited |
| GET /students/{id}/ledger | OWNER, ACCOUNTANT | lines + running balance | |
| GET /students/{id}/attendance?month | staff | month view | |
| POST /enrolments, PATCH /enrolments/{id} | OWNER | enrol, end | capacity check |
| GET /charges?student&period&status | OWNER, ACCOUNTANT | charges | |
| POST /charges | OWNER, ACCOUNTANT | one-off charge | |
| POST /fee-runs/{period}/run | OWNER | run or resume the fee job manually | idempotent |
| GET /fee-runs/{period} | OWNER | progress | |
| POST /payments | OWNER, ACCOUNTANT, TEACHER (cash only) | record payment | 409 on near-duplicate unless confirmDuplicate |
| GET /payments/{id} | OWNER, ACCOUNTANT | receipt | |
| POST /payments/{id}/refund | OWNER, ACCOUNTANT | refund with reason | |
| PATCH /payments/{id}/allocations | ACCOUNTANT, OWNER | reallocate | |
| POST /payment-links | OWNER, ACCOUNTANT | create Razorpay link | plan feature |
| GET /outstanding | OWNER, ACCOUNTANT | outstanding list | |
| POST /reminders/send-now | OWNER, ACCOUNTANT | manual reminder | 1 per parent per 24 h |
| GET /messages?student | OWNER, ACCOUNTANT | message log | |
| GET/POST /batches/{id}/tests | TEACHER own / OWNER | tests of a batch | |
| GET/PUT /tests/{id}/marks | TEACHER own / OWNER | read and enter marks (full replacement, supersedes) | within 14 days |
| POST /tests/{id}/send-results | TEACHER own / OWNER | one message per child | 409 if already sent unless OWNER confirms |
| GET /students/{id}/results | OWNER, ACCOUNTANT, TEACHER own | marks history and trend | |
| GET/PUT /assessments?period&batch | TEACHER own / OWNER | monthly drafts and comments | |
| POST /assessments/{period}/send | OWNER | send reviewed drafts | logged |
| GET /dashboard | OWNER (reduced for others) | figures | |
| GET /reports/statement?month | OWNER, ACCOUNTANT | reconciled statement | |
| GET /exports/{kind}.csv?from&to | OWNER | CSV stream | |
| GET /audit?from&to | OWNER | audit log | |
| POST /announcements | OWNER, TEACHER own | batch or all-batch announcement | recipient count returned |
| POST /sessions/{id}/reschedule | OWNER, TEACHER own | move a session | history kept; auto-announce |
| GET /receipts/{token}.pdf | public (signed) | receipt PDF | 90-day validity |
| GET /calendar/{token}.ics | public (signed token) | iCal feed of the user's sessions, 60 days | cache 10 min; 404 when revoked |
| POST /calendar/feed/rotate | any staff | new feed token | old one revoked |
| POST /calendar/google/connect, DELETE /calendar/google | OWNER, TEACHER | OAuth connect/disconnect (post-pilot) | Standard plan |
| GET/PATCH /subscription | OWNER | plan, usage, upgrade | |
| POST /webhooks/whatsapp, GET /webhooks/whatsapp | provider | inbound + status; verify challenge | signature verified |
| POST /webhooks/razorpay | provider | payment events | signature verified |
| GET/POST /platform/centres, PATCH /platform/centres/{id} | PLATFORM_ADMIN | tenant ops | counts only |
| GET /platform/health | PLATFORM_ADMIN | queues, jobs, breakers | |

## Payment request example

```http
POST /v1/payments
Idempotency-Key: 7e1d6b7e-2c31-4a4a-9b0d-9c8f0f2b0c11
{ "studentId": "stu_01J9…", "amountPaise": 120000, "method": "cash", "receivedOn": "2026-10-04", "confirmDuplicate": false }
```
```http
201 Created
{ "id": "pay_01J9…", "receiptNo": "BM-2026-000412", "amountPaise": 120000, "allocations": [{"chargeId":"chg_01J9…","amountPaise":120000}], "balanceAfterPaise": 0 }
```
Replay with the same key → `200` with the same body and `Idempotent-Replay: true`. Near-duplicate → `409` `{type:"…/near-duplicate-payment", detail:"A ₹1,200 cash payment for this student was recorded today at 10:12 (BM-2026-000411). Resend with confirmDuplicate=true if this is a second payment."}`.
