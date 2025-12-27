import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { profile } from '../lib/api';
import Avatar from '../components/Avatar';
import { Camera, Save, Lock, Phone, MapPin, FileText, X, Check, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile form state
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

  useEffect(() => {
    if (user) {
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
      await profile.updateProfile({ bio, phoneNumber, location });
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
    <div style={{ padding: '48px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Settings
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
          Manage your profile and account settings
        </p>
      </div>

      {/* Profile Picture Section */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: '0 0 24px 0' }}>
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

            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
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
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Profile Information
        </h2>

        <form onSubmit={handleProfileUpdate}>
          {/* Bio */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', textAlign: 'right' }}>
              {bio.length}/500 characters
            </div>
          </div>

          {/* Phone Number */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
          marginBottom: '24px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Change Password
        </h2>

        <form onSubmit={handlePasswordChange}>
          {/* Current Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0 0' }}>
              Must be at least 8 characters
            </p>
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
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
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '32px',
        }}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px', margin: '0 0 24px 0' }}>
          Account Information
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Full Name
            </label>
            <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user.name}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Email
            </label>
            <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user.email}</p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
              Role
            </label>
            <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user.role.replace('_', ' ')}</p>
          </div>

          {user.title && (
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>
                Title
              </label>
              <p style={{ fontSize: '14px', color: '#111827', margin: 0 }}>{user.title}</p>
            </div>
          )}
        </div>

        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '16px', marginBottom: 0 }}>
          Contact your administrator to update your name, email, role, or title.
        </p>
      </div>
    </div>
  );
}
