# ADR-0004 Money as long paise; one rounding point per charge
**Context.** Fees, discounts and pro-ration must produce receipts and statements that agree to the rupee across months and with the parent's expectation.
**Decision.** All stored and transported money is `bigint`/`long` paise wrapped in a `Money` value object. Pro-ration and discount are computed in BigDecimal with 6-dp intermediate precision and rounded once, HALF_EVEN, to whole rupees when the charge is created. Payments are exact paise as received. An ArchUnit rule forbids floating point in money packages.
**Consequences.** No drift between the student page, the receipt message and the statement. Rounding behaviour is testable by property tests. The computation inputs are stored so any charge can be explained.
**Alternatives.** Doubles: cumulative error. Rounding per step: two correct steps can sum to a wrong total.
