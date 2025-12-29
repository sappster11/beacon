import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { oneOnOnes, users } from '../lib/api';
import { ArrowLeft, Calendar, FileText, ExternalLink, Plus, Link as LinkIcon, Trash2 } from 'lucide-react';
import Avatar from '../components/Avatar';

interface LinkedDocument {
  title: string;
  url: string;
}

export default function EmployeeOneOnOnes() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<any>(null);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [documents, setDocuments] = useState<LinkedDocument[]>([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: '', url: '' });

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  const loadData = async () => {
    if (!employeeId) return;

    try {
      setIsLoading(true);

      // Load all meetings
      const allMeetings = await oneOnOnes.getMyMeetings();

      // Filter to meetings with this employee
      const employeeMeetings = allMeetings.filter((m: any) =>
        m.employee.id === employeeId || m.manager.id === employeeId
      );

      // Sort by date (newest first)
      employeeMeetings.sort((a: any, b: any) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
      );

      setMeetings(employeeMeetings);

      // Get employee info from the first meeting
      if (employeeMeetings.length > 0) {
        const meeting = employeeMeetings[0];
        const emp = meeting.manager.id === user?.id ? meeting.employee : meeting.manager;
        setEmployee(emp);
      } else {
        // Try to load employee info directly
        try {
          const empData = await users.getById(employeeId);
          setEmployee(empData);
        } catch (err) {
          console.error('Failed to load employee:', err);
        }
      }

      // Load documents from localStorage
      const storedDocs = localStorage.getItem(`1on1-docs-${user?.id}-${employeeId}`);
      if (storedDocs) {
        setDocuments(JSON.parse(storedDocs));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDocument = () => {
    if (!newDoc.title.trim() || !newDoc.url.trim()) {
      setError('Please enter both title and URL');
      return;
    }

    const updatedDocs = [...documents, newDoc];
    localStorage.setItem(`1on1-docs-${user?.id}-${employeeId}`, JSON.stringify(updatedDocs));
    setDocuments(updatedDocs);
    setShowAddDocModal(false);
    setNewDoc({ title: '', url: '' });
    setError('');
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocs = documents.filter((_, i) => i !== index);
    if (updatedDocs.length === 0) {
      localStorage.removeItem(`1on1-docs-${user?.id}-${employeeId}`);
    } else {
      localStorage.setItem(`1on1-docs-${user?.id}-${employeeId}`, JSON.stringify(updatedDocs));
    }
    setDocuments(updatedDocs);
  };

  // Placeholder data for preview
  const isPlaceholder = employeeId?.startsWith('placeholder-');
  const placeholderEmployee = isPlaceholder ? {
    name: employeeId === 'placeholder-1' ? 'Sarah Chen' : employeeId === 'placeholder-2' ? 'Marcus Johnson' : 'Emily Rodriguez',
    title: employeeId === 'placeholder-1' ? 'Senior Software Engineer' : employeeId === 'placeholder-2' ? 'Product Designer' : 'Frontend Developer',
  } : null;

  const placeholderMeetings = isPlaceholder ? [
    { id: 'p1', scheduledAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'scheduled', sharedNotes: null },
    { id: 'p2', scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', sharedNotes: 'Discussed Q1 goals progress.' },
    { id: 'p3', scheduledAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', sharedNotes: 'Career development discussion.' },
    { id: 'p4', scheduledAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', sharedNotes: null },
    { id: 'p5', scheduledAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), status: 'completed', sharedNotes: 'Sprint retrospective discussion.' },
  ] : [];

  const displayEmployee = employee || placeholderEmployee;
  const displayMeetings = meetings.length > 0 ? meetings : placeholderMeetings;

  if (isLoading && !isPlaceholder) {
    return (
      <div style={{ padding: '48px' }}>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  if (!displayEmployee) {
    return (
      <div style={{ padding: '48px' }}>
        <button
          onClick={() => navigate('/one-on-ones')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#374151',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          Back to 1:1s
        </button>
        <p style={{ color: '#6b7280' }}>Employee not found</p>
      </div>
    );
  }

  const upcomingMeetings = displayMeetings.filter(m => new Date(m.scheduledAt) > new Date() && m.status === 'scheduled');
  const pastMeetings = displayMeetings.filter(m => new Date(m.scheduledAt) <= new Date() || m.status !== 'scheduled');

  return (
    <div style={{ padding: '48px', maxWidth: '900px' }}>
      {/* Back Button */}
      <button
        onClick={() => navigate('/one-on-ones')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'transparent',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          color: '#374151',
          marginBottom: '24px',
        }}
      >
        <ArrowLeft size={16} />
        Back to 1:1s
      </button>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Employee Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '32px' }}>
        <Avatar
          user={{ name: displayEmployee.name, profilePicture: displayEmployee.profilePicture }}
          size="lg"
        />
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '28px', fontWeight: '600', color: '#111827' }}>
            1:1s with {displayEmployee.name}
          </h1>
          {displayEmployee.title && (
            <p style={{ margin: 0, fontSize: '16px', color: '#6b7280' }}>{displayEmployee.title}</p>
          )}
        </div>
      </div>

      {/* Shared Documents Section */}
      <div style={{ marginBottom: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
            Shared Documents
          </h3>
          {isManager && (
            <button
              onClick={() => setShowAddDocModal(true)}
              style={{
                padding: '8px 14px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} />
              Add Document
            </button>
          )}
        </div>

        {documents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {documents.map((doc, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} color="#3b82f6" />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>{doc.title}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      background: '#3b82f6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ExternalLink size={12} />
                    Open
                  </a>
                  {isManager && (
                    <button
                      onClick={() => handleRemoveDocument(idx)}
                      style={{
                        padding: '6px 10px',
                        background: 'transparent',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
            No documents linked yet. Add a Google Doc or Notion page for your ongoing 1:1 notes.
          </p>
        )}
      </div>

      {/* Upcoming 1:1s */}
      {upcomingMeetings.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
            Upcoming
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {upcomingMeetings.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => !isPlaceholder && navigate(`/one-on-ones/${meeting.id}`)}
                style={{
                  padding: '16px 20px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '8px',
                  cursor: isPlaceholder ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isPlaceholder) {
                    e.currentTarget.style.background = '#dbeafe';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#eff6ff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={18} color="#3b82f6" />
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#1e40af' }}>
                    {new Date(meeting.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                  <span style={{ fontSize: '14px', color: '#3b82f6' }}>
                    {new Date(meeting.scheduledAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <span style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '500' }}>
                  {isPlaceholder ? 'Preview' : 'Open →'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past 1:1s */}
      <div>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          History ({pastMeetings.length})
        </h3>
        {pastMeetings.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>
            No past 1:1s yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pastMeetings.map(meeting => (
              <div
                key={meeting.id}
                onClick={() => !isPlaceholder && navigate(`/one-on-ones/${meeting.id}`)}
                style={{
                  padding: '16px 20px',
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: isPlaceholder ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!isPlaceholder) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.background = '#ffffff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '500', color: '#374151' }}>
                    {new Date(meeting.scheduledAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {(meeting.sharedNotes || meeting.managerNotes) && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#3b82f6', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                      <FileText size={12} />
                      Has notes
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '13px', color: '#6b7280' }}>
                  {isPlaceholder ? 'Preview' : 'View →'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Document Modal */}
      {showAddDocModal && (
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
          }}
          onClick={() => setShowAddDocModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '450px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              Add Shared Document
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280' }}>
              Link a Google Doc, Notion page, or any URL for your 1:1s with {displayEmployee.name}.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Document Name
                </label>
                <input
                  type="text"
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="e.g., 1:1 Notes, Career Development, Goals Doc"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Document URL
                </label>
                <input
                  type="url"
                  value={newDoc.url}
                  onChange={(e) => setNewDoc({ ...newDoc, url: e.target.value })}
                  placeholder="https://docs.google.com/..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddDocModal(false);
                  setNewDoc({ title: '', url: '' });
                }}
                style={{
                  padding: '10px 16px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDocument}
                style={{
                  padding: '10px 16px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Add Document
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
