# 🏗️ בונים בית — Project Context

> הצוותות והפקודות הגלובליים: ~/.claude/
> קובץ זה = הקשר ספציפי לפרויקט בלבד.

## מבנה ארגוני
```
מנכ"ל (אתה)
    └── 🎯 Orchestrator  (~/.claude/agents/orchestrator.md)
            ├── 💻 Team Dev     (.claude/agents/team-dev.md) ← override
            ├── 🧪 Team QA      (.claude/agents/team-qa.md) ← override
            ├── 🎨 Team UI      (~/.claude/agents/team-ui.md)
            ├── 📱 Team Mobile  (~/.claude/agents/team-mobile.md)
            ├── ⚙️  Team Infra   (~/.claude/agents/team-infra.md)
            ├── 📚 Team Docs    (~/.claude/agents/team-docs.md)
            └── 🛟 Team Support (~/.claude/agents/team-support.md)
```

## Slash Commands
/mission [תיאור] — משימה חדשה
/standup          — סטנדאפ יומי
/review [קובץ]   — סקירת קוד מקיפה
/sync [נושא]     — ישיבת sync ידנית

## פרויקט
שם: בונים בית | PWA ניהול בנייה | פלטפורמה: Base44
מיקום: ~/base44-migration/

## Stack
React 18 + Vite + TypeScript | shadcn/ui + Tailwind
TanStack Query | Base44 SDK | i18next

## Context Files — קרא לפני כל משימה
1. CLAUDE.md (קובץ זה)
2. .claude/agents/team-dev.md
3. .claude/agents/team-qa.md
4. src/i18n/ — מפתחות קיימים
5. src/components/ — קומפוננטים קיימים

## כללים קריטיים
1. RTL — document.documentElement.dir = 'rtl'
2. i18n — כל עברית דרך t('key')
3. Backend — Base44 SDK בלבד
4. TypeScript — אסור any
5. Packages — אסור ללא אישור מנכ"ל
6. base44Client.ts — אסור לשנות ללא הוראה
7. **Language** — Always respond in English. Do not use Hebrew in responses.

🛑 עומד לשבור כלל? עצור ודווח למנכ"ל קודם.

## In-Progress
| קומפוננט | סטטוס |
|---------|--------|
| DocumentUpload | 🔄 |
| DocumentsTab | 🔄 |
| GanttChart | 🔄 |
| ProjectCalendar | 🔄 |
