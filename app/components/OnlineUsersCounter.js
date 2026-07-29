'use client';

import { useState, useEffect } from 'react';

export default function OnlineUsersCounter() {
  const [onlineCount, setOnlineCount] = useState(1);

  useEffect(() => {
    // Generate a unique session ID for this browser tab
    const randomId = Math.random().toString(36).substring(2, 15);
    const sessionId = `ns-session-${Date.now()}-${randomId}`;

    const sendHeartbeat = async () => {
      try {
        const res = await fetch('/api/online-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.online === 'number') {
            setOnlineCount(data.online);
          }
        }
      } catch (err) {
        console.error('Heartbeat error:', err);
      }
    };

    // Send initial heartbeat immediately
    sendHeartbeat();

    // Send heartbeat every 20 seconds to stay marked active
    const interval = setInterval(sendHeartbeat, 20000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '0.4rem',
        padding: '0.35rem 0.75rem',
        borderRadius: '9999px',
        backgroundColor: 'rgba(60, 212, 255, 0.06)',
        border: '1px solid rgba(60, 212, 255, 0.15)',
        fontSize: '0.75rem',
        fontWeight: '700',
        color: 'var(--color-candy-cyan)',
        marginRight: '0.5rem',
        flexShrink: 0
      }}
    >
      <span 
        style={{ 
          width: '7px', 
          height: '7px', 
          borderRadius: '50%', 
          backgroundColor: '#3cd4ff',
          boxShadow: '0 0 8px #3cd4ff',
          display: 'inline-block',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}
      />
      <span>{onlineCount} Online</span>

      <style>{`
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.5; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
