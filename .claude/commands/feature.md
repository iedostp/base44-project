# Feature Pipeline: $ARGUMENTS

שלב 1 — Spec (pm-spec agent)
הפעל את pm-spec subagent עם: "$ARGUMENTS"
המתן לתוצאה והצג לי את ה-spec.

⏸️ עצור כאן — המתן לאישורי לפני שממשיך.

שלב 2 — Explore (אחרי אישור)
הפעל explorer subagent לסרוק קוד רלוונטי.

שלב 3 — Implement
מממש לפי ה-spec שאושר.
אחרי כל קובץ — הרץ `npm run typecheck`.

שלב 4 — Review
הפעל reviewer subagent על השינויים.
תקן כל 🔴 לפני סיום.
