# ADR-0012 Plan limits enforced in application services via PlanGuard
**Context.** Plan limits (students, staff, messages, features) must be reliable or the pricing is meaningless; UI-only gating is bypassable.
**Decision.** `PlanGuard.check(centreId, Feature|Limit)` is called in the application service for every gated action; it reads a cached plan snapshot (Redis, 60 s) and throws `PlanLimitExceeded` mapped to 402 with an upgrade link. The relay's PreSendChecks consult the message cap.
**Consequences.** One place to change limits; tests per limit; the UI reads `/me.plan` to hide buttons but never relies on it.
**Alternatives.** Checking in controllers: missed by jobs and webhooks. Database triggers: opaque errors.
