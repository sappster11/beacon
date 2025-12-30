import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { oneOnOnes, googleCalendar, users } from '../lib/api';
import type { User } from '../types';
import { Plus, Users, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import Avatar from '../components/Avatar';

// Smart date formatting
const formatNextDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 5) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface EmployeeWithMeetings {
  employee: {
    id: string;
    name: string;
    title?: string;
    profilePicture?: string;
  };
  meetings: any[];
  nextMeeting?: any;
}

export default function OneOnOnes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedEventEmployees, setSelectedEventEmployees] = useState<{ [eventId: string]: string }>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    employeeId: '',
    date: '',
    time: '',
  });

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadMeetings();
    checkCalendarConnection();
    checkOAuthCallback();
  }, []);

  const loadMeetings = async () => {
    try {
      setIsLoading(true);
      const allMeetings = await oneOnOnes.getMyMeetings();
      setMeetings(allMeetings);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load meetings');
    } finally {
      setIsLoading(false);
    }
  };

  const checkCalendarConnection = async () => {
    try {
      const status = await googleCalendar.getConnectionStatus();
      setCalendarConnected(status.connected);
    } catch (err) {
      console.error('Failed to check calendar status:', err);
    }
  };

  const checkOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setShowSuccessMessage(true);
      setCalendarConnected(true);
      window.history.replaceState({}, '', '/one-on-ones');
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const { authUrl } = await googleCalendar.connect();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to connect calendar:', err);
      setError('Failed to connect Google Calendar');
    }
  };

  const loadEmployees = async () => {
    if (!user?.id) return;
    try {
      if (user.role === 'HR_ADMIN' || user.role === 'SUPER_ADMIN') {
        const allUsers = await users.getAll();
        setEmployees(allUsers.filter(u => u.id !== user.id));
      } else {
        const reports = await users.getDirectReports(user.id);
        setEmployees(reports);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const handleOpenImportModal = async () => {
    setShowImportModal(true);
    setLoadingEvents(true);
    loadEmployees();

    try {
      const { events } = await googleCalendar.getEvents(100);
      // Filter to only show 2-person meetings (you + 1 other person)
      const filteredEvents = events.filter((event: any) => {
        if (!event.start) return false;
        // Check attendees - should have exactly 2 people (including organizer)
        if (event.attendees && event.attendees.length === 2) return true;
        // Also include events with 1 attendee (might just show the other person)
        if (event.attendees && event.attendees.length === 1) return true;
        return false;
      });
      setCalendarEvents(filteredEvents);
    } catch (err) {
      console.error('Failed to load calendar events:', err);
      setError('Failed to load calendar events');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleLinkCalendarEvent = async (event: any) => {
    const employeeId = selectedEventEmployees[event.id];
    if (!employeeId) {
      setError('Please select an employee for this meeting');
      return;
    }

    try {
      await oneOnOnes.linkCalendarEvent({
        googleEventId: event.id,
        googleEventUrl: event.htmlLink,
        employeeId,
        scheduledAt: event.start.dateTime || event.start.date,
        title: event.summary,
      });
      setCalendarEvents(calendarEvents.filter(e => e.id !== event.id));
      loadMeetings();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to link calendar event');
    }
  };

  const handleAddMeeting = async () => {
    const { employeeId, date, time } = addForm;
    if (!employeeId || !date || !time) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await oneOnOnes.create({
        employeeId,
        scheduledAt,
        syncToCalendar: false,
      });
      setShowAddModal(false);
      setAddForm({ employeeId: '', date: '', time: '' });
      loadMeetings();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create meeting');
    }
  };

  // Group meetings by employee
  const getEmployeesWithMeetings = (): EmployeeWithMeetings[] => {
    const employeeMap = new Map<string, EmployeeWithMeetings>();
    const now = new Date();

    meetings.forEach(meeting => {
      const otherPerson = meeting.manager.id === user?.id ? meeting.employee : meeting.manager;
      const employeeId = otherPerson.id;

      if (!employeeMap.has(employeeId)) {
        employeeMap.set(employeeId, {
          employee: otherPerson,
          meetings: [],
          nextMeeting: undefined,
        });
      }

      const entry = employeeMap.get(employeeId)!;
      entry.meetings.push(meeting);

      const meetingDate = new Date(meeting.scheduledAt);
      if (meetingDate > now && meeting.status === 'scheduled') {
        if (!entry.nextMeeting || meetingDate < new Date(entry.nextMeeting.scheduledAt)) {
          entry.nextMeeting = meeting;
        }
      }
    });

    employeeMap.forEach(entry => {
      entry.meetings.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    });

    return Array.from(employeeMap.values()).sort((a, b) => {
      const aLatest = a.meetings[0]?.scheduledAt || '';
      const bLatest = b.meetings[0]?.scheduledAt || '';
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });
  };

  const employeesWithMeetings = getEmployeesWithMeetings();

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>1:1s</h1>
        <p style={{ color: 'var(--text-muted)' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>1:1s</h1>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
            Track your 1:1 meetings with your team
          </p>
        </div>

        {isManager && (
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {calendarConnected ? (
              <button
                onClick={handleOpenImportModal}
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sync from Google
              </button>
            ) : (
              <button
                onClick={handleConnectCalendar}
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Connect Google
              </button>
            )}
            <button
              onClick={() => {
                setShowAddModal(true);
                loadEmployees();
              }}
              style={{
                padding: '10px 16px',
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
            >
              <Plus size={18} />
              Add Manually
            </button>
          </div>
        )}
      </div>

      {showSuccessMessage && (
        <div style={{ padding: '12px 16px', background: '#dcfce7', color: '#166534', borderRadius: '8px', marginBottom: '20px', border: '1px solid #bbf7d0' }}>
          Google Calendar connected successfully!
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {/* Simple Employee Cards */}
      {employeesWithMeetings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Users size={32} color="#9ca3af" style={{ marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>No 1:1s yet</h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            {isManager ? 'Sync from Google Calendar or add a 1:1 manually to get started.' : 'Your manager hasn\'t scheduled any 1:1s yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {employeesWithMeetings.map(({ employee, nextMeeting, meetings: empMeetings }) => {
            // Get linked documents from localStorage
            const storedDocs = localStorage.getItem(`1on1-docs-${user?.id}-${employee.id}`);
            const documents: { title: string; url: string }[] = storedDocs ? JSON.parse(storedDocs) : [];

            return (
              <div
                key={employee.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onClick={() => navigate(`/one-on-ones/employee/${employee.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(59, 130, 246, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <Avatar
                  user={{ name: employee.name, profilePicture: employee.profilePicture }}
                  size="md"
                />

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {employee.name}
                  </h3>
                  {employee.title && (
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>{employee.title}</p>
                  )}
                </div>

                {/* Document links */}
                {documents.length > 0 && (
                  <div
                    style={{ display: 'flex', gap: '8px' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {documents.slice(0, 2).map((doc, idx) => (
                      <a
                        key={idx}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '6px 10px',
                          background: '#f3f4f6',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          color: 'var(--text-secondary)',
                          textDecoration: 'none',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#e5e7eb';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                        }}
                        title={doc.title}
                      >
                        <FileText size={12} />
                        {doc.title.length > 15 ? doc.title.substring(0, 15) + '...' : doc.title}
                      </a>
                    ))}
                    {documents.length > 2 && (
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>
                        +{documents.length - 2}
                      </span>
                    )}
                  </div>
                )}

                {nextMeeting ? (
                  <div style={{ textAlign: 'right', marginRight: '8px' }}>
                    <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: 'var(--text-muted)' }}>Next 1:1</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#3b82f6' }}>
                      {formatNextDate(nextMeeting.scheduledAt)}
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: 'right', marginRight: '8px' }}>
                    <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>No upcoming</p>
                  </div>
                )}

                <ChevronRight size={20} color="#9ca3af" />
              </div>
            );
          })}
        </div>
      )}

      {/* Add 1:1 Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Add 1:1
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Employee
                </label>
                <select
                  value={addForm.employeeId}
                  onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} {emp.title && `- ${emp.title}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Date
                </label>
                <input
                  type="date"
                  value={addForm.date}
                  onChange={(e) => setAddForm({ ...addForm, date: e.target.value })}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  Time
                </label>
                <input
                  type="time"
                  value={addForm.time}
                  onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
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
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 16px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMeeting}
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
                Add 1:1
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import from Calendar Modal */}
      {showImportModal && (
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
          onClick={() => setShowImportModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImportModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--text-muted)',
                fontSize: '24px',
                lineHeight: 1,
              }}
            >
              ×
            </button>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Sync from Google Calendar
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
              Showing meetings with you and one other person
            </p>

            {loadingEvents ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading calendar events...</p>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>
                  No 1:1 meetings found. Only showing meetings with 2 attendees.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {calendarEvents.map((event) => (
                  <div
                    key={event.id}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {event.summary || 'Untitled Event'}
                      </h3>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                        {new Date(event.start.dateTime || event.start.date).toLocaleString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {event.recurringEventId && (
                          <span style={{ marginLeft: '8px', color: '#f59e0b' }}>🔁 Recurring</span>
                        )}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <select
                        value={selectedEventEmployees[event.id] || ''}
                        onChange={(e) => setSelectedEventEmployees({ ...selectedEventEmployees, [event.id]: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          border: '1px solid var(--border-color)',
                          borderRadius: '6px',
                          fontSize: '14px',
                        }}
                      >
                        <option value="">Select employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} {emp.title && `- ${emp.title}`}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleLinkCalendarEvent(event)}
                        disabled={!selectedEventEmployees[event.id]}
                        style={{
                          padding: '8px 16px',
                          background: selectedEventEmployees[event.id] ? '#10b981' : '#9ca3af',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: selectedEventEmployees[event.id] ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
