import { Rocket } from 'lucide-react';

export default function Development() {
  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Rocket size={28} color="#8b5cf6" />
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>Development Plans</h1>
        </div>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          Track your career growth and skill development
        </p>
      </div>

      {/* Coming Soon Card */}
      <div
        style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
        }}
      >
        <Rocket size={40} style={{ marginBottom: '16px', color: 'var(--text-faint)' }} />
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
          Coming Soon
        </h3>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          We're building an exciting new way to help you track your career goals and skill development. Stay tuned!
        </p>
      </div>
    </div>
  );
}
