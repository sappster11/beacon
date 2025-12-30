import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Integration } from '../../types/index';
import { Plug, CheckCircle, XCircle, Settings, Calendar } from 'lucide-react';
import api from '../../lib/api';

export default function AdminIntegrationsTab() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [configuringType, setConfiguringType] = useState<string | null>(null);

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/integrations');
      setIntegrations(response.data);
    } catch (error) {
      console.error('Failed to load integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntegrationInfo = (type: string) => {
    const info: Record<string, { name: string; description: string; icon: any }> = {
      gusto: {
        name: 'Gusto',
        description: 'Sync employee data from your Gusto account',
        icon: Plug
      },
      google_calendar: {
        name: 'Google Calendar',
        description: 'Sync one-on-ones with Google Calendar',
        icon: Calendar
      },
      hris: {
        name: 'HRIS Integration',
        description: 'Connect to your HR Information System',
        icon: Settings
      }
    };
    return info[type] || { name: type, description: 'Integration', icon: Plug };
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading integrations...</div>;
  }

  const integrationTypes = ['gusto', 'google_calendar', 'hris'];

  return (
    <div>
      {!isSuperAdmin && (
        <div style={{ padding: '16px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#92400e' }}>
            Integration configuration requires SUPER_ADMIN privileges
          </div>
        </div>
      )}

      {/* Integration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {integrationTypes.map(type => {
          const integration = integrations.find(i => i.type === type);
          const info = getIntegrationInfo(type);
          const Icon = info.icon;
          const isConnected = integration?.isConnected || false;

          return (
            <div
              key={type}
              style={{
                padding: '24px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
                <div style={{
                  padding: '12px',
                  background: isConnected ? '#d1fae5' : 'var(--bg-tertiary)',
                  borderRadius: '10px',
                  color: isConnected ? '#10b981' : 'var(--text-muted)'
                }}>
                  <Icon size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                      {info.name}
                    </h3>
                    {isConnected ? (
                      <CheckCircle size={18} style={{ color: '#10b981' }} />
                    ) : (
                      <XCircle size={18} style={{ color: 'var(--text-faint)' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                    {info.description}
                  </p>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                  <span style={{ fontWeight: '500', color: isConnected ? '#10b981' : 'var(--text-muted)' }}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                {integration?.lastSyncAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Last Sync:</span>
                    <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>
                      {new Date(integration.lastSyncAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {integration?.syncStatus && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Sync Status:</span>
                    <span style={{
                      fontWeight: '500',
                      color: integration.syncStatus === 'success' ? '#10b981' : '#dc2626'
                    }}>
                      {integration.syncStatus}
                    </span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {isSuperAdmin && (
                  <button
                    onClick={() => setConfiguringType(type)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: isConnected ? 'var(--bg-tertiary)' : '#3b82f6',
                      color: isConnected ? 'var(--text-secondary)' : 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {isConnected ? 'Reconfigure' : 'Configure'}
                  </button>
                )}
                {isConnected && isSuperAdmin && (
                  <button
                    onClick={async () => {
                      if (confirm('Disconnect this integration?')) {
                        try {
                          await api.post(`/admin/integrations/${type}/disconnect`);
                          await loadIntegrations();
                        } catch (error) {
                          alert('Failed to disconnect integration');
                        }
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {configuringType && (
        <IntegrationConfigModal
          type={configuringType}
          onClose={() => setConfiguringType(null)}
          onSuccess={() => {
            setConfiguringType(null);
            loadIntegrations();
          }}
        />
      )}
    </div>
  );
}

// Integration Configuration Modal
interface IntegrationConfigModalProps {
  type: string;
  onClose: () => void;
  onSuccess: () => void;
}

function IntegrationConfigModal({ type, onClose, onSuccess }: IntegrationConfigModalProps) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getConfigFields = (type: string) => {
    const fields: Record<string, Array<{ key: string; label: string; type: string; placeholder?: string }>> = {
      gusto: [
        { key: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Your Gusto Client ID' },
        { key: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Your Gusto Client Secret' },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Gusto API Key' }
      ],
      google_calendar: [
        { key: 'clientId', label: 'Google Client ID', type: 'text' },
        { key: 'clientSecret', label: 'Google Client Secret', type: 'password' }
      ],
      hris: [
        { key: 'apiUrl', label: 'API URL', type: 'text', placeholder: 'https://api.yourhrissystem.com' },
        { key: 'apiKey', label: 'API Key', type: 'password' }
      ]
    };
    return fields[type] || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);
      await api.patch(`/admin/integrations/${type}/config`, { config });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const fields = getConfigFields(type);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '500px',
          padding: '24px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
          Configure {type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {fields.map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={config[field.key] || ''}
                  onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? 'var(--text-faint)' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
