import { NextResponse } from 'next/server';
import { notifyOwner, sendEmail, storeSubmission } from '@/lib/integrations';
import { isRateLimited } from '@/lib/rateLimit';
import { type FieldSpec, isBot, LIMITS, readBody, validate } from '@/lib/validation';

// Get Involved enquiries. Each pathway has an allowlist of fields; anything
// else the client sends is discarded, never stored.
const PATHWAYS: Record<string, Record<string, FieldSpec>> = {
  policymaker: {
    name: { max: LIMITS.name, required: true },
    org: { max: LIMITS.org },
    role: { max: LIMITS.short },
    email: { max: LIMITS.email, required: true, email: true },
    ask: { max: LIMITS.long },
  },
  pilot: {
    name: { max: LIMITS.name, required: true },
    org: { max: LIMITS.org },
    email: { max: LIMITS.email, required: true, email: true },
    site: { max: LIMITS.short },
    capacity: { max: LIMITS.short },
    ask: { max: LIMITS.long },
  },
  volunteer: {
    name: { max: LIMITS.name, required: true },
    email: { max: LIMITS.email, required: true, email: true },
    skills: { max: LIMITS.long },
  },
};

export async function POST(request: Request) {
  const { body, isForm } = await readBody(request);
  const reply = (status: string, http: number, extra: Record<string, unknown> = {}) =>
    isForm
      ? NextResponse.redirect(new URL(`/get-involved?status=${status}#forms`, request.url), 303)
      : NextResponse.json({ status, ...extra }, { status: http });

  if (!body) return reply('error', 400, { error: 'Invalid request' });
  if (isBot(body)) return reply('ok', 200);
  if (await isRateLimited(request, 'submission')) {
    return reply('busy', 429, { error: 'Too many attempts from your connection. Please wait a minute and try again.' });
  }

  const type = typeof body.type === 'string' ? body.type : '';
  const spec = PATHWAYS[type];
  if (!spec) return reply('error', 400, { error: 'Unknown enquiry type' });
  const v = validate(body, spec);
  if (!v.ok) return reply('error', 400, { error: v.error });

  const stored = await storeSubmission({ type, payload: v.values, created_at: new Date().toISOString(), handled: false });
  if (!stored) {
    return reply('unavailable', 503, { error: 'We couldn’t send your message just now. Please try again later.' });
  }

  await notifyOwner(`New ${type} enquiry`, v.values);
  await sendEmail(
    v.values.email,
    'Irish Grid has received your message',
    'Thank you for getting in touch. We have received your message and will reply soon.\n\nIrish Grid is an independent, non-partisan research and advocacy site. It has no connection to EirGrid or SONI.',
  );
  return reply('ok', 200);
}
