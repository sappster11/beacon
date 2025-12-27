import { X, Copy, Check } from 'lucide-react';
import type { AuditLog } from '../../types/index';
import { useState } from 'react';

interface Props {
  log: AuditLog;
  onClose: () => void;
}

export default function AuditLogDetailModal({ log, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const changes = log.changes ? JSON.parse(log.changes) : null;
  const metadata = log.metadata ? JSON.parse(log.metadata) : null;

  const handleCopyResourceId = () => {
    navigator.clipboard.writeText(log.resourceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: '1px solid #e5e7eb',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
              {log.resourceType} - {log.action}
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#111827')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Description */}
          {log.description && (
            <div
              style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}
            >
              <p style={{ fontSize: '14px', color: '#374151', margin: 0 }}>
                {log.description}
              </p>
            </div>
          )}

          {/* Status Badge */}
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                background: log.status === 'failed' ? '#fee2e2' : '#d1fae5',
                color: log.status === 'failed' ? '#991b1b' : '#065f46'
              }}
            >
              {log.status === 'failed' ? 'Failed' : 'Success'}
            </span>
          </div>

          {/* Error Message */}
          {log.errorMessage && (
            <div
              style={{
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#991b1b', marginBottom: '4px' }}>
                    Error
                  </div>
                  <div style={{ fontSize: '14px', color: '#991b1b' }}>
                    {log.errorMessage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User Info */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              User Information
            </div>
            <div style={{ fontSize: '14px', color: '#374151' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Name:</strong> {log.user?.name || 'System'}
              </div>
              {log.user?.email && (
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                  {log.user.email}
                </div>
              )}
            </div>
          </div>

          {/* Resource ID */}
          <div
            style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '24px'
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Resource Information
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
                  Resource ID
                </div>
                <div style={{ fontSize: '14px', color: '#111827', fontFamily: 'monospace' }}>
                  {log.resourceId}
                </div>
              </div>
              <button
                onClick={handleCopyResourceId}
                style={{
                  background: copied ? '#d1fae5' : '#f3f4f6',
                  border: '1px solid ' + (copied ? '#10b981' : '#e5e7eb'),
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: copied ? '#065f46' : '#374151',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => !copied && (e.currentTarget.style.background = '#e5e7eb')}
                onMouseLeave={(e) => !copied && (e.currentTarget.style.background = '#f3f4f6')}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Metadata */}
          {metadata && (
            <div
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '24px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Request Metadata
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                {metadata.ip && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>IP Address</div>
                    <div style={{ color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>{metadata.ip}</div>
                  </div>
                )}
                {metadata.method && (
                  <div>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>HTTP Method</div>
                    <div style={{ color: '#111827' }}>{metadata.method}</div>
                  </div>
                )}
                {metadata.path && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>Request Path</div>
                    <div style={{ color: '#111827', fontFamily: 'monospace', fontSize: '13px' }}>{metadata.path}</div>
                  </div>
                )}
                {metadata.userAgent && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div style={{ color: '#6b7280', fontSize: '13px', marginBottom: '4px' }}>User Agent</div>
                    <div style={{ color: '#111827', fontSize: '13px', wordBreak: 'break-all' }}>{metadata.userAgent}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Changes - Before/After Comparison */}
          {changes && (changes.before || changes.after) && (
            <div
              style={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '16px'
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
                Changes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Before State */}
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Before
                  </div>
                  <pre
                    style={{
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      maxHeight: '400px',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: '#374151',
                      margin: 0,
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    {changes.before ? JSON.stringify(changes.before, null, 2) : 'null'}
                  </pre>
                </div>

                {/* After State */}
                <div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#6b7280',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    After
                  </div>
                  <pre
                    style={{
                      background: '#f9fafb',
                      padding: '12px',
                      borderRadius: '6px',
                      overflow: 'auto',
                      maxHeight: '400px',
                      fontSize: '12px',
                      lineHeight: '1.6',
                      color: '#374151',
                      margin: 0,
                      border: '1px solid #e5e7eb'
                    }}
                  >
                    {changes.after ? JSON.stringify(changes.after, null, 2) : 'null'}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
