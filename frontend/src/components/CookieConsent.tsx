import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Cookie } from 'lucide-react';

const COOKIE_CONSENT_KEY = 'beacon_cookie_consent';

type ConsentStatus = 'pending' | 'accepted' | 'declined';

export default function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus>('pending');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored === 'accepted' || stored === 'declined') {
      setStatus(stored);
    } else {
      // Delay showing the banner slightly for better UX
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setStatus('accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined');
    setStatus('declined');
    setIsVisible(false);
  };

  if (status !== 'pending' || !isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#1f2937',
        borderTop: '1px solid #374151',
        padding: '16px 20px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '280px' }}>
          <Cookie size={24} color="#9ca3af" style={{ flexShrink: 0 }} />
          <p style={{ margin: 0, color: '#e5e7eb', fontSize: '14px', lineHeight: '1.5' }}>
            We use cookies to enhance your experience. By continuing to use this site, you agree to our{' '}
            <Link to="/privacy" style={{ color: '#60a5fa', textDecoration: 'underline' }}>
              Privacy Policy
            </Link>{' '}
            and use of cookies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <button
            onClick={handleDecline}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid #4b5563',
              borderRadius: '6px',
              color: '#9ca3af',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#6b7280';
              e.currentTarget.style.color = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#4b5563';
              e.currentTarget.style.color = '#9ca3af';
            }}
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            style={{
              padding: '8px 20px',
              background: '#3b82f6',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  );
}
