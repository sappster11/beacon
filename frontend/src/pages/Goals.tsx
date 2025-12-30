import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reviews } from '../lib/api';
import type { Review, AssignedGoal } from '../types';
import { Target, Calendar, ExternalLink } from 'lucide-react';

interface GoalWithReview {
  goal: AssignedGoal;
  review: Review;
}

export default function Goals() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [goalsWithReviews, setGoalsWithReviews] = useState<GoalWithReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      // Get all reviews where the user is the reviewee
      const myReviews = await reviews.getMyReviews();

      // Extract goals from each review
      const allGoals: GoalWithReview[] = [];
      for (const review of myReviews) {
        // Only include reviews where user is the reviewee
        if (review.reviewee?.id !== user?.id) continue;

        if (review.assignedGoals) {
          try {
            const parsedGoals: AssignedGoal[] = typeof review.assignedGoals === 'string'
              ? JSON.parse(review.assignedGoals)
              : review.assignedGoals;

            for (const goal of parsedGoals) {
              allGoals.push({ goal, review });
            }
          } catch (e) {
            console.error('Failed to parse goals for review', review.id);
          }
        }
      }

      setGoalsWithReviews(allGoals);
    } catch (err: any) {
      setError(err.message || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return '#10b981';
      case 'almost_done':
        return '#3b82f6';
      case 'partially_achieved':
        return '#f59e0b';
      case 'not_achieved':
        return '#ef4444';
      default:
        return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'Achieved';
      case 'almost_done':
        return 'Almost Done';
      case 'partially_achieved':
        return 'Partially Achieved';
      case 'not_achieved':
        return 'Not Achieved';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>My Goals</h1>
        <p style={{ color: 'var(--text-muted)' }}>Loading goals...</p>
      </div>
    );
  }

  // Group goals by review cycle
  const goalsByReview = goalsWithReviews.reduce((acc, { goal, review }) => {
    const cycleName = review.cycle?.name || 'Unknown Cycle';
    if (!acc[cycleName]) {
      acc[cycleName] = { review, goals: [] };
    }
    acc[cycleName].goals.push(goal);
    return acc;
  }, {} as Record<string, { review: Review; goals: AssignedGoal[] }>);

  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Target size={28} color="#f59e0b" />
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>My Goals</h1>
        </div>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          Goals assigned to you from performance reviews
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {goalsWithReviews.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-tertiary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
          }}
        >
          <Target size={40} color="var(--text-faint)" style={{ marginBottom: '16px' }} />
          <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
            No goals assigned yet
          </h3>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
            Goals will appear here once they are assigned in your performance reviews.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '900px' }}>
          {Object.entries(goalsByReview).map(([cycleName, { review, goals }]) => (
            <div
              key={review.id}
              style={{
                marginBottom: '24px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Review Cycle Header */}
              <div
                style={{
                  padding: '16px 20px',
                  background: 'var(--bg-tertiary)',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {cycleName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Calendar size={14} />
                    <span>Manager: {review.reviewer?.name || 'Unknown'}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/reviews/${review.id}`)}
                  style={{
                    padding: '8px 14px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ExternalLink size={14} />
                  View Review
                </button>
              </div>

              {/* Goals List */}
              <div style={{ padding: '8px 0' }}>
                {goals.map((goal, index) => (
                  <div
                    key={goal.id || index}
                    style={{
                      padding: '16px 20px',
                      borderBottom: index < goals.length - 1 ? '1px solid var(--bg-tertiary)' : 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'start',
                      gap: '16px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <Target size={16} color="#f59e0b" />
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {goal.title}
                        </h4>
                      </div>
                      {goal.description && (
                        <p style={{ margin: '4px 0 0 24px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                          {goal.description}
                        </p>
                      )}
                      {goal.dueDate && (
                        <p style={{ margin: '8px 0 0 24px', fontSize: '13px', color: 'var(--text-faint)' }}>
                          Due: {new Date(goal.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: `${getStatusColor(goal.status)}15`,
                        color: getStatusColor(goal.status),
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {getStatusLabel(goal.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
