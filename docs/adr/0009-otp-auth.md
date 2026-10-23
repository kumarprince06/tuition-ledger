# ADR-0009 Phone + OTP authentication with short JWT and rotated refresh
**Status.** Partly superseded by ADR-0019: email + password is now a second sign-in method; everything else here still applies.
**Context.** Users are owners and teachers on phones; passwords get shared among staff; email is rare.
**Decision.** OTP over WhatsApp (SMS fallback via provider) with rate limits; access JWT 15 minutes carrying centre and role and a token version; refresh token 30 days, opaque, httpOnly cookie, rotated on every use and stored hashed. Role change or deactivation bumps the version.
**Consequences.** No password reset flows; a lost phone is handled by the owner deactivating the user. Revocation within 15 minutes at worst, immediately for refresh.
**Alternatives.** Email + password: friction and shared credentials. Long-lived JWT: no revocation.
