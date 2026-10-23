# 10 — Test plan

Testing is organised by guarantee, not by layer: each guarantee in 01 has at least one test that would fail if it were broken. Everything below runs in CI on every pull request except the load test (nightly) and the drills (monthly).

## 1. Levels and tools

| Level | Tool | Scope | Runs |
|---|---|---|---|
| Unit | JUnit 5, AssertJ, jqwik | pure logic: fee calculator, money, allocation, template rendering, permission matrix | every PR, under 1 min |
| Architecture | ArchUnit, Spring Modulith | module boundaries, money types, tenant annotations, layering | every PR |
| Integration | Testcontainers (Postgres, Redis), Spring Boot test slices | repositories, services with real DB, RLS, jobs, outbox relay | every PR, under 6 min |
| Contract | OpenAPI validator + generated client tests | API matches openapi.yaml | every PR |
| End-to-end | Playwright against Compose stack with fakes | attendance, payment, link, reminder flows through the UI | nightly and before release |
| Load | k6 | NFR-1/2 on staging | nightly report |
| Drills | runbook scripts | restore, relay crash, webhook replay | monthly |

## 2. Guarantee → test matrix

| Guarantee | Test | Level |
|---|---|---|
| G1 payment recorded once | `PaymentIdempotencyIT`: same key twice → one row; `UtrDuplicateIT`; `RazorpayWebhookReplayIT`: same event body ×3 → one payment; `CashNearDuplicateIT`: 409 then confirm | integration |
| G1 receipt numbers gap-free | `ReceiptCounterConcurrencyIT`: 50 threads, numbers 1..50 | integration |
| G2 append-only ledger | `LedgerGrantsIT`: UPDATE as tl_app fails; `RefundLeavesOriginalIT` | integration |
| G2 balances derived | `BalanceReconciliationIT`: view equals sum after random operations (property-based with 200 random ops) | integration |
| G3 pro-ration | `FeeCalculatorTest` with SRS examples; `FeeCalculatorProperties`: 0 ≤ net ≤ fee; monotone in active days; split-month sums within ₹1 | unit |
| G3 fee job restartable | `FeeRunResumeIT`: kill after N students, resume, counts equal, no duplicates | integration |
| G4 no reminder when paid | `ReminderSkipWhenPaidIT`: pay before send → skipped; `ReminderSlotDedupeIT` | integration |
| G4 quiet hours | `QuietHoursTest` (unit on time maths across DST-less IST and Dubai), `QuietHoursIT` | unit + integration |
| G4 one message per parent | `SiblingCombineIT` | integration |
| G5 attendance history | `AttendanceSupersedeIT`, `AttendanceWindowIT` | integration |
| G5 parent keyword replies | `InboundRouterTest` matrix (keywords, case, whitespace, Bengali synonyms) | unit |
| G6 outbox exactly-once after crash | `OutboxRelayCrashIT`: kill relay mid-batch (Testcontainers pause), restart, each row sent once (fake client counts) | integration |
| G6 event registry | `EventPublicationReplayIT`: commit, crash before listener, restart runs listener once | integration |
| Tenant isolation | `TenantIsolationIT`: every repository method with two centres; `RlsIT`: raw JDBC query without filter returns nothing | integration |
| Permissions | `PermissionMatrixTest`: code matrix equals 07 §1 table (parsed from the doc) | unit |
| Plan limits | `PlanGuardIT` per limit and feature; `MessageCapIT` at 90% and 100% | integration |
| Consent | `NoReminderWithoutConsentIT`, `StopOptsOutIT` | integration |
| Money type safety | `MoneyArchTest`: no float/double in money packages | architecture |
| API contract | `OpenApiContractTest`: responses validate against schema | contract |

## 3. Test data

- `make seed` builds Bright Minds deterministically (fixed ULID seed) so figures in tests and demos are stable.
- No real phone numbers anywhere; fakes accept any E.164 and record sends.
- Golden statement for September 2026 (from the pilot's register) checked into `src/test/resources/golden/` once Gate 1 passes; the reconciliation test compares against it.

## 4. Manual and exploratory

Before each release: a 30-minute scripted walk-through on a real phone (attendance, cash payment, receipt arrival, reminder content, dashboard), plus one exploratory session focused on the sprint's area. Findings use the bug-table format: Bug ID | Title | Pre-condition | Steps to Reproduce | Expected Result | Actual Result | Severity | Priority.

## 5. Definition of tested

A ticket's tests are complete when: its acceptance criteria each map to a named test; the guarantee tests it touches still pass; coverage of the new module code is above 80% lines (not a target to game, a floor to notice gaps); and QA has executed the manual cases for the sprint.
