# Progress — תיב מינוב 🏗️

_עודכן לאחרונה: 2026-03-19_

---

## ✅ הושלם

- [x] Base44 SDK setup — `src/api/base44Client.js`
- [x] Entities definition — `src/api/entities.js`
- [x] Auth system — `src/lib/AuthContext.jsx`
- [x] Layout ראשי — `src/Layout.jsx`
- [x] דפים בסיסיים — Home, ExpenseAnalytics, Suppliers, UserSettings
- [x] shadcn/ui library — `src/components/ui/`
- [x] TanStack Query setup — `src/lib/query-client.js`
- [x] URL params navigation — `src/lib/app-params.js`
- [x] DashboardSummary component
- [x] StageCard component
- [x] BudgetTab component
- [x] NotificationBell + NotificationSettingsPanel
- [x] ProjectChat + DirectMessagesPanel
- [x] CalendarSyncPanel
- [x] Android TWA — native app, splash screen, file upload, WebView
- [x] DocumentUpload — i18n + RTL complete
- [x] DocumentsTab — i18n + RTL complete

---

## 🔄 בעבודה

- [ ] **GanttChart** — `src/components/project/GanttChart.jsx`
- [ ] **ProjectCalendar** — `src/components/project/ProjectCalendar.jsx`

---

## 📋 הבא בתור

_מלא לפי העדיפויות שלך:_

- [ ] סיום GanttChart
- [ ] סיום ProjectCalendar
- [ ] דף InitializeTasks — לממש
- [ ] ToggleDemo — לבדוק אם נחוץ או למחוק
- [ ] PWA testing על Android
- [ ] i18n — לוודא כל הטקסטים דרך i18next

---

## 🐛 באגים ידועים

_הוסף כאן בעיות שנתקלת בהן:_

- [ ] (ריק — הוסף ידנית)

---

## 📌 הפעם הבאה

> כתוב כאן משפט אחד בסוף כל סשן — מה הצעד הראשון בפתיחה הבאה

---

## 🗺️ מפת הפרויקט (לעיון מהיר)

| תיקייה | תוכן |
|--------|------|
| `src/api/` | base44Client, entities, integrations |
| `src/lib/` | AuthContext, query-client, app-params, utils |
| `src/components/project/` | GanttChart, Calendar, Documents, Budget, Dashboard |
| `src/components/chat/` | ProjectChat, DirectMessages |
| `src/components/notifications/` | NotificationBell, Settings |
| `src/components/calendar/` | CalendarSync |
| `src/components/ui/` | shadcn library |
| `functions/` | Deno serverless functions |
