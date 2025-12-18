/**
 * ────────────────────────────────────
 * GOOGLE TAG MANAGER SCRIPT
 * ────────────────────────────────────
 * Script do GTM para Next.js App Router
 */

'use client';

import Script from 'next/script';

const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || 'G-B21PK9JQYS';

export function GoogleTagManager() {
  return (
    <>
      {/* Google tag (gtag.js) */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}
