# Architecture — תיב מינוב

## Stack
- **Frontend**: React + Vite, shadcn/ui, TanStack Query
- **Backend**: Base44 SDK (serverless), Deno TypeScript in functions/
- **Routing**: React Router v7, src/pages.config.js (auto-generated)
- **i18n/RTL**: i18next, Hebrew primary, RTL via document.documentElement.dir
- **Theming**: useAppTheme.jsx, dark/light/system → localStorage
- **Tab nav**: URL query params (?tab=...) + pushState for Android PWA back-button

## Key Directories
| Path | Purpose |
|------|---------|
| src/api/base44Client.js | Base44 SDK setup |
| src/api/entities.js | All entity definitions |
| src/api/integrations.js | External integrations |
| src/pages.config.js | Auto-generated routes |
| src/components/ui/ | shadcn components |
| functions/ | Deno serverless functions |

## Critical Patterns
- Always use TanStack Query for data fetching — no raw fetch()
- All text through i18next — no hardcoded Hebrew strings
- RTL applied globally via useAppTheme, not per-component
- Base44 SDK for all backend calls — never direct API
