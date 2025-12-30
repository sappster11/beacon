import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reviews, reviewCycles, manager } from '../lib/api';
import type { Review, ReviewCycle, User } from '../types';
import { ReviewsSkeleton } from '../components/Skeleton';
import { ChevronDown } from 'lucide-react';

export default function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [subordinates, setSubordinates] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'completed'>('current');
  const [roleFilter, setRoleFilter] = useState<'all' | 'reviewee' | 'reviewer'>('all');
  const [cycleFilter, setCycleFilter] = useState<string>('active');

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // HR Admins can see all reviews in the system
      const isHRAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

      // Get all subordinates (direct + indirect reports) for managers
      const subordinatesData = isManager ? await manager.getFullOrgTree() : [];
      setSubordinates(subordinatesData);

      // Get subordinate IDs for filtering
      const subordinateIds = subordinatesData.map(s => s.id);

      const [reviewsData, cyclesData] = await Promise.all([
        isHRAdmin ? reviews.getAll() : reviews.getMyReviews(subordinateIds),
        reviewCycles.getAll(),
      ]);

      setAllReviews(reviewsData);
      setCycles(cyclesData);

      // Set initial cycle filter to active cycle if exists
      const activeCycle = cyclesData.find((c: ReviewCycle) => c.status === 'active');
      if (activeCycle) {
        setCycleFilter(activeCycle.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reviews based on status, role, and cycle
  const filteredReviews = allReviews.filter(review => {
    // Cycle filter
    if (cycleFilter !== 'all') {
      if (review.cycle?.id !== cycleFilter) return false;
    }

    // Status filter - 'current' means any in-progress status, 'completed' means COMPLETED
    if (statusFilter === 'current') {
      // In-progress statuses (not completed)
      const inProgressStatuses = ['SELF_REVIEW', 'MANAGER_REVIEW', 'READY_TO_SHARE', 'SHARED', 'ACKNOWLEDGED', 'PENDING_APPROVAL'];
      if (!inProgressStatuses.includes(review.status)) return false;
    } else if (statusFilter === 'completed') {
      if (review.status !== 'COMPLETED') return false;
    }

    // Role filter
    if (roleFilter === 'reviewee') {
      if (review.reviewee.id !== user?.id) return false;
    } else if (roleFilter === 'reviewer') {
      if (review.reviewer.id !== user?.id) return false;
    }

    return true;
  });

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: 'Does Not Meet Expectations',
      2: 'Partially Meets Expectations',
      3: 'Meets Expectations',
      4: 'Exceeds Expectations',
    };
    return labels[rating] || 'Not Rated';
  };

  const getRatingColor = (rating: number) => {
    const colors: Record<number, string> = {
      1: '#ef4444',
      2: '#f59e0b',
      3: '#10b981',
      4: '#3b82f6',
    };
    return colors[rating] || 'var(--text-muted)';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981';
      case 'SELF_REVIEW':
        return '#3b82f6';
      case 'MANAGER_REVIEW':
        return '#f59e0b';
      case 'READY_TO_SHARE':
        return '#8b5cf6';
      case 'SHARED':
        return '#06b6d4';
      case 'ACKNOWLEDGED':
        return '#10b981';
      case 'PENDING_APPROVAL':
        return '#f59e0b';
      // Legacy statuses
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'NOT_STARTED':
        return 'var(--text-muted)';
      default:
        return 'var(--text-muted)';
    }
  };

  const renderReviewCard = (review: any) => {
    const isReviewee = review.reviewee.id === user?.id;
    const otherPerson = isReviewee ? review.reviewer : review.reviewee;
    const roleLabel = isReviewee ? 'Reviewer' : 'Reviewee';

    return (
      <div
        key={review.id}
        className="review-card"
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          background: 'var(--bg-primary)',
          transition: 'all 0.2s',
        }}
      >
        <div className="review-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{review.cycle.name}</h3>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600',
                  background: isReviewee ? '#dbeafe' : '#fef3c7',
                  color: isReviewee ? '#1e40af' : '#92400e',
                  textTransform: 'uppercase' as 'uppercase',
                }}
              >
                {isReviewee ? 'My Review' : 'Team Review'}
              </span>
            </div>
            <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '14px' }}>
              {roleLabel}: <strong>{otherPerson.name}</strong> {otherPerson.title && `(${otherPerson.title})`}
            </p>
          </div>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500',
              background: `${getStatusColor(review.status)}20`,
              color: getStatusColor(review.status),
            }}
          >
            {review.status.replace('_', ' ')}
          </span>
        </div>

        {review.overallRating && (
          <div style={{ marginTop: '12px' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '4px',
                background: getRatingColor(review.overallRating),
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {review.overallRating}/4 - {getRatingLabel(review.overallRating)}
            </div>
          </div>
        )}

        {review.peerFeedback && review.peerFeedback.length > 0 && (
          <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            📝 {review.peerFeedback.length} peer feedback received
          </div>
        )}

        <button
          onClick={() => navigate(`/reviews/${review.id}`)}
          style={{
            marginTop: '16px',
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
          Open Review
        </button>
      </div>
    );
  };

  if (isLoading) {
    return <ReviewsSkeleton />;
  }

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Performance Reviews</h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          View and complete your performance assessments
          {(user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <span style={{ marginLeft: '8px' }}>
              ·
              <a
                onClick={() => navigate('/review-management')}
                style={{
                  marginLeft: '8px',
                  color: 'var(--color-primary)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Manage Reviews
              </a>
            </span>
          )}
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Cycle Selector */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          Review Cycle
        </label>
        <div style={{ position: 'relative', display: 'inline-block', minWidth: '280px' }}>
          <select
            value={cycleFilter}
            onChange={(e) => setCycleFilter(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              fontSize: '15px',
              fontWeight: '500',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              appearance: 'none',
            }}
          >
            <option value="all">All Cycles</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name} {cycle.status === 'active' ? '(Active)' : ''}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: 'var(--text-muted)',
            }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setStatusFilter('current')}
            style={{
              padding: '8px 20px',
              background: statusFilter === 'current' ? '#3b82f6' : '#ffffff',
              color: statusFilter === 'current' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
          >
            In Progress
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '8px 20px',
              background: statusFilter === 'completed' ? '#3b82f6' : '#ffffff',
              color: statusFilter === 'completed' ? '#ffffff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
          >
            Completed
          </button>
        </div>

        {/* Role Filter (Only show if user is a manager) */}
        {isManager && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setRoleFilter(roleFilter === 'reviewee' ? 'all' : 'reviewee')}
              style={{
                padding: '8px 16px',
                background: roleFilter === 'reviewee' ? '#dbeafe' : '#ffffff',
                color: roleFilter === 'reviewee' ? '#1e40af' : 'var(--text-secondary)',
                border: roleFilter === 'reviewee' ? '1px solid #93c5fd' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s',
              }}
            >
              My Reviews
            </button>
            <button
              onClick={() => setRoleFilter(roleFilter === 'reviewer' ? 'all' : 'reviewer')}
              style={{
                padding: '8px 16px',
                background: roleFilter === 'reviewer' ? '#fef3c7' : '#ffffff',
                color: roleFilter === 'reviewer' ? '#92400e' : 'var(--text-secondary)',
                border: roleFilter === 'reviewer' ? '1px solid #fcd34d' : '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s',
              }}
            >
              Team Reviews
            </button>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div style={{ marginBottom: '40px' }}>
        {filteredReviews.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>No reviews found</h3>
            <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '14px' }}>
              {statusFilter === 'current' && 'No reviews in progress for the selected cycle.'}
              {statusFilter === 'completed' && 'No completed reviews for the selected cycle.'}
              {statusFilter === 'all' && 'No reviews found for the selected cycle.'}
            </p>
          </div>
        ) : (
          <div style={{ maxWidth: '1400px' }}>
            {filteredReviews.map(review => renderReviewCard(review))}
          </div>
        )}
      </div>
    </div>
  );
}
