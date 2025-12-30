import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Save, Settings as SettingsIcon } from 'lucide-react';
import { settings as settingsApi } from '../../lib/api';

export default function AdminSettingsTab() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Settings state
  const [reviewSettings, setReviewSettings] = useState({
    scaleMin: 1,
    scaleMax: 4,
    scaleLabels: {
      1: 'Not Effective',
      2: 'Minimally Effective',
      3: 'Effective',
      4: 'Highly Effective'
    }
  });

  const [notificationSettings, setNotificationSettings] = useState({
    // Review notifications
    reviewDeadlineReminder: true,
    reviewDeadlineReminderDays: 7,
    selfReviewSubmissionReminder: true,
    selfReviewSubmissionReminderDays: 3,
    managerPendingReviewReminder: true,
    managerPendingReviewReminderFrequency: 'daily',
    overdueReviewReminder: true,

    // One-on-one notifications
    oneOnOneReminder: true,
    oneOnOneReminderHours: 24,
    oneOnOneSummaryReminder: true,

    // Goal notifications
    goalReminder: true,
    goalReminderFrequency: 'weekly',
    goalDeadlineReminder: true,
    goalDeadlineReminderDays: 7,

    // Feedback notifications
    feedbackRequestNotification: true,
    newFeedbackNotification: true
  });

  const [featureFlags, setFeatureFlags] = useState({
    goalsEnabled: true,
    developmentPlansEnabled: true,
    peerFeedbackEnabled: true,
    competencyCommentsEnabled: true
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsApi.getAll();

      // Merge with defaults to ensure all fields exist
      if (allSettings.review) {
        setReviewSettings(prev => ({ ...prev, ...allSettings.review, scaleLabels: { ...prev.scaleLabels, ...(allSettings.review as any)?.scaleLabels } }));
      }
      if (allSettings.notifications) {
        setNotificationSettings(prev => ({ ...prev, ...allSettings.notifications }));
      }
      if (allSettings.features) {
        setFeatureFlags(prev => ({ ...prev, ...allSettings.features }));
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category: string, settingsData: any) => {
    try {
      setSaving(category);
      await settingsApi.update(category, settingsData);
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading settings...</div>;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Review Settings */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <SettingsIcon size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Review Settings
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Rating Scale
            </label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="number"
                value={reviewSettings.scaleMin}
                onChange={(e) => setReviewSettings({ ...reviewSettings, scaleMin: parseInt(e.target.value) })}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                min="1"
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input
                type="number"
                value={reviewSettings.scaleMax}
                onChange={(e) => setReviewSettings({ ...reviewSettings, scaleMax: parseInt(e.target.value) })}
                style={{
                  width: '80px',
                  padding: '8px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                min="2"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Scale Labels
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(reviewSettings.scaleLabels || {}).map(([key, value]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', width: '20px' }}>{key}:</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setReviewSettings({
                      ...reviewSettings,
                      scaleLabels: { ...reviewSettings.scaleLabels, [key]: e.target.value }
                    })}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => saveSettings('review', reviewSettings)}
          disabled={saving === 'review'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: saving === 'review' ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving === 'review' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {saving === 'review' ? 'Saving...' : 'Save Review Settings'}
        </button>
      </div>

      {/* Notification Settings */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <SettingsIcon size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Notification Settings
          </h3>
        </div>

        {/* Review Notifications */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Review Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.reviewDeadlineReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, reviewDeadlineReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Review deadline reminders
                </span>
              </label>
              {notificationSettings.reviewDeadlineReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <input
                    type="number"
                    value={notificationSettings.reviewDeadlineReminderDays}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, reviewDeadlineReminderDays: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>days before deadline</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.selfReviewSubmissionReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, selfReviewSubmissionReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Self-review submission reminders
                </span>
              </label>
              {notificationSettings.selfReviewSubmissionReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <input
                    type="number"
                    value={notificationSettings.selfReviewSubmissionReminderDays}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, selfReviewSubmissionReminderDays: parseInt(e.target.value) })}
                    min="1"
                    max="14"
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>days before deadline</span>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.managerPendingReviewReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, managerPendingReviewReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Manager pending review reminders
                </span>
              </label>
              {notificationSettings.managerPendingReviewReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <select
                    value={notificationSettings.managerPendingReviewReminderFrequency}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, managerPendingReviewReminderFrequency: e.target.value })}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="daily">Daily</option>
                    <option value="every-3-days">Every 3 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationSettings.overdueReviewReminder}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, overdueReviewReminder: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Overdue review notifications
              </span>
            </label>
          </div>
        </div>

        {/* One-on-One Notifications */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            One-on-One Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.oneOnOneReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, oneOnOneReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Upcoming meeting reminders
                </span>
              </label>
              {notificationSettings.oneOnOneReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <input
                    type="number"
                    value={notificationSettings.oneOnOneReminderHours}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, oneOnOneReminderHours: parseInt(e.target.value) })}
                    min="1"
                    max="168"
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>hours before meeting</span>
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationSettings.oneOnOneSummaryReminder}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, oneOnOneSummaryReminder: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Meeting summary reminders (for incomplete summaries)
              </span>
            </label>
          </div>
        </div>

        {/* Goal Notifications */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Goal Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '8px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.goalReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, goalReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Goal progress reminders
                </span>
              </label>
              {notificationSettings.goalReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <select
                    value={notificationSettings.goalReminderFrequency}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, goalReminderFrequency: e.target.value })}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={notificationSettings.goalDeadlineReminder}
                  onChange={(e) => setNotificationSettings({ ...notificationSettings, goalDeadlineReminder: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Goal deadline reminders
                </span>
              </label>
              {notificationSettings.goalDeadlineReminder && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '28px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Send reminder</span>
                  <input
                    type="number"
                    value={notificationSettings.goalDeadlineReminderDays}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, goalDeadlineReminderDays: parseInt(e.target.value) })}
                    min="1"
                    max="30"
                    style={{
                      width: '60px',
                      padding: '6px 8px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      fontSize: '13px'
                    }}
                  />
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>days before deadline</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Feedback Notifications */}
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Feedback Notifications
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationSettings.feedbackRequestNotification}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, feedbackRequestNotification: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Feedback request notifications
              </span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notificationSettings.newFeedbackNotification}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, newFeedbackNotification: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#3b82f6' }}
              />
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                New feedback received notifications
              </span>
            </label>
          </div>
        </div>

        <button
          onClick={() => saveSettings('notifications', notificationSettings)}
          disabled={saving === 'notifications'}
          style={{
            marginTop: '24px',
            padding: '10px 20px',
            background: saving === 'notifications' ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving === 'notifications' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {saving === 'notifications' ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>

      {/* Feature Flags (SUPER_ADMIN only) */}
      {isSuperAdmin && (
        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <SettingsIcon size={20} style={{ color: '#3b82f6' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
              Feature Flags
            </h3>
            <span style={{
              padding: '4px 8px',
              background: '#fef3c7',
              color: '#92400e',
              fontSize: '11px',
              fontWeight: '600',
              borderRadius: '4px'
            }}>
              SUPER ADMIN ONLY
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(featureFlags).map(([key, value]) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => setFeatureFlags({ ...featureFlags, [key]: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </span>
              </label>
            ))}
          </div>

          <button
            onClick={() => saveSettings('features', featureFlags)}
            disabled={saving === 'features'}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: saving === 'features' ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: saving === 'features' ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Save size={16} />
            {saving === 'features' ? 'Saving...' : 'Save Feature Flags'}
          </button>
        </div>
      )}
    </div>
  );
}
