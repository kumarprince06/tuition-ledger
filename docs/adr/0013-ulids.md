# ADR-0013 ULID identifiers with type prefixes
**Context.** IDs appear in URLs, receipts, WhatsApp messages and support conversations.
**Decision.** ULIDs with a short type prefix (`stu_`, `pay_`, `chg_`), generated in the application, stored as text. Receipt numbers are a separate human series (ADR-0007).
**Consequences.** Time-sortable, no central sequence, safe to generate before insert (needed for idempotency keys and outbox rows in one transaction); a prefix tells support what an ID is.
**Alternatives.** Serial integers: enumerable and leak volume. UUIDv4: unsorted indexes.
