# 02 — Software Requirements Specification

Each requirement has an ID, a priority (M = must for MVP, S = should, C = could), acceptance criteria written as checks a tester can run, and the guarantee from the PRD it serves. A ticket is done only when its requirement's acceptance criteria pass.

## 1. Tenancy, users and access

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| CEN-1 | M | A centre has name, address, timezone (default Asia/Kolkata), fee due day (1–28), quiet hours (default 20:00–08:00), receipt prefix (2–4 uppercase letters), WhatsApp sender, payment account | Verify that creating a centre without a receipt prefix is rejected with a field error; verify that the timezone is applied when computing the fee month (a centre in Asia/Dubai runs its fee job at 00:10 Dubai time) |
| CEN-2 | M | Users log in with whatsaap phone + otp; a user belongs to exactly one centre; OTPs expire in 5 minutes and allow 3 attempts | Verify that a 4th wrong OTP invalidates the challenge; verify that an OTP used once cannot be reused |
| CEN-3 | M | Roles OWNER, TEACHER, ACCOUNTANT; permissions per the matrix in 07; enforced in services, not only in the UI | Verify that a TEACHER calling POST /charges receives 403; verify that a TEACHER can mark attendance only for batches assigned to them |
| CEN-4 | M | The owner can invite, change the role of, and deactivate users; deactivation revokes sessions within 60 seconds | Verify that a deactivated user's next API call returns 401 |
| CEN-5 | S | An owner can belong to more than one centre and switch (second centre is a separate subscription) | Verify that switching changes every subsequent query's centre scope |

## 2. Batches, sessions, enrolments

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| BAT-1 | M | Batch: name, subject, class, teacher, weekly schedule (days + start/end), monthly fee, capacity, status | Verify that a batch with end time before start time is rejected |
| BAT-2 | M | Sessions generated 30 days ahead from the schedule; centre holidays skipped; regeneration never duplicates | Verify that running generation twice yields the same session count; verify that adding a holiday removes future sessions on that date that have no attendance |
| BAT-3 | M | Teacher can add an extra session or cancel one (with reason) | Verify that a cancelled session is excluded from attendance digests |
| ENR-1 | M | Enrolment has from-date and optional to-date; a student can be in several batches; no overlapping enrolments in the same batch | Verify that enrolling a student twice in one batch with overlapping dates is rejected |
| ENR-2 | M | Capacity is checked on enrolment; owner can override with a reason | Verify the override is recorded in the audit log |

## 3. Students and parents

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| STU-1 | M | Student: name, class, parent name, parent WhatsApp number (E.164, validated), joined-on, discount % (0–100), status (active, paused, left) | Verify that a number without country code is rejected with a hint |
| STU-2 | M | Status changes are dated and produce fee adjustments through the fee engine | Verify that pausing on the 16th of a 30-day month produces an adjustment of −15/30 of the fee for that month |
| STU-3 | M | Consent: an opt-in message is sent when a parent number is added; no reminder goes out before consent is recorded (YES reply or owner marks verbal consent with timestamp) | Verify that a student without consent appears in the "awaiting consent" list and receives no reminder |
| STU-4 | M | Sibling detection by identical parent number; sibling discount optional per centre | Verify two students with the same parent number appear grouped on the parent's page |
| STU-5 | S | Bulk import of students from CSV with a preview and row-level errors | Verify that an import with one bad row imports none and reports the row |
| STU-6 | M | Personal data deletion on request replaces name, parent name and phone with placeholders; ledger and receipts remain | Verify that after deletion the student still appears in September's statement with the placeholder |

## 4. Attendance

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| ATT-1 | M | Teacher marks a session: default present, toggle absent/late; saved per student with marker and time | Verify that saving stores one row per enrolled student |
| ATT-2 | M | Edits within 7 days supersede earlier rows; history visible to owner | Verify that a second save keeps the first rows with superseded_by set |
| ATT-3 | M | Parent reply ATTENDANCE returns the current month per child | Verify the reply within 30 seconds and that it lists absent dates |
| ATT-4 | S | Attendance below a threshold (default 75% over 30 days) is flagged to the owner | Verify the flag appears on the dashboard the morning after the threshold is crossed |

