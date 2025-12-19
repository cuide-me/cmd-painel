'use client';

import Script from 'next/script';

export function GoogleTagManager() {
  const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

  if (!GA4_ID) {
    console.warn('[GA4] NEXT_PUBLIC_GA4_ID não configurado');
    return null;
  }

  return (
    <>
      {/* Google Tag Manager */}
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
      />
      <Script
        id="gtag-init"
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
