# 16 — Work estimation and build order

The working estimate is [estimation/work-estimation.xlsx](estimation/work-estimation.xlsx); edit sizes, risk, owner and status there and every total recalculates. This page is the readable summary as of 2026-10-24 (updated for self-serve registration and email + password sign-in).

## Method

- Base size per task in half-days (hd) from [09-sprint-plan.md](09-sprint-plan.md); 1 hd = 4 hours.
- Contingency by risk: Low 10%, Medium 20%, High 35% (money correctness, concurrency, external providers, approvals). Pilot-fix reserve gets none — it is already a buffer.
- Capacity per sprint: backend 20 hd (one full-time dev), frontend 8 hd (part-time), QA 2 hd, PM 4 hd.
- Tasks are ordered so each step builds on a finished one: project setup → tenant provisioning → auth → the screen that uses each API.

## Build order

| # | Phase | What it delivers | Est. (hd) |
|---|---|---|---|
| P0 | Project setup | Monorepo (`/backend`, `/frontend`, `/infra`), Spring Boot + Modulith skeleton, Vite + React skeleton, Docker Compose, CI for both as required checks, shared kernel, generated API client, design tokens, backups | 11.0 |
| P1 | Tenant provisioning | Tenant schema with RLS, centre + owner creation (platform admin API/CLI), tenant isolation | 6.6 |
| P2 | Authentication & roles | WhatsApp-code and email + password sign-in, self-serve registration, permission matrix, audit; then sign-in, registration, app shell and staff screens | 18.1 |
| P3 | Batches & sessions | Batches API and session generation; batches, sessions and holidays screens | 6.9 |
| P4 | Students & enrolments | Students and enrolments API; students and status screens | 4.6 |
| P5 | Attendance | Attendance API, phone-first marking screen, seed data, sprint 1 QA | 7.0 |
| P6 | Fee engine | Fee calculator, resumable fee run and its preview, adjustments, one-off charges; fee run screen | 13.6 |
| P7 | Ledger & payments | Ledger, idempotent payments, refunds, credits, statement and reconciliation; ledger and payment screens; **Gate 1** | 19.3 |
| P8 | WhatsApp messaging | Templates, outbox, WhatsApp adapter, centre sender status with held messages, consent, keywords, receipts, message log; consent UI | 21.0 |
| P9 | Online payments | Razorpay links and webhooks, announcements; link, inbox and announcement screens | 11.7 |
| P10 | Reminders & digests | Reminder scheduler, weekly digest, send-now | 6.4 |
| P11 | Dashboard, reports & settings | Dashboard, outstanding list, list summaries, exports, settings, receipt PDF and their screens | 15.3 |
| P12 | Calendar & rescheduling | iCal feeds, teacher nudges, reschedule and their screens | 5.3 |
| P13 | Go-live | Metrics and alerts, production deploy with TLS, QA, go-live runbook, live fee run; **Gate 2** | 8.7 |
| P14 | Tests & results | Marks, result messages, marks entry screen | 8.5 |
| P15 | Plans & billing | PlanGuard, metering and invoices, platform console API and screens | 12.2 |
| P16 | Hardening | Data deletion, load test, security pass, pilot-fix reserve, regression; **Gate 3** | 17.5 |
| | **MVP total** | **≈ 194 hd ≈ 774 hours** (BE 133, FE 42.5, QA 9, PM 9) | **193.5** |

Post-pilot backlog (phases 2–4 of [15-roadmap.md](15-roadmap.md)) is listed in the sheet as `BL-xx` rows: ≈ 115 hd, not committed.

## What the numbers say

- With contingency, backend needs **≈ 6.7 sprints (≈ 13.3 weeks)**, against the 5 sprints planned in 09. Backend is the critical path.
- Sprint 1 backend is loaded to ~160% of capacity and sprint 2 to ~150% (registration and email + password land there); every other sprint is above 100%. Either accept a sixth sprint, add backend capacity, or cut scope using the cut line in 01.
- Frontend fits in 5 sprints overall, but sprints 1 and 2 are over capacity; the sheet moves new FE screens to sprint 2 and later ones can slide without blocking backend.

## Added to the sprint plan

Work the sprint plan needed but did not ticket, marked `NEW-xx` in the sheet: self-serve registration and email + password sign-in (NEW-10 to NEW-12), fee-run preview, adjustments endpoint, WhatsApp sender status and list summaries (NEW-13 to NEW-16), monorepo layout, environment config, CI for both apps, centre provisioning, staff management UI, sessions and holidays UI, student status UI, a money QA pass and a production deploy for the frontend. `S1-13` and `S1-14` are split into smaller rows. `S5-11` depended on `S5-05`, which moved to sprint 6, so the CSV import wizard moved to the backlog with it.
