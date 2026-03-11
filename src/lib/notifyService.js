import { supabase } from "./supabaseClient";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-notify`;

async function sendWhatsApp(to, message) {
  const { data: { session } } = await supabase.auth.getSession();

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ to, message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `WhatsApp send failed (${res.status})`);
  }

  return res.json();
}

/**
 * Send a project status update notification.
 * @param {string} phone - recipient phone number (digits, e.g. "972501234567")
 * @param {string} projectName
 * @param {string} update - human-readable status update
 */
export async function sendProjectUpdate(phone, projectName, update) {
  const message = `🏗️ *${projectName}*\n\n${update}`;
  return sendWhatsApp(phone, message);
}

/**
 * Send a milestone reminder notification.
 * @param {string} phone
 * @param {string} projectName
 * @param {string} milestone
 * @param {string} date - formatted date string
 */
export async function sendMilestoneReminder(phone, projectName, milestone, date) {
  const message = `⏰ *תזכורת אבן דרך*\n\nפרויקט: ${projectName}\nאבן דרך: ${milestone}\nתאריך יעד: ${date}`;
  return sendWhatsApp(phone, message);
}
