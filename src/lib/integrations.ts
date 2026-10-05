// Supabase (storage) and Resend (email) over REST, no SDKs. Every function
// reports what actually happened: callers must never tell a visitor something
// was saved or sent when it wasn't.

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://irishgrid.com';

function supabase(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? { url, key } : null;
}

function headers(key: string, extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

/** Store a Get Involved submission. Returns false if storage isn't configured or fails. */
export async function storeSubmission(row: Record<string, unknown>): Promise<boolean> {
  const db = supabase();
  if (!db) return false;
  try {
    const res = await fetch(`${db.url}/rest/v1/submissions`, {
      method: 'POST',
      headers: headers(db.key, { Prefer: 'return=minimal' }),
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---- Pledges ------------------------------------------------------------------

export type PledgeResult =
  | { status: 'pending' } // stored; confirmation email sent
  | { status: 'stored' } // stored on a database without confirmation support
  | { status: 'duplicate' }
  | { status: 'unavailable' };

export async function createPledge(p: { name: string; org?: string; email: string }): Promise<PledgeResult> {
  const db = supabase();
  if (!db) return { status: 'unavailable' };
  const email = p.email.toLowerCase();

  try {
    const existing = await fetch(
      `${db.url}/rest/v1/pledges?select=id&email=eq.${encodeURIComponent(email)}&limit=1`,
      { headers: headers(db.key) },
    );
    if (existing.ok && ((await existing.json()) as unknown[]).length > 0) return { status: 'duplicate' };
  } catch {
    return { status: 'unavailable' };
  }

  const confirmToken = crypto.randomUUID();
  const withdrawToken = crypto.randomUUID();
  const base = { name: p.name, org: p.org ?? null, email, confirmed: false };

  let res = await insert(db, { ...base, confirm_token: confirmToken, withdraw_token: withdrawToken });
  if (res.ok) {
    await sendEmail(
      email,
      'Please confirm your Irish Grid pledge',
      [
        `Thank you, ${p.name}. Please confirm your pledge of support by opening this link:`,
        `${SITE}/api/pledge/confirm?token=${confirmToken}`,
        '',
        'If you did not sign the pledge, ignore this email and nothing more will happen.',
        `To withdraw your pledge at any time: ${SITE}/api/pledge/withdraw?token=${withdrawToken}`,
        '',
        'Irish Grid is an independent, non-partisan research and advocacy site. It has no connection to EirGrid or SONI.',
      ].join('\n'),
    );
    return { status: 'pending' };
  }

  // Database not yet migrated (no token columns): store without confirmation.
  if (res.status === 400 && /confirm_token|withdraw_token/.test(res.body)) {
    res = await insert(db, base);
    if (res.ok) return { status: 'stored' };
  }
  if (res.status === 409) return { status: 'duplicate' };
  return { status: 'unavailable' };
}

async function insert(db: { url: string; key: string }, row: Record<string, unknown>) {
  try {
    const r = await fetch(`${db.url}/rest/v1/pledges`, {
      method: 'POST',
      headers: headers(db.key, { Prefer: 'return=minimal' }),
      body: JSON.stringify(row),
    });
    return { ok: r.ok, status: r.status, body: r.ok ? '' : await r.text() };
  } catch {
    return { ok: false, status: 0, body: '' };
  }
}

/** Confirm a pledge by its single-use token. */
export async function confirmPledge(token: string): Promise<boolean> {
  const db = supabase();
  if (!db || !/^[0-9a-f-]{36}$/i.test(token)) return false;
  try {
    const res = await fetch(`${db.url}/rest/v1/pledges?confirm_token=eq.${token}`, {
      method: 'PATCH',
      headers: headers(db.key, { Prefer: 'return=representation' }),
      body: JSON.stringify({ confirmed: true, confirmed_at: new Date().toISOString(), confirm_token: null }),
    });
    return res.ok && ((await res.json()) as unknown[]).length > 0;
  } catch {
    return false;
  }
}

/** Withdraw (delete) a pledge by its withdrawal token. */
export async function withdrawPledge(token: string): Promise<boolean> {
  const db = supabase();
  if (!db || !/^[0-9a-f-]{36}$/i.test(token)) return false;
  try {
    const res = await fetch(`${db.url}/rest/v1/pledges?withdraw_token=eq.${token}`, {
      method: 'DELETE',
      headers: headers(db.key, { Prefer: 'return=representation' }),
    });
    return res.ok && ((await res.json()) as unknown[]).length > 0;
  } catch {
    return false;
  }
}

/**
 * Confirmed pledge count, or null when it can't be read — the page then shows
 * no number at all. (Pending pledges still hold a confirm token; legacy rows
 * from before confirmation existed have none and are counted.)
 */
export async function getPledgeCount(): Promise<number | null> {
  const db = supabase();
  if (!db) return null;
  const query = async (filter: string) => {
    const res = await fetch(`${db.url}/rest/v1/pledges?select=id${filter}`, {
      method: 'HEAD',
      headers: headers(db.key, { Prefer: 'count=exact' }),
    });
    if (!res.ok) return null;
    const total = res.headers.get('content-range')?.split('/')[1];
    return total && /^\d+$/.test(total) ? Number(total) : null;
  };
  try {
    return (await query('&confirm_token=is.null')) ?? (await query(''));
  } catch {
    return null;
  }
}

// ---- Email --------------------------------------------------------------------

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
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

/** Notify the site owner of a new enquiry (only the fields that were stored). */
export async function notifyOwner(subject: string, fields: Record<string, string>): Promise<boolean> {
  const to = process.env.CONTACT_NOTIFY_EMAIL;
  if (!to) return false;
  const body = Object.entries(fields)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return sendEmail(to, subject, body);
}
