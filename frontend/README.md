# Tuition Ledger — frontend

React 18 + TypeScript + Vite ([ADR-0014](../docs/adr/0014-frontend.md)).

```bash
nvm use                   # Node 22 from .nvmrc
npm install
cp .env.example .env.local  # set API_PROXY_TARGET to the backend port
npm run dev               # http://localhost:5173
npm test                  # Vitest
npm run lint && npm run format:check && npm run build
```

Layout: `src/app` (entry, providers, routes), `src/features/<feature>` (one folder per feature: pages, hooks, API calls), `src/shared` (UI components, utilities, generated API client from S1-13b).
