'use client';

import Script from 'next/script';

export default function PopunderAd() {
  return (
    <>
      <Script
        id="popunder-ad"
        src="/ads/popunder.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            if (typeof pop !== 'undefined' && pop.popMethods) {
              pop.popMethods
                .add('https://fluffy-machine.com/bh3.Vm0OP/3jpSvzbNmmVLJ/ZZDi0s3vMsj/Qm2zO/T-YIxaLpTzc/ybNDDXY_5iNCjmUp', {
                  under: true,
                  newTab: true,
                  cookieExpires: 86400,
                })
                .config({
                  perpage: 1,
                });
            }
          } catch (e) {}
        }}
      />
    </>
  );
}
