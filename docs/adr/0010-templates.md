# ADR-0010 WhatsApp templates versioned in the database, English first
**Context.** WhatsApp business messages outside a 24-hour window must use pre-approved templates; approval takes days; centres will want Bengali and Hindi.
**Decision.** `message_templates(key, language, provider_template_name, version, variables)`; rendering is a pure function with snapshot tests; language is a centre setting; new languages are rows plus provider approval, not code. English in MVP; Bengali added in week 7 if the pilot asks.
**Consequences.** Copy changes are reviewable and reversible; a rejected template never blocks a deploy. The parent's language is the centre's language in MVP (per-parent language is a later setting).
**Alternatives.** Free-text messages: blocked by WhatsApp policy outside the window.
