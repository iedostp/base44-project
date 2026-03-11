# 🧪 Team QA — Override: בונים בית

> מרחיב את ~/.claude/agents/team-qa.md
> כל הבדיקות הגלובליות בתוקף + הבדיקות כאן.

## בדיקות נוספות

### RTL
- [ ] document.documentElement.dir === 'rtl'
- [ ] אין ml-* / pl-* / text-left בקוד חדש
- [ ] אייקוני חצים לא הפוכים

### i18n
- [ ] אין עברית hardcoded בJSX
- [ ] כל t('key') קיים בקובץ התרגום
- [ ] אין missing key warnings בconsole

### Base44
- [ ] אין Supabase ישיר
- [ ] אין fetch() ישיר לbackend
- [ ] כל query עם isLoading + isError
- [ ] כל mutation עם onError

### קומפוננטים ספציפיים
- [ ] DocumentUpload — קבצים עברית מועלים
- [ ] DocumentsTab — רשימה RTL
- [ ] GanttChart — timeline RTL
- [ ] ProjectCalendar — שבוע מתחיל ראשון
