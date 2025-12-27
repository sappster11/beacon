import { Link } from 'react-router-dom';

export default function Dev() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1a2e',
      padding: '40px 20px',
      color: 'white',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Dev Navigation</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '40px' }}>All pages and test accounts</p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {/* Public Pages */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#667eea' }}>Public</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/', label: 'Landing' },
                { to: '/login', label: 'Login' },
                { to: '/register', label: 'Register' },
                { to: '/forgot-password', label: 'Forgot Password' },
                { to: '/reset-password', label: 'Reset Password' },
                { to: '/accept-invite', label: 'Accept Invite' },
                { to: '/terms', label: 'Terms of Service' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '14px',
                }}>{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Authenticated Pages */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#10b981' }}>Authenticated</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/dashboard', label: 'Dashboard' },
                { to: '/reviews', label: 'Reviews' },
                { to: '/one-on-ones', label: 'One-on-Ones' },
                { to: '/goals', label: 'Goals' },
                { to: '/development', label: 'Development' },
                { to: '/employees', label: 'Org Chart' },
                { to: '/settings', label: 'Settings' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '14px',
                }}>{link.label}</Link>
              ))}
            </div>
          </div>

          {/* Manager & Admin Pages */}
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#f59e0b' }}>Manager & Admin</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/team', label: 'Team (Manager+)' },
                { to: '/review-management', label: 'Review Management (Admin)' },
                { to: '/admin', label: 'Admin Panel (Admin)' },
                { to: '/platform-admin', label: 'Platform Admin' },
              ].map(link => (
                <Link key={link.to} to={link.to} style={{
                  color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.05)',
                  fontSize: '14px',
                }}>{link.label}</Link>
              ))}
            </div>
          </div>
        </div>

        {/* Test Accounts */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '12px',
          padding: '24px',
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#ec4899' }}>
            Test Accounts <span style={{ fontWeight: 'normal', color: 'rgba(255,255,255,0.5)' }}>(password: password123)</span>
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '14px',
          }}>
            <div><strong>Admin:</strong> admin@beacon.com</div>
            <div><strong>Manager:</strong> manager@beacon.com</div>
            <div><strong>Employee:</strong> john@beacon.com</div>
            <div><strong>Employee:</strong> sarah@beacon.com</div>
            <div><strong>PM:</strong> product@beacon.com</div>
          </div>
        </div>
      </div>
    </div>
  );
}
