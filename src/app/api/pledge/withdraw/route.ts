import { NextResponse } from 'next/server';
import { withdrawPledge } from '@/lib/integrations';
import { readBody } from '@/lib/validation';

// POST only (see confirm/route.ts): withdrawing deletes the pledge record.
export async function POST(request: Request) {
  const { body } = await readBody(request);
  const token = typeof body?.token === 'string' ? body.token : '';
  const ok = await withdrawPledge(token);
  return NextResponse.redirect(new URL(`/pledge?status=${ok ? 'withdrawn' : 'invalid'}#pledge-form`, request.url), 303);
}
