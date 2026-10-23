# ADR-0014 React SPA with generated client, mobile-first
**Context.** Teachers mark attendance on phones in a classroom; owners use laptops for setup and phones for everything else.
**Decision.** React 18 + TypeScript + Vite single-page app; TanStack Query for server state; API client generated from `openapi.yaml` in CI so drift fails the build; design tokens with one accent and semantic colours for paid/due/overdue; the three daily flows (attendance, cash entry, dashboard) designed at 360 px first. Served by Caddy from the same VPS.
**Consequences.** One frontend for all staff roles with role-based routes; no app-store dependency; offline is out of scope for MVP (attendance needs connectivity, acceptable for the pilot).
**Alternatives.** Server-rendered Thymeleaf: faster to start, worse on phones. Native apps: out of reach in ten weeks.
