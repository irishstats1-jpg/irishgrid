import { NextResponse } from 'next/server';
import { storeSubmission, sendConfirmation, isValidEmail } from '@/lib/integrations';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.name !== 'string' || body.name.trim().length < 2) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (!isValidEmail(body.email)) {
    return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
  }

  const result = await storeSubmission('pledges', {
    name: String(body.name).trim(),
    org: typeof body.org === 'string' ? body.org.trim() : null,
    email: body.email,
    created_at: new Date().toISOString(),
    confirmed: false,
  });

  await sendConfirmation(
    body.email as string,
    'Thanks for pledging your support to Irish Grid',
    'Thank you for signing the Irish Grid pledge of support. Your voice helps make the case for ending clean-energy waste.\n\n— Irish Grid (independent; not affiliated with EirGrid or SONI)',
  );

  return NextResponse.json({ ok: true, ...result });
}
