# 💻 Team Dev — Override: בונים בית

> מרחיב את ~/.claude/agents/team-dev.md
> כל הכללים הגלובליים בתוקף + הכללים כאן.

## Stack
- React + Vite + TypeScript (strict)
- shadcn/ui — extend, לא replace
- TanStack Query — server state בלבד
- Base44 SDK — אסור Supabase/fetch ישיר
- i18next — כל string עברי דרך t('key')
- Tailwind — RTL-first

## כללים נוספים

### RTL
- אסור ml-* / pl-* / text-left ללayout
- השתמש ב-mr-* / pr-* / text-right / text-start

### i18n
- אסור hardcode עברית בJSX
- מפתח חדש → מוסיף לקובץ src/i18n/
- namespace לפי feature: documents.upload, gantt.title

### Base44
- כל data → TanStack Query + Base44 SDK
- כל useQuery/useMutation → isLoading + isError + onError

### קומפוננטים פעילים — זהירות
| קומפוננט | סטטוס | הערה |
|---------|--------|------|
| DocumentUpload | 🔄 | שמות עברית, RTL preview |
| DocumentsTab | 🔄 | תלוי DocumentUpload |
| GanttChart | 🔄 | RTL timeline — תאם לפני שינוי |
| ProjectCalendar | 🔄 | locale עברי, שבוע מתחיל ראשון |

## פקודות
npm run dev / build / typecheck / lint / preview
