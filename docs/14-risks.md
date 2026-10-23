# 14 — Risks, assumptions, open questions, decision log

## Risks

| # | Risk | Likelihood | Impact | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | WhatsApp template approval delayed | Medium | Sprint 3 slips | Submit templates in week 3 (S3-13); keep opt-in and receipt templates minimal; fake client keeps dev moving | PM |
| R2 | Razorpay KYC for the pilot centre delayed | Medium | Links not live for October | Start in week 3 (S3-14); cash and UTR paths do not depend on it | PM |
| R3 | Parents don't reply YES to opt-in | High | Reminders blocked for many | Owner verbal-consent path with timestamp; teachers ask parents in class; measure consent rate weekly | PM |
| R4 | Pilot staff keep using the register in parallel forever | Medium | No real usage | Gate 2 requires the register as control for one month only; owner commits to switching at the review | PM |
| R5 | One developer; illness or job change | Medium | Schedule | Docs are complete enough for a second developer to join; cut line defined | PM |
| R6 | Fee pro-ration edge cases (February, join and leave in the same month) | Medium | Wrong charges | Property tests; golden statement from the pilot | BE |
| R7 | Provider outages (WhatsApp, Razorpay) | Low | Delayed messages | Outbox retries; breaker; status page; messages never lost | BE |
| R8 | Data protection complaint from a parent | Low | Reputation | Consent-first design, STOP, deletion path, plain-language notice | PM |
| R10 | Google OAuth verification for calendar scopes takes longer than a sprint | High | Google sync slips | iCal feeds and nudges ship without Google; verification started in sprint 5 (S5-14) | PM |
| R11 | A teacher comment is hurtful or a mark is sent to the wrong parent | Low | Serious reputation harm | Comments bounded and owner-reviewed by default; one child per message with student ID in the dedupe key; correction flow; banned-words check | PM |
| R12 | Announcements recreate the group-message problem (spam) | Medium | Opt-outs rise | 300-character limit, per-plan caps, owner setting to restrict senders, STOP honoured | PM |
| R13 | Recorded-class add-on infrastructure cost exceeds revenue | Medium | Loss on the add-on | Provider cost metered per centre; add-on priced per viewer plus storage; auto-disable on overdue invoice | PM |
| R9 | Underpricing | Medium | Revenue | Costs tracked per centre monthly; plans revisited at 10 centres | PM |

## Assumptions
- Centres have smartphones with WhatsApp and at least intermittent data in the classroom.
- Monthly fees are the norm; per-session fees are out of MVP.
- One currency (INR) and one tax rule (GST on Tuition Ledger's invoice; no tax on the centre's fees in MVP).
- The pilot centre agrees to a parallel month with the register.

## Open questions (to close with the client in sprint 1)
1. Payment link fee: absorb or pass through? (default absorb)
2. Reminder tone and the exact Bengali wording for the three reminders.
3. Receipt prefix and whether numbers reset each financial year.
4. Does the centre want teachers to see dues of their batch's students? (default yes, amounts only)
5. Weekly digest day and time.

## Decision log

| Date | Decision | By | Note |
|---|---|---|---|
| 2026-10-23 | Web app first for staff; WhatsApp for parents only | client | PRD |
| 2026-10-23 | Cash, Razorpay links and manual UPI all in MVP | client | PRD |
| 2026-10-23 | First users: a coaching centre with multiple teachers (roles in MVP) | client | PRD |
| 2026-10-23 | No message broker in MVP | tech lead | ADR-0003 |
