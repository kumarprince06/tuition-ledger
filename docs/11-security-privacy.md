# 11 — Security and privacy

## 1. Threat model (what we defend against)

| Threat | Control |
|---|---|
| Staff of centre A reads centre B's data | Hibernate filter + RLS + isolation tests (ADR-0002); app runs as `tl_app`, which owns no table, so RLS always applies; no tenant context → no rows; TenantMismatch → 404 |
| A person who works at two centres carries data or rights from one to the other | One access token = one centre and that membership's role; switching issues a new token; each centre sees only its own memberships (ADR-0020) |
| Global `users` table read outside tenancy lists staff of every centre | `users` holds identity only (no student or money data); Modulith test forbids access outside the tenancy module; centre screens read staff through `memberships` |
| Platform admin account takeover | Platform admins are a separate grant reaching only `/platform/*`; console shows counts only; MFA or company SSO for admins before launch |
| Forged webhook for another centre | Razorpay webhooks per centre at `/webhooks/razorpay/{centreId}`, verified with that centre's secret; `notes.centre_id` must match (ADR-0021) |
| Centre's Razorpay secret leaks | AES-GCM encryption, key outside the database; write-only in the API, shown masked; never logged; owner-only, audited; Partner OAuth replaces pasted keys when approved |
| Teacher escalates to money actions | Permission matrix enforced in services; teacher scoping predicate |
| Stolen phone with an active session | Owner deactivates user → refresh dies now, access within 15 min |
| OTP brute force | 3 attempts per challenge, 5 sends per hour per phone, Redis-backed |
| Password guessing and credential stuffing | Argon2id hashes; common/breached password list at registration and change; 5 failures per account in 15 min lock password sign-in and notify on WhatsApp; per-IP rate limit on /auth/login; one error message for wrong email or password |
| Password reset abuse | /auth/password/forgot always answers 202; single-use reset tokens stored hashed, 30-minute expiry; reset and change revoke every session |
| Shared staff passwords | Each person has their own account; owners see last sign-in per user and can deactivate; WhatsApp-code sign-in stays available so nobody needs to share |
| Forged webhook creates a payment | Signature verification (Meta, Razorpay); event store by provider ID; amounts taken from the provider payload, never the client |
| Replayed webhook double-credits | Unique (provider, event_id) + payment idempotency |
| Message spam to parents | Consent required; STOP honoured; per-plan caps; one send-now per parent per day |
| Secret leakage | Env-only secrets, pre-commit secret scan, separate keys per environment |
| Dependency vulnerabilities | Dependabot + OWASP dependency check in CI; patch within 7 days for high |
| SQL injection | JPA parameters; native queries allow-listed and reviewed |
| XSS in SPA | React escaping; CSP headers from Caddy; no dangerouslySetInnerHTML |
| CSRF on refresh | SameSite=Strict cookie, origin check, rotation |
| Enumeration of IDs | ULIDs, tenant scoping; list endpoints never accept a centre parameter |

## 2. Data classification

| Data | Class | Handling |
|---|---|---|
| Parent phone, names | Personal | encrypted at rest (disk), masked in logs (`+91*****1234`), deletable on request |
| Student name, class, attendance | Personal (minor) | same; no photos or free-text notes in MVP |
| Money records | Financial | append-only; retained per 05 retention |
| Message contents | Personal | 180-day retention then archived |
| Test marks, teacher comments | Personal (minor), sensitive | one child per message, no ranks, never in group posts, append-only history, owner-only export, excluded from the platform console and from logs |
| Homework files, recordings (phase 2–4) | Personal (minor), copyrighted | signed short-lived links; watermark on video; storage per centre; deleted with the centre |
| Secrets, tokens | Secret | env vars, hashed refresh tokens, never logged |
| Centre payment credentials (Razorpay key secret, webhook secret, OAuth tokens) | Secret | AES-GCM in `centre_payment_accounts`, encryption key in env; never returned or logged; deleted when the centre disconnects or is deleted. Tuition Ledger never holds parent money or bank details |

## 3. Privacy commitments (reflected in the notice shown to parents and owners)

- We message a parent only after consent and stop on request.
- We store what the centre needs to run fees and attendance, nothing more.
- A parent or centre can ask for personal data deletion; money records remain as the centre's accounting record with the person's identifiers replaced.
- Data is stored in India (VPS region ap-south) and not sold or shared beyond the providers needed to send messages and take payments.
- The owner can export everything at any time.

## 4. Operational security

- Caddy terminates TLS with automatic certificates; HSTS on.
- SSH keys only; fail2ban; unattended security updates on the host.
- Database reachable only from the app container network; backups encrypted at rest in object storage.
- Admin (platform) access requires a separate account and is audited; no shared logins.
- Incident response: see 12 §5.
