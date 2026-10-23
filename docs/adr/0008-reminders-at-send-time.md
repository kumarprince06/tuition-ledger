# ADR-0008 Reminders generated at send time from the live balance
**Context.** The most damaging message a centre can send is a reminder for money already paid.
**Decision.** The reminder job enqueues per (charge, slot) with a dedupe key and `not_before`; the relay re-reads the balance immediately before sending and marks the row skipped if nothing is due. Messages are never pre-rendered days ahead.
**Consequences.** A payment at 07:58 cancels an 08:00 reminder; skipped count is a health metric. Slight extra read per send, negligible.
**Alternatives.** Generate the month's reminders on the 1st: simple, and wrong the first time a parent pays early.
