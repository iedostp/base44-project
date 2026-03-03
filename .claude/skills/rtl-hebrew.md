---
description: RTL Hebrew UI patterns, i18n, layout rules for React components in this project
---

# RTL / Hebrew Rules

## Direction
- Apply RTL via `useAppTheme.jsx` → `document.documentElement.dir = 'rtl'`
- Never set `dir` inline on individual components
- shadcn/ui components: add `dir="rtl"` only on Dialog/Popover root if needed

## i18next
- All visible text via `t('key')` — zero hardcoded Hebrew strings
- Key format: `snake_case`, namespace = page/feature name
- Plurals: use `_one` / `_other` suffixes
- Date format for Hebrew users: `DD/MM/YYYY`

## CSS / Tailwind
- Use `ms-*` / `me-*` (margin-start/end) instead of `ml-*` / `mr-*`
- Use `ps-*` / `pe-*` (padding-start/end) instead of `pl-*` / `pr-*`
- Icons that have direction meaning: flip with `rtl:scale-x-[-1]`

## Android PWA Back Button
- Tab navigation MUST use `?tab=...` URL params + `pushState`
- Never use internal state for tabs — breaks Android back button
