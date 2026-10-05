import { getCloudflareContext } from '@opennextjs/cloudflare';

// Per-IP rate limiting via Cloudflare's Workers rate-limiting binding
// (`FORMS_LIMITER` in wrangler.toml: 5 requests / 60 s per key). Outside
// Cloudflare (local dev, tests) there is no binding and requests pass.

interface Limiter {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export async function isRateLimited(request: Request, scope: string): Promise<boolean> {
  let limiter: Limiter | undefined;
  try {
    const { env } = getCloudflareContext();
    limiter = (env as unknown as { FORMS_LIMITER?: Limiter }).FORMS_LIMITER;
  } catch {
    return false;
  }
  if (!limiter) return false;
  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  try {
    const { success } = await limiter.limit({ key: `${scope}:${ip}` });
    return !success;
  } catch {
    return false;
  }
}
