import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reviews, reviewCycles } from '../lib/api';
import type { Review, ReviewCycle } from '../types';
import { ReviewsSkeleton } from '../components/Skeleton';

export default function Reviews() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'current' | 'completed'>('current');
  const [roleFilter, setRoleFilter] = useState<'all' | 'reviewee' | 'reviewer'>('all');

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);

      // HR Admins can see all reviews in the system
      const isHRAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

      const [reviewsData, cyclesData] = await Promise.all([
        isHRAdmin ? reviews.getAll() : reviews.getMyReviews(),
        reviewCycles.getAll(),
      ]);

      setAllReviews(reviewsData);
      setCycles(cyclesData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load reviews');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter reviews based on status and role
  const filteredReviews = allReviews.filter(review => {
    // Status filter
    if (statusFilter === 'current') {
      if (review.status === 'COMPLETED') return false;
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
    return colors[rating] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return '#10b981';
      case 'IN_PROGRESS':
        return '#f59e0b';
      case 'NOT_STARTED':
        return '#6b7280';
      default:
        return '#6b7280';
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
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          background: '#ffffff',
          transition: 'all 0.2s',
        }}
      >
        <div className="review-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>{review.cycle.name}</h3>
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
            <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
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
          <div style={{ marginTop: '12px', fontSize: '14px', color: '#6b7280' }}>
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

  const activeCycle = cycles.find((c) => c.status === 'active');

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Performance Reviews</h1>
        <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>View and complete your performance assessments</p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {activeCycle && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '30px',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#1e40af', fontSize: '16px', fontWeight: '600' }}>Active Review Cycle</h3>
          <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#111827' }}>{activeCycle.name}</p>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            {new Date(activeCycle.startDate).toLocaleDateString()} -{' '}
            {new Date(activeCycle.endDate).toLocaleDateString()}
          </p>
        </div>
      )}

      {(user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div
          className="hr-admin-banner"
          style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '14px', color: '#92400e', fontWeight: '500', flex: 1, minWidth: '200px' }}>
            ℹ️ HR Admin View: Showing all reviews
          </span>
          <button
            onClick={() => navigate('/review-management')}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
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
            Manage Reviews
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ marginBottom: '24px' }}>
        <div className="reviews-tabs" style={{ display: 'flex', gap: '16px', marginBottom: '16px', borderBottom: '2px solid #e5e7eb', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {/* Status Filter Tabs */}
          <button
            onClick={() => setStatusFilter('current')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: statusFilter === 'current' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'current' ? '600' : '500',
              color: statusFilter === 'current' ? '#3b82f6' : '#6b7280',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Current
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: statusFilter === 'completed' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'completed' ? '600' : '500',
              color: statusFilter === 'completed' ? '#3b82f6' : '#6b7280',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '12px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: statusFilter === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: statusFilter === 'all' ? '600' : '500',
              color: statusFilter === 'all' ? '#3b82f6' : '#6b7280',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            All
          </button>
        </div>

        {/* Role Filter Pills (Only show if user is a manager) */}
        {isManager && (
          <div className="reviews-role-filter" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRoleFilter('all')}
              style={{
                padding: '8px 16px',
                background: roleFilter === 'all' ? '#3b82f6' : '#ffffff',
                color: roleFilter === 'all' ? '#ffffff' : '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s',
              }}
            >
              All Reviews
            </button>
            <button
              onClick={() => setRoleFilter('reviewee')}
              style={{
                padding: '8px 16px',
                background: roleFilter === 'reviewee' ? '#3b82f6' : '#ffffff',
                color: roleFilter === 'reviewee' ? '#ffffff' : '#374151',
                border: '1px solid #e5e7eb',
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
              onClick={() => setRoleFilter('reviewer')}
              style={{
                padding: '8px 16px',
                background: roleFilter === 'reviewer' ? '#3b82f6' : '#ffffff',
                color: roleFilter === 'reviewer' ? '#ffffff' : '#374151',
                border: '1px solid #e5e7eb',
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
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>No reviews found</h3>
            <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
              {statusFilter === 'current' && 'You don\'t have any current reviews.'}
              {statusFilter === 'completed' && 'You don\'t have any completed reviews yet.'}
              {statusFilter === 'all' && 'You don\'t have any reviews yet.'}
            </p>
            {activeCycle && statusFilter === 'current' && (
              <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>Reviews for {activeCycle.name} will appear here.</p>
            )}
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
