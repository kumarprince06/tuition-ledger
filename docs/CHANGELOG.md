# Documentation changelog

Apply these in order if you maintain a hand-edited copy.

## 2026-10-23 (c) — announcements, rescheduling, PDF receipts, phase 2–4 roadmap, recordings add-on, multilingual
- NEW `15-roadmap.md`: phases 1–4 with exit criteria, items, SRS IDs and sizes; recordings add-on design; multilingual scope; permanent exclusions.
- NEW `adr/0017-recordings-addon.md`; row added to `adr/README.md`.
- `02-srs.md`: new sections 7d (ANN-1..3, SCH-1, RCP-1), 7e (phase 2: ADM, HWK, LVE, EXP, ACC, BNK, PAYR), 7f (phase 3–4: QR, PTM, MB, REF, I18N, VID).
- `01-prd.md` §3: MVP scope line extended; "deliberately out" reworded to "out of the MVP" with pointer to the roadmap.
- `09-sprint-plan.md`: S3-16/17 announcements; S4-17/18/19 reschedule, receipt PDF, FE; sprint totals updated; sprint 6–7 backlog extended (S6-09/10 moved items, S7-01..09).
- `08-saas-plans.md`: plan rows for announcements, storage, admissions, expenses, exports, multi-branch, recordings; new §6 add-on pricing.
- `07-tenant-admin.md`: permissions ANNOUNCE, SESSION_RESCHEDULE; settings for auto-announce, announcement senders, receipt PDF, recordings add-on.
- `05-data-model.md`: tables announcements, session_changes, receipt_documents; outline of phase 2–4 tables.
- `06-api.md`: POST /announcements, POST /sessions/{id}/reschedule, GET /receipts/{token}.pdf.
- `11-security-privacy.md`: data class row for files and recordings.
- `14-risks.md`: R12 announcement spam, R13 add-on cost.
- `03-system-design.md` §7: teacher nudge job row.
- `README.md`: index row for 15.

## 2026-10-23 (b) — tests, marks, results and monthly assessment
- `02-srs.md` 7c (ASM-1..8); `adr/0016-assessments.md`; `05` tests/marks/monthly_assessments; `06` endpoints; `07` permissions and settings; `08` plan rows; `09` S5-15..18, S6-06..08, S5-05 and S5-07 moved to sprint 6; `11` data class; `14` R11; `01` §5 message examples and opt-in wording.

## 2026-10-23 (a) — calendar feeds, teacher nudges, Google sync
- `02-srs.md` 7b (CAL-1..5); `adr/0015-calendar.md`; `05` calendar_feeds, calendar_links; `06` feed endpoints; `07` settings; `08` plan rows; `09` S4-14..16, S5-14, S6-01..03; `14` R10; `03` scheduling row.
