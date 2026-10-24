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
| R14 | Self-registered centres stall at "connect WhatsApp" (Meta business verification takes days or fails) | High | Trials that never message a parent, churn | Checklist step with status and help; everything else usable meanwhile; held messages released on approval; platform console flags centres stuck in `pending` for 5 days | PM |
| R15 | Fake or abusive registrations consume OTP and WhatsApp costs | Medium | Cost, noise in the console | OTP before any row is created; 3 registrations per phone and per IP per day; console flags centres with no activity after 7 days | Tech lead |
| R16 | Verification and reset emails land in spam or never arrive | Medium | Owners can't verify email or reset a password | Transactional email provider with SPF/DKIM/DMARC on our domain; WhatsApp code always works as a fallback for sign-in and reset | Tech lead |
| R17 | A centre's Razorpay secret leaks (pasted into support chat, logged, or read from a database dump) | Low | Attacker can create links or refunds on that centre's account | AES-GCM encryption with the key outside the database; secrets write-only in the API and never logged; owner-only and audited; move to Razorpay Partner OAuth when approved (ADR-0021) | Tech lead |
| R18 | Razorpay Partner (OAuth) approval takes months or is refused | Medium | Owners keep pasting keys | Pasted keys work meanwhile; setup guide with screenshots in Settings | PM |
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
| 2026-10-24 | A person is one global user; their role at each centre is a membership; platform admins are a grant on a user | tech lead | ADR-0020 |
| 2026-10-24 | Tenant isolation and provisioning are built before authentication; root and platform tables have no RLS; two database roles | tech lead | ADR-0002 |
| 2026-10-24 | Trial end date lives on `subscriptions`; statuses trialing, active, past_due, read_only, suspended, cancelled | tech lead | 05 |
| 2026-10-24 | Parent fees go only to the centre's own accounts (cash, UPI ID, own Razorpay); never through Tuition Ledger; Razorpay keys pasted first, Partner OAuth later | client | ADR-0021 |
