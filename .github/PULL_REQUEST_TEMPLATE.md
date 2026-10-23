## Ticket
S<n>-<nn> · Requirement: <ID> · Design: <doc §>

## What changed

## Checklist (from docs/13-ways-of-working.md)
- [ ] Money is `Money`/paise; no float or double
- [ ] New entities are `@TenantScoped` with a `centre_id` index
- [ ] Transaction boundary on the application service
- [ ] Idempotency handled for retryable writes
- [ ] Events published in-transaction; listeners idempotent
- [ ] Permissions annotated; teacher scoping where relevant
- [ ] Audit entry for settings/money/role changes
- [ ] Problem-details errors with stable `type`
- [ ] Tests from the ticket added and green
- [ ] OpenAPI updated, client regenerated
- [ ] Migration additive and lock-safe
- [ ] Docs updated (SRS / ADR / 07 / 08) where behaviour changed
