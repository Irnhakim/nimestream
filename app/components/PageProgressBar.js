'use client';

import { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);
  const [visible, setVisible] = useState(false);

  // Trigger completion when path changes
  useEffect(() => {
    if (active) {
      setProgress(100);
      const timer = setTimeout(() => {
        setActive(false);
        setVisible(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, active]);

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const target = e.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (!href) return;

      // Skip external links, hashes, target blanks, and same-page anchors
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        target.getAttribute('target') === '_blank' ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if target is a different route
      const currentUrl = window.location.pathname + window.location.search;
      if (href !== currentUrl) {
        setVisible(true);
        setActive(true);
        setProgress(10); // Start progress

        // Simulate progress increment
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 80) {
              clearInterval(interval);
              return prev;
            }
            return prev + 10;
          });
        }, 150);

        target.addEventListener('cleanup-loader', () => clearInterval(interval));
      }
    };

    document.addEventListener('click', handleAnchorClick, true); // Use capture phase
    return () => {
      document.removeEventListener('click', handleAnchorClick, true);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '4px', // Slightly thicker for visibility
        width: `${progress}%`,
        background: 'linear-gradient(90deg, var(--color-candy-pink), var(--color-candy-purple), var(--color-candy-cyan))',
        boxShadow: '0 0 12px rgba(60, 212, 255, 0.7), 0 0 6px rgba(255, 96, 151, 0.6)',
        zIndex: 9999999, // Set extreme high z-index to overlay header
        transition: 'width 0.25s cubic-bezier(0.1, 0.8, 0.1, 1), opacity 0.3s ease',
        opacity: progress === 100 ? 0 : 1,
        pointerEvents: 'none'
      }}
    />
  );
}

export default function PageProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
