import { NextResponse } from 'next/server';
import { storeSubmission, sendConfirmation, isValidEmail } from '@/lib/integrations';

const VALID_TYPES = new Set(['policymaker', 'investor', 'pilot', 'volunteer']);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = String(body.type ?? '');
  if (!VALID_TYPES.has(type)) {
    return NextResponse.json({ error: 'Unknown submission type' }, { status: 400 });
  }
  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const { type: _t, ...payload } = body;
  const result = await storeSubmission('submissions', {
    type,
    payload,
    created_at: new Date().toISOString(),
    handled: false,
  });

  await sendConfirmation(
    body.email as string,
    'Thanks — Irish Grid has received your submission',
    'Thank you for getting in touch with Irish Grid. We have received your submission and will be in contact soon.\n\n— Irish Grid (independent; not affiliated with EirGrid or SONI)',
  );

  return NextResponse.json({ ok: true, ...result });
}
