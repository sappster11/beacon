import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { HelpCircle, ChevronDown, ChevronRight, BookOpen, MessageCircle, Info } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
  roles: string[];
}

interface Guide {
  title: string;
  description: string;
  steps: string[];
  category: string;
  roles: string[];
}

const faqs: FAQ[] = [
  // All Users (Employee+)
  {
    question: 'How do I complete my self-assessment?',
    answer: 'Navigate to the Reviews page and find any review with status "Self Review". Click on it to open the review form. Rate yourself on each competency using the 1-4 scale, add comments explaining your rating, and click "Submit Self Review" when complete.',
    category: 'Reviews',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'Where can I see my goals?',
    answer: 'Go to the Goals page from the sidebar. You\'ll see all your assigned goals organized by status. You can also view goals assigned during reviews by clicking on any completed review.',
    category: 'Goals',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I view my performance review results?',
    answer: 'Navigate to the Reviews page and click on any review with status "Shared" or "Acknowledged". You\'ll see your self-assessment alongside your manager\'s review. Click "Acknowledge" after reviewing to confirm you\'ve seen the feedback.',
    category: 'Reviews',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I update my profile?',
    answer: 'Click on your name/avatar at the bottom of the sidebar to access Settings. Here you can update your profile picture, notification preferences, and account settings.',
    category: 'General',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I schedule a 1:1 meeting?',
    answer: 'Go to the 1:1s page and click "Schedule 1:1". Select the person you want to meet with, choose a date and time, and optionally add an agenda. If you\'ve connected your Google Calendar, you can also sync meetings automatically.',
    category: '1:1s',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I connect my Google Calendar?',
    answer: 'Navigate to the 1:1s page and look for the "Connect Google Calendar" banner at the top. Click the button and follow the Google authentication prompts. Once connected, your calendar events will sync automatically.',
    category: '1:1s',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'What do the review ratings mean?',
    answer: 'The rating scale is: 1 = Does Not Meet Expectations, 2 = Partially Meets Expectations, 3 = Meets Expectations, 4 = Exceeds Expectations. Focus on providing honest assessments with specific examples in your comments.',
    category: 'Reviews',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  // Managers+
  {
    question: 'How do I complete reviews for my team?',
    answer: 'Go to the Reviews page and switch to the "Team Reviews" tab. You\'ll see all pending reviews for your direct reports. Click on any review with status "Manager Review" to provide your assessment and ratings.',
    category: 'Reviews',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I assign goals to employees?',
    answer: 'During a performance review, you can add goals in the "Goals" section before sharing the review. Alternatively, go to the Team page, select an employee, and add goals directly from their profile.',
    category: 'Goals',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I use the Library to create templates?',
    answer: 'Navigate to the Library page from the Management section in the sidebar. Here you can create and save goal templates, review templates, and 1:1 agenda templates that can be reused across your team.',
    category: 'Library',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I view my team\'s progress?',
    answer: 'Go to the Team page to see an overview of your direct reports. You can view each person\'s goals, review status, and upcoming 1:1s. The Dashboard also shows team-level metrics and pending items.',
    category: 'Team',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I schedule 1:1s with my direct reports?',
    answer: 'From the 1:1s page, click "Schedule 1:1" and select one of your direct reports. Set a recurring schedule if desired. You can also bulk-schedule 1:1s from the Team page.',
    category: '1:1s',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
  },
  // HR Admins+
  {
    question: 'How do I create a review cycle?',
    answer: 'Go to Review Management and click "Create Review Cycle". Define the cycle name, date range, and which departments/employees to include. Once created, the cycle will appear on the management page where you can assign reviews.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I assign reviews to employees?',
    answer: 'From Review Management, click "Assign Reviews" on any active review cycle. Select the employees to include, and the system will automatically create reviews based on their reporting structure.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I add new users?',
    answer: 'Navigate to Admin > Users tab. Click "Add User" to create individual users, or use "Bulk Import" to upload a CSV file with multiple users. New users will receive an email invitation to set up their account.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I manage departments?',
    answer: 'Go to Admin > Departments tab. Here you can create, edit, and delete departments. Assign a department head and organize your organizational structure. Users can be assigned to departments from the Users tab.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I view audit logs?',
    answer: 'Navigate to Admin > Audit Logs tab. You can filter by date range, action type, and user. The logs show all significant actions taken in the system for compliance and troubleshooting purposes.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
  {
    question: 'How do I customize company branding?',
    answer: 'Go to Admin > Company tab. Here you can upload your company logo and customize the primary, secondary, and accent colors used throughout the application.',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
  },
];

const guides: Guide[] = [
  // All Users
  {
    title: 'Completing Your Self-Assessment',
    description: 'Step-by-step guide to completing your performance self-review',
    category: 'Reviews',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to the Reviews page from the sidebar',
      'Find the review with status "Self Review" and click on it',
      'Read each competency carefully and reflect on your performance',
      'Select a rating (1-4) for each competency',
      'Add detailed comments with specific examples to support your rating',
      'Review all your responses before submitting',
      'Click "Submit Self Review" to send to your manager',
    ],
  },
  {
    title: 'Understanding Your Performance Review',
    description: 'How to interpret and acknowledge your review results',
    category: 'Reviews',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Wait for notification that your review has been shared',
      'Navigate to Reviews and find the review with status "Shared"',
      'Review your self-assessment alongside your manager\'s evaluation',
      'Note any differences between your ratings and your manager\'s',
      'Read your manager\'s comments for specific feedback',
      'Review any goals assigned for the next period',
      'Click "Acknowledge" to confirm you\'ve reviewed the feedback',
      'Schedule a follow-up 1:1 if you have questions',
    ],
  },
  {
    title: 'Setting Up Google Calendar Sync',
    description: 'Connect your calendar to automatically sync 1:1 meetings',
    category: '1:1s',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Go to the 1:1s page from the sidebar',
      'Look for the "Connect Google Calendar" banner at the top',
      'Click the "Connect" button',
      'Sign in with your Google account when prompted',
      'Grant Beacon permission to view and create calendar events',
      'Your existing 1:1 meetings will begin syncing automatically',
      'New 1:1s scheduled in Beacon will appear on your Google Calendar',
    ],
  },
  {
    title: 'Managing Your Goals',
    description: 'How to view, track, and update your goals',
    category: 'Goals',
    roles: ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to the Goals page from the sidebar',
      'View your goals organized by status (In Progress, Completed, etc.)',
      'Click on any goal to see full details and progress',
      'Update goal progress by clicking "Update Status"',
      'Add notes or comments to track your progress',
      'Goals assigned during reviews will appear automatically',
    ],
  },
  // Managers
  {
    title: 'Completing Manager Reviews',
    description: 'How to evaluate your direct reports\' performance',
    category: 'Reviews',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Go to Reviews and click "Team Reviews" tab',
      'Find reviews with status "Manager Review"',
      'Click on a review to open the evaluation form',
      'Review the employee\'s self-assessment first',
      'Provide your own rating for each competency',
      'Add specific, actionable feedback in the comments',
      'Assign goals for the next review period if applicable',
      'Click "Share Review" when ready to share with the employee',
    ],
  },
  {
    title: 'Managing Your Team',
    description: 'Overview of team management features',
    category: 'Team',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to the Team page from the sidebar',
      'View all your direct reports and their current status',
      'Click on an employee to see their full profile',
      'View their goals, review history, and upcoming 1:1s',
      'Use the Dashboard to see team-wide metrics',
      'Schedule 1:1s directly from the team member\'s profile',
    ],
  },
  {
    title: 'Using the Library',
    description: 'Create and manage reusable templates',
    category: 'Library',
    roles: ['MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to Library from the Management section',
      'Browse existing templates or click "Create Template"',
      'Choose template type: Goal, Review, or 1:1 Agenda',
      'Fill in the template details and content',
      'Save the template for future use',
      'Apply templates when creating new goals or reviews',
    ],
  },
  // HR Admins
  {
    title: 'Creating a Review Cycle',
    description: 'Set up a new performance review cycle',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Go to Review Management from the sidebar',
      'Click "Create Review Cycle" button',
      'Enter cycle name (e.g., "Q1 2025 Performance Review")',
      'Set the start and end dates for the review period',
      'Choose which departments or employees to include',
      'Configure review stages and deadlines',
      'Click "Create" to save the review cycle',
      'Assign reviews to populate the cycle with participants',
    ],
  },
  {
    title: 'Adding and Managing Users',
    description: 'How to add users individually or in bulk',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to Admin > Users tab',
      'For individual users: Click "Add User" and fill in details',
      'For bulk import: Click "Bulk Import" and upload a CSV file',
      'CSV should include: email, name, title, department, manager email',
      'Assign appropriate roles (Employee, Manager, HR Admin)',
      'Set the user\'s manager and department',
      'Click "Create" to send an invitation email',
      'Users will set up their password via the invitation link',
    ],
  },
  {
    title: 'Managing Departments',
    description: 'Set up your organizational structure',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to Admin > Departments tab',
      'Click "Add Department" to create a new department',
      'Enter department name and optional description',
      'Assign a department head (must be Manager role or above)',
      'Save the department',
      'Assign employees to departments from the Users tab',
      'Edit or delete departments as your organization changes',
    ],
  },
  {
    title: 'Customizing Company Settings',
    description: 'Configure branding and company-wide settings',
    category: 'Admin',
    roles: ['HR_ADMIN', 'SUPER_ADMIN'],
    steps: [
      'Navigate to Admin > Company tab',
      'Upload your company logo (recommended: PNG or SVG)',
      'Set primary color for main navigation and buttons',
      'Set secondary color for management sections',
      'Set accent color for highlights and special elements',
      'Preview changes before saving',
      'Click "Save" to apply branding across the application',
    ],
  },
];

