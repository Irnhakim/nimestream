'use client';

import { useEffect } from 'react';

export default function PopunderAd() {
  useEffect(() => {
    if (document.getElementById('popunder-ad-script')) return;

    const script = document.createElement('script');
    script.id = 'popunder-ad-script';
    script.src = '/ads/popunder.js';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return null;
}
