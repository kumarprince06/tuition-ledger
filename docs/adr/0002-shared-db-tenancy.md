# ADR-0002 Shared database with centre_id, Hibernate filter and row-level security
**Context.** Hundreds of small tenants, each with under 50 MB of data; migrations must stay cheap; isolation must be provable.
**Decision.** One schema; every tenant table has `centre_id`. A request-scoped TenantContext from the JWT enables a Hibernate filter on `@TenantScoped` entities and sets `app.centre_id` so Postgres row-level security policies apply as a second guard. A test asserts every entity with `centre_id` is `@TenantScoped` and every native query is allow-listed.

- **Roles.** Postgres does not apply row-level security to a table's owner, so `tl_migrate` owns the schema and runs Flyway, and the application connects as `tl_app`, which owns nothing and is subject to every policy.
- **Fails closed.** Policies compare with `current_setting('app.centre_id', true)`; with no tenant context the setting is null and a query returns no rows.
- **Root and platform tables.** `centres`, `users` (ADR-0020), `platform_admins`, `plans`, `subscriptions`, `usage` and `platform_invoices` have no row-level security; they are reachable only through the tenancy and platform modules (enforced by the Modulith test). Jobs that work across centres (session generation, fee runs, trial expiry, metering) list centres from `centres`, then process one centre per transaction with the tenant context set to that centre.
- **Provisioning.** Creating a centre generates its id first, sets the tenant context to it, then inserts the centre, the owner's membership, settings and subscription in one transaction, so tenant-table inserts pass the policies.
- **Before authentication exists,** only tests set the tenant context; there is no header or parameter that selects a centre.

**Consequences.** One migration per release; backups and restores are simple; cross-tenant leakage requires defeating two independent mechanisms. Per-tenant export is a filtered dump. Risk: a hot tenant affects others; mitigated by indexes on (centre_id, …) and, later, moving one tenant to its own datasource (the filter design permits a routing datasource).
**Alternatives.** Schema-per-tenant: 300 migrations per release and connection-pool fragmentation. Database-per-tenant: cost and ops out of proportion.
