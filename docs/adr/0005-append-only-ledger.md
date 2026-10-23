# ADR-0005 Append-only ledger with derived balances
**Context.** Disputes are about history: "I paid in July", "who changed this". A mutable balance cannot answer them.
**Decision.** `ledger_lines` is append-only (the app role has no UPDATE/DELETE); every charge, payment, adjustment, refund and credit is a line with actor and reason; a student's balance is the sum. A materialised view serves the dashboard and is reconciled nightly against the sum.
**Consequences.** Every number has a provenance; corrections leave a trail; deleting personal data does not touch money rows. Cost: balance queries need an index and the view; both are in place.
**Alternatives.** Balance column with audit table: the audit table is always one bug away from disagreeing with the balance.
