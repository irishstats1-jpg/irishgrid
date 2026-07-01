import Script from 'next/script';

// Cookieless, privacy-friendly analytics (§14). Renders the Plausible script
// only when NEXT_PUBLIC_ANALYTICS_DOMAIN is set, so there is no tracking (and no
// consent banner needed) until it's configured. Swap the src for Umami if preferred.
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_ANALYTICS_DOMAIN;
  if (!domain) return null;
  return (
    <Script
      defer
      data-domain={domain}
      src="https://plausible.io/js/script.js"
      strategy="afterInteractive"
    />
  );
}
