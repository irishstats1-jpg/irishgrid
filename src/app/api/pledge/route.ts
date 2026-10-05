import { NextResponse } from 'next/server';
import { createPledge } from '@/lib/integrations';
import { isRateLimited } from '@/lib/rateLimit';
import { isBot, LIMITS, readBody, validate } from '@/lib/validation';

// Pledge sign-up. Accepts JSON (enhanced form) or a plain form post (no
// JavaScript), and only reports success when the pledge was actually stored.

const MESSAGES = {
  pending: 'Thank you. Check your inbox and confirm your pledge to have it counted.',
  stored: 'Thank you — your pledge has been recorded.',
  duplicate: 'This email address has already signed the pledge.',
  unavailable: 'We couldn’t record your pledge just now. Please try again later.',
  busy: 'Too many attempts from your connection. Please wait a minute and try again.',
} as const;

export async function POST(request: Request) {
  const { body, isForm } = await readBody(request);
  const reply = (status: string, http: number, extra: Record<string, unknown> = {}) =>
    isForm
      ? NextResponse.redirect(new URL(`/pledge?status=${status}#pledge-form`, request.url), 303)
      : NextResponse.json({ status, ...extra }, { status: http });

  if (!body) return reply('error', 400, { error: 'Invalid request' });
  if (isBot(body)) return reply('pending', 200, { message: MESSAGES.pending });
  if (await isRateLimited(request, 'pledge')) return reply('busy', 429, { error: MESSAGES.busy });

  const v = validate(body, {
    name: { max: LIMITS.name, required: true },
    org: { max: LIMITS.org },
    email: { max: LIMITS.email, required: true, email: true },
  });
  if (!v.ok) return reply('error', 400, { error: v.error });
  if (v.values.name.length < 2) return reply('error', 400, { error: 'Please enter your name' });

  const result = await createPledge({ name: v.values.name, org: v.values.org, email: v.values.email });
  switch (result.status) {
    case 'pending':
      return reply('pending', 200, { message: MESSAGES.pending });
    case 'stored':
      return reply('stored', 200, { message: MESSAGES.stored });
    case 'duplicate':
      return reply('duplicate', 200, { message: MESSAGES.duplicate });
    default:
      return reply('unavailable', 503, { error: MESSAGES.unavailable });
  }
}