export default function Help() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'faqs' | 'guides'>('faqs');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedGuide, setExpandedGuide] = useState<number | null>(null);

  const userRole = user?.role || 'EMPLOYEE';

  // Filter content based on user role
  const filteredFAQs = faqs.filter((faq) => faq.roles.includes(userRole));
  const filteredGuides = guides.filter((guide) => guide.roles.includes(userRole));

  // Group FAQs by category
  const faqsByCategory = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category].push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  // Group Guides by category
  const guidesByCategory = filteredGuides.reduce((acc, guide) => {
    if (!acc[guide.category]) {
      acc[guide.category] = [];
    }
    acc[guide.category].push(guide);
    return acc;
  }, {} as Record<string, Guide[]>);

  const categoryOrder = ['General', 'Reviews', 'Goals', '1:1s', 'Team', 'Library', 'Admin'];

  // Define which categories are role-restricted
  const getRoleBadgeText = (category: string): string | null => {
    if (category === 'Team' || category === 'Library') {
      return userRole === 'MANAGER' ? 'Manager' : userRole === 'HR_ADMIN' ? 'HR Admin' : userRole === 'SUPER_ADMIN' ? 'Admin' : null;
    }
    if (category === 'Admin') {
      return userRole === 'HR_ADMIN' ? 'HR Admin' : userRole === 'SUPER_ADMIN' ? 'Admin' : null;
    }
    return null;
  };

  const RoleBadge = ({ category }: { category: string }) => {
    const roleText = getRoleBadgeText(category);
    if (!roleText) return null;

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '4px',
        marginLeft: '10px',
        fontSize: '10px',
        color: '#1e40af',
        fontWeight: '500',
        textTransform: 'none',
        letterSpacing: '0',
      }}>
        <Info size={12} style={{ color: '#3b82f6' }} />
        Visible because you're a {roleText}
      </span>
    );
  };

  return (
    <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <HelpCircle size={28} style={{ color: 'var(--color-primary)' }} />
          <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Help Center
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0 }}>
          Find answers to common questions and step-by-step guides for using Beacon
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '0',
        }}
      >
        <button
          onClick={() => setActiveTab('faqs')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'faqs' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'faqs' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-1px',
          }}
        >
          <MessageCircle size={18} />
          FAQs
        </button>
        <button
          onClick={() => setActiveTab('guides')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'guides' ? '2px solid var(--color-primary)' : '2px solid transparent',
            color: activeTab === 'guides' ? 'var(--color-primary)' : 'var(--text-muted)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '-1px',
          }}
        >
          <BookOpen size={18} />
          Step-by-Step Guides
        </button>
      </div>

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div>
          {categoryOrder
            .filter((cat) => faqsByCategory[cat])
            .map((category) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {category}
                  <RoleBadge category={category} />
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {faqsByCategory[category].map((faq, index) => {
                    const globalIndex = filteredFAQs.indexOf(faq);
                    const isExpanded = expandedFAQ === globalIndex;

                    return (
                      <div
                        key={index}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => setExpandedFAQ(isExpanded ? null : globalIndex)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            textAlign: 'left',
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                          ) : (
                            <ChevronRight size={18} style={{ color: '#9ca3af', flexShrink: 0 }} />
                          )}
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: '500',
                              color: 'var(--text-primary)',
                            }}
                          >
                            {faq.question}
                          </span>
                        </button>
                        {isExpanded && (
                          <div
                            style={{
                              padding: '0 16px 16px 46px',
                              fontSize: '14px',
                              color: 'var(--text-secondary)',
                              lineHeight: '1.6',
                            }}
                          >
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Guides Tab */}
      {activeTab === 'guides' && (
        <div>
          {categoryOrder
            .filter((cat) => guidesByCategory[cat])
            .map((category) => (
              <div key={category} style={{ marginBottom: '32px' }}>
                <h2
                  style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {category}
                  <RoleBadge category={category} />
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {guidesByCategory[category].map((guide, index) => {
                    const globalIndex = filteredGuides.indexOf(guide);
                    const isExpanded = expandedGuide === globalIndex;

                    return (
                      <div
                        key={index}
                        style={{
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          onClick={() => setExpandedGuide(isExpanded ? null : globalIndex)}
                          style={{
                            width: '100%',
                            padding: '16px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            textAlign: 'left',
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown size={18} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                          ) : (
                            <ChevronRight size={18} style={{ color: '#9ca3af', flexShrink: 0, marginTop: '2px' }} />
                          )}
                          <div>
                            <div
                              style={{
                                fontSize: '14px',
                                fontWeight: '500',
                                color: 'var(--text-primary)',
                                marginBottom: '4px',
                              }}
                            >
                              {guide.title}
                            </div>
                            <div
                              style={{
                                fontSize: '13px',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {guide.description}
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div
                            style={{
                              padding: '0 16px 16px 46px',
                            }}
                          >
                            <ol
                              style={{
                                margin: 0,
                                paddingLeft: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                              }}
                            >
                              {guide.steps.map((step, stepIndex) => (
                                <li
                                  key={stepIndex}
                                  style={{
                                    fontSize: '14px',
                                    color: 'var(--text-secondary)',
                                    lineHeight: '1.5',
                                  }}
                                >
                                  {step}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
