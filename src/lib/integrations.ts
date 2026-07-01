// Optional external integrations (Supabase + Resend) that degrade gracefully.
// When env vars are absent (e.g. local/dev, or before provisioning), calls are
// no-ops that still return success so the UX works end-to-end. In production,
// set the env vars in §18 and these persist + notify for real. Uses REST so no
// SDK dependency is required.

interface StoreResult {
  stored: boolean;
  notified: boolean;
}

export async function storeSubmission(
  table: 'submissions' | 'pledges',
  row: Record<string, unknown>,
): Promise<StoreResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let stored = false;

  if (url && key) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(row),
      });
      stored = res.ok;
    } catch {
      stored = false;
    }
  }

  const notified = await notifyOwner(table, row);
  return { stored, notified };
}

async function notifyOwner(context: string, row: Record<string, unknown>): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!apiKey || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: 'Irish Grid <notify@irishgrid.com>',
        to,
        subject: `New ${context} submission`,
        text: JSON.stringify(row, null, 2),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Confirmation email to the submitter (pledge / get-involved). */
export async function sendConfirmation(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from: 'Irish Grid <hello@irishgrid.com>', to, subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Running pledge tally. Falls back to a seed count when Supabase is absent. */
export async function getPledgeCount(): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const SEED = 1287;
  if (!url || !key) return SEED;
  try {
    const res = await fetch(`${url}/rest/v1/pledges?select=id`, {
      method: 'HEAD',
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' },
    });
    const range = res.headers.get('content-range'); // e.g. "0-24/1312"
    const total = range?.split('/')[1];
    return total ? Number(total) : SEED;
  } catch {
    return SEED;
  }
}

export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
