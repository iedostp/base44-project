import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const today = new Date();

    // Fetch all data
    const [projects, settingsList] = await Promise.all([
      base44.entities.Project.filter({ created_by: user.email }),
      base44.entities.NotificationSettings.filter({ user_email: user.email }),
    ]);

    if (!projects.length) return Response.json({ created: 0 });
    const project = projects[0];

    const settings = settingsList[0] || {
      task_overdue_inapp: true,
      budget_alert_inapp: true,
    };

    const [stages, tasks, expenses, suppliers, existingNotifications] = await Promise.all([
      base44.entities.Stage.filter({ project_id: project.id }),
      base44.entities.Task.filter({ created_by: user.email }),
      base44.entities.Expense.filter({ project_id: project.id }),
      base44.entities.Supplier.filter({ project_id: project.id }),
      base44.entities.Notification.filter({ user_email: user.email }),
    ]);

    const existingRefs = new Set(existingNotifications.map(n => n.reference_id));

    // Parse duration to days
    const parseDurationDays = (duration) => {
      if (!duration) return 30;
      const monthMatch = duration.match(/(\d+)(?:-(\d+))?\s*חודש/);
      if (monthMatch) {
        const avg = monthMatch[2]
          ? (parseInt(monthMatch[1]) + parseInt(monthMatch[2])) / 2
          : parseInt(monthMatch[1]);
        return avg * 30;
      }
      const weekMatch = duration.match(/(\d+)(?:-(\d+))?\s*שבוע/);
      if (weekMatch) {
        const avg = weekMatch[2]
          ? (parseInt(weekMatch[1]) + parseInt(weekMatch[2])) / 2
          : parseInt(weekMatch[1]);
        return avg * 7;
      }
      return 30;
    };

    // Build stagesWithDates
    let runningDate = project.start_date ? new Date(project.start_date) : new Date();
    const stagesWithDates = [...stages]
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(stage => {
        const startDate = new Date(runningDate);
        const durationDays = parseDurationDays(stage.duration);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + durationDays);
        runningDate = new Date(endDate);
        const stageTasks = tasks.filter(t => t.stage_id === stage.id);
        const completedTasks = stageTasks.filter(t => t.done).length;
        const progress = stageTasks.length > 0 ? (completedTasks / stageTasks.length) * 100 : 0;
        const totalSpentOnStage = expenses
          .filter(e => e.stage_id === stage.id)
          .reduce((sum, e) => sum + (e.amount || 0), 0);
        const plannedBudget = project.total_budget
          ? (project.total_budget * (parseFloat(stage.budget_percentage) || 0)) / 100
          : 0;
        return {
          ...stage,
          startDate,
          endDate,
          durationDays,
          progress,
          totalSpentOnStage,
          plannedBudget,
          stageTasks,
        };
      });

    const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const selectedSuppliers = suppliers.filter(s => s.status === 'selected');
    const underConsiderationSuppliers = suppliers.filter(s => s.status === 'under_consideration');
    const notContactedSuppliers = suppliers.filter(s => s.status === 'not_contacted');

    // Build AI prompt
    const prompt = `
אתה מערכת ניהול פרויקט בנייה חכמה. נתח את נתוני הפרויקט הבאים וצור רשימת התראות חכמות ומדויקות.

**פרטי הפרויקט:**
- שם: ${project.name || 'לא צוין'}
- תאריך התחלה: ${project.start_date || 'לא הוגדר'}
- תקציב כולל: ${project.total_budget ? project.total_budget.toLocaleString() + ' ₪' : 'לא הוגדר'}
- הוצאה בפועל: ${totalSpent.toLocaleString()} ₪
- ניצול תקציב: ${project.total_budget ? Math.round((totalSpent / project.total_budget) * 100) + '%' : 'לא ידוע'}
- תאריך היום: ${today.toISOString().split('T')[0]}

**שלבי הפרויקט (ממוינים לפי סדר):**
${stagesWithDates.map((s, i) => `
${i + 1}. ${s.title}
   - סטטוס: ${s.completed ? 'הושלם ✅' : 'בתהליך/ממתין'}
   - התקדמות: ${Math.round(s.progress)}% (${s.stageTasks.filter(t => t.done).length}/${s.stageTasks.length} משימות)
   - תאריך התחלה מתוכנן: ${s.startDate.toISOString().split('T')[0]}
   - תאריך סיום מתוכנן: ${s.endDate.toISOString().split('T')[0]}
   - תקציב מתוכנן: ${s.plannedBudget.toLocaleString()} ₪
   - תקציב בפועל: ${s.totalSpentOnStage.toLocaleString()} ₪
   - עדיפות: ${s.priority || 'לא הוגדר'}
   - משימות לא גמורות: ${s.stageTasks.filter(t => !t.done).map(t => t.text).join(', ') || 'אין'}
`).join('')}

**ספקים:**
- נבחרו: ${selectedSuppliers.length} ספקים (${selectedSuppliers.map(s => s.name + ' - ' + s.category).join(', ') || 'אין'})
- בבדיקה: ${underConsiderationSuppliers.length}
- לא הושגו: ${notContactedSuppliers.length}

**הוצאות גדולות (מעל 10,000 ₪):**
${expenses.filter(e => e.amount > 10000).map(e => `- ${e.description}: ${e.amount.toLocaleString()} ₪ (${e.date})`).join('\n') || 'אין'}

נתח את הנתונים ובקש לזהות:
1. שלבים שעלולים לפגר (על סמך ההתקדמות הנוכחית מול הזמן שנותר)
2. צווארי בקבוק (שלבים שיכבלו את שלבים אחריהם)
3. חריגות תקציב בשלבים
4. ספקים קריטיים שעדיין לא נבחרו לשלבים קרובים
5. תלויות בין שלבים שמצריכות תשומת לב

**הנחיות:**
- צור רק התראות אמיתיות וחשובות, לא יותר מ-6 התראות סה"כ
- הגדר חומרה (severity) בצורה אמיתית - אל תהיה דרמטי מדי
- כתוב בעברית קצרה וברורה
- reference_id חייב להיות ייחודי ולכלול תאריך היום (${today.toISOString().split('T')[0]}) כדי לאפשר יצירה מחדש מחר
`;

    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          alerts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['task_overdue', 'task_upcoming', 'budget_alert'] },
                title: { type: 'string' },
                message: { type: 'string' },
                severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
                reference_id: { type: 'string' },
              },
            },
          },
          summary: { type: 'string' },
        },
      },
    });

    const newNotifications = [];

    for (const alert of (aiResponse.alerts || [])) {
      if (!alert.reference_id || existingRefs.has(alert.reference_id)) continue;

      const shouldCreate =
        (alert.type === 'task_overdue' && settings.task_overdue_inapp !== false) ||
        (alert.type === 'task_upcoming' && settings.task_upcoming_inapp !== false) ||
        (alert.type === 'budget_alert' && settings.budget_alert_inapp !== false);

      if (!shouldCreate) continue;

      await base44.entities.Notification.create({
        user_email: user.email,
        project_id: project.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        read: false,
        reference_id: alert.reference_id,
        notification_date: today.toISOString().split('T')[0],
      });

      newNotifications.push(alert);
    }

    return Response.json({
      created: newNotifications.length,
      summary: aiResponse.summary || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});