import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: 'clamp(20px, 5vw, 40px)',
      paddingTop: 'clamp(80px, 15vw, 120px)',
      boxSizing: 'border-box',
      overflowX: 'hidden',
    }}>
      {/* Logo in top left */}
      <div style={{
        position: 'absolute',
        top: 'clamp(16px, 4vw, 40px)',
        left: 'clamp(16px, 4vw, 40px)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: 'clamp(32px, 8vw, 40px)',
          height: 'clamp(32px, 8vw, 40px)',
          background: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          color: '#667eea',
          fontSize: 'clamp(16px, 4vw, 20px)'
        }}>
          B
        </div>
        <h1 style={{
          color: 'white',
          fontSize: 'clamp(18px, 5vw, 24px)',
          fontWeight: '700',
          margin: 0
        }}>
          Beacon
        </h1>
      </div>

      {/* Hero Content */}
      <div style={{
        maxWidth: '900px',
        width: '100%',
        padding: '0 clamp(8px, 2vw, 20px)',
        boxSizing: 'border-box',
      }}>
        <h2 style={{
          fontSize: 'clamp(28px, 8vw, 72px)',
          fontWeight: '800',
          color: 'white',
          margin: '0 0 clamp(16px, 4vw, 32px) 0',
          lineHeight: '1.1',
          wordWrap: 'break-word',
        }}>
          Performance Management That Actually Works
        </h2>
        <p style={{
          fontSize: 'clamp(16px, 4vw, 24px)',
          color: 'rgba(255, 255, 255, 0.95)',
          margin: '0 0 clamp(32px, 6vw, 56px) 0',
          lineHeight: '1.5',
        }}>
          Empower your team with continuous feedback, goal alignment, and meaningful development conversations.
        </p>
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 'clamp(12px, 3vw, 20px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              padding: 'clamp(14px, 3vw, 20px) clamp(32px, 8vw, 56px)',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: 'clamp(16px, 4vw, 20px)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 25px 70px rgba(0, 0, 0, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.3)';
            }}
          >
            Get Started
          </Link>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: 'clamp(14px, 3vw, 20px) clamp(32px, 8vw, 56px)',
              background: 'transparent',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: 'clamp(16px, 4vw, 20px)',
              border: '2px solid white',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* All Pages Navigation */}
      <div style={{
        marginTop: 'clamp(60px, 10vw, 100px)',
        width: '100%',
        maxWidth: '1200px',
        padding: '0 clamp(16px, 4vw, 40px)',
        boxSizing: 'border-box',
      }}>
        <h3 style={{
          color: 'white',
          fontSize: 'clamp(18px, 4vw, 24px)',
          fontWeight: '600',
          marginBottom: '24px',
          textAlign: 'center',
        }}>
          All Pages
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '24px',
        }}>
          {/* Public Pages */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              Public
            </h4>
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
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Authenticated Pages */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              Authenticated
            </h4>
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
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Manager & Admin Pages */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}>
            <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              Manager & Admin
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/team', label: 'Team (Manager+)' },
                { to: '/review-management', label: 'Review Management (Admin)' },
                { to: '/admin', label: 'Admin Panel (Admin)' },
                { to: '/platform-admin', label: 'Platform Admin' },
              ].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    textDecoration: 'none',
                    fontSize: '14px',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Test Accounts */}
        <div style={{
          marginTop: '32px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
          textAlign: 'left',
        }}>
          <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
            Test Accounts (password: password123)
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
          }}>
            <div><strong style={{ color: 'white' }}>Admin:</strong> admin@beacon.com</div>
            <div><strong style={{ color: 'white' }}>Manager:</strong> manager@beacon.com</div>
            <div><strong style={{ color: 'white' }}>Employee:</strong> john@beacon.com</div>
            <div><strong style={{ color: 'white' }}>Employee:</strong> sarah@beacon.com</div>
            <div><strong style={{ color: 'white' }}>PM:</strong> product@beacon.com</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '60px',
        paddingBottom: '32px',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(16px, 4vw, 24px)',
          flexWrap: 'wrap',
        }}>
          <Link
            to="/terms"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
          >
            Terms of Service
          </Link>
          <Link
            to="/privacy"
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              textDecoration: 'none',
              fontSize: '14px',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
          >
            Privacy Policy
          </Link>
        </div>
        <p style={{
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          margin: '12px 0 0 0',
        }}>
          &copy; {new Date().getFullYear()} Homestead Studio. All rights reserved.
        </p>
      </div>
    </div>
  );
}
