# 12 — Runbook

## 1. Deploy

`make release` builds the image (Jib), runs migrations with `tl_migrate`, swaps containers with health check; rollback = previous tag + `flyway undo` is not used, migrations are forward-only and additive during a release (expand/contract).

Pre-release checklist: CI green, e2e nightly green, migration reviewed for locks (no table rewrites in business hours 07:00–21:00 IST), changelog written, owner notification prepared if visible changes.

## 2. Alerts and first response

| Alert | Threshold | First response |
|---|---|---|
| App health down | 2 checks, 1 min | restart container; check disk and memory; check Postgres |
| Outbox oldest queued age | > 10 min during 08:00–20:00 | check relay logs; provider status; breaker state; `make relay-status` |
| Webhook signature failures | > 0 in 5 min | verify provider secret rotation; block source if persistent |
| Fee run incomplete | any centre not finished by 06:00 on day 1 | `POST /fee-runs/{period}/run` to resume; inspect fee_runs.last_error |
| Reconciliation diff | ≠ 0 | stop writes for that centre (feature flag), inspect ledger vs view, rebuild view, root-cause |
| Reminders skipped-paid rate | drops to 0 for a day with payments present | balance check may be broken; pause reminder job; investigate |
| Disk > 80% | — | prune images; check outbox and audit growth; archive |
| Backup missing | no dump by 03:30 | run manually; fix cron; verify object storage credentials |

## 3. Common operations

- Resume a fee run: `POST /v1/fee-runs/2026-11/run` as owner or via platform console.
- Replay a dead outbox row: set status queued, attempts 0 via the console action (audited).
- Rotate a provider secret: update env, restart, verify a test webhook.
- Suspend a centre: console action; apps receive 402/403 with message; data retained.
- Support session: console → centre → "Open read-only session" (30 min, audited).

## 4. Backup and restore

Nightly `pg_dump -Fc` at 02:30 to object storage, 30 days kept. Monthly drill: restore into a fresh container, run `make verify-restore` (row counts per table against the night's manifest, reconciliation job), log the duration in `docs/ops/restore-log.md`. RPO 24 h, RTO 2 h.

## 5. Incident response

1. Acknowledge the alert; post in the ops channel with time and impact.
2. Stabilise (restart, pause a job, enable a feature flag) before diagnosing.
3. If parent data or money may be affected, stop outbound messaging (`RELAY_PAUSED=true`) until the scope is known.
4. Communicate to affected owners within 2 hours with what happened and what we are doing.
5. Post-incident note in `docs/mistakes.md` within 48 hours: timeline, cause, fix, prevention. This file is also the interview-story source.

## 6. Go-live checklist for a new centre

- [ ] Centre created with timezone, due day, quiet hours, prefix
- [ ] Owner logged in on their phone; staff invited
- [ ] Batches with fees; students imported; enrolments checked against the register
- [ ] WhatsApp sender verified; opt-ins sent to one batch first; replies observed for 48 h
- [ ] Payment account live (or cash/UPI only confirmed)
- [ ] Test payment and receipt on the owner's phone
- [ ] Fee run dry-run reviewed with the owner before the 1st
- [ ] Owner knows the support number and the changelog channel
