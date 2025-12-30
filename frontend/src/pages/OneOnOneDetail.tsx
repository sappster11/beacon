import { useState, useCallback, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { X, ExternalLink, Upload, FileText, Link as LinkIcon, ArrowLeft, Bold, Italic, Underline, List, ListOrdered, Eye } from 'lucide-react';
import type { OneOnOne } from '../types';
import { oneOnOnes as oneOnOnesApi, goals as goalsApi, reviews as reviewsApi, reviewCycles as reviewCyclesApi } from '../lib/api';
import TabNavigation from '../components/TabNavigation';
import { useAuth } from '../hooks/useAuth';
import type { Goal, Review } from '../types';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

// Tiptap editor styles
const editorStyles = `
  .ProseMirror {
    outline: none;
    min-height: 100px;
  }
  .ProseMirror p {
    margin: 0.5em 0;
  }
  .ProseMirror ul, .ProseMirror ol {
    padding-left: 1.5em;
    margin: 0.5em 0;
  }
  .ProseMirror li {
    margin: 0.25em 0;
  }
  .ProseMirror strong {
    font-weight: 600;
  }
  .ProseMirror em {
    font-style: italic;
  }
  .ProseMirror p.is-editor-empty:first-child::before {
    color: #adb5bd;
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`;

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Rating badge helper
const renderRatingBadge = (rating: number | undefined) => {
  if (!rating) {
    return <span style={{ color: 'var(--text-faint)', fontSize: '13px' }}>—</span>;
  }

  const ratingColors: { [key: number]: string } = {
    1: '#ef4444', // Red
    2: '#f59e0b', // Orange
    3: '#10b981', // Green
    4: '#3b82f6', // Blue
  };

  const color = ratingColors[rating] || 'var(--text-muted)';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 12px',
      background: `${color}15`,
      borderRadius: '6px',
      color: color,
      fontWeight: '600',
      fontSize: '13px',
    }}>
      {rating}/4
    </div>
  );
};

// Toolbar component for Tiptap
const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const buttonStyle = (isActive: boolean) => ({
    padding: '6px 10px',
    background: isActive ? 'var(--border-color)' : 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s',
  });

  return (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '12px',
        borderBottom: '1px solid #d1d5db',
        background: 'var(--bg-tertiary)',
      }}
    >
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        style={buttonStyle(editor.isActive('bold'))}
        type="button"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        style={buttonStyle(editor.isActive('italic'))}
        type="button"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        style={buttonStyle(editor.isActive('bulletList'))}
        type="button"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        style={buttonStyle(editor.isActive('orderedList'))}
        type="button"
      >
        <ListOrdered size={16} />
      </button>
    </div>
  );
};

