import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Notification settings
    const settingsList = await base44.entities.NotificationSettings.filter({ user_email: user.email });
    const settings = settingsList[0] || {
      task_overdue_inapp: true,
      task_overdue_email: false,
      task_upcoming_inapp: true,
      task_upcoming_email: false,
      budget_alert_inapp: true,
      budget_alert_email: false,
      upcoming_days_ahead: 7,
    };

    const projects = await base44.entities.Project.filter({ created_by: user.email });
    if (!projects.length) return Response.json({ created: 0 });
    const project = projects[0];

    const stages = await base44.entities.Stage.filter({ project_id: project.id });
    const tasks = await base44.entities.Task.filter({ created_by: user.email });
    const expenses = await base44.entities.Expense.filter({ project_id: project.id });

    // Existing notifications (deduplicate)
    const existingNotifications = await base44.entities.Notification.filter({ user_email: user.email });
    const existingRefs = new Set(existingNotifications.map(n => n.reference_id));

    const newNotifications = [];
    const daysAhead = settings.upcoming_days_ahead || 7;
    const todayStr = today.toISOString().split('T')[0];

    // ── 1. Task-level due_date alerts ────────────────────────────────────────
    for (const task of tasks) {
      if (task.done) continue;
      if (!task.due_date) continue;

      const dueDate = new Date(task.due_date);
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

      // Overdue
      if (diffDays < 0) {
        const refId = `task_overdue_${task.id}_${todayStr}`;
        if (!existingRefs.has(refId) && settings.task_overdue_inapp !== false) {
          newNotifications.push({
            user_email: user.email,
            project_id: project.id,
            type: 'task_overdue',
            title: 'משימה באיחור',
            message: `המשימה "${task.text}" עברה את תאריך היעד שלה (${dueDate.toLocaleDateString('he-IL')}).`,
            read: false,
            reference_id: refId,
            notification_date: todayStr,
          });
          if (settings.task_overdue_email) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: '⏰ משימה באיחור - בונים בית',
              body: `שלום ${user.full_name},\n\nהמשימה "${task.text}" עברה את תאריך היעד שלה (${dueDate.toLocaleDateString('he-IL')}).\n\nבהצלחה,\nצוות בונים בית`,
            });
          }
        }
      }

      // Upcoming (within daysAhead)
      if (diffDays >= 0 && diffDays <= daysAhead) {
        const refId = `task_upcoming_${task.id}_${todayStr}`;
        if (!existingRefs.has(refId) && settings.task_upcoming_inapp !== false) {
          newNotifications.push({
            user_email: user.email,
            project_id: project.id,
            type: 'task_upcoming',
            title: diffDays === 0 ? 'משימה ליום זה' : `משימה מתקרבת – עוד ${diffDays} ימים`,
            message: `המשימה "${task.text}" צפויה להסתיים ב-${dueDate.toLocaleDateString('he-IL')}.`,
            read: false,
            reference_id: refId,
            notification_date: todayStr,
          });
          if (settings.task_upcoming_email) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: `📅 משימה מתקרבת – עוד ${diffDays} ימים - בונים בית`,
              body: `שלום ${user.full_name},\n\nהמשימה "${task.text}" צפויה להסתיים ב-${dueDate.toLocaleDateString('he-IL')}.\n\nבהצלחה,\nצוות בונים בית`,
            });
          }
        }
      }
    }

    // ── 2. Stage completion alerts ────────────────────────────────────────────
    for (const stage of stages) {
      if (stage.completed) {
        const refId = `stage_completed_${stage.id}`;
        if (!existingRefs.has(refId)) {
          newNotifications.push({
            user_email: user.email,
            project_id: project.id,
            type: 'task_upcoming',
            title: '🎉 שלב הושלם בהצלחה',
            message: `שלב "${stage.title}" הושלם בהצלחה!`,
            read: false,
            reference_id: refId,
            notification_date: todayStr,
          });
        }
      } else {
        // Stage nearly complete: if all tasks but one are done
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        if (stageTasks.length > 1) {
          const remaining = stageTasks.filter(t => !t.done).length;
          if (remaining === 1) {
            const refId = `stage_almost_${stage.id}_${todayStr}`;
            if (!existingRefs.has(refId)) {
              newNotifications.push({
                user_email: user.email,
                project_id: project.id,
                type: 'task_upcoming',
                title: 'שלב עומד להסתיים',
                message: `שלב "${stage.title}" כמעט הסתיים – נשארה משימה אחת בלבד!`,
                read: false,
                reference_id: refId,
                notification_date: todayStr,
              });
            }
          }
        }
      }

      // ── 3. Per-stage budget overrun ─────────────────────────────────────────
      if (project.total_budget) {
        const plannedAmount = project.total_budget * (parseFloat(stage.budget_percentage) || 0) / 100;
        const stageExpenses = expenses.filter(e => e.stage_id === stage.id);
        const stageSpent = stageExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

        if (plannedAmount > 0 && stageSpent > plannedAmount) {
          const refId = `stage_budget_overrun_${stage.id}`;
          if (!existingRefs.has(refId) && settings.budget_alert_inapp !== false) {
            newNotifications.push({
              user_email: user.email,
              project_id: project.id,
              type: 'budget_alert',
              title: 'חריגת תקציב בשלב',
              message: `שלב "${stage.title}" חרג מהתקציב המתוכנן: הוצא ${stageSpent.toLocaleString()} ₪ מתוך ${Math.round(plannedAmount).toLocaleString()} ₪.`,
              read: false,
              reference_id: refId,
              notification_date: todayStr,
            });
            if (settings.budget_alert_email) {
              await base44.integrations.Core.SendEmail({
                to: user.email,
                subject: '⚠️ חריגת תקציב בשלב - בונים בית',
                body: `שלום ${user.full_name},\n\nשלב "${stage.title}" חרג מהתקציב:\nהוצא: ${stageSpent.toLocaleString()} ₪\nמתוכנן: ${Math.round(plannedAmount).toLocaleString()} ₪\n\nבהצלחה,\nצוות בונים בית`,
              });
            }
          }
        }
      }
    }

    // ── 4. Project-wide budget alerts ─────────────────────────────────────────
    if (project.total_budget) {
      const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const percentUsed = (totalSpent / project.total_budget) * 100;

      if (percentUsed >= 75 && percentUsed < 90) {
        const refId = `budget_alert_${project.id}_75`;
        if (!existingRefs.has(refId) && settings.budget_alert_inapp !== false) {
          newNotifications.push({
            user_email: user.email,
            project_id: project.id,
            type: 'budget_alert',
            title: 'התראת תקציב – 75% בשימוש',
            message: `השתמשת ב-${Math.round(percentUsed)}% מהתקציב הכולל. נותר ${(project.total_budget - totalSpent).toLocaleString()} ₪.`,
            read: false,
            reference_id: refId,
            notification_date: todayStr,
          });
          if (settings.budget_alert_email) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: '⚠️ התראת תקציב 75% - בונים בית',
              body: `שלום ${user.full_name},\n\nנוצלו ${Math.round(percentUsed)}% מהתקציב.\nנותר: ${(project.total_budget - totalSpent).toLocaleString()} ₪.\n\nבהצלחה,\nצוות בונים בית`,
            });
          }
        }
      }

      if (percentUsed >= 90) {
        const refId = `budget_alert_${project.id}_90`;
        if (!existingRefs.has(refId) && settings.budget_alert_inapp !== false) {
          newNotifications.push({
            user_email: user.email,
            project_id: project.id,
            type: 'budget_alert',
            title: '🚨 התראה קריטית – תקציב בסכנה',
            message: `השתמשת ב-${Math.round(percentUsed)}% מהתקציב הכולל! נותר רק ${(project.total_budget - totalSpent).toLocaleString()} ₪.`,
            read: false,
            reference_id: refId,
            notification_date: todayStr,
          });
          if (settings.budget_alert_email) {
            await base44.integrations.Core.SendEmail({
              to: user.email,
              subject: '🚨 תקציב בסכנה - בונים בית',
              body: `שלום ${user.full_name},\n\nנוצלו ${Math.round(percentUsed)}% מהתקציב!\nנותר: ${(project.total_budget - totalSpent).toLocaleString()} ₪.\n\nבהצלחה,\nצוות בונים בית`,
            });
          }
        }
      }
    }

    // Create all notifications
    for (const notif of newNotifications) {
      await base44.entities.Notification.create(notif);
    }

    return Response.json({ created: newNotifications.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});