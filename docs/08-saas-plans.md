# 08 — SaaS plans, limits and billing

Pricing is set so that the smallest tutor can start free and a 100-student centre pays less than one student's monthly fee.

## 1. Plans

| | Free | Starter | Standard |
|---|---|---|---|
| Price per month | ₹0 | ₹199 | ₹499 |
| Included active students | 30 | 100 | 300 |
| Overage per active student | not allowed (upgrade) | ₹2 | ₹1.50 |
| Staff users | 1 (owner) | 5 | unlimited |
| WhatsApp messages per month | 150 | 1,000 | 4,000 (then ₹0.25 each) |
| Payment links (Razorpay) | — | ✓ | ✓ |
| CSV import | — | ✓ | ✓ |
| Weekly digests | — | ✓ | ✓ |
| Calendar feeds (iCal) + teacher nudges | ✓ | ✓ | ✓ |
| Google Calendar sync and conflict checks | — | — | ✓ |
| Languages | English | English, Bengali, Hindi | all |
| Exports | students, attendance | all | all |
| Audit log retention | 90 days | 1 year | 7 years |
| Tests, marks and result messages | ✓ (counts against cap) | ✓ | ✓ |
| Monthly assessment messages | — | ✓ | ✓ |
| Progress trends on student page | — | ✓ | ✓ |
| Announcements | ✓ (counts against cap) | ✓ | ✓ |
| Homework and material storage (phase 2) | — | 2 GB | 10 GB |
| Admissions pipeline (phase 2) | — | ✓ | ✓ |
| Expenses and profit view (phase 2) | — | ✓ | ✓ |
| Accountant exports (phase 2) | — | — | ✓ |
| Multi-branch (phase 3) | — | — | ✓ (+₹199 per extra branch) |
| Recorded class library (phase 4 add-on) | — | add-on | add-on |
| Support | WhatsApp, 2 business days | WhatsApp, 1 business day | WhatsApp + call, same day |

Active student = status active or paused on any day of the month (left students are not counted). Bright Minds (118 students, 3 staff) is on Starter: ₹199 + 18 × ₹2 = ₹235 per month.

## 2. Limits are enforced, not just displayed

| Limit | Where enforced | What the user sees |
|---|---|---|
| Student count | `StudentService.add`, `import` | 402 with "Starter includes 100 students; you have 100 active. Upgrade or mark students as left." |
| Staff count | `UserService.invite` | same pattern |
| Messages | `PreSendChecks` in the relay | at 90%: owner warned by in-app banner and WhatsApp; at 100%: reminders and digests skipped and logged, receipts still sent |
| Features | `PlanGuard.check(Feature)` in the service | 402 with upgrade link; the UI hides the button and shows a lock with the plan name |

Downgrade is refused while current usage exceeds the target plan's included students or staff.

## 3. Metering and invoicing Tuition Ledger's own customers

- On the 1st at 02:00 a job writes `usage(centre, period, activeStudents, messagesSent, payments)` for the previous month.
- Invoice = plan price + overage × (activeStudents − included) + message overage; GST 18% added; minimum ₹0.
- Collection: Razorpay Subscriptions for the fixed part with the overage added as an add-on, or a payment link for centres that prefer manual payment. The platform's own invoices are stored in `platform_invoices` and are immutable; corrections are credit notes.
- Grace: unpaid 7 days after the 1st → reminder to owner; 14 days → read-only mode (reads and exports work, writes return 402 with a pay link); 60 days → suspended (no access, data retained 90 more days); then deletion unless the owner asks for an export.

## 4. Why these prices

- Cost per centre at Starter scale is about ₹100/month (₹85 WhatsApp + share of hosting), so Starter is positive from the first centre.
- A centre recovering one missed fee a month pays for the year.
- Free tier exists for the single tutor with 20 students; it is the referral engine, not the revenue.

## 5. Trials and promotions

- New centres start on Starter features free for 30 days; at day 30 they choose a plan or drop to Free (if under the limits) or read-only.
- A referral from an existing centre gives both a free month on Starter.

## 6. Add-on pricing (phase 4, indicative)

| Add-on | Centre pays Tuition Ledger | Centre charges students | Notes |
|---|---|---|---|
| Recorded class library | ₹20 per active viewer per month + ₹8 per GB stored | centre's choice, suggested ₹49–99 per student per month | provider cost tracked per centre; add-on disabled automatically if the centre's platform invoice is 30 days overdue |
| Extra branch | ₹199 per branch per month | — | Standard plan only |
| Extra messages | ₹0.25 per message above cap | — | all plans |
