// Input validation for public form endpoints. Every field is allowlisted, typed
// and length-limited; anything not listed is dropped rather than stored.

export const LIMITS = {
  name: 120,
  org: 160,
  email: 254,
  short: 160,
  long: 2000,
} as const;

export type FieldSpec = { max: number; required?: boolean; email?: boolean };

export function isValidEmail(email: unknown): email is string {
  return (
    typeof email === 'string' &&
    email.length <= LIMITS.email &&
    /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]+$/.test(email)
  );
}

export type Validated =
  | { ok: true; values: Record<string, string> }
  | { ok: false; error: string };

/** Validate `input` against `spec`; unknown keys are discarded. */
export function validate(input: Record<string, unknown>, spec: Record<string, FieldSpec>): Validated {
  const values: Record<string, string> = {};
  for (const [key, rule] of Object.entries(spec)) {
    const raw = input[key];
    const value = typeof raw === 'string' ? raw.trim() : '';
    if (!value) {
      if (rule.required) return { ok: false, error: `${label(key)} is required` };
      continue;
    }
    if (value.length > rule.max) return { ok: false, error: `${label(key)} is too long (max ${rule.max} characters)` };
    if (rule.email && !isValidEmail(value)) return { ok: false, error: 'A valid email is required' };
    values[key] = rule.email ? value.toLowerCase() : value;
  }
  return { ok: true, values };
}

function label(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Read a request body as a plain object whether it was sent as JSON (the
 * enhanced form) or as a regular form post (no JavaScript). Bodies over 32 KB
 * are rejected.
 */
export async function readBody(request: Request): Promise<{ body: Record<string, unknown> | null; isForm: boolean }> {
  const type = request.headers.get('content-type') ?? '';
  const isForm = type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data');
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 32_768) return { body: null, isForm };
  try {
    if (isForm) {
      const data = await request.formData();
      const body: Record<string, unknown> = {};
      data.forEach((v, k) => {
        if (typeof v === 'string') body[k] = v;
      });
      return { body, isForm };
    }
    const text = await request.text();
    if (text.length > 32_768) return { body: null, isForm };
    const parsed = JSON.parse(text);
    return { body: parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null, isForm };
  } catch {
    return { body: null, isForm };
  }
}

/** Hidden field bots fill in and people never see. */
export const HONEYPOT_FIELD = 'website';
export function isBot(body: Record<string, unknown>): boolean {
  const v = body[HONEYPOT_FIELD];
  return typeof v === 'string' && v.trim().length > 0;
}
