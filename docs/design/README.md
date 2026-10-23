# Design: v2 static prototype

[prototype.html](prototype.html) is the reference for every frontend ticket. It is one self-contained file: open it in a browser, no build or server needed. Data lives in memory and resets on reload; nothing is sent anywhere.

## Opening it

| URL | Opens |
|---|---|
| `prototype.html` | Sign-in (WhatsApp code or email + password) |
| `prototype.html#signup` | Centre registration |
| `prototype.html?as=owner#dashboard` | Signed in as the owner (also `teacher`, `accountant`) |
| `prototype.html#platform` | Platform console |

Demo sign-in: WhatsApp numbers `98300 00001` (owner), `…02` (teacher), `…04` (accountant), code `123456`; or `dutta@brightminds.in` / `sumit@brightminds.in` with password `Tuition@2026`. The "Prototype controls" box (sidebar, or **Demo** on phones) switches role, opens a parent's WhatsApp to try keyword replies, registers a new centre, and resets the data. None of these controls ship.

## What changed from the first prototype

**Phone first.** Bottom tab bar on phones (Today · Classes · Students · Fees/Tests · More); attendance and marks open as full-screen tasks with a back button; tables turn into cards below 900 px; tap targets are at least 44 px.

**Daily flows.** Attendance: tap a name to mark absent, a separate Late button, live counts and Save in one sticky bar, undo after saving, owner-only correction history. Marks: Next on the keypad moves to the next student, progress shown, values checked as you type.

**Nothing irreversible on one tap.** Sending results, announcements, manual reminders, deactivating staff, changing roles, cancelling classes and deleting personal data all go through a confirmation that shows the recipients or the effect, often with a message preview.

**Payments.** Searchable student picker (no 118-item dropdown); received-on date for backdated cash; near-duplicate and duplicate-UTR warnings come back from the server, as `POST /payments` does; receipt sheet with allocations and the balance after; payment links are copied or shared, not sent silently.

**Settings.** Edits are held until Save, with an unsaved-changes bar and a guard when leaving; reminder days are toggles, not free text; all of 07 §2 is present, grouped into sections.

**Accessibility.** Text contrast meets WCAG AA in both themes (muted text about 5:1; button text on marigold about 8.5:1); dialogs take focus, trap Tab, close on Escape and return focus; reduced motion respected.

**Look.** Exercise-book palette: notebook-ink blue for navigation and brand, marigold for the main action, cream paper background, ruled lines and a margin line on the sign-in and registration panels. Status colours are kept apart from the brand: green = paid, orange = due, red = overdue. One font (Inter) with tabular numbers for money. The tokens at the top of the file become the S1-13c design tokens.

## Decisions it encodes (match the backend)

- **Enrolments:** a student can be in several batches; charges, attendance lists and the students list follow active enrolments (ENR-1).
- **Consent belongs to the parent's phone**, so siblings share it and get one message (STU-3, STU-4).
- **Permissions come from the 07 matrix**: teachers see balances only and record cash only for their own batches; accountants can read attendance but not mark it.
- **Message statuses** are shown as they are: delivered, held (no WhatsApp number yet), skipped (paid before send, no consent, opted out), failed.
- **Registration** (CEN-6, ADR-0018/0019): centre name and city → owner name, email, WhatsApp number and password → WhatsApp code. The receipt prefix is generated from the name and can be changed in Settings until the first receipt. The centre then lands on the onboarding checklist; parent messages are held until its own WhatsApp number is approved (CEN-7).
- **Sign-in** by WhatsApp code or email + password, with a lock after 5 wrong passwords, forgot/reset, and a "Sign-in methods" card in My account (CEN-8).
- **Defaults chosen** where the docs were silent: late counts as attended; paused students are left off attendance lists; accountants may pause students (07 already allows it). Change these in 02-srs.md if the client decides otherwise.
- **Removed:** "Remind everyone outstanding". Automatic reminders on the due day, +3 and +7 already do this without bypassing the schedule and quiet hours.

## Still to design

CSV import wizard (phase 2), monthly assessment and teacher comments (ASM-5..8, phase 2), Google Calendar connect (post-pilot), Bengali UI strings.
