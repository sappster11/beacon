import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { profile, dataExport } from '../lib/api';
import Avatar from '../components/Avatar';
import { Camera, Save, Lock, Phone, MapPin, FileText, X, Check, AlertCircle, Download, Trash2, Database } from 'lucide-react';

export default function Settings() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name?.split(' ')[0] || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [location, setLocation] = useState(user?.location || '');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [imageError, setImageError] = useState('');

  // Data export state
  const [dataSummary, setDataSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name?.split(' ')[0] || '');
      setBio(user.bio || '');
      setPhoneNumber(user.phoneNumber || '');
      setLocation(user.location || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await profile.updateProfile({ displayName, bio, phoneNumber, location });
      await refreshUser();
      setProfileSuccess('Profile updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (error: any) {
      setProfileError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      await profile.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setImageError('Please upload a valid image file (JPG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('Image must be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    setImageError('');

    try {
      await profile.uploadProfilePicture(file);
      await refreshUser();
    } catch (error: any) {
      setImageError(error.response?.data?.error || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    setIsUploadingImage(true);
    setImageError('');

    try {
      await profile.deleteProfilePicture();
      await refreshUser();
    } catch (error: any) {
      setImageError(error.response?.data?.error || 'Failed to remove image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const loadDataSummary = async () => {
    setIsLoadingSummary(true);
    try {
      const summary = await dataExport.getSummary();
      setDataSummary(summary);
    } catch (error) {
      console.error('Failed to load data summary:', error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    setExportError('');

    try {
      const blob = await dataExport.downloadMyData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beacon-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      setExportError(error.response?.data?.error || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmEmail) {
      setDeleteError('Please enter your email to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      await dataExport.deleteAccount(deleteConfirmEmail);
      logout();
      navigate('/');
    } catch (error: any) {
      setDeleteError(error.response?.data?.error || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user) {
    return (
      <div style={{ padding: '48px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Picture Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Profile Picture
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '16px' }}>
          <Avatar user={user} size="xl" />

          <div style={{ flex: 1 }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImage}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isUploadingImage ? 0.6 : 1,
                }}
              >
                <Camera size={16} />
                {isUploadingImage ? 'Uploading...' : 'Upload Photo'}
              </button>

              {user.profilePicture && (
                <button
                  onClick={handleRemoveImage}
                  disabled={isUploadingImage}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    cursor: isUploadingImage ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isUploadingImage ? 0.6 : 1,
                  }}
                >
                  <X size={16} />
                  Remove
                </button>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              JPG, PNG, GIF or WebP. Max 5MB.
            </p>
          </div>
        </div>

        {imageError && (
          <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {imageError}
          </div>
        )}
      </div>

      {/* Profile Information Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Profile Information
        </h2>

        <form onSubmit={handleProfileUpdate}>
          {/* Display Name */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="How you'd like to be greeted"
              maxLength={50}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
              }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              This is how you'll be greeted on the Dashboard (e.g., "Welcome back, {displayName || 'Your Name'}")
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <FileText size={16} />
              Bio / About Me
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              maxLength={500}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                minHeight: '120px',
              }}
            />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>
              {bio.length}/500 characters
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Phone size={16} />
              Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+1 (555) 123-4567"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Location */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="San Francisco, CA"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Success/Error Messages */}
          {profileSuccess && (
            <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {profileError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isUpdatingProfile}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isUpdatingProfile ? 0.6 : 1,
            }}
          >
            <Save size={16} />
            {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Password Change Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange}>
          {/* Current Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={16} />
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* New Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={16} />
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              <Lock size={16} />
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Success/Error Messages */}
          {passwordSuccess && (
            <div style={{ padding: '12px', background: '#d1fae5', color: '#065f46', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Check size={16} />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isChangingPassword}
            style={{
              padding: '12px 24px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: isChangingPassword ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: isChangingPassword ? 0.6 : 1,
            }}
          >
            <Lock size={16} />
            {isChangingPassword ? 'Changing Password...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Read-only Account Info */}
      <div
        style={{
          background: 'var(--bg-tertiary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '32px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Account Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Full Name
            </label>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{user.name}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Email
            </label>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{user.email}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Role
            </label>
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{user.role.replace('_', ' ')}</p>
          </div>

          {user.title && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                Title
              </label>
              <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{user.title}</p>
            </div>
          )}
        </div>

        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '16px', marginBottom: 0 }}>
          Contact your administrator to update your name, email, role, or title.
        </p>
      </div>

      {/* Data & Privacy Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '32px',
          marginTop: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', margin: '0 0 8px 0' }}>
          Data & Privacy
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Manage your personal data. Learn more in our{' '}
          <Link to="/privacy" style={{ color: '#3b82f6', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>.
        </p>

        {/* Data Export */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: '#dbeafe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Database size={24} color="#3b82f6" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Export Your Data
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Download a copy of all your personal data including goals, reviews, one-on-ones, and development plans.
              </p>

              {dataSummary && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '16px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                  gap: '16px',
                }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{dataSummary.goals}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Goals</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{dataSummary.reviews}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Reviews</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{dataSummary.oneOnOnes}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>1:1 Meetings</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{dataSummary.developmentPlans}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Dev Plans</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {!dataSummary && (
                  <button
                    onClick={loadDataSummary}
                    disabled={isLoadingSummary}
                    style={{
                      padding: '10px 20px',
                      background: 'transparent',
                      color: '#3b82f6',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      cursor: isLoadingSummary ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      opacity: isLoadingSummary ? 0.6 : 1,
                    }}
                  >
                    {isLoadingSummary ? 'Loading...' : 'Preview Data'}
                  </button>
                )}
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  style={{
                    padding: '10px 20px',
                    background: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isExporting ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isExporting ? 0.6 : 1,
                  }}
                >
                  <Download size={16} />
                  {isExporting ? 'Exporting...' : 'Download My Data'}
                </button>
              </div>

              {exportError && (
                <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginTop: '12px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={16} />
                  {exportError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0 0 32px 0' }} />

        {/* Account Deletion */}
        <div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '10px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Trash2 size={24} color="#dc2626" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
                Delete Account
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '10px 20px',
                    background: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Delete My Account
                </button>
              ) : (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '20px',
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#991b1b', fontWeight: '500', margin: '0 0 16px 0' }}>
                    Are you absolutely sure? This will permanently delete:
                  </p>
                  <ul style={{ fontSize: '14px', color: '#7f1d1d', margin: '0 0 16px 0', paddingLeft: '20px' }}>
                    <li>Your profile and account information</li>
                    <li>All your goals and progress</li>
                    <li>Your performance reviews</li>
                    <li>One-on-one meeting notes</li>
                    <li>Development plans</li>
                  </ul>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                      Type your email to confirm: <strong>{user.email}</strong>
                    </label>
                    <input
                      type="email"
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      placeholder={user.email}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>

                  {deleteError && (
                    <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertCircle size={16} />
                      {deleteError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmEmail('');
                        setDeleteError('');
                      }}
                      style={{
                        padding: '10px 20px',
                        background: 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || deleteConfirmEmail.toLowerCase() !== user.email.toLowerCase()}
                      style={{
                        padding: '10px 20px',
                        background: deleteConfirmEmail.toLowerCase() === user.email.toLowerCase() ? '#dc2626' : 'var(--text-faint)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isDeleting || deleteConfirmEmail.toLowerCase() !== user.email.toLowerCase() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Trash2 size={16} />
                      {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