export default function OneOnOneDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [meeting, setMeeting] = useState<OneOnOne | null>(null);
  const [activeTab, setActiveTab] = useState('agenda');
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if in preview mode (non-UUID id or preview=true param)
  const isPreviewMode = searchParams.get('preview') === 'true' || (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

  // Local state for inline editing
  const [agenda, setAgenda] = useState('');
  const [sharedNotes, setSharedNotes] = useState('');
  const [managerNotes, setManagerNotes] = useState('');
  const [transcript, setTranscript] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [employeeGoals, setEmployeeGoals] = useState<Goal[]>([]);
  const [employeeCompetencies, setEmployeeCompetencies] = useState<any[]>([]);
  const [latestReviewId, setLatestReviewId] = useState<string | null>(null);
  const [currentCycleReviewId, setCurrentCycleReviewId] = useState<string | null>(null);
  const [currentCycleCompetencies, setCurrentCycleCompetencies] = useState<any[]>([]);
  const [currentCycleGoals, setCurrentCycleGoals] = useState<any[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    url: '',
    isRecurring: false,
  });
  const [loadingDocuments, setLoadingDocuments] = useState(false);

  const isManager = meeting ? meeting.manager.id === user?.id : false;
  const employeeId = meeting ? (isManager ? meeting.employee.id : meeting.manager.id) : null;

  // Tiptap editors for agenda and shared notes
  const agendaEditor = useEditor({
    extensions: [StarterKit],
    content: agenda,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setAgenda(html);
      if (meeting && !isPreviewMode) {
        saveAgenda(meeting.id, html);
      }
    },
  });

  const sharedNotesEditor = useEditor({
    extensions: [StarterKit],
    content: sharedNotes,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSharedNotes(html);
      if (meeting && !isPreviewMode) {
        saveSharedNotes(meeting.id, html);
      }
    },
  });

  const managerNotesEditor = useEditor({
    extensions: [StarterKit],
    content: managerNotes,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setManagerNotes(html);
      if (meeting && !isPreviewMode) {
        saveManagerNotes(meeting.id, html);
      }
    },
  });

  // Update editor content when data loads
  useEffect(() => {
    if (agendaEditor && agenda !== agendaEditor.getHTML()) {
      agendaEditor.commands.setContent(agenda);
    }
  }, [agenda, agendaEditor]);

  useEffect(() => {
    if (sharedNotesEditor && sharedNotes !== sharedNotesEditor.getHTML()) {
      sharedNotesEditor.commands.setContent(sharedNotes);
    }
  }, [sharedNotes, sharedNotesEditor]);

  useEffect(() => {
    if (managerNotesEditor && managerNotes !== managerNotesEditor.getHTML()) {
      managerNotesEditor.commands.setContent(managerNotes);
    }
  }, [managerNotes, managerNotesEditor]);

  // Preview mode dummy data
  const previewMeeting: OneOnOne = {
    id: 'preview',
    managerId: 'manager-1',
    employeeId: 'employee-1',
    scheduledAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    agenda: '<p><strong>Discussion Topics:</strong></p><ul><li>Q1 goals progress review</li><li>Upcoming project timeline</li><li>Career development discussion</li><li>Team collaboration feedback</li></ul>',
    sharedNotes: '<p><strong>Key Takeaways:</strong></p><ul><li>Great progress on the dashboard redesign project</li><li>Need to schedule follow-up with design team</li><li>Consider taking the leadership workshop next quarter</li></ul><p><strong>Action Items:</strong></p><ul><li>Complete code review by Friday</li><li>Set up meeting with stakeholders</li><li>Update project documentation</li></ul>',
    managerNotes: '<p><strong>Private Notes:</strong></p><p>Employee is showing strong initiative. Consider for team lead role in Q2. Follow up on certification program interest.</p>',
    actionItems: '- Complete code review by Friday\n- Set up meeting with stakeholders\n- Update project documentation\n- Schedule follow-up 1:1 in 2 weeks',
    status: 'completed',
    transcript: 'Sample transcript content would appear here after uploading or pasting meeting notes...',
    manager: { id: 'manager-1', name: user?.name || 'Manager Name', email: 'manager@example.com', title: 'Engineering Manager' },
    employee: { id: 'employee-1', name: 'Sarah Chen', email: 'sarah@example.com', title: 'Senior Software Engineer' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const previewGoals: Goal[] = [
    { id: 'g1', title: 'Complete Dashboard Redesign', description: 'Implement new UI components', status: 'ACTIVE', targetValue: 100, currentValue: 75, unit: '%', userId: 'employee-1', createdAt: '', updatedAt: '' },
    { id: 'g2', title: 'Improve Test Coverage', description: 'Increase unit test coverage to 80%', status: 'ACTIVE', targetValue: 80, currentValue: 65, unit: '%', userId: 'employee-1', createdAt: '', updatedAt: '' },
    { id: 'g3', title: 'Lead Sprint Planning', description: 'Take ownership of sprint planning sessions', status: 'ACTIVE', userId: 'employee-1', createdAt: '', updatedAt: '' },
  ];

  const previewCompetencies = [
    { name: 'Technical Leadership', description: 'Guide technical decisions and mentor team members' },
    { name: 'Communication', description: 'Clear and effective communication with stakeholders' },
    { name: 'Problem Solving', description: 'Analyze complex problems and develop solutions' },
  ];

  const previewDocuments = [
    { id: 'd1', title: 'Running 1:1 Agenda Doc', url: 'https://docs.google.com/example', isRecurring: true },
    { id: 'd2', title: 'Q1 Goals Tracker', url: 'https://docs.google.com/example2', isRecurring: false },
  ];

  // Load meeting data
  useEffect(() => {
    const loadData = async () => {
      if (isPreviewMode) {
        // Load preview data
        setMeeting(previewMeeting);
        setAgenda(previewMeeting.agenda || '');
        setSharedNotes(previewMeeting.sharedNotes || '');
        setManagerNotes(previewMeeting.managerNotes || '');
        setTranscript(previewMeeting.transcript || '');
        setActionItems(previewMeeting.actionItems || '');
        setEmployeeGoals(previewGoals);
        setCurrentCycleCompetencies(previewCompetencies);
        setDocuments(previewDocuments);
        setLoading(false);
        return;
      }

      if (id) {
        await loadMeeting();
        await loadDocuments();
      }
    };
    loadData();
  }, [id, isPreviewMode]);

  const loadMeeting = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await oneOnOnesApi.getById(id);
      setMeeting(data);
      setAgenda(data.agenda || '');
      setSharedNotes(data.sharedNotes || '');
      setManagerNotes(data.managerNotes || '');
      setTranscript(data.transcript || '');
      setActionItems(data.actionItems || '');

      // Load employee context (goals and competencies)
      loadEmployeeContext(data);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.message || 'Unknown error';
      console.error('Failed to load meeting:', error);
      console.error('Meeting ID:', id);
      console.error('Error details:', errorMessage);
      setLoadError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeContext = async (meetingData: OneOnOne) => {
    const empId = user?.id === meetingData.manager.id ? meetingData.employee.id : meetingData.manager.id;

    try {
      setLoadingContext(true);

      // Load employee's active goals
      const goalsData = await goalsApi.getUserGoals(empId);
      const activeGoals = goalsData.filter((g: Goal) => g.status === 'ACTIVE');
      setEmployeeGoals(activeGoals);

      // Load review history for the employee
      const reviewHistory = await reviewsApi.getHistory(empId);

      if (reviewHistory && reviewHistory.length > 0) {
        const latestReview = reviewHistory[0];
        setLatestReviewId(latestReview.id);
        if (latestReview.competencies) {
          const parsed = JSON.parse(latestReview.competencies);
          setEmployeeCompetencies(parsed);
        }
      }

      // Load current cycle review for competencies and goals
      try {
        const cycles = await reviewCyclesApi.getAll();
        const now = new Date();

        // Find active cycle (either by status or by date range)
        const activeCycle = cycles.find((c: any) => {
          const start = new Date(c.startDate);
          const end = new Date(c.endDate);
          return (now >= start && now <= end) || c.status === 'active';
        });

        if (activeCycle && reviewHistory && reviewHistory.length > 0) {
          // Find review for current cycle from review history
          const currentReview = reviewHistory.find((r: any) => r.cycleId === activeCycle.id);

          if (currentReview) {
            setCurrentCycleReviewId(currentReview.id);

            // Parse and set current cycle competencies
            if (currentReview.competencies) {
              try {
                const competencies = JSON.parse(currentReview.competencies);
                setCurrentCycleCompetencies(Array.isArray(competencies) ? competencies : []);
              } catch (e) {
                console.error('Failed to parse competencies:', e);
                setCurrentCycleCompetencies([]);
              }
            }

            // Parse and set current cycle goals (kept for future use)
            if (currentReview.assignedGoals) {
              try {
                const assignedGoals = JSON.parse(currentReview.assignedGoals);
                setCurrentCycleGoals(Array.isArray(assignedGoals) ? assignedGoals : []);
              } catch (e) {
                console.error('Failed to parse assigned goals:', e);
                setCurrentCycleGoals([]);
              }
            }
          }
        }
      } catch (cycleError) {
        console.error('Failed to load current cycle data:', cycleError);
      }
    } catch (error) {
      console.error('Failed to load employee context:', error);
    } finally {
      setLoadingContext(false);
    }
  };

  const loadDocuments = async () => {
    if (!id) return;
    try {
      setLoadingDocuments(true);
      const docs = await oneOnOnesApi.getDocuments(id);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleAddDocument = async () => {
    if (!meeting || !newDocument.title.trim() || !newDocument.url.trim()) {
      setSaveMessage('✗ Title and URL required');
      setTimeout(() => setSaveMessage(''), 2000);
      return;
    }

    try {
      await oneOnOnesApi.addDocument(meeting.id, newDocument);
      setSaveMessage('✓ Document added');
      setTimeout(() => setSaveMessage(''), 2000);
      setShowAddDocModal(false);
      setNewDocument({ title: '', url: '', isRecurring: false });
      loadDocuments();
    } catch (error) {
      console.error('Failed to add document:', error);
      setSaveMessage('✗ Failed to add document');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!meeting) return;
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      await oneOnOnesApi.deleteDocument(meeting.id, docId);
      setSaveMessage('✓ Document deleted');
      setTimeout(() => setSaveMessage(''), 2000);
      loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      setSaveMessage('✗ Failed to delete');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  // Auto-save functions with debounce
  const saveAgenda = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.update(id, { agenda: value });
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save agenda:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  const saveSharedNotes = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateSharedNotes(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save shared notes:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  const saveManagerNotes = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateManagerNotes(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save manager notes:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  const saveTranscript = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateTranscript(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save transcript:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  const saveActionItems = useCallback(
    debounce(async (id: string, value: string) => {
      try {
        await oneOnOnesApi.updateActionItems(id, value);
        setSaveMessage('✓ Saved');
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save action items:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
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
      loadMeeting();
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

  if (loading) {
    return (
      <div style={{ padding: '48px' }}>
        <p>Loading meeting...</p>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ padding: '48px', maxWidth: '600px' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Meeting not found</h2>
        {loadError && (
          <div style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '16px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#991b1b' }}>Error details:</p>
            <p style={{ margin: 0, color: '#7f1d1d', fontFamily: 'monospace', fontSize: '14px' }}>{loadError}</p>
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
          Meeting ID: <code style={{ background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: '4px' }}>{id}</code>
        </p>
        <button
          onClick={() => navigate('/one-on-ones')}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
          }}
        >
          Back to One-on-Ones
        </button>
      </div>
    );
  }

  const otherPerson = isManager ? meeting.employee : meeting.manager;
  const meetingDate = new Date(meeting.scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <>
      <style>{editorStyles}</style>
      <div style={{ padding: '48px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            marginBottom: '24px',
          }}>
            <Eye size={20} color="#92400e" />
            <div>
              <div style={{ fontWeight: '600', color: '#92400e', fontSize: '14px' }}>
                Preview Mode
              </div>
              <div style={{ fontSize: '13px', color: '#a16207' }}>
                This is sample data showing how a 1:1 meeting looks. Changes won't be saved.
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
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
            color: 'var(--text-secondary)',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} />
          Back to One-on-Ones
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '32px', marginBottom: '8px', margin: 0 }}>
              One-on-One with {otherPerson.name}
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
              {meetingDate}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {saveMessage && (
              <span
                style={{
                  fontSize: '14px',
                  color: saveMessage.includes('✓') ? '#10b981' : '#ef4444',
                  fontWeight: '500',
                }}
              >
                {saveMessage}
              </span>
            )}
            {meeting.googleEventUrl && (
              <a
                href={meeting.googleEventUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  background: 'var(--bg-primary)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '14px',
                }}
              >
                <ExternalLink size={16} />
                View in Calendar
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabNavigation
        tabs={[
          { id: 'agenda', label: 'Agenda & Notes' },
          { id: 'transcript', label: 'Transcript' },
          { id: 'action-items', label: 'Action Items' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div style={{ marginTop: '24px' }}>
        {/* Agenda & Notes Tab */}
        {activeTab === 'agenda' && meeting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Agenda */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                }}
              >
                Agenda
              </label>
              <div style={{
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-tertiary)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
              }}>
                <MenuBar editor={agendaEditor} />
                <EditorContent
                  editor={agendaEditor}
                  style={{
                    minHeight: '120px',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Documents */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}
              >
                Shared Documents
              </label>
              <button
                onClick={() => setShowAddDocModal(true)}
                style={{
                  padding: '8px 16px',
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
                  transition: 'background 0.15s',
                  marginBottom: '12px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <LinkIcon size={14} />
                Add Document
              </button>

              {loadingDocuments ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Loading documents...</p>
              ) : documents.length === 0 ? (
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  No documents added yet. Click "Add Document" to link a Google Doc or any URL.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        background: 'var(--bg-primary)',
                      }}
                    >
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <LinkIcon size={16} style={{ color: 'var(--text-muted)' }} />
                        <div>
                          <div style={{ fontWeight: '500', fontSize: '14px' }}>{doc.title}</div>
                          {doc.isRecurring && (
                            <span
                              style={{
                                display: 'inline-block',
                                marginTop: '4px',
                                padding: '2px 8px',
                                background: '#dbeafe',
                                color: '#1e40af',
                                fontSize: '11px',
                                borderRadius: '4px',
                                fontWeight: '500',
                              }}
                            >
                              Recurring - Shows in all future 1:1s
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            padding: '8px 12px',
                            background: 'var(--bg-tertiary)',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            color: 'var(--text-secondary)',
                            textDecoration: 'none',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <ExternalLink size={14} />
                          Open
                        </a>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          style={{
                            padding: '8px 12px',
                            background: 'transparent',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '13px',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shared Notes */}
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                }}
              >
                Shared Notes
              </label>
              <div style={{
                border: '2px solid #d1d5db',
                borderRadius: '8px',
                overflow: 'hidden',
                background: 'var(--bg-tertiary)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
              }}>
                <MenuBar editor={sharedNotesEditor} />
                <EditorContent
                  editor={sharedNotesEditor}
                  style={{
                    minHeight: '200px',
                    padding: '16px',
                    background: 'var(--bg-primary)',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Manager Notes (Manager Only) */}
            {isManager && (
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Manager Notes (Private)
                </label>
                <div style={{
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: '#fef3c7',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s',
                }}>
                  <MenuBar editor={managerNotesEditor} />
                  <EditorContent
                    editor={managerNotesEditor}
                    style={{
                      minHeight: '150px',
                      padding: '16px',
                      background: '#fffbeb',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && meeting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.doc,.docx,.pdf"
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadProgress}
                  style={{
                    padding: '12px 24px',
                    background: uploadProgress ? 'var(--border-color)' : '#3b82f6',
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
                >
                  <Upload size={18} />
                  {uploadProgress ? 'Uploading...' : 'Upload Transcript File'}
                </button>
                {meeting.transcriptFileUrl && (
                  <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
                    <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
                    File uploaded
                  </p>
                )}
              </div>

              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                }}
              >
                Or Paste Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  saveTranscript(meeting.id, e.target.value);
                }}
                placeholder="Paste transcript text here..."
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
            </div>
          </div>
        )}

        {/* Action Items Tab */}
        {activeTab === 'action-items' && meeting && (
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
                    background: actionItems.trim() ? '#3b82f6' : 'var(--border-color)',
                    color: actionItems.trim() ? '#ffffff' : 'var(--text-faint)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: actionItems.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (actionItems.trim()) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (actionItems.trim()) {
                      e.currentTarget.style.background = '#3b82f6';
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
                  if (meeting) {
                    saveActionItems(meeting.id, e.target.value);
                  }
                }}
                placeholder="List action items from this meeting..."
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: '16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
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

      {/* Current Review Cycle Focus Areas - Bottom of Page */}
      <div style={{
        marginTop: '48px',
        borderTop: '2px solid var(--border-color)',
        paddingTop: '32px',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '24px',
        }}>
          Current Review Cycle Focus Areas
        </h3>

        {currentCycleCompetencies.length === 0 && employeeGoals.length === 0 && (
          <div style={{
            padding: '24px',
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            textAlign: 'center',
          }}>
            <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#92400e' }}>
              No review assigned for the current cycle. Create a review to set competencies and goals.
            </p>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => navigate('/review-management')}
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                Go to Review Management
              </button>
            )}
          </div>
        )}

        {(currentCycleCompetencies.length > 0 || employeeGoals.length > 0) && (

          <div style={{
            display: 'grid',
            gridTemplateColumns: employeeGoals.length > 0 && currentCycleCompetencies.length > 0 ? '1fr 1fr' : '1fr',
            gap: '32px',
          }}>
            {/* Competencies List */}
            {currentCycleCompetencies.length > 0 && (
              <div>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: 'var(--text-secondary)',
                  marginBottom: '12px',
                }}>
                  Competencies to Develop
                </h4>
                <div style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                }}>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {currentCycleCompetencies.map((comp, idx) => (
                      <li key={idx} style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                      }}>
                        <strong>{comp.name}</strong>
                        {comp.description && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            — {comp.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                {currentCycleReviewId && (
                  <div style={{ marginTop: '12px', textAlign: 'right' }}>
                    <button
                      onClick={() => navigate(`/reviews/${currentCycleReviewId}`)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        background: '#eff6ff',
                        color: '#3b82f6',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dbeafe';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#eff6ff';
                        e.currentTarget.style.borderColor = '#bfdbfe';
                      }}
                    >
                      View Full Review <ExternalLink size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Goals List */}
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '12px',
              }}>
                Active Goals
              </h4>
              <div style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
              }}>
                {employeeGoals.length > 0 ? (
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}>
                    {employeeGoals.map((goal, idx) => (
                      <li key={goal.id || idx} style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                      }}>
                        <strong>{goal.title}</strong>
                        {goal.description && (
                          <span style={{ color: 'var(--text-muted)', marginLeft: '8px' }}>
                            — {goal.description}
                          </span>
                        )}
                        {goal.targetValue && (
                          <div style={{
                            marginTop: '4px',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                          }}>
                            Target: {goal.targetValue} {goal.unit || ''}
                            {goal.currentValue !== undefined && ` (Current: ${goal.currentValue})`}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: 'var(--text-faint)',
                    fontStyle: 'italic',
                  }}>
                    No active goals set. Create goals to track progress.
                  </p>
                )}
              </div>
            </div>
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
              background: 'var(--bg-primary)',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px 0' }}>
                Add Document
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                Link a Google Doc or any URL to this meeting
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Document Title
                </label>
                <input
                  type="text"
                  value={newDocument.title}
                  onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
                  placeholder="e.g., Meeting Notes, Agenda Doc"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Document URL
                </label>
                <input
                  type="url"
                  value={newDocument.url}
                  onChange={(e) => setNewDocument({ ...newDocument, url: e.target.value })}
                  placeholder="https://docs.google.com/..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#d1d5db';
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newDocument.isRecurring}
                    onChange={(e) =>
                      setNewDocument({ ...newDocument, isRecurring: e.target.checked })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>
                    Show in all future 1:1s with {otherPerson.name}
                  </span>
                </label>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '6px 0 0 24px' }}>
                  Recurring documents automatically appear in every future meeting with this person
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddDocModal(false);
                  setNewDocument({ title: '', url: '', isRecurring: false });
                }}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                style={{
                  padding: '10px 20px',
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
    </>
  );
}
