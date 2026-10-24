# Architecture decision records

Format: context → decision → consequences → alternatives. Status is Accepted unless noted. A superseded ADR stays here with a pointer to its replacement.

| # | Title |
|---|---|
| 0001 | Modular monolith in one deployable |
| 0002 | Shared database with centre_id, Hibernate filter and row-level security |
| 0003 | Postgres outbox and scheduled relays instead of a message broker |
| 0004 | Money as long paise; one rounding point per charge |
| 0005 | Append-only ledger with derived balances |
| 0006 | Idempotency on every payment channel |
| 0007 | Gap-free receipt numbers from a locked counter |
| 0008 | Reminders generated at send time from the live balance |
| 0009 | Phone + OTP authentication with short JWT and rotated refresh |
| 0010 | WhatsApp templates versioned in the database, English first |
| 0011 | Spring Modulith event publication registry for cross-module reactions |
| 0012 | Plan limits enforced in application services via PlanGuard |
| 0013 | ULID identifiers with type prefixes |
| 0014 | React SPA with generated client, mobile-first |
| 0015 | Calendar: iCal feeds and WhatsApp nudges first, Google OAuth sync later |
| 0016 | Test results and assessments as structured templates, one child per message, no ranks |
| 0017 | Recorded class library as a paid add-on billed through the fee engine |
| 0018 | Self-serve centre registration with OTP-verified owner; WhatsApp sender connected during onboarding |
| 0019 | Email + password as a second sign-in method alongside WhatsApp codes (partly supersedes 0009) |
| 0020 | People are global users; their role at a centre is a membership |
| 0021 | Parent fees settle only to the centre's own accounts |
