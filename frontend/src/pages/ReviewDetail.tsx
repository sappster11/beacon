import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { reviews } from '../lib/api';
import { ArrowLeft } from 'lucide-react';
import ReviewDetailModal from '../components/ReviewDetailModal';

export default function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [review, setReview] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadReview();
    }
  }, [id]);

  const loadReview = async () => {
    try {
      setIsLoading(true);
      const data = await reviews.getById(id!);
      setReview(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load review');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <p>Loading review...</p>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div style={{ padding: '48px' }}>
        <button
          onClick={() => navigate('/reviews')}
          style={{
            padding: '8px 16px',
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#ffffff';
          }}
        >
          <ArrowLeft size={16} />
          Back to Reviews
        </button>
        <div
          style={{
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            {error || 'Review not found'}
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            This review may not exist or you may not have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  // Allow reviewer, HR_ADMIN, or SUPER_ADMIN to edit
  const isReviewer = review.reviewerId === user?.id || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div style={{ padding: '48px' }}>
      <button
        onClick={() => navigate('/reviews')}
        style={{
          padding: '8px 16px',
          background: '#ffffff',
          color: '#374151',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#f9fafb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#ffffff';
        }}
      >
        <ArrowLeft size={16} />
        Back to Reviews
      </button>

      {/* Render the modal content in the page */}
      <ReviewDetailModal
        review={review}
        isOpen={true}
        onClose={() => navigate('/reviews')}
        isReviewer={isReviewer}
        isPage={true}
      />
    </div>
  );
}
