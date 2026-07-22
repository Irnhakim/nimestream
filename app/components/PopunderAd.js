'use client';

import Script from 'next/script';

export default function PopunderAd() {
  return (
    <Script
      id="popunder-ad"
      src="/ads/popunder.js"
      strategy="afterInteractive"
    />
  );
}
