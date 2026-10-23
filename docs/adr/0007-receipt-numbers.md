# ADR-0007 Gap-free receipt numbers from a locked counter
**Context.** Centres and their accountants expect an unbroken receipt series per centre; gaps raise questions during audits.
**Decision.** `receipt_counters(centre_id, next_no)`; the payment transaction does `SELECT … FOR UPDATE`, assigns the number, increments, commits. Numbers format `PREFIX-YYYY-NNNNNN`, resetting per financial year if the centre chooses.
**Consequences.** Serialised per centre, which is fine at a few payments per minute per centre; a 50-thread test proves no gaps or duplicates. A rolled-back payment consumes nothing because the increment is in the same transaction.
**Alternatives.** Database sequences: gaps on rollback. UUIDs: unreadable and unacceptable to accountants.