## 5. Fees and charges

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| FEE-1 | M | On day 1 at 00:10 centre time the fee job creates one monthly charge per active enrolment for that month | Verify that a centre with 118 active enrolments has 118 monthly charges for the period after the job |
| FEE-2 | M | Pro-ration by calendar day: fee × active days ÷ days in month, discount applied after, one HALF_EVEN rounding to the rupee | Verify: fee ₹1,200, joined 19 Sept (30-day month) → 12/30 × 1200 = ₹480.00; with 10% discount → ₹432.00 |
| FEE-3 | M | Re-running the fee job for the same month creates no duplicate | Verify by running twice and counting |
| FEE-4 | M | One-off charges with description and optional due date | Verify they appear in the ledger and reminders |
| FEE-5 | M | Every charge stores its computation inputs | Verify the student page can show "₹1,200 × 12/30 − 10% = ₹432" |
| FEE-6 | S | Fee plan changes on a batch apply from the next month; current month charges are untouched | Verify that changing the fee on the 10th does not alter the 1st's charges |

## 6. Payments and ledger

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| PAY-1 | M | Cash payment: student, amount, date, recorded-by; near-duplicate (same student, amount, date) requires explicit confirmation; idempotency key derived from those plus a client-generated UUID | Verify that retrying the same request with the same UUID returns the same receipt and creates one payment |
| PAY-2 | M | Razorpay payment link per student balance or per charge; webhook `payment_link.paid` records the payment; duplicate webhook is a no-op | Verify by replaying a webhook body: one payment, same receipt number |
| PAY-3 | M | Manual UPI entry with UTR; UTR unique per centre | Verify a repeated UTR is rejected and the original receipt is shown |
| PAY-4 | M | Allocation oldest-charge-first; accountant can reallocate; overpayment remains as credit and is auto-applied next month | Verify the student balance after a ₹2,000 payment against a ₹1,200 charge is −₹800 (credit) |
| PAY-5 | M | Refunds and adjustments require a reason; they add lines, never edit | Verify that the original payment row is unchanged after a refund |
| LED-1 | M | Student ledger: all lines in order with running balance; monthly subtotals | Verify running balance equals the sum of lines at every row |
| LED-2 | M | Receipt numbers gap-free per centre, assigned inside the payment transaction | Verify with 50 concurrent payments that numbers are 1..50 with no gaps or duplicates |
| LED-3 | M | Monthly statement: opening dues + charges − payments ± adjustments = closing dues | Verify the equation holds for a month with every kind of line |
| LED-4 | S | Payment reversal when Razorpay reports a refund or chargeback | Verify a reversing line with reference to the original |

## 7. Messaging

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| MSG-1 | M | Reminders on due day, +3, +7 per unpaid charge; generated from the live balance at send time; one per charge per slot | Verify that paying before the slot results in a "skipped" record and no message |
| MSG-2 | M | Receipt message within 60 seconds of a payment record | Verify timing in the message log |
| MSG-3 | S | Weekly attendance digest Sunday 10:00 centre time; owner can disable | Verify no digest when disabled |
| MSG-4 | M | Outbox with retries (5, exponential backoff from 1 min), provider message ID and delivery status stored | Verify that killing the relay mid-batch and restarting sends each pending row exactly once |
| MSG-5 | M | Quiet hours honoured; messages due inside quiet hours are sent at the end of quiet hours | Verify a reminder due at 22:00 is sent at 08:00 |
| MSG-6 | M | Inbound keywords DUES, ATTENDANCE, RECEIPT, HELP, STOP, YES; anything else forwarded to the owner | Verify each keyword's reply content |
| MSG-7 | M | STOP opts out of reminders and digests, not receipts; owner notified | Verify no reminder after STOP and that a receipt still arrives |
| MSG-8 | M | One message per parent covering all their children for reminders and digests | Verify a parent with two children receives one reminder listing both |
| MSG-9 | M | Monthly message cap per plan; when 90% is reached the owner is warned; at 100% only receipts are sent | Verify behaviour at the cap |

## 7b. Calendar and teacher nudges

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| CAL-1 | M | Each staff user has a private iCal feed URL (signed token, revocable) containing their sessions for the next 60 days; the owner's feed contains all batches | Verify that subscribing in Google Calendar shows the sessions with the batch name and room; verify that revoking the token makes the URL return 404 |
| CAL-2 | M | Each calendar event's description contains a deep link that opens that session's attendance screen (login if needed) | Verify that tapping the link on a phone lands on the marking screen for that session |
| CAL-3 | M | Teacher nudge: WhatsApp message 10 minutes before each session (configurable 0–60) with the same deep link; off by default for owners who also teach, on for teachers | Verify that cancelling a session cancels its nudge; verify no nudge for a session already marked |
| CAL-4 | S | Owner setting: calendar feeds on/off, nudge lead time, whether feeds include student counts | Verify the setting change updates the feed on next refresh |
| CAL-5 | C (post-pilot, Standard plan) | Google Calendar two-way sync via OAuth: sessions pushed as events; free/busy read to warn about teacher conflicts when creating batches or extra sessions and to suggest a free teacher for substitution | Verify a conflict warning appears when a new batch overlaps a busy slot; verify a session change updates the Google event within 5 minutes |

