# Tuition Ledger — frontend

React 18 + TypeScript + Vite ([ADR-0014](../docs/adr/0014-frontend.md)). Every screen from the [v2 design](../docs/design/README.md) is built here and runs on **in-memory demo data**, so the whole app works before the backend exists.

```bash
nvm use                     # Node 22 from .nvmrc
npm install
npm run dev                 # http://localhost:5173
npm test                    # Vitest
npm run lint && npm run format:check && npm run build
```

Demo sign-in: WhatsApp `98300 00001` (owner), `…02` (teacher), `…04` (accountant) with code `123456`, or `dutta@brightminds.in` / `Tuition@2026`. Add `?as=owner`, `?as=teacher` or `?as=accountant` to any URL to open signed in. The "Prototype controls" box switches role, opens a parent's WhatsApp to try keyword replies, registers a new centre and resets the data.

## Layout

```
src/
├── app/            routes, AppShell (sidebar, phone top bar + bottom tabs), providers
├── features/       one folder per area: auth, dashboard, classes, students, fees, tests,
│                   announce, reports, settings, account, platform, sheets (dialogs), parent (demo drawer)
├── shared/
│   ├── lib/        format.ts (money in paise, dates, validation)
│   └── ui/         kit (Field, Pill, Kpi, Tabs…), overlay (Sheet, toast, confirm), Icon, pills
└── mock/           in-memory backend: types, seed (Bright Minds), domain rules, auth, store
```

## Moving to the real API

`src/mock/` stands in for the backend. Its types follow `docs/api/openapi.yaml` and each mutation in `domain.ts` names the endpoint it mirrors. When an endpoint ships, replace the matching `mock/` call with the generated client (S1-13b) and TanStack Query; screens keep their props and markup. The mock clock is fixed at 23 Oct 2026 (`TODAY` in `shared/lib/format.ts`).
