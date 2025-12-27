import { Rocket } from 'lucide-react';

export default function Development() {
  return (
    <div style={{
      padding: '48px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
    }}>
      <div
        style={{
          textAlign: 'center',
          maxWidth: '600px',
          padding: '60px 40px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}
        >
          <Rocket size={40} color="#ffffff" />
        </div>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '12px',
          letterSpacing: '-0.5px',
        }}>
          Development Plans
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#6b7280',
          margin: '0 0 8px 0',
          lineHeight: '1.6',
        }}>
          Coming Soon
        </p>
        <p style={{
          fontSize: '15px',
          color: '#9ca3af',
          margin: 0,
          lineHeight: '1.5',
        }}>
          We're building an exciting new way to help you track your career goals and skill development. Stay tuned!
        </p>
      </div>
    </div>
  );
}