## 7c. Tests, marks and monthly assessment

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| ASM-1 | M | A teacher creates a test for a batch: name, date, max marks, optional topic; tests are listed per batch | Verify that a test with max marks ≤ 0 is rejected; verify a TEACHER can create tests only for own batches |
| ASM-2 | M | Marks entry per student: numeric (0–max, decimals allowed) or Absent; saved with entered-by and time; edits within 14 days supersede earlier values (history kept) | Verify a value above max is rejected; verify a second save keeps the first row with superseded_by set |
| ASM-3 | M | "Send results to parents": one message per child to the consenting parent with test name, marks out of max and (if the owner enables it) the batch average; never a rank; never to opted-out parents; absent students get an "absent for test" message only if enabled | Verify a parent with two children receives two messages; verify no message to an opted-out parent; verify the average is omitted when the setting is off |
| ASM-4 | M | Results are sent once per test by default; a resend requires owner confirmation and is logged; corrected marks after sending produce a "corrected result" message to that parent only | Verify the second send without confirmation returns 409; verify a correction message reaches one parent |
| ASM-5 | S | Monthly assessment per student on a day the owner chooses (default last day): attendance % for the month, each test's marks, teacher comment (≤ 200 characters, optional), one message per child | Verify content matches the template snapshot; verify a student with no tests still receives attendance and comment |
| ASM-6 | S | Teacher comment entry per batch per month with a 200-character limit and a banned-words check; the owner reviews before sending when the setting requires it | Verify a 201-character comment is rejected; verify the owner can edit or clear a comment before send |
| ASM-7 | S | Parent keyword RESULTS returns the child's last three results and the latest monthly assessment | Verify the reply content |
| ASM-8 | C | Progress trend: marks as % across tests on the student page and a trend sentence in the assessment | Verify the sentence for rising, falling and insufficient data |

Marks are classified Personal (minor) in 11-security-privacy.md; the platform console never shows them; export is owner-only.

## 7d. Announcements, rescheduling, receipt PDF

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| ANN-1 | M | Owner or teacher sends a batch announcement (≤ 300 characters) to all consenting parents of a batch, one message per parent, through the outbox; logged per student | Verify a parent with two children in different batches gets one message per batch; verify an opted-out parent is skipped |
| ANN-2 | M | Cancelling or rescheduling a session automatically sends an announcement to the batch and to the teacher; the owner can disable auto-announcements | Verify the message names the old and new time |
| ANN-3 | S | Announcements to all batches at once (holiday notice) with a preview of recipient count | Verify the count equals consenting parents excluding opt-outs |
| SCH-1 | M | A session can be rescheduled (new date/time, reason); attendance, nudges and calendar feeds follow the new time; the original time is kept in history | Verify the iCal feed shows the new time within 10 minutes; verify the nudge fires at the new time |
| RCP-1 | M | Every receipt message includes a link to a PDF receipt (centre name, receipt number, student, amount, method, date, remaining balance); the link is signed and valid for 90 days | Verify the PDF totals equal the ledger; verify an expired link returns a page offering to request a fresh one |

## 7e. Phase 2 requirements (post-pilot; summary level, detailed before sprint 6)

