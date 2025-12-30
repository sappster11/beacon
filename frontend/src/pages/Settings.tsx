import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profile } from '../lib/api';
import Avatar from '../components/Avatar';
import { Camera, Save, Lock, X, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
  const [displayName, setDisplayName] = useState(user?.displayName || user?.name?.split(' ')[0] || '');

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

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || user.name?.split(' ')[0] || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await profile.updateProfile({ displayName });
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

  if (!user) {
    return (
      <div style={{ padding: '48px' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Section - Picture and Display Name combined */}
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
          Profile
        </h2>

        <form onSubmit={handleProfileUpdate}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', marginBottom: '24px' }}>
            {/* Avatar */}
            <div>
              <Avatar user={user} size="xl" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            {/* Display Name */}
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
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
                This is how you'll be greeted (e.g., "Welcome back, {displayName || 'Your Name'}")
              </div>
            </div>
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

          {imageError && (
            <div style={{ padding: '12px', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} />
              {imageError}
            </div>
          )}

          {/* Buttons on same line */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingImage}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
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
                type="button"
                onClick={handleRemoveImage}
                disabled={isUploadingImage}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
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

            <button
              type="submit"
              disabled={isUpdatingProfile}
              style={{
                padding: '10px 20px',
                background: 'var(--color-primary)',
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
              {isUpdatingProfile ? 'Saving...' : 'Save'}
            </button>
          </div>
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
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
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
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
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
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
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
              background: 'var(--color-primary)',
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
            <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</p>
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
    </div>
  );
}
