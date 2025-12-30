import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { Home, Target, ClipboardList, Users, TrendingUp, LogOut, Menu, X, Building2, UsersRound, Settings, Globe, BookOpen, HelpCircle, Moon, Sun } from 'lucide-react';
import Avatar from './Avatar';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const { user, logout } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  // Apply dark mode to document
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode.toString());
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Check platform admin status
  useEffect(() => {
    const checkPlatformAdmin = async () => {
      if (!user) {
        setIsPlatformAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      setIsPlatformAdmin(!!data);
    };
    checkPlatformAdmin();
  }, [user]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/reviews', label: 'Reviews', icon: ClipboardList },
    { path: '/one-on-ones', label: '1:1s', icon: Users },
    { path: '/goals', label: 'Goals', icon: Target },
    { path: '/development', label: 'Development', icon: TrendingUp, comingSoon: true },
    { path: '/employees', label: 'Org Chart', icon: UsersRound },
    { path: '/help', label: 'Help', icon: HelpCircle },
  ];

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';
  const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  const managementItems = [];
  if (isManager) {
    managementItems.push({ path: '/team', label: 'Team', icon: Building2 });
    managementItems.push({ path: '/library', label: 'Library', icon: BookOpen });
  }
  if (isAdmin) {
    managementItems.push({ path: '/review-management', label: 'Review Management', icon: ClipboardList });
    managementItems.push({ path: '/admin', label: 'Admin', icon: Settings });
  }

  const platformItems = [];
  if (isPlatformAdmin) {
    platformItems.push({ path: '/platform-admin', label: 'Platform Admin', icon: Globe });
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1001,
          padding: '8px',
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'none',
        }}
        className="mobile-menu-button"
      >
        {isMobileMenuOpen ? <X size={20} color="var(--text-primary)" /> : <Menu size={20} color="var(--text-primary)" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 999,
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Left Sidebar */}
      <aside
        style={{
          width: '240px',
          background: 'var(--bg-primary)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          zIndex: 1000,
          transition: 'transform 0.3s ease',
        }}
        className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}
      >
        {/* Logo */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--border-color)',
          }}
        >
          <div
            onClick={() => navigate('/')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            {branding.logo ? (
              <img
                src={branding.logo}
                alt="Company logo"
                style={{
                  maxHeight: '36px',
                  maxWidth: '160px',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.5px',
                }}
              >
                Beacon
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '4px',
                  border: 'none',
                  background: active ? 'var(--color-primary)' : 'transparent',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: active ? '500' : '400',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'var(--bg-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                <Icon size={18} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {(item as any).comingSoon && (
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: active ? 'rgba(254, 243, 199, 0.2)' : '#fef3c7',
                      color: active ? '#fef3c7' : '#92400e',
                      fontSize: '9px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Soon
                  </span>
                )}
              </button>
            );
          })}

          {/* Management Section */}
          {managementItems.length > 0 && (
            <>
              <div
                style={{
                  padding: '16px 8px 8px 8px',
                  marginTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Management
                </div>
              </div>
              {managementItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      border: 'none',
                      background: active ? 'var(--color-secondary)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: active ? '500' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}

          {/* Platform Section (Platform Admins only) */}
          {platformItems.length > 0 && (
            <>
              <div
                style={{
                  padding: '16px 8px 8px 8px',
                  marginTop: '8px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Platform
                </div>
              </div>
              {platformItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      marginBottom: '4px',
                      border: 'none',
                      background: active ? 'var(--color-accent)' : 'transparent',
                      color: active ? '#ffffff' : 'var(--text-muted)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: active ? '500' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 0.15s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }
                    }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </>
          )}
        </nav>

        {/* User Info & Logout */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          <button
            onClick={() => {
              navigate('/settings');
              setIsMobileMenuOpen(false);
            }}
            style={{
              width: '100%',
              padding: '12px',
              background: 'var(--bg-tertiary)',
              border: 'none',
              borderRadius: '8px',
              marginBottom: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
          >
            <Avatar
              user={{ name: user?.name || '', profilePicture: user?.profilePicture }}
              size="sm"
            />
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '2px' }}>
                {user?.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {user?.role.replace('_', ' ')}
              </div>
            </div>
            <Settings size={16} style={{ color: 'var(--text-faint)' }} />
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginBottom: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
              <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div
              style={{
                width: '36px',
                height: '20px',
                borderRadius: '10px',
                background: isDarkMode ? '#3b82f6' : '#d1d5db',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  position: 'absolute',
                  top: '2px',
                  left: isDarkMode ? '18px' : '2px',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                }}
              />
            </div>
          </button>

          <button
            onClick={logout}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '400',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#fef2f2';
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main
        style={{
          marginLeft: '240px',
          flex: 1,
          minHeight: '100vh',
          background: 'var(--bg-secondary)',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
