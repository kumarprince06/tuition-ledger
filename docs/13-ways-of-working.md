# 13 — Ways of working and definition of done

## Branching and review
- `main` is always deployable. Feature branches `feat/S2-07-payment-record`; squash merge.
- Every PR links its ticket, states the requirement ID, and lists the tests added.
- One approving review (or a documented self-review checklist when solo). Reviews use the checklist below.

## PR checklist
- [ ] Money is `Money`/paise; no float or double
- [ ] Every new entity is `@TenantScoped` and has a `centre_id` index
- [ ] Transaction boundary is on the application service; no repository calls from controllers
- [ ] Idempotency considered for every write that can be retried (key, unique constraint, replay response)
- [ ] Events published inside the transaction; listeners idempotent
- [ ] Permission annotated; teacher scoping where relevant
- [ ] Audit entry for settings/money/role changes
- [ ] Errors use problem details with stable `type`
- [ ] Tests named in the ticket exist and pass; integration tests use Testcontainers
- [ ] Metrics/log fields added where the runbook needs them
- [ ] OpenAPI updated and client regenerated
- [ ] Migration is additive and lock-safe; rollback plan noted
- [ ] Docs updated: SRS if behaviour changed, ADR if a decision changed, 07/08 if permissions or plans changed

## Definition of done (ticket)
1. Acceptance criteria demonstrated on the Compose stack.
2. Tests from the ticket merged and green in CI.
3. Documentation touched as per the checklist.
4. QA manual cases for the ticket executed (sprint-level for small tickets).
5. Observability in place where named.
6. Deployed to staging; smoke checked.

## Definition of done (sprint)
Demo given to the client, retrospective held, actions ticketed, release notes sent to pilot owners, `docs/mistakes.md` updated if anything surprised us.

## Coding conventions
Java 21, records for DTOs and value objects, constructor injection, no field injection, no `@Autowired`. Package-private by default; `api` package is the only public surface per module. Null-safety with JSpecify annotations. Tests named `<Class>Test` (unit) and `<Feature>IT` (integration). Commits in imperative mood with the ticket ID.

## Communication with the client
Weekly written update (what shipped, what is next, decisions needed, risks) on Friday; sprint demo every second Friday; decisions recorded in 14-risks.md's decision log. Scope requests go into the backlog with an estimate, never straight into a sprint.
