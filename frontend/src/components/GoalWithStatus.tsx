import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, MoreVertical, Edit2, Trash2, MessageSquare } from 'lucide-react';
import type { AssignedGoal, AssignedGoalStatus, GoalComment } from '../types';
import { reviews as reviewsApi } from '../lib/api';

interface GoalWithStatusProps {
  goal: AssignedGoal;
  reviewId: string;
  isManager: boolean;
  weight: number;
  onStatusChange: (updatedGoal: AssignedGoal) => void;
  onDelete?: () => void;
}

const STATUS_CONFIG: Record<AssignedGoalStatus, { label: string; color: string; bgColor: string }> = {
  not_achieved: { label: 'Not Achieved', color: '#ef4444', bgColor: '#fef2f2' },
  partially_achieved: { label: 'Partially Achieved', color: '#f59e0b', bgColor: '#fffbeb' },
  almost_done: { label: 'Almost Done', color: '#eab308', bgColor: '#fefce8' },
  achieved: { label: 'Goal Achieved', color: '#10b981', bgColor: '#f0fdf4' },
};

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

export default function GoalWithStatus({ goal, reviewId, isManager, weight, onStatusChange, onDelete }: GoalWithStatusProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [editDescription, setEditDescription] = useState(goal.description || '');
  const [comments, setComments] = useState<GoalComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const statusConfig = STATUS_CONFIG[goal.status];

  // Load comments when expanded
  useEffect(() => {
    if (showComments && comments.length === 0 && goal.id) {
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
    if (!goal.id) return;
    setIsLoadingComments(true);
    try {
      const loadedComments = await reviewsApi.getGoalComments(reviewId, goal.id);
      setComments(loadedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !goal.id) return;

    setIsSubmittingComment(true);
    try {
      const comment = await reviewsApi.createGoalComment(
        reviewId,
        goal.id,
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

  const handleStatusChange = (newStatus: AssignedGoalStatus) => {
    onStatusChange({ ...goal, status: newStatus });
  };

  const handleRatingChange = (type: 'self' | 'manager', rating: number | undefined) => {
    const updated = { ...goal };
    if (type === 'self') {
      updated.selfRating = rating;
    } else {
      updated.managerRating = rating;
    }
    onStatusChange(updated);
  };

  const handleSaveEdit = () => {
    onStatusChange({
      ...goal,
      title: editTitle.trim(),
      description: editDescription.trim()
    });
    setIsEditing(false);
    setShowDropdown(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(goal.title);
    setEditDescription(goal.description || '');
    setIsEditing(false);
  };

  return (
    <div
      style={{
        padding: '16px',
        background: 'var(--bg-primary)',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        marginBottom: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div
          style={{
            marginTop: '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: statusConfig.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={14} color={statusConfig.color} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            {isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #3b82f6',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontWeight: '600',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Goal title"
                />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                  {weight.toFixed(1)}%
                </span>
              </div>
            ) : (
              <>
                <h4 style={{ margin: '0', fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {goal.title}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#f59e0b' }}>
                    {weight.toFixed(1)}%
                  </span>
                  {onDelete && isManager && (
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
              </>
            )}
          </div>

          {isEditing ? (
            <div style={{ marginBottom: '16px' }}>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '13px',
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
                placeholder="Description (optional)"
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
                  disabled={!editTitle.trim()}
                  style={{
                    padding: '6px 12px',
                    background: !editTitle.trim() ? 'var(--text-faint)' : '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: !editTitle.trim() ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (editTitle.trim()) {
                      e.currentTarget.style.background = '#2563eb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (editTitle.trim()) {
                      e.currentTarget.style.background = '#3b82f6';
                    }
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            goal.description && (
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {goal.description}
              </p>
            )
          )}

          {/* Ratings */}
          <div style={{ marginBottom: '12px' }}>
            {/* Employee Rating */}
            {!isManager && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Your Rating
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[1, 2, 3, 4].map((rating) => {
                    const isSelfSelected = goal.selfRating === rating;
                    const isManagerSelected = goal.managerRating === rating;
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
            {isManager && goal.selfRating && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Employee Rating
                </label>
                <div
                  style={{
                    padding: '10px 12px',
                    background: `${getRatingColor(goal.selfRating)}15`,
                    border: `1px solid ${getRatingColor(goal.selfRating)}40`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: getRatingColor(goal.selfRating),
                    fontWeight: '600',
                  }}
                >
                  {goal.selfRating} - {RATING_LABELS[goal.selfRating as keyof typeof RATING_LABELS]}
                </div>
              </div>
            )}

            {/* Manager Rating */}
            {isManager && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Manager Rating
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {[1, 2, 3, 4].map((rating) => {
                    const isSelfSelected = goal.selfRating === rating;
                    const isManagerSelected = goal.managerRating === rating;
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
            {!isManager && goal.managerRating && (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Manager Rating
                </label>
                <div
                  style={{
                    padding: '10px 12px',
                    background: `${getRatingColor(goal.managerRating)}15`,
                    border: `1px solid ${getRatingColor(goal.managerRating)}40`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: getRatingColor(goal.managerRating),
                    fontWeight: '600',
                  }}
                >
                  {goal.managerRating} - {RATING_LABELS[goal.managerRating as keyof typeof RATING_LABELS]}
                </div>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '16px' }}>
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
                  </>
                )}
              </div>
            )}
          </div>

          {goal.dueDate && (
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
              Due: {new Date(goal.dueDate).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
