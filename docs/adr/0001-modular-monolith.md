# ADR-0001 Modular monolith in one deployable
**Context.** One engineer, ten weeks to a paying customer, expected load under 50 requests/s and a few thousand messages a day at 300 centres. Correctness of money and messaging matters more than independent scaling.
**Decision.** One Spring Boot application with module boundaries enforced by Spring Modulith (`@ApplicationModule`, verified in a test). Scheduled jobs run in the same process under ShedLock.
**Consequences.** One deploy, one database, simple local setup; adding a replica is possible because jobs are locked. Module boundaries are tested so a later extraction is a move, not a rewrite. Risk: a heavy report query slows the API; mitigated with the materialised view and, later, a read replica.
**Alternatives.** Microservices: network boundaries between fees, ledger and messaging would turn one transaction into a saga for no benefit at this scale. Monolith without Modulith: boundaries erode in months.
