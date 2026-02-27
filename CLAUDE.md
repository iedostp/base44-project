# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run lint       # ESLint (scoped to src/components, src/pages, src/Layout.jsx)
npm run typecheck  # TypeScript type checking via jsconfig.json
npm run preview    # Preview production build
```

There are no tests in this project.

## Architecture

This is **"בונים בית"** (Building a House) — a Hebrew-first, RTL construction project management PWA built on the [Base44](https://base44.com) platform.

### Backend: Base44 SDK

All data, auth, and integrations go through `@base44/sdk`. The client is initialized in `src/api/base44Client.js` and configured via app params (read from URL query string → localStorage → env vars).

- **Env vars**: `VITE_BASE44_APP_ID`, `VITE_BASE44_BACKEND_URL`
- **Entities** (CRUD): exported from `src/api/entities.js` — e.g. `base44.entities.Project`, `base44.entities.Stage`, `base44.entities.Task`, `base44.entities.Expense`, etc.
- **Integrations**: exported from `src/api/integrations.js` — `InvokeLLM`, `SendEmail`, `UploadFile`, `GenerateImage`, `ExtractDataFromUploadedFile`
- **Auth**: `base44.auth` — `me()`, `logout()`, `redirectToLogin()`. Wrapped in `AuthContext` (`src/lib/AuthContext.jsx`).

Legacy SDK imports (`@/integrations`, `@/entities`) can be enabled with `BASE44_LEGACY_SDK_IMPORTS=true` (handled by `@base44/vite-plugin`).

### Server-Side Functions (`functions/`)

Deno TypeScript functions deployed to the Base44 server. Each file is a standalone `Deno.serve()` handler. They import the SDK via `npm:@base44/sdk@0.8.6` and use `createClientFromRequest(req)` to get an authenticated client from the incoming request. These are **not** bundled by Vite — they run on Base44's serverless infrastructure.

### Frontend Routing

Page routing is managed by `src/pages.config.js` — **this file is auto-generated**. Do not manually add page imports; create files in `src/pages/` and the Base44 plugin registers them. The only manually editable value is `mainPage` (the landing page key).

Routes are mounted via React Router v7 in `App.jsx`. The `Layout` component wraps all pages (defined in `src/Layout.jsx`).

### Tab Navigation (URL-Driven)

The main `Home` page (`src/pages/Home.jsx`) drives navigation via URL query params (`?tab=home`, `?tab=stages`, etc.) rather than React Router routes. Tab changes use `window.history.pushState`. This enables Android back-button support in the PWA.

### i18n & RTL

- i18next configured in `src/components/i18n.jsx`. Primary language is Hebrew (`he`), with RTL layout.
- Language is persisted to `localStorage` key `language`.
- RTL/LTR is applied to `document.documentElement.dir` at startup (in `Layout.jsx`) and on language change.
- All UI strings should use `useTranslation()` with keys defined in `src/components/i18n.jsx`.

### Theming

- Custom theme system in `src/components/useAppTheme.jsx`, stored in `localStorage` under `app_theme_prefs`.
- Supports: dark/light/system mode, accent color (6 options), font size, border roundness, compact mode.
- `initThemeFromStorage()` is called synchronously at module load in `Layout.jsx` to avoid flash.
- Dark mode uses Tailwind's `class` strategy (`dark:` variants).

### UI Components

All UI primitives are shadcn/ui components in `src/components/ui/` (Radix UI based). Do not modify these directly — they follow the shadcn/ui pattern. Path alias `@/` maps to `src/`.

### Data Fetching Pattern

Pages use TanStack Query (`useQuery` / `useMutation`) for all Base44 entity operations. The shared `queryClientInstance` is in `src/lib/query-client.js`.

## Development Guidelines

### Hebrew & RTL Standards
- **Direction:** Always ensure the UI is rendered in RTL (Right-to-Left). Use `dir="rtl"` on the root element and appropriate CSS classes.
- **Text Alignment:** Ensure Hebrew text is displayed correctly from right to left. If needed, use manual reversal solutions for text rendering before display as per project requirements.
- **Layout:** Verify that sidebars, icons, and navigation elements are correctly mirrored for RTL users.
- **Validation:** After any CSS or layout changes, perform a visual check (or use Playwright) to confirm the RTL layout hasn't broken.
