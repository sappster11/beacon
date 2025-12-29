import { Rocket } from 'lucide-react';

export default function Development() {
  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Rocket size={28} color="#8b5cf6" />
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', margin: 0 }}>Development Plans</h1>
        </div>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
          Track your career growth and skill development
        </p>
      </div>

      {/* Coming Soon Card */}
      <div style={{ maxWidth: '900px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <Rocket size={40} color="#9ca3af" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            Coming Soon
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
            We're building an exciting new way to help you track your career goals and skill development. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
}
