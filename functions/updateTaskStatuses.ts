import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Logic:
 * - done = true                          → "הושלמה"
 * - due_date passed & not done           → "איחור"
 * - due_date within next 3 days & !done  → "התקדמה" (approaching)
 * - no due_date & !done                  → "בהמתנה"
 * - due_date in future (>3 days) & !done → "פתוחה"
 */
const computeStatus = (task) => {
  if (task.done) return "הושלמה";

  if (!task.due_date) return task.status === "הושלמה" ? "פתוחה" : (task.status || "פתוחה");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "איחור";
  if (diffDays <= 3) return "התקדמה";
  return "פתוחה";
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow both authenticated users (manual trigger) and scheduled runs (no user)
    let isAuthenticated = false;
    try {
      const user = await base44.auth.me();
      isAuthenticated = !!user;
    } catch (_) { /* scheduled run */ }

    // Use service role to access all tasks
    const tasks = await base44.asServiceRole.entities.Task.list();

    let updated = 0;
    let skipped = 0;

    for (const task of tasks) {
      const newStatus = computeStatus(task);

      // Only update if status actually changed
      if (task.status !== newStatus) {
        await base44.asServiceRole.entities.Task.update(task.id, { status: newStatus });
        updated++;
      } else {
        skipped++;
      }
    }

    return Response.json({
      success: true,
      total: tasks.length,
      updated,
      skipped,
      message: `עודכנו ${updated} משימות מתוך ${tasks.length}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});