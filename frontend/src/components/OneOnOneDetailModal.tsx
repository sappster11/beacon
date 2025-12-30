import { useState, useCallback, useRef, useEffect } from 'react';
import { X, ExternalLink, Upload, FileText, Link as LinkIcon } from 'lucide-react';
import type { OneOnOne } from '../types';
import { oneOnOnes as oneOnOnesApi } from '../lib/api';
import TabNavigation from './TabNavigation';

interface OneOnOneDetailModalProps {
  meeting: OneOnOne | null;
  isOpen: boolean;
  onClose: () => void;
  isManager: boolean;
  onUpdate?: () => void;
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function OneOnOneDetailModal({
  meeting,
  isOpen,
  onClose,
  isManager,
  onUpdate,
}: OneOnOneDetailModalProps) {
  const [activeTab, setActiveTab] = useState('agenda');
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local state for inline editing
  const [agenda, setAgenda] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [actionItems, setActionItems] = useState('');

  // Initialize local state from meeting
  useEffect(() => {
    if (meeting) {
      setAgenda(meeting.agenda || '');
      setSharedNotes(meeting.sharedNotes || '');
      setManagerNotes(meeting.managerNotes || '');
      setTranscript(meeting.transcript || '');
      setDocumentUrl(meeting.documentUrl || '');
      setActionItems(meeting.actionItems || '');
    }
  }, [meeting]);

  // Auto-save functions with debounce
  const saveAgenda = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.update(id, { agenda: value });
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save agenda:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  const saveSharedNotes = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateSharedNotes(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save shared notes:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  const saveManagerNotes = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateManagerNotes(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save manager notes:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  const saveTranscript = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateTranscript(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save transcript:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  const saveDocumentUrl = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateDocumentUrl(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save document URL:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  const saveActionItems = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateActionItems(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Failed to save action items:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    [onUpdate]
  );

  // Copy to clipboard
  const handleCopyActionItems = async () => {
    try {
      await navigator.clipboard.writeText(actionItems);
      setSaveMessage('✓ Copied to clipboard!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setSaveMessage('✗ Failed to copy');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!meeting || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    setUploadProgress(true);

    try {
      await oneOnOnesApi.uploadTranscript(meeting.id, file);
      setSaveMessage('✓ File uploaded');
      setTimeout(() => setSaveMessage(''), 2000);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Failed to upload file:', error);
      setSaveMessage('✗ Upload failed');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!isOpen || !meeting) return null;

  const otherPerson = isManager ? meeting.employee : meeting.manager;
  const meetingDate = new Date(meeting.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const content = (
    <div
      style={{
        background: 'var(--bg-primary)',
        borderRadius: '12px',
        padding: '0',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            One-on-One with {otherPerson?.name}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
            {meetingDate}
            {meeting.googleEventUrl && (
              <>
                {' • '}
                <a
                  href={meeting.googleEventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#3b82f6',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  View in Calendar <ExternalLink size={12} />
                </a>
              </>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {saveMessage && (
            <span
              style={{
                fontSize: '13px',
                color: saveMessage.includes('✓') ? '#10b981' : '#ef4444',
                fontWeight: '500',
              }}
            >
              {saveMessage}
            </span>
          )}
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={[
          { id: 'agenda', label: 'Agenda & Notes' },
          { id: 'transcript', label: 'Transcript' },
          { id: 'action-items', label: 'Action Items' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {/* Agenda & Notes Tab */}
        {activeTab === 'agenda' && (
          <div>
            {/* Agenda */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Agenda
              </label>
              <textarea
                value={agenda}
                onChange={(e) => {
                  setAgenda(e.target.value);
                  saveAgenda(meeting.id, e.target.value);
                }}
                placeholder="What would you like to discuss?"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>

            {/* Document URL */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                <LinkIcon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Shared Document
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="url"
                  value={documentUrl}
                  onChange={(e) => {
                    setDocumentUrl(e.target.value);
                    saveDocumentUrl(meeting.id, e.target.value);
                  }}
                  placeholder="Paste Google Doc URL or any document link..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                />
                {documentUrl && (
                  <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '12px 16px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3b82f6';
                    }}
                  >
                    Open <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Shared Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Shared Notes
              </label>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                Notes visible to both participants
              </p>
              <textarea
                value={sharedNotes}
                onChange={(e) => {
                  setSharedNotes(e.target.value);
                  saveSharedNotes(meeting.id, e.target.value);
                }}
                placeholder="Take notes during the meeting..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  lineHeight: '1.6',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>

            {/* Manager Notes (Manager Only) */}
            {isManager && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Manager-Only Notes
                </label>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Private notes only visible to you
                </p>
                <textarea
                  value={managerNotes}
                  onChange={(e) => {
                    setManagerNotes(e.target.value);
                    saveManagerNotes(meeting.id, e.target.value);
                  }}
                  placeholder="Private notes for your reference..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.6',
                    background: '#fffbeb',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#fbbf24';
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="#3b82f6" />
                Meeting Transcript
              </h3>

              {/* File Upload */}
              <div style={{ marginBottom: '24px' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.doc,.docx,.pdf"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProgress}
                  style={{
                    padding: '12px 24px',
                    background: uploadProgress ? '#9ca3af' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: uploadProgress ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => {
                    if (!uploadProgress) e.currentTarget.style.background = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    if (!uploadProgress) e.currentTarget.style.background = '#3b82f6';
                  }}
                >
                  <Upload size={16} />
                  {uploadProgress ? 'Uploading...' : 'Upload Transcript File'}
                </button>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Supported formats: .txt, .doc, .docx, .pdf (max 10MB)
                </p>
                {meeting.transcriptFileUrl && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#10b981', fontWeight: '500' }}>
                    ✓ File uploaded: {meeting.transcriptFileUrl.split('/').pop()}
                  </p>
                )}
              </div>

              {/* Or Paste Transcript */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Or Paste Transcript
                </label>
                <textarea
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    saveTranscript(meeting.id, e.target.value);
                  }}
                  placeholder="Paste your meeting transcript here..."
                  rows={15}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    fontSize: '13px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'monospace',
                    lineHeight: '1.6',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                />
              </div>

              {/* AI Summarization Coming Soon */}
              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                  AI summarization coming soon!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Items Tab */}
        {activeTab === 'action-items' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                }}
              >
                <label
                  style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Action Items
                </label>
                <button
                  onClick={handleCopyActionItems}
                  disabled={!actionItems.trim()}
                  style={{
                    padding: '8px 16px',
                    background: actionItems.trim() ? 'var(--color-primary)' : 'var(--border-color)',
                    color: actionItems.trim() ? '#ffffff' : '#9ca3af',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: actionItems.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (actionItems.trim()) {
                      e.currentTarget.style.background = 'var(--color-primary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (actionItems.trim()) {
                      e.currentTarget.style.background = 'var(--color-primary)';
                    }
                  }}
                >
                  Copy to Clipboard
                </button>
              </div>
              <textarea
                value={actionItems}
                onChange={(e) => {
                  setActionItems(e.target.value);
                  saveActionItems(meeting.id, e.target.value);
                }}
                placeholder="List action items from this meeting..."
                style={{
                  width: '100%',
                  minHeight: '250px',
                  padding: '16px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--color-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              />
              <p
                style={{
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                }}
              >
                Type or paste action items, then use the "Copy to Clipboard" button to export to your
                project management tool.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px 32px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          onClick={onClose}
          style={{
            padding: '10px 24px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
          }}
        >
          Close
        </button>
      </div>
    </div>
  );

  // Render as modal with overlay
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
        padding: '20px',
      }}
      onClick={onClose}
    >
      {content}
    </div>
  );
}
