# Tuition Ledger

Multi-tenant SaaS for small coaching centres (50–300 students): attendance, fees, payments and parent messaging over WhatsApp. Parents install nothing.

> **Status:** pre-development. This repo holds the complete design pack. Code starts at Sprint 1 ([docs/09-sprint-plan.md](docs/09-sprint-plan.md)).

## What it guarantees

| # | Guarantee |
|---|---|
| G1 | A payment is recorded exactly once, whatever the channel (cash, Razorpay, manual UPI) |
| G2 | Balances are derived from an append-only ledger; corrections are new entries |
| G3 | Charges are pro-rated correctly for joins, leaves, pauses and discounts |
| G4 | No reminder for money already paid, no duplicates, none outside 8 am–8 pm |
| G5 | Any student's attendance for any day, with who marked it and when |
| G6 | No data lost on restart, phone change or staff change |

## Planned stack

Java 21 · Spring Boot 4 · Spring Modulith · PostgreSQL 16 · Redis · React 18 + TypeScript + Vite · WhatsApp Cloud API · Razorpay · Docker Compose on one VPS. No message broker; a Postgres outbox handles delivery ([ADR-0003](docs/adr/0003-outbox-no-broker.md)).

## Documentation

Start at [docs/README.md](docs/README.md). Key documents:

- [Product requirements](docs/01-prd.md) · [SRS](docs/02-srs.md) · [Roadmap](docs/15-roadmap.md)
- [System design](docs/03-system-design.md) · [Low-level design](docs/04-lld.md) · [Data model](docs/05-data-model.md)
- [API contract](docs/06-api.md) · [openapi.yaml](docs/api/openapi.yaml)
- [Sprint plan](docs/09-sprint-plan.md) · [Test plan](docs/10-test-plan.md) · [Ways of working](docs/13-ways-of-working.md)
- [Architecture decision records](docs/adr/)

## Contributing

Every PR maps to a ticket in the sprint plan and follows the checklist in [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md). To change a design decision, add a new ADR; never edit an accepted one.

## Licence

See [LICENSE](LICENSE).
