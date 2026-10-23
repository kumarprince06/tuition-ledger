# ADR-0011 Spring Modulith event publication registry for cross-module reactions
**Context.** A payment must produce a receipt message; a status change must produce a fee adjustment. If the reaction runs after commit and the process dies in between, it is lost; if it runs inside the transaction and fails, it rolls back a valid payment.
**Decision.** Publish domain events inside the transaction; Modulith's event publication registry persists them in the same commit; `@ApplicationModuleListener` handlers run after commit, are retried on restart, and are idempotent (dedupe keys on their effects).
**Consequences.** Exactly the outbox semantics for in-process reactions with no extra table to write by hand; incomplete publications are visible and replayable.
**Alternatives.** Plain `@TransactionalEventListener(AFTER_COMMIT)`: lost on crash. Synchronous calls: coupling and rollback of good data on messaging failures.
