import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, description, startDate, endDate, allDay, colorId, reminders } = await req.json();

    if (!title || !startDate) return Response.json({ error: 'title and startDate are required' }, { status: 400 });

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    const event = {
      summary: title,
      description: description || '',
      colorId: colorId || '1',
      reminders: reminders || { useDefault: true },
    };

    if (allDay) {
      event.start = { date: startDate };
      event.end = { date: endDate || startDate };
    } else {
      event.start = { dateTime: startDate, timeZone: 'Asia/Jerusalem' };
      event.end = { dateTime: endDate || startDate, timeZone: 'Asia/Jerusalem' };
    }

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!res.ok) {
      const err = await res.text();
      return Response.json({ error: err }, { status: 400 });
    }

    const created = await res.json();
    return Response.json({ success: true, eventId: created.id, htmlLink: created.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});