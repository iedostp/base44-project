---
description: PWA patterns, mobile behavior, offline support, performance for this construction app
---

# PWA / Mobile Patterns

## Performance
- Lazy load routes with `React.lazy()` + `<Suspense>`
- Images: use `loading="lazy"` and explicit width/height
- TanStack Query cache: staleTime min 30s for stable data

## PWA Behavior
- Service worker managed by Vite PWA plugin
- Offline: show `<OfflineBanner>` when `navigator.onLine === false`
- Install prompt: handle `beforeinstallprompt` event

## Construction App Specifics
- Users often on mobile at construction sites — optimize for touch
- Large tap targets: min 44x44px
- Avoid hover-only interactions
- Forms should work offline and sync when back online
