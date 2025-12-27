import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { goals, goalTemplates } from '../lib/api';
import type { Goal, GoalTemplate } from '../types';
import CreateGoalTemplateModal from '../components/CreateGoalTemplateModal';
import AssignGoalModal from '../components/AssignGoalModal';

export default function Goals() {
  const { user } = useAuth();
  const [myGoals, setMyGoals] = useState<Goal[]>([]);
  const [companyGoals, setCompanyGoals] = useState<Goal[]>([]);
  const [templates, setTemplates] = useState<GoalTemplate[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'company' | 'library'>('my');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showAssignGoalModal, setShowAssignGoalModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>();

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const promises = [
        goals.getMyGoals(),
        goals.getCompanyGoals(),
      ];

      // Load templates if user is manager or above
      if (isManager) {
        promises.push(goalTemplates.getAll() as any);
      }

      const results = await Promise.all(promises);
      setMyGoals(results[0]);
      setCompanyGoals(results[1]);
      if (isManager && results[2]) {
        setTemplates(results[2]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#3b82f6';
      case 'COMPLETED':
        return '#10b981';
      case 'DRAFT':
        return '#6b7280';
      case 'CANCELLED':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    const colors: any = {
      PRIVATE: '#6b7280',
      TEAM: '#3b82f6',
      COMPANY: '#10b981',
    };
    return (
      <span
        style={{
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          background: `${colors[visibility] || '#6b7280'}20`,
          color: colors[visibility] || '#6b7280',
        }}
      >
        {visibility}
      </span>
    );
  };

  const calculateProgress = (goal: Goal) => {
    if (!goal.targetValue || goal.targetValue === 0) return 0;
    return Math.min(100, Math.round(((goal.currentValue || 0) / goal.targetValue) * 100));
  };

  const renderGoal = (goal: Goal) => {
    const progress = calculateProgress(goal);

    return (
      <div
        key={goal.id}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>{goal.title}</h3>
            <p style={{ margin: '0', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>{goal.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {getVisibilityBadge(goal.visibility)}
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                background: `${getStatusColor(goal.status)}20`,
                color: getStatusColor(goal.status),
              }}
            >
              {goal.status}
            </span>
          </div>
        </div>

        {goal.targetValue && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px', color: '#666' }}>
                {goal.currentValue || 0} / {goal.targetValue} {goal.unit}
              </span>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: getStatusColor(goal.status) }}>
                {progress}%
              </span>
            </div>
            <div style={{ background: '#e9ecef', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  background: getStatusColor(goal.status),
                  width: `${progress}%`,
                  height: '100%',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {goal.dueDate && (
          <div style={{ fontSize: '14px', color: '#666' }}>
            <strong>Due:</strong> {new Date(goal.dueDate).toLocaleDateString()}
          </div>
        )}
      </div>
    );
  };

  const renderTemplate = (template: GoalTemplate) => {
    const getCategoryColor = (category: string) => {
      const colors: any = {
        Sales: '#10b981',
        Engineering: '#3b82f6',
        'Customer Success': '#8b5cf6',
        Leadership: '#f59e0b',
        Marketing: '#ec4899',
        Operations: '#6b7280',
      };
      return colors[category] || '#6b7280';
    };

    return (
      <div
        key={template.id}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          background: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>{template.title}</h3>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: `${getCategoryColor(template.category)}20`,
                  color: getCategoryColor(template.category),
                }}
              >
                {template.category}
              </span>
            </div>
            <p style={{ margin: '0', color: '#6b7280', fontSize: '14px', lineHeight: '1.5' }}>{template.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
          {template.targetValue && (
            <div>
              <strong>Target:</strong> {template.targetValue} {template.unit}
            </div>
          )}
          {template.suggestedDuration && (
            <div>
              <strong>Duration:</strong> {template.suggestedDuration} days
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setSelectedTemplateId(template.id);
            setShowAssignGoalModal(true);
          }}
          style={{
            padding: '10px 20px',
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
          Use Template
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Goals</h1>
        <p>Loading goals...</p>
      </div>
    );
  }

  const displayGoals = activeTab === 'my' ? myGoals : activeTab === 'company' ? companyGoals : [];

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Goals & OKRs
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>Track your objectives and key results</p>
        </div>

        {isManager && (
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'library' ? (
              <button
                onClick={() => setShowCreateTemplateModal(true)}
                style={{
                  padding: '10px 20px',
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
                Create Template
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedTemplateId(undefined);
                  setShowAssignGoalModal(true);
                }}
                style={{
                  padding: '10px 20px',
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
                Create Goal
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('my')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'my' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-1px',
            fontWeight: activeTab === 'my' ? '500' : '400',
            color: activeTab === 'my' ? '#3b82f6' : '#6b7280',
            fontSize: '14px',
            transition: 'all 0.15s',
          }}
        >
          My Goals ({myGoals.length})
        </button>
        <button
          onClick={() => setActiveTab('company')}
          style={{
            padding: '12px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: activeTab === 'company' ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: '-1px',
            fontWeight: activeTab === 'company' ? '500' : '400',
            color: activeTab === 'company' ? '#3b82f6' : '#6b7280',
            fontSize: '14px',
            transition: 'all 0.15s',
          }}
        >
          Company Goals ({companyGoals.length})
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab('library')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderBottom: activeTab === 'library' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-1px',
              fontWeight: activeTab === 'library' ? '500' : '400',
              color: activeTab === 'library' ? '#3b82f6' : '#6b7280',
              fontSize: '14px',
              transition: 'all 0.15s',
            }}
          >
            Goal Library ({templates.length})
          </button>
        )}
      </div>

      {activeTab === 'library' ? (
        templates.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>No goal templates found</h3>
            <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Goal templates will appear here once they are created.</p>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px' }}>{templates.map(renderTemplate)}</div>
        )
      ) : displayGoals.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>No goals found</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>{activeTab === 'my' ? "You don't have any goals yet." : 'No company-wide goals set.'}</p>
        </div>
      ) : (
        <div style={{ maxWidth: '1400px' }}>{displayGoals.map(renderGoal)}</div>
      )}

      {/* Modals */}
      {showCreateTemplateModal && (
        <CreateGoalTemplateModal
          onClose={() => setShowCreateTemplateModal(false)}
          onCreated={(template) => {
            setTemplates([...templates, template]);
            setShowCreateTemplateModal(false);
          }}
        />
      )}

      {showAssignGoalModal && (
        <AssignGoalModal
          templateId={selectedTemplateId}
          onClose={() => {
            setShowAssignGoalModal(false);
            setSelectedTemplateId(undefined);
          }}
          onCreated={(goal) => {
            // Reload goals to show the newly created one
            loadGoals();
            setShowAssignGoalModal(false);
            setSelectedTemplateId(undefined);
          }}
        />
      )}
    </div>
  );
}
