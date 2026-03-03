---
Project: "תיב מינוב" — Hebrew-first RTL construction management PWA on Base44

## Working Directory
Always `cd ~/base44-migration` at the start of each session.

## Commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TS check |
| `npm run lint` | Lint |
| `npm run preview` | Preview build |

## 🔴 After EVERY code change
Run `npm run typecheck` — fix ALL errors before continuing.
Never leave TypeScript errors unfixed.

## Key Files
- Backend SDK: `src/api/base44Client.js`
- Entities: `src/api/entities.js`
- Integrations: `src/api/integrations.js`
- Routes: `src/pages.config.js` (auto-generated — do not edit manually)
- Theme: `src/components/useAppTheme.jsx`

## Critical Rules
1. **RTL**: Apply via `document.documentElement.dir`, not per-component
2. **Tab nav**: URL query params `?tab=...` + `pushState` (Android PWA back-button)
3. **i18n**: All text via i18next — zero hardcoded Hebrew strings
4. **Data**: TanStack Query everywhere — no raw `fetch()` calls
5. **Backend**: Base44 SDK only — no direct API calls

## When you need more context
- Full architecture: @docs/architecture.md
- Task progress: @docs/progress.md

## Useful slash commands
- `/check` — typecheck + lint
- `/new-feature <name>` — structured feature workflow
- `/review` — review recent changes
- `/status` — project status summary
