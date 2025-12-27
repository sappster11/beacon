import { useEffect, useState, useCallback } from 'react';
import { Award, TrendingUp, Target, MessageSquare, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import type { Review, Competency, SelfReflection, AssignedGoal } from '../types';
import { reviews as reviewsApi } from '../lib/api';
import TabNavigation from './TabNavigation';
import CompetencyCard from './CompetencyCard';
import GoalWithStatus from './GoalWithStatus';

interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  isReviewer: boolean;
  isPage?: boolean;
}

const RATING_LABELS = {
  1: 'Not effective',
  2: 'Minimally effective',
  3: 'Effective',
  4: 'Highly effective',
};

const getRatingColor = (rating: number) => {
  const colors = {
    1: '#ef4444',
    2: '#f59e0b',
    3: '#10b981',
    4: '#3b82f6',
  };
  return colors[rating as keyof typeof colors] || '#6b7280';
};

// Calculate weighted average for competencies
const calculateCompetencyAverage = (competencies: Competency[], type: 'self' | 'manager'): number | null => {
  const rated = competencies.filter(c =>
    type === 'self' ? c.selfRating !== undefined : c.managerRating !== undefined
  );

  if (rated.length === 0) return null;

  const totalScore = rated.reduce((sum, comp) => {
    const rating = type === 'self' ? comp.selfRating! : comp.managerRating!;
    return sum + rating;
  }, 0);

  return totalScore / rated.length;
};

// Calculate weighted average for goals
const calculateGoalAverage = (goals: AssignedGoal[], type: 'self' | 'manager'): number | null => {
  const rated = goals.filter(g =>
    type === 'self' ? g.selfRating !== undefined : g.managerRating !== undefined
  );

  if (rated.length === 0) return null;

  const totalScore = rated.reduce((sum, goal) => {
    const rating = type === 'self' ? goal.selfRating! : goal.managerRating!;
    return sum + rating;
  }, 0);

  return totalScore / rated.length;
};

// Calculate combined average (50% competencies, 50% goals)
const calculateCombinedAverage = (
  competencies: Competency[],
  goals: AssignedGoal[],
  type: 'self' | 'manager'
): number | null => {
  const compAvg = calculateCompetencyAverage(competencies, type);
  const goalAvg = calculateGoalAverage(goals, type);

  // Need both averages to calculate combined
  if (compAvg === null || goalAvg === null) return null;

  return (compAvg + goalAvg) / 2;
};

// Debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function ReviewDetailModal({ review, isOpen, onClose, isReviewer, isPage = false }: ReviewDetailModalProps) {
  const [activeTab, setActiveTab] = useState('scoring');
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [selfReflections, setSelfReflections] = useState<SelfReflection[]>([]);
  const [assignedGoals, setAssignedGoals] = useState<AssignedGoal[]>([]);
  const [saveMessage, setSaveMessage] = useState('');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Add competency form state
  const [showAddCompetency, setShowAddCompetency] = useState(false);
  const [newCompetencyName, setNewCompetencyName] = useState('');
  const [newCompetencyDescription, setNewCompetencyDescription] = useState('');

  // Add goal form state
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalDescription, setNewGoalDescription] = useState('');

  // Add self-reflection form state
  const [showAddReflection, setShowAddReflection] = useState(false);
  const [newReflectionQuestion, setNewReflectionQuestion] = useState('');
  const [editingReflectionIndex, setEditingReflectionIndex] = useState<number | null>(null);
  const [editReflectionQuestion, setEditReflectionQuestion] = useState('');
  const [reflectionDropdownIndex, setReflectionDropdownIndex] = useState<number | null>(null);

  // Parse review data
  useEffect(() => {
    if (review) {
      try {
        if (review.competencies) {
          setCompetencies(JSON.parse(review.competencies));
        }
        if (review.selfReflections) {
          setSelfReflections(JSON.parse(review.selfReflections));
        }
        if (review.assignedGoals) {
          const goals = JSON.parse(review.assignedGoals);
          // Ensure all goals have IDs
          const goalsWithIds = goals.map((goal: AssignedGoal) => ({
            ...goal,
            id: goal.id || crypto.randomUUID(),
          }));
          setAssignedGoals(goalsWithIds);
        }
      } catch (error) {
        console.error('Failed to parse review data:', error);
      }
    }
  }, [review]);

  // Auto-save competencies
  const saveCompetencies = useCallback(
    debounce(async (reviewId: string, comps: Competency[], isReviewer: boolean) => {
      try {
        if (isReviewer) {
          await reviewsApi.submitCompetencyManagerRatings(reviewId, comps);
        } else {
          await reviewsApi.submitCompetencySelfRatings(reviewId, comps);
        }
        setSaveMessage('✓ Saved');
        setLastSavedTime(new Date());
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save competencies:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  // Auto-save self-reflections
  const saveSelfReflections = useCallback(
    debounce(async (reviewId: string, reflections: SelfReflection[]) => {
      try {
        await reviewsApi.submitSelfReflections(reviewId, reflections);
        setSaveMessage('✓ Saved');
        setLastSavedTime(new Date());
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save reflections:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  // Auto-save goals
  const saveGoals = useCallback(
    debounce(async (reviewId: string, goals: AssignedGoal[]) => {
      try {
        await reviewsApi.assignGoals(reviewId, goals);
        setSaveMessage('✓ Saved');
        setLastSavedTime(new Date());
        setTimeout(() => setSaveMessage(''), 2000);
      } catch (error) {
        console.error('Failed to save goals:', error);
        setSaveMessage('✗ Failed to save');
        setTimeout(() => setSaveMessage(''), 3000);
      }
    }, 500),
    []
  );

  // Handle competency changes
  const handleCompetencyChange = (index: number, updatedCompetency: Competency) => {
    const updated = [...competencies];
    updated[index] = updatedCompetency;
    setCompetencies(updated);
    if (review) {
      saveCompetencies(review.id, updated, isReviewer);
    }
  };

  // Handle self-reflections changes
  const handleReflectionsChange = (updatedReflections: SelfReflection[]) => {
    setSelfReflections(updatedReflections);
    if (review) {
      saveSelfReflections(review.id, updatedReflections);
    }
  };

  // Handle goals changes
  const handleGoalsChange = (index: number, updatedGoal: AssignedGoal) => {
    const updated = [...assignedGoals];
    updated[index] = updatedGoal;
    setAssignedGoals(updated);
    if (review) {
      saveGoals(review.id, updated);
    }
  };

  // Handle adding new competency
  const handleAddCompetency = () => {
    if (!newCompetencyName.trim()) return;

    const newCompetency: Competency = {
      name: newCompetencyName.trim(),
      description: newCompetencyDescription.trim(),
    };

    const updated = [...competencies, newCompetency];
    setCompetencies(updated);

    // Reset form
    setNewCompetencyName('');
    setNewCompetencyDescription('');
    setShowAddCompetency(false);

    // Save to backend
    if (review) {
      saveCompetencies(review.id, updated, isReviewer);
    }
  };

  // Handle adding new goal
  const handleAddGoal = () => {
    if (!newGoalTitle.trim()) return;

    const newGoal: AssignedGoal = {
      id: crypto.randomUUID(),
      title: newGoalTitle.trim(),
      description: newGoalDescription.trim(),
      status: 'not_achieved',
    };

    const updated = [...assignedGoals, newGoal];
    setAssignedGoals(updated);

    // Reset form
    setNewGoalTitle('');
    setNewGoalDescription('');
    setShowAddGoal(false);

    // Save to backend
    if (review) {
      saveGoals(review.id, updated);
    }
  };

  // Handle removing competency
  const handleRemoveCompetency = (index: number) => {
    const updated = competencies.filter((_, i) => i !== index);
    setCompetencies(updated);
    if (review) {
      saveCompetencies(review.id, updated, isReviewer);
    }
  };

  // Handle removing goal
  const handleRemoveGoal = (index: number) => {
    const updated = assignedGoals.filter((_, i) => i !== index);
    setAssignedGoals(updated);
    if (review) {
      saveGoals(review.id, updated);
    }
  };

  // Handle adding new self-reflection question
  const handleAddReflection = () => {
    if (!newReflectionQuestion.trim()) return;

    const newReflection: SelfReflection = {
      question: newReflectionQuestion.trim(),
      answer: '',
    };

    const updated = [...selfReflections, newReflection];
    setSelfReflections(updated);

    // Reset form
    setNewReflectionQuestion('');
    setShowAddReflection(false);

    // Save to backend (manager can modify questions)
    if (review && isReviewer) {
      saveSelfReflections(review.id, updated);
    }
  };

  // Handle removing self-reflection question
  const handleRemoveReflection = (index: number) => {
    const updated = selfReflections.filter((_, i) => i !== index);
    setSelfReflections(updated);
    setReflectionDropdownIndex(null);
    if (review && isReviewer) {
      saveSelfReflections(review.id, updated);
    }
  };

  // Handle editing self-reflection question
  const handleStartEditReflection = (index: number) => {
    setEditingReflectionIndex(index);
    setEditReflectionQuestion(selfReflections[index].question);
    setReflectionDropdownIndex(null);
  };

  const handleSaveEditReflection = () => {
    if (editingReflectionIndex === null || !editReflectionQuestion.trim()) return;

    const updated = [...selfReflections];
    updated[editingReflectionIndex] = {
      ...updated[editingReflectionIndex],
      question: editReflectionQuestion.trim()
    };
    setSelfReflections(updated);
    setEditingReflectionIndex(null);
    setEditReflectionQuestion('');

    if (review && isReviewer) {
      saveSelfReflections(review.id, updated);
    }
  };

  const handleCancelEditReflection = () => {
    setEditingReflectionIndex(null);
    setEditReflectionQuestion('');
  };

  if (!isOpen || !review) return null;

  const competencyWeight = competencies.length > 0 ? 100 / competencies.length : 0;
  const goalWeight = assignedGoals.length > 0 ? 100 / assignedGoals.length : 0;

  const contentStyle = isPage
    ? {
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0',
        maxWidth: '1000px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column' as 'column',
        border: '1px solid #e5e7eb',
      }
    : {
        background: '#ffffff',
        borderRadius: '12px',
        padding: '0',
        maxWidth: '1000px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as 'column',
      };

  const content = (
    <div style={contentStyle} onClick={isPage ? undefined : (e) => e.stopPropagation()}>
      {/* Header */}
      <div
        style={{
          padding: '24px 32px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
            {review.cycle?.name || 'Performance Review'}
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {review.reviewee?.name} • {review.reviewee?.title}
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
          {lastSavedTime && (
            <span
              style={{
                fontSize: '13px',
                color: '#6b7280',
                fontWeight: '500',
              }}
            >
              Last Saved: {lastSavedTime.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        tabs={[
          { id: 'scoring', label: 'Scoring' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {/* Scoring Tab */}
        {activeTab === 'scoring' && (
          <>
            {/* Competencies */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <TrendingUp size={20} color="#10b981" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Competencies
                  </h3>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {competencies.length > 0 && (
                    <span style={{ fontSize: '14px', color: '#6b7280' }}>
                      Each competency weighted at {competencyWeight.toFixed(1)}%
                    </span>
                  )}
                  {isReviewer && (
                    <button
                      onClick={() => setShowAddCompetency(!showAddCompetency)}
                      style={{
                        padding: '8px 16px',
                        background: showAddCompetency ? '#f3f4f6' : '#3b82f6',
                        color: showAddCompetency ? '#374151' : '#ffffff',
                        border: showAddCompetency ? '1px solid #d1d5db' : 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!showAddCompetency) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!showAddCompetency) {
                          e.currentTarget.style.background = '#3b82f6';
                        }
                      }}
                    >
                      {showAddCompetency ? 'Cancel' : '+ Add Competency'}
                    </button>
                  )}
                </div>
              </div>

              {/* Add Competency Form */}
              {showAddCompetency && (
                <div style={{
                  padding: '20px',
                  background: '#f0fdf4',
                  border: '2px solid #86efac',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#166534' }}>
                    Add New Competency
                  </h4>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Competency Name *
                    </label>
                    <input
                      type="text"
                      value={newCompetencyName}
                      onChange={(e) => setNewCompetencyName(e.target.value)}
                      placeholder="e.g., Technical Expertise"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Description
                    </label>
                    <textarea
                      value={newCompetencyDescription}
                      onChange={(e) => setNewCompetencyDescription(e.target.value)}
                      placeholder="Describe what this competency involves..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowAddCompetency(false);
                        setNewCompetencyName('');
                        setNewCompetencyDescription('');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCompetency}
                      disabled={!newCompetencyName.trim()}
                      style={{
                        padding: '8px 16px',
                        background: !newCompetencyName.trim() ? '#9ca3af' : '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !newCompetencyName.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (newCompetencyName.trim()) {
                          e.currentTarget.style.background = '#059669';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newCompetencyName.trim()) {
                          e.currentTarget.style.background = '#10b981';
                        }
                      }}
                    >
                      Add Competency
                    </button>
                  </div>
                </div>
              )}

              {/* Competency Cards */}
              {competencies.length > 0 ? (
                <div>
                  {competencies.map((comp, index) => (
                    <CompetencyCard
                      key={`comp-${index}-${comp.name}`}
                      competency={comp}
                      reviewId={review.id}
                      weight={competencyWeight}
                      isReviewee={!isReviewer}
                      isReviewer={isReviewer}
                      onCompetencyChange={(updated) => handleCompetencyChange(index, updated)}
                      onDelete={() => handleRemoveCompetency(index)}
                    />
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    No competencies have been added yet. Click "Add Competency" to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Goals Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Target size={20} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Goals for Next Period</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {assignedGoals.length > 0 && (
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    Each goal weighted at {goalWeight.toFixed(1)}%
                  </span>
                )}
                {isReviewer && (
                <button
                  onClick={() => setShowAddGoal(!showAddGoal)}
                  style={{
                    padding: '8px 16px',
                    background: showAddGoal ? '#f3f4f6' : '#3b82f6',
                    color: showAddGoal ? '#374151' : '#ffffff',
                    border: showAddGoal ? '1px solid #d1d5db' : 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!showAddGoal) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!showAddGoal) {
                      e.currentTarget.style.background = '#3b82f6';
                    }
                  }}
                >
                  {showAddGoal ? 'Cancel' : '+ Add Goal'}
                </button>
                )}
              </div>
            </div>

            {/* Add Goal Form */}
            {showAddGoal && (
              <div style={{
                padding: '20px',
                background: '#fffbeb',
                border: '2px solid #fbbf24',
                borderRadius: '8px',
                marginBottom: '16px',
              }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#92400e' }}>
                  Add New Goal
                </h4>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Goal Title *
                  </label>
                  <input
                    type="text"
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="e.g., Improve customer satisfaction score"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Description
                  </label>
                  <textarea
                    value={newGoalDescription}
                    onChange={(e) => setNewGoalDescription(e.target.value)}
                    placeholder="Describe what this goal involves and success criteria..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#d1d5db';
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setShowAddGoal(false);
                      setNewGoalTitle('');
                      setNewGoalDescription('');
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#ffffff',
                      color: '#374151',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#ffffff';
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddGoal}
                    disabled={!newGoalTitle.trim()}
                    style={{
                      padding: '8px 16px',
                      background: !newGoalTitle.trim() ? '#9ca3af' : '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: !newGoalTitle.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (newGoalTitle.trim()) {
                        e.currentTarget.style.background = '#d97706';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (newGoalTitle.trim()) {
                        e.currentTarget.style.background = '#f59e0b';
                      }
                    }}
                  >
                    Add Goal
                  </button>
                </div>
              </div>
            )}

            {/* Goal Cards */}
            {assignedGoals.length > 0 ? (
              <div>
                {assignedGoals.map((goal, index) => (
                  <GoalWithStatus
                    key={goal.id || `goal-${index}-${goal.title}`}
                    goal={goal}
                    reviewId={review!.id}
                    isManager={isReviewer}
                    weight={goalWeight}
                    onStatusChange={(updated) => handleGoalsChange(index, updated)}
                    onDelete={() => handleRemoveGoal(index)}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '32px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                  No goals have been assigned for this review yet. Click "Add Goal" to get started.
                </p>
              </div>
            )}
          </div>

            {/* Self Reflections */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <MessageSquare size={20} color="#8b5cf6" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Self-Reflection Questions
                  </h3>
                </div>
                {isReviewer && (
                  <button
                    onClick={() => setShowAddReflection(!showAddReflection)}
                    style={{
                      padding: '8px 16px',
                      background: showAddReflection ? '#f3f4f6' : '#3b82f6',
                      color: showAddReflection ? '#374151' : '#ffffff',
                      border: showAddReflection ? '1px solid #d1d5db' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '500',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!showAddReflection) {
                        e.currentTarget.style.background = '#2563eb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!showAddReflection) {
                        e.currentTarget.style.background = '#3b82f6';
                      }
                    }}
                  >
                    {showAddReflection ? 'Cancel' : '+ Add Question'}
                  </button>
                )}
              </div>

              {/* Add Reflection Form */}
              {showAddReflection && (
                <div style={{
                  padding: '20px',
                  background: '#f5f3ff',
                  border: '2px solid #c4b5fd',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#5b21b6' }}>
                    Add New Self-Reflection Question
                  </h4>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                      Question *
                    </label>
                    <textarea
                      value={newReflectionQuestion}
                      onChange={(e) => setNewReflectionQuestion(e.target.value)}
                      placeholder="e.g., What are you most proud of this review period?"
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = '#d1d5db';
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowAddReflection(false);
                        setNewReflectionQuestion('');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f3f4f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#ffffff';
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddReflection}
                      disabled={!newReflectionQuestion.trim()}
                      style={{
                        padding: '8px 16px',
                        background: !newReflectionQuestion.trim() ? '#9ca3af' : '#8b5cf6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: !newReflectionQuestion.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (newReflectionQuestion.trim()) {
                          e.currentTarget.style.background = '#7c3aed';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newReflectionQuestion.trim()) {
                          e.currentTarget.style.background = '#8b5cf6';
                        }
                      }}
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              )}

              {/* Reflection Cards */}
              {selfReflections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {selfReflections.map((reflection, index) => (
                    <div
                      key={`reflection-${index}-${reflection.question.substring(0, 20)}`}
                      style={{
                        padding: '16px',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      {editingReflectionIndex === index ? (
                        <div style={{ marginBottom: '12px' }}>
                          <textarea
                            value={editReflectionQuestion}
                            onChange={(e) => setEditReflectionQuestion(e.target.value)}
                            rows={2}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: '1px solid #3b82f6',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                              outline: 'none',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              marginBottom: '8px',
                            }}
                            placeholder="Question"
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={handleCancelEditReflection}
                              style={{
                                padding: '6px 12px',
                                background: '#ffffff',
                                color: '#374151',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#f3f4f6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#ffffff';
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEditReflection}
                              disabled={!editReflectionQuestion.trim()}
                              style={{
                                padding: '6px 12px',
                                background: !editReflectionQuestion.trim() ? '#9ca3af' : '#3b82f6',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: !editReflectionQuestion.trim() ? 'not-allowed' : 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                transition: 'all 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                if (editReflectionQuestion.trim()) {
                                  e.currentTarget.style.background = '#2563eb';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (editReflectionQuestion.trim()) {
                                  e.currentTarget.style.background = '#3b82f6';
                                }
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '600', color: '#111827', flex: 1 }}>
                            {reflection.question}
                          </h4>
                          {isReviewer && (
                            <div style={{ position: 'relative', marginLeft: '8px' }}>
                              <button
                                onClick={() => setReflectionDropdownIndex(reflectionDropdownIndex === index ? null : index)}
                                style={{
                                  padding: '6px',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  borderRadius: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f3f4f6';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                                title="Options"
                              >
                                <MoreVertical size={16} color="#6b7280" />
                              </button>

                              {/* Dropdown Menu */}
                              {reflectionDropdownIndex === index && (
                                <div style={{
                                  position: 'absolute',
                                  top: '100%',
                                  right: '0',
                                  marginTop: '4px',
                                  background: '#ffffff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                  zIndex: 10,
                                  minWidth: '120px',
                                }}>
                                  <button
                                    onClick={() => handleStartEditReflection(index)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      background: 'transparent',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      color: '#374151',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#f9fafb';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    <Edit2 size={14} />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleRemoveReflection(index)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      background: 'transparent',
                                      border: 'none',
                                      borderTop: '1px solid #f3f4f6',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      textAlign: 'left',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      color: '#ef4444',
                                      transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = '#fef2f2';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'transparent';
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {!isReviewer ? (
                        <textarea
                          value={reflection.answer}
                          onChange={(e) => {
                            const updated = [...selfReflections];
                            updated[index] = { ...updated[index], answer: e.target.value };
                            handleReflectionsChange(updated);
                          }}
                          placeholder="Enter your response..."
                          rows={4}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            fontSize: '14px',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit',
                            lineHeight: '1.6',
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = '#e5e7eb';
                          }}
                        />
                      ) : (
                        <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                          {reflection.answer || <em style={{ color: '#9ca3af' }}>No response provided</em>}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '32px',
                  background: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                    No self-reflection questions have been added yet. Click "Add Question" to get started.
                  </p>
                </div>
              )}
            </div>

            {/* Combined Average Section */}
            {(competencies.length > 0 || assignedGoals.length > 0) && (
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Award size={20} color="#3b82f6" />
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                    Performance Summary
                  </h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Self Assessment Summary */}
                  <div style={{
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                      Individual Assessment
                    </div>

                    {/* Competencies Average */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                        Competencies Average
                      </div>
                      {calculateCompetencyAverage(competencies, 'self') !== null ? (
                        <div style={{
                          padding: '10px 12px',
                          background: `${getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'self')!))}15`,
                          border: `1px solid ${getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'self')!))}40`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'self')!)),
                          fontWeight: '600',
                        }}>
                          {calculateCompetencyAverage(competencies, 'self')!.toFixed(2)} / 4.00
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>

                    {/* Goals Average */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                        Goals Average
                      </div>
                      {calculateGoalAverage(assignedGoals, 'self') !== null ? (
                        <div style={{
                          padding: '10px 12px',
                          background: `${getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'self')!))}15`,
                          border: `1px solid ${getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'self')!))}40`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'self')!)),
                          fontWeight: '600',
                        }}>
                          {calculateGoalAverage(assignedGoals, 'self')!.toFixed(2)} / 4.00
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>

                    {/* Combined Average */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '2px solid #e5e7eb',
                    }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                        Overall Rating
                      </div>
                      {calculateCombinedAverage(competencies, assignedGoals, 'self') !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: getRatingColor(Math.round(calculateCombinedAverage(competencies, assignedGoals, 'self')!)),
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: '600',
                          }}>
                            {calculateCombinedAverage(competencies, assignedGoals, 'self')!.toFixed(1)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                              {RATING_LABELS[Math.round(calculateCombinedAverage(competencies, assignedGoals, 'self')!) as keyof typeof RATING_LABELS]}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              50% Competencies + 50% Goals
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '18px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Manager Assessment Summary */}
                  <div style={{
                    padding: '20px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}>
                    <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px', fontWeight: '500', textTransform: 'uppercase' }}>
                      Manager Assessment
                    </div>

                    {/* Competencies Average */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                        Competencies Average
                      </div>
                      {calculateCompetencyAverage(competencies, 'manager') !== null ? (
                        <div style={{
                          padding: '10px 12px',
                          background: `${getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'manager')!))}15`,
                          border: `1px solid ${getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'manager')!))}40`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: getRatingColor(Math.round(calculateCompetencyAverage(competencies, 'manager')!)),
                          fontWeight: '600',
                        }}>
                          {calculateCompetencyAverage(competencies, 'manager')!.toFixed(2)} / 4.00
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>

                    {/* Goals Average */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                        Goals Average
                      </div>
                      {calculateGoalAverage(assignedGoals, 'manager') !== null ? (
                        <div style={{
                          padding: '10px 12px',
                          background: `${getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'manager')!))}15`,
                          border: `1px solid ${getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'manager')!))}40`,
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: getRatingColor(Math.round(calculateGoalAverage(assignedGoals, 'manager')!)),
                          fontWeight: '600',
                        }}>
                          {calculateGoalAverage(assignedGoals, 'manager')!.toFixed(2)} / 4.00
                        </div>
                      ) : (
                        <div style={{
                          padding: '10px 12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '14px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>

                    {/* Combined Average */}
                    <div style={{
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '2px solid #e5e7eb',
                    }}>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                        Overall Rating
                      </div>
                      {calculateCombinedAverage(competencies, assignedGoals, 'manager') !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: getRatingColor(Math.round(calculateCombinedAverage(competencies, assignedGoals, 'manager')!)),
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '20px',
                            fontWeight: '600',
                          }}>
                            {calculateCombinedAverage(competencies, assignedGoals, 'manager')!.toFixed(1)}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                              {RATING_LABELS[Math.round(calculateCombinedAverage(competencies, assignedGoals, 'manager')!) as keyof typeof RATING_LABELS]}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>
                              50% Competencies + 50% Goals
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '12px',
                          background: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          fontSize: '18px',
                          color: '#9ca3af',
                          fontWeight: '600',
                          textAlign: 'center',
                        }}>
                          --
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // If rendering as a page, return content directly
  if (isPage) {
    return content;
  }

  // If rendering as a modal, wrap in overlay
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
