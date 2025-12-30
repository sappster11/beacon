import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Trash2, MoreVertical, Edit2 } from 'lucide-react';
import type { Competency, CompetencyComment } from '../types';
import { reviews as reviewsApi } from '../lib/api';

interface CompetencyCardProps {
  competency: Competency;
  reviewId: string;
  weight: number;
  isReviewee: boolean;
  isReviewer: boolean;
  onCompetencyChange: (updatedCompetency: Competency) => void;
  onDelete?: () => void;
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
  return colors[rating as keyof typeof colors] || 'var(--text-muted)';
};

export default function CompetencyCard({
  competency,
  reviewId,
  weight,
  isReviewee,
  isReviewer,
  onCompetencyChange,
  onDelete,
}: CompetencyCardProps) {
  const [comments, setComments] = useState<CompetencyComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(competency.name);
  const [editDescription, setEditDescription] = useState(competency.description);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load comments when expanded
  useEffect(() => {
    if (showComments && comments.length === 0) {
      loadComments();
    }
  }, [showComments]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const loadedComments = await reviewsApi.getCompetencyComments(reviewId, competency.name);
      setComments(loadedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleRatingChange = (type: 'self' | 'manager', rating: number | undefined) => {
    const updated = { ...competency };
    if (type === 'self') {
      updated.selfRating = rating;
    } else {
      updated.managerRating = rating;
    }
    onCompetencyChange(updated);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const comment = await reviewsApi.createCompetencyComment(
        reviewId,
        competency.name,
        newComment
      );
      setComments([...comments, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSaveEdit = () => {
    onCompetencyChange({
      ...competency,
      name: editName.trim(),
      description: editDescription.trim()
    });
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setEditName(competency.name);
    setEditDescription(competency.description);
    setIsEditing(false);
  };

  return (
    <div
      style={{
        padding: '20px',
        background: 'var(--bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '16px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        {isEditing ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: '600',
                  outline: 'none',
                  fontFamily: 'inherit',
                  marginRight: '8px',
                }}
                placeholder="Competency name"
              />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                {weight.toFixed(1)}%
              </span>
            </div>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                marginBottom: '8px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              placeholder="Description"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '6px 12px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-tertiary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-primary)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!editName.trim()}
                style={{
                  padding: '6px 12px',
                  background: !editName.trim() ? 'var(--text-faint)' : '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: !editName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (editName.trim()) {
                    e.currentTarget.style.background = '#2563eb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (editName.trim()) {
                    e.currentTarget.style.background = '#3b82f6';
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                {competency.name}
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#3b82f6' }}>
                  {weight.toFixed(1)}%
                </span>
                {onDelete && isReviewer && (
                  <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
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
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                      title="Options"
                    >
                      <MoreVertical size={16} color="var(--text-muted)" />
                    </button>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: '0',
                        marginTop: '4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        zIndex: 10,
                        minWidth: '120px',
                      }}>
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowDropdown(false);
                          }}
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
                            color: 'var(--text-secondary)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--bg-tertiary)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            onDelete();
                            setShowDropdown(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'transparent',
                            border: 'none',
                            borderTop: '1px solid var(--bg-tertiary)',
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
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              {competency.description}
            </p>
          </div>
        )}
      </div>

      {/* Ratings */}
      <div style={{ marginBottom: '16px' }}>
        {/* Employee Rating */}
        {isReviewee && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Your Rating
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[1, 2, 3, 4].map((rating) => {
                const isSelfSelected = competency.selfRating === rating;
                const isManagerSelected = competency.managerRating === rating;
                const isBothSelected = isSelfSelected && isManagerSelected;
                const borderColor = (isSelfSelected || isManagerSelected) ? '#1e40af' : 'var(--border-color)';
                const isSelected = isSelfSelected || isManagerSelected;

                return (
                  <div key={rating} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleRatingChange('self', isSelfSelected ? undefined : rating)}
                      style={{
                        width: '100%',
                        padding: '10px 8px',
                        background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
                      }}
                    >
                      <span style={{ fontSize: '18px', fontWeight: '600' }}>{rating}</span>
                      <span style={{ fontSize: '11px', lineHeight: '1.3' }}>
                        {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
                      </span>
                    </button>
                    {(isSelfSelected || isManagerSelected) && (
                      <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', textAlign: 'center' }}>
                        {isBothSelected ? 'Both Selected' : isSelfSelected ? 'Individual Selected' : 'Manager Selected'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View-only Employee Rating */}
        {!isReviewee && competency.selfRating && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Employee Rating
            </label>
            <div
              style={{
                padding: '10px 12px',
                background: `${getRatingColor(competency.selfRating)}15`,
                border: `1px solid ${getRatingColor(competency.selfRating)}40`,
                borderRadius: '6px',
                fontSize: '14px',
                color: getRatingColor(competency.selfRating),
                fontWeight: '600',
              }}
            >
              {competency.selfRating} - {RATING_LABELS[competency.selfRating as keyof typeof RATING_LABELS]}
            </div>
          </div>
        )}

        {/* Manager Rating */}
        {isReviewer && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Manager Rating
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[1, 2, 3, 4].map((rating) => {
                const isSelfSelected = competency.selfRating === rating;
                const isManagerSelected = competency.managerRating === rating;
                const isBothSelected = isSelfSelected && isManagerSelected;
                const borderColor = (isSelfSelected || isManagerSelected) ? '#1e40af' : 'var(--border-color)';
                const isSelected = isSelfSelected || isManagerSelected;

                return (
                  <div key={rating} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handleRatingChange('manager', isManagerSelected ? undefined : rating)}
                      style={{
                        width: '100%',
                        padding: '10px 8px',
                        background: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)',
                        color: 'var(--text-secondary)',
                        border: `2px solid ${borderColor}`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isSelected ? 'var(--bg-tertiary)' : 'var(--bg-primary)';
                      }}
                    >
                      <span style={{ fontSize: '18px', fontWeight: '600' }}>{rating}</span>
                      <span style={{ fontSize: '11px', lineHeight: '1.3' }}>
                        {RATING_LABELS[rating as keyof typeof RATING_LABELS]}
                      </span>
                    </button>
                    {(isSelfSelected || isManagerSelected) && (
                      <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: '600', textAlign: 'center' }}>
                        {isBothSelected ? 'Both Selected' : isManagerSelected ? 'Manager Selected' : 'Individual Selected'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* View-only Manager Rating */}
        {!isReviewer && competency.managerRating && (
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Manager Rating
            </label>
            <div
              style={{
                padding: '10px 12px',
                background: `${getRatingColor(competency.managerRating)}15`,
                border: `1px solid ${getRatingColor(competency.managerRating)}40`,
                borderRadius: '6px',
                fontSize: '14px',
                color: getRatingColor(competency.managerRating),
                fontWeight: '600',
              }}
            >
              {competency.managerRating} - {RATING_LABELS[competency.managerRating as keyof typeof RATING_LABELS]}
            </div>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
        <button
          onClick={() => setShowComments(!showComments)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--text-secondary)',
            padding: '0',
          }}
        >
          <MessageSquare size={16} color="var(--text-muted)" />
          Comments ({comments.length})
        </button>

        {showComments && (
          <div style={{ marginTop: '12px' }}>
            {isLoadingComments ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '12px 0' }}>Loading comments...</p>
            ) : (
              <>
                {/* Display Comments */}
                {comments.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        style={{
                          padding: '12px',
                          background: 'var(--bg-tertiary)',
                          borderRadius: '6px',
                          marginBottom: '8px',
                          borderLeft: `3px solid ${comment.authorRole === 'EMPLOYEE' ? '#3b82f6' : '#10b981'}`,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {comment.author?.name} ({comment.authorRole === 'EMPLOYEE' ? 'Employee' : 'Manager'})
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                          {comment.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                {(isReviewee || isReviewer) && (
                  <div>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        fontSize: '13px',
                        outline: 'none',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = '#3b82f6';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={isSubmittingComment || !newComment.trim()}
                      style={{
                        marginTop: '8px',
                        padding: '8px 16px',
                        background: isSubmittingComment || !newComment.trim() ? 'var(--text-faint)' : '#3b82f6',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isSubmittingComment || !newComment.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmittingComment && newComment.trim()) {
                          e.currentTarget.style.background = '#2563eb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmittingComment && newComment.trim()) {
                          e.currentTarget.style.background = '#3b82f6';
                        }
                      }}
                    >
                      {isSubmittingComment ? 'Adding...' : 'Add Comment'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
