'use client';

import { useEffect } from 'react';

export default function PopunderAd() {
  useEffect(() => {
    // Hindari inject ulang jika sudah ada
    if (document.getElementById('popunder-ad-script')) return;

    const script = document.createElement('script');
    script.id = 'popunder-ad-script';
    script.src = '/ads/popunder.js';
    script.async = true;
    script.onload = () => {
      try {
        // Script expose 'pop' ke window lewat src_pop, coba akses dari window
        const p = window.pop || window.src_pop;
        if (p && p.popMethods) {
          p.popMethods
            .add(
              'https://fluffy-machine.com/bh3.Vm0OP/3jpSvzbNmmVLJ/ZZDi0s3vMsj/Qm2zO/T-YIxaLpTzc/ybNDDXY_5iNCjmUp',
              {
                under: true,
                newTab: true,
                cookieExpires: 86400,
              }
            )
            .config({
              perpage: 1,
            });
        }
      } catch (e) {
        console.error('PopunderAd error:', e);
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
