import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// OpenNext → Cloudflare Workers config (§3). Runs Next.js (Node runtime, ISR,
// next/og) on Cloudflare. For persistent ISR/data cache across instances, add
// an R2 incremental cache here later (see @opennextjs/cloudflare docs).
export default defineCloudflareConfig({});
