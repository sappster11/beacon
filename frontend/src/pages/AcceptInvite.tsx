import { useState, FormEvent, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Check, CheckCircle, XCircle, Loader } from 'lucide-react';
import { invitations as invitationsApi } from '../lib/api';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<{
    email: string;
    name: string;
    organizationName: string;
  } | null>(null);

  const passwordRequirements = [
    { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
    { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
    { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
    { label: 'Number', test: (p: string) => /\d/.test(p) },
    { label: 'Special character', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
  ];

  const allPasswordRequirementsMet = passwordRequirements.every(req => req.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword !== '';

  useEffect(() => {
    if (!token) {
      setIsValidating(false);
      setError('Invalid invitation link');
      return;
    }

    validateToken();
  }, [token]);

  const validateToken = async () => {
    try {
      const result = await invitationsApi.validateToken(token!);
      if (result.valid && result.invitation) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Invalid invitation');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid or expired invitation');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allPasswordRequirementsMet) {
      setError('Password does not meet all requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await invitationsApi.accept(token!, password);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  };

  // Loading state
  if (isValidating) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
        }}>
          <Loader size={48} color="#667eea" style={{ animation: 'spin 1s linear infinite' }} />
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Validating invitation...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#dcfce7',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
          }}>
            <CheckCircle size={32} color="#16a34a" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '12px',
          }}>
            Account created!
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
          }}>
            Welcome to {invitation?.organizationName}! You can now log in with your email and password.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!invitation) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          padding: '48px',
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
          }}>
            <XCircle size={32} color="#dc2626" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '12px',
          }}>
            Invalid Invitation
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
            marginBottom: '24px',
          }}>
            {error || 'This invitation link is invalid or has expired. Please contact your administrator for a new invitation.'}
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Back Link */}
      <Link
        to="/login"
        style={{
          position: 'absolute',
          top: '40px',
          left: '40px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'white',
          textDecoration: 'none',
          fontSize: '16px',
          fontWeight: '500',
        }}
      >
        <ArrowLeft size={20} />
        Back to Login
      </Link>

      {/* Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '48px',
        width: '100%',
        maxWidth: '440px',
      }}>
        {/* Icon & Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
          }}>
            <Lock size={28} color="white" />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '8px',
          }}>
            Welcome, {invitation.name}!
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280',
          }}>
            You've been invited to join <strong>{invitation.organizationName}</strong>
          </p>
          <p style={{
            fontSize: '14px',
            color: '#9ca3af',
            marginTop: '8px',
          }}>
            Create a password to complete your account setup
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="email" style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={invitation.email}
              disabled
              style={{
                ...inputStyle,
                background: '#f9fafb',
                color: '#6b7280',
                cursor: 'not-allowed',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="password" style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
            />
            {/* Password Requirements */}
            <div style={{ marginTop: '12px' }}>
              {passwordRequirements.map((req, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: req.test(password) ? '#059669' : '#6b7280',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: req.test(password) ? '#059669' : '#e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {req.test(password) && <Check size={10} color="white" />}
                  </div>
                  {req.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="confirmPassword" style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
            }}>
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                ...inputStyle,
                borderColor: confirmPassword && !passwordsMatch ? '#dc2626' : '#e5e7eb',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
              onBlur={(e) => e.currentTarget.style.borderColor = confirmPassword && !passwordsMatch ? '#dc2626' : '#e5e7eb'}
            />
            {confirmPassword && !passwordsMatch && (
              <p style={{
                fontSize: '13px',
                color: '#dc2626',
                marginTop: '8px',
              }}>
                Passwords do not match
              </p>
            )}
          </div>

          {error && (
            <div style={{
              color: '#991b1b',
              marginBottom: '20px',
              padding: '12px 16px',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !allPasswordRequirementsMet || !passwordsMatch}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              background: isLoading || !allPasswordRequirementsMet || !passwordsMatch
                ? '#9ca3af'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isLoading || !allPasswordRequirementsMet || !passwordsMatch ? 'not-allowed' : 'pointer',
            }}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