| ID | Pri | Requirement |
|---|---|---|
| ADM-1 | C | Enquiry record: name, phone, class, source, interested batch, status (new, demo scheduled, follow-up, joined, lost) |
| ADM-2 | C | Demo class scheduling adds the prospect to a session's attendance list as "demo" |
| ADM-3 | C | Follow-up reminders to the owner over WhatsApp when a follow-up is due; two missed follow-ups flag the enquiry |
| ADM-4 | C | "Convert to student" pre-fills the student form; conversion rate per source on the dashboard |
| HWK-1 | C | Teacher attaches homework text and up to 3 files (PDF/image, 10 MB each) to a session; parents get a message with the text and signed links |
| HWK-2 | C | Study material per batch (files) with a MATERIAL keyword returning the last 5 links; storage counted against the plan |
| LVE-1 | C | Parent replies LEAVE <from> <to>; the teacher sees it on the session screen; absence in that range is marked "informed" |
| LVE-2 | C | Informed absences are shown separately in digests and assessments |
| EXP-1 | C | Owner records expenses with category, amount, date, note; recurring expenses (rent) auto-created monthly |
| EXP-2 | C | Teacher payouts recorded as expenses linked to the teacher |
| EXP-3 | C | Monthly profit view: collections − expenses, by month, exportable |
| ACC-1 | C | Tally XML export of monthly receipts and expenses; Zoho Books CSV |
| ACC-2 | C | Year-end statement per student (for parents' reimbursement claims) and per centre |
| BNK-1 | C | Bank statement CSV import with suggested matches to UTR/amount/date; accountant confirms |
| PAYR-1 | C | Teacher payroll share by batch percentage or per student; monthly statement per teacher |

## 7f. Phase 3 and 4 requirements (summary level)

| ID | Pri | Requirement |
|---|---|---|
| QR-1 | C | Per-student QR (printed card or WhatsApp image); scanning at a centre device marks present for the session in progress; teacher confirms exceptions |
| QR-2 | C | Anti-misuse: a scan outside session time or by another batch's student is rejected and logged |
| PTM-1 | C | Teacher publishes meeting slots; parents receive a message and reply with a slot number; confirmations and reminders sent |
| PTM-2 | C | Teacher's PTM schedule in the calendar feed |
| MB-1 | C | A centre can have branches; staff belong to a branch or all; students and batches belong to a branch |
| MB-2 | C | Owner reports consolidated or per branch; receipt prefixes per branch |
| MB-3 | C | One subscription covers all branches; limits counted across branches |
| REF-1 | C | Referral code per parent; referee and referrer discounts applied as adjustments when the referee's first payment clears |
| I18N-1 | C | Staff UI in Bengali and Hindi; language per user |
| I18N-2 | C | Per-parent message language; templates selected per recipient |
| I18N-3 | C | PDFs and the student portal in all supported languages |
| VID-1 | C | Owner enables the Recordings add-on per batch and sets the student price per month |
| VID-2 | C | Teacher uploads a recording against a session (file or unlisted link); provider transcodes; status visible |
| VID-3 | C | Fee engine creates a monthly "Recordings" charge for enrolled students in enabled batches; existing reminders and receipts apply |
| VID-4 | C | Student portal (phone + OTP, student or parent number) lists entitled recordings; entitlement = paid charge for the month or owner grant |
| VID-5 | C | Playback through short-lived signed URLs, name watermark, no download; concurrent-session limit of 2 per student |
| VID-6 | C | Owner analytics: views per recording, per student watch time (minutes, not per-second tracking) |
| VID-7 | C | Platform billing: per active viewer per month plus storage GB; shown on the centre's plan page |

## 8. Reports and dashboard

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| RPT-1 | M | Dashboard: due this month, collected, outstanding, collection rate, attendance rate per batch, today's sessions, awaiting consent | Verify every figure against SQL on seed data |
| RPT-2 | M | Outstanding list with days overdue and a rate-limited "send reminder now" | Verify a second "send now" within 24 h is refused with a message |
| RPT-3 | M | CSV export of ledger, payments, attendance for a date range | Verify the CSV opens in Excel with correct columns |
| RPT-4 | S | Teacher view: own batches' attendance rates and dues | Verify it excludes other teachers' batches |

## 9. Platform (Tuition Ledger operator)

| ID | Pri | Requirement | Acceptance criteria |
|---|---|---|---|
| PLT-1 | M | Platform console: create centre, suspend, reactivate, change plan, see usage and health; never shows student names | Verify the console API returns counts only |
| PLT-2 | M | Metering: active students per centre per month, messages sent, payments count | Verify the monthly usage row |
| PLT-3 | M | Billing: plan price + overage, invoice on the 1st, Razorpay subscription or link, 7-day grace, then read-only | Verify read-only mode blocks writes with a clear message |
| PLT-4 | S | Centre self-serve plan upgrade and downgrade from the owner's settings | Verify downgrade is refused while over the lower plan's limits |

## 10. Non-functional requirements

| ID | Requirement | How verified |
|---|---|---|
| NFR-1 | API p95 under 300 ms for reads, 600 ms for writes, at 300 centres | k6 run in sprint 5 |
| NFR-2 | Fee job for 300 centres × 150 students completes in under 10 minutes | timed in CI nightly |
| NFR-3 | Availability target 99.5% monthly; planned maintenance outside 07:00–21:00 IST | Uptime Kuma |
| NFR-4 | RPO 24 hours (nightly backup), RTO 2 hours; restore rehearsed monthly | runbook log |
| NFR-5 | Every write carries the acting user; every settings change is in the audit log | audit tests |
| NFR-6 | Web app usable on a 360 px phone; attendance marking under 60 seconds for 40 students | usability check with the pilot |
| NFR-7 | All money in paise as integers; no floating point in money code paths | ArchUnit rule |
| NFR-8 | Tenant isolation: every entity scoped by centre_id and covered by the isolation test | ArchUnit + integration test |
