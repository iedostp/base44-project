---
description: Base44 SDK usage, entities, serverless Deno functions, data fetching patterns
---

# Base44 Patterns

## Data Fetching
- ALWAYS use Base44 SDK entities — never raw `fetch()` to backend
- All entities defined in `src/api/entities.js`
- TanStack Query wraps all entity calls — use `useQuery` / `useMutation`
- Invalidate queries after mutations: `queryClient.invalidateQueries(['entityName'])`

## SDK Setup
- Client initialized in `src/api/base44Client.js`
- Import entities: `import { EntityName } from '@/api/entities'`
- Never import base44Client directly in components

## Serverless Functions (Deno)
- Located in `functions/` — TypeScript only
- Import dependencies from CDN: `import x from 'https://deno.land/x/...'`
- No npm packages — Deno CDN only
- Return format: `{ data: ..., error: null }` or `{ data: null, error: '...' }`
- Run locally: `npm run preview` includes function emulation

## Integrations
- External integrations in `src/api/integrations.js`
- Always handle loading + error states in UI
