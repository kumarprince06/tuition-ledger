# Documentation changelog

Apply these in order if you maintain a hand-edited copy.

## 2026-10-24 (b) — identity and memberships, tenant isolation before auth, centre payment accounts
- NEW `adr/0020-identity-memberships.md`: a person is one global `users` row; their role at each centre is a `memberships` row; platform admins are a grant (`platform_admins`); sign-in picks or asks for the centre.
- NEW `adr/0021-centre-payment-accounts.md`: parent fees only to the centre's own cash, UPI ID or Razorpay; never through Tuition Ledger; pasted Razorpay keys first, Partner OAuth later; per-centre webhooks.
- `adr/0002`: `tl_migrate` owns the schema and the app runs as `tl_app`; fails closed without a context; root and platform tables without RLS; provisioning sets the context to the new centre; only tests set the context before auth. `adr/0018`: trial date on `subscriptions`; two-centre teacher limitation resolved. `adr/README.md` rows.
- `05-data-model.md`: root tables section; `users` without `centre_id` and `role`; `memberships`, `platform_admins`, `centre_payment_accounts`; `centres.upi_id`, `upi_payee_name`; `centres.trial_ends_on` moved to `subscriptions` with a status check; `calendar_feeds` keyed by (user, centre).
- `02-srs.md`: CEN-1 payment methods; CEN-2 one person, many centres; CEN-5 now M for every role; PAY-6 (UPI link and QR), PAY-7 (fees only to the centre's accounts).
- `03-system-design.md` §4–5, `04-lld.md` §2, §8, §10: roles, root tables, centre selection, provisioning service, per-centre Razorpay client and webhooks, subscription statuses.
- `06-api.md` + `api/openapi.yaml`: `POST /auth/centre`, `POST /centres`, `/me` lists centres, `/centre/payment-methods`, `/webhooks/razorpay/{centreId}`; staff management acts on memberships.
- `07-tenant-admin.md`: payment-method settings; onboarding step 7. `09-sprint-plan.md`: S1-03, S1-05, S1-07 (isolation and provisioning before auth), S3-08, S3-14, new S3-18/19; sprint totals. `11-security-privacy.md`: threats and data class. `14-risks.md`: R17, R18, decision log.
- Not yet re-derived: `16-work-estimation.md` and `estimation/work-estimation.xlsx` (+2 hd BE in sprint 1, +2 hd BE and +1 hd FE in sprint 3).

## 2026-10-24 — self-serve registration, backend gaps found by the prototype, v2 static design
- NEW `adr/0018-self-serve-signup.md` and `adr/0019-email-password-login.md` (partly supersedes ADR-0009); rows in `adr/README.md`; ADR-0009 status line.
- Registration takes centre name, owner name, email, WhatsApp number and password (the receipt prefix is generated from the name and editable in Settings until the first receipt); sign-in by WhatsApp code or email + password (CEN-2, CEN-6, CEN-8); `POST /auth/login`, email verification, password reset, `PATCH /me/credentials`; `users` credential columns and `auth_tokens`; threats and controls in `11-security-privacy.md`; R16.
- `02-srs.md`: CEN-6 (self-serve registration), CEN-7 (parent messages held until the centre's WhatsApp number is approved); ATT-1 now states the roster rule and that late counts as attended.
- `06-api.md` + `api/openapi.yaml`: `POST /signup/otp`, `POST /signup`, `GET /centre/whatsapp`, `GET /fee-runs/{period}/preview`, `POST /adjustments`; students list filters `hasBalance`, `consent` and fields `batchIds`, `attendanceRate30d`; batch list summary fields.
- `05-data-model.md`: `centres.whatsapp_status`, `trial_ends_on`, `signup_source`; `users.email`; outbox status `held`.
- `07-tenant-admin.md` §4: onboarding step 2 "WhatsApp Business number connected".
- `14-risks.md`: R14 (WhatsApp approval stalls new centres), R15 (abusive registrations).
- NEW `design/prototype.html` (v2 static design) and `design/README.md` (UX and backend-alignment decisions).

## 2026-10-23 (c) — announcements, rescheduling, PDF receipts, phase 2–4 roadmap, recordings add-on, multilingual
- NEW `15-roadmap.md`: phases 1–4 with exit criteria, items, SRS IDs and sizes; recordings add-on design; multilingual scope; permanent exclusions.
- NEW `adr/0017-recordings-addon.md`; row added to `adr/README.md`.
- `02-srs.md`: new sections 7d (ANN-1..3, SCH-1, RCP-1), 7e (phase 2: ADM, HWK, LVE, EXP, ACC, BNK, PAYR), 7f (phase 3–4: QR, PTM, MB, REF, I18N, VID).
- `01-prd.md` §3: MVP scope line extended; "deliberately out" reworded to "out of the MVP" with pointer to the roadmap.
- `09-sprint-plan.md`: S3-16/17 announcements; S4-17/18/19 reschedule, receipt PDF, FE; sprint totals updated; sprint 6–7 backlog extended (S6-09/10 moved items, S7-01..09).
- `08-saas-plans.md`: plan rows for announcements, storage, admissions, expenses, exports, multi-branch, recordings; new §6 add-on pricing.
- `07-tenant-admin.md`: permissions ANNOUNCE, SESSION_RESCHEDULE; settings for auto-announce, announcement senders, receipt PDF, recordings add-on.
- `05-data-model.md`: tables announcements, session_changes, receipt_documents; outline of phase 2–4 tables.
- `06-api.md`: POST /announcements, POST /sessions/{id}/reschedule, GET /receipts/{token}.pdf.
- `11-security-privacy.md`: data class row for files and recordings.
- `14-risks.md`: R12 announcement spam, R13 add-on cost.
- `03-system-design.md` §7: teacher nudge job row.
- `README.md`: index row for 15.

## 2026-10-23 (b) — tests, marks, results and monthly assessment
- `02-srs.md` 7c (ASM-1..8); `adr/0016-assessments.md`; `05` tests/marks/monthly_assessments; `06` endpoints; `07` permissions and settings; `08` plan rows; `09` S5-15..18, S6-06..08, S5-05 and S5-07 moved to sprint 6; `11` data class; `14` R11; `01` §5 message examples and opt-in wording.

## 2026-10-23 (a) — calendar feeds, teacher nudges, Google sync
- `02-srs.md` 7b (CAL-1..5); `adr/0015-calendar.md`; `05` calendar_feeds, calendar_links; `06` feed endpoints; `07` settings; `08` plan rows; `09` S4-14..16, S5-14, S6-01..03; `14` R10; `03` scheduling row.
