# ADR-0006 Idempotency on every payment channel
**Context.** Payments arrive by cash entry (humans retry), Razorpay webhooks (providers redeliver) and manual UPI (the same UTR gets typed twice).
**Decision.** One `PaymentService.record` with a mandatory idempotency key: client UUID for cash (generated when the form opens) plus a near-duplicate check requiring explicit confirmation; provider payment ID for Razorpay; UTR for manual UPI. Keys are unique per centre; a replay returns the original receipt with `Idempotent-Replay: true`. Webhook bodies are stored by provider event ID before processing.
**Consequences.** Double entry is structurally impossible rather than discouraged; the count of idempotent hits becomes a product metric. Cost: the SPA must manage the key per form instance.
**Alternatives.** Trusting UI disabling of the button: fails on retries and multiple devices.
