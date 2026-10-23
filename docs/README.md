# Tuition Ledger — pre-development documentation

Multi-tenant SaaS for small coaching centres: attendance, fees, payments and parent messaging over WhatsApp.
Every document here exists so that a developer can take a ticket from `09-sprint-plan.md` and build it without asking what was meant.

| # | Document | Owner | Read before |
|---|---|---|---|
| 01 | [Product requirements](01-prd.md) | PM | anything |
| 02 | [Software requirements (SRS) with acceptance criteria](02-srs.md) | PM + tech lead | picking a ticket |
| 03 | [System design (HLD)](03-system-design.md) | tech lead | any backend work |
| 04 | [Low-level design (LLD)](04-lld.md) | tech lead | writing a module |
| 05 | [Data model and DDL](05-data-model.md) | tech lead | any migration |
| 06 | [API contract](06-api.md) + [openapi.yaml](api/openapi.yaml) | backend | any endpoint, any frontend screen |
| 07 | [Tenant administration and permissions](07-tenant-admin.md) | PM | roles, settings, console screens |
| 08 | [SaaS plans, limits and billing](08-saas-plans.md) | PM | plan checks, metering |
| 09 | [Sprint plan with tickets](09-sprint-plan.md) | PM | every sprint |
| 10 | [Test plan](10-test-plan.md) | QA + backend | definition of done |
| 11 | [Security and privacy](11-security-privacy.md) | tech lead | auth, messaging, data handling |
| 12 | [Runbook](12-runbook.md) | on-call | going live |
| 13 | [Ways of working and definition of done](13-ways-of-working.md) | everyone | first commit |
| 14 | [Risks, assumptions, open questions](14-risks.md) | PM | sprint planning |
| 15 | [Roadmap beyond the MVP](15-roadmap.md) | PM | any "can it also…" conversation |
| ADR | [Architecture decision records](adr/) | tech lead | challenging a design choice |

## How these documents are used

- **Client conversations** use 01, 07, 08 and 14. Nothing is promised that is not in 01's scope table.
- **Sprint planning** uses 09; every ticket links to an SRS requirement and an LLD section.
- **Code review** uses 13's checklist and 10's test matrix.
- **Changes** to any decision go through a new ADR; the old one is marked superseded, never deleted.

## Glossary

| Term | Meaning |
|---|---|
| Centre | A tenant: one coaching centre or institute, one legal entity, one subscription |
| Owner | The centre's administrator; full control of the centre |
| Teacher | Staff member who marks attendance and may record cash |
| Accountant | Staff member who manages money, not attendance |
| Parent | The payer and recipient of WhatsApp messages; never logs in |
| Batch | A class group with a subject, schedule, teacher and fee plan |
| Session | One scheduled meeting of a batch |
| Enrolment | A student's membership of a batch over a date range |
| Charge | An amount a student owes for a period or a one-off item |
| Ledger line | An append-only money movement on a student's account |
| Outbox | The table that holds every outbound message until it is delivered |
| Plan | The centre's Tuition Ledger subscription tier (Free, Starter, Standard) |
