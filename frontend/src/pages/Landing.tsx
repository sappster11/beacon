import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px',
      position: 'relative',
    }}>
      {/* Logo in top left */}
      <div style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'white',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          color: '#667eea',
          fontSize: '20px'
        }}>
          B
        </div>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '700', margin: 0 }}>Beacon</h1>
      </div>

      {/* Hero Content */}
      <div style={{ maxWidth: '900px' }}>
        <h2 style={{
          fontSize: '72px',
          fontWeight: '800',
          color: 'white',
          margin: '0 0 32px 0',
          lineHeight: '1.1',
        }}>
          Performance Management<br />That Actually Works
        </h2>
        <p style={{
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.95)',
          margin: '0 0 56px 0',
          lineHeight: '1.5',
        }}>
          Empower your team with continuous feedback, goal alignment, and meaningful development conversations.
        </p>
        <Link
          to="/login"
          style={{
            display: 'inline-block',
            padding: '20px 56px',
            background: 'white',
            color: '#667eea',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '700',
            fontSize: '20px',
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
          Sign In
        </Link>
      </div>
    </div>
  );
}
