import { NextResponse } from 'next/server';
import { confirmPledge } from '@/lib/integrations';
import { readBody } from '@/lib/validation';

// POST only: the email links to /pledge/confirm, a page with a button, so mail
// scanners that pre-open links can't confirm a pledge on someone's behalf.
export async function POST(request: Request) {
  const { body } = await readBody(request);
  const token = typeof body?.token === 'string' ? body.token : '';
  const ok = await confirmPledge(token);
  return NextResponse.redirect(new URL(`/pledge?status=${ok ? 'confirmed' : 'invalid'}#pledge-form`, request.url), 303);
}
