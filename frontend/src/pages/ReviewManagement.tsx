import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { reviewCycles } from '../lib/api';
import type { ReviewCycle } from '../types';
import { Plus, Calendar, Users, CheckCircle, Star, ChevronDown } from 'lucide-react';
import CreateReviewCycleModal from '../components/CreateReviewCycleModal';
import AssignReviewsModal from '../components/AssignReviewsModal';

export default function ReviewManagement() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<ReviewCycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateCycleModal, setShowCreateCycleModal] = useState(false);
  const [showAssignReviewsModal, setShowAssignReviewsModal] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState<ReviewCycle | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadCycles();
  }, []);

  const loadCycles = async () => {
    try {
      setIsLoading(true);
      const data = await reviewCycles.getAll();
      setCycles(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load review cycles');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      QUARTERLY: 'Quarterly',
      SEMI_ANNUAL: 'Semi-Annual',
      ANNUAL: 'Annual',
    };
    return labels[type] || type;
  };

  const handleSetActive = async (cycleId: string) => {
    try {
      await reviewCycles.setActive(cycleId);
      await loadCycles();
    } catch (err: any) {
      setError(err.message || 'Failed to set cycle as active');
    }
  };

  const handleStatusChange = async (cycleId: string, newStatus: string) => {
    try {
      setUpdatingStatus(cycleId);
      setStatusDropdownOpen(null);
      await reviewCycles.update(cycleId, { status: newStatus } as any);
      await loadCycles();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: '#10b981' },
    scheduled: { label: 'Scheduled', color: '#3b82f6' },
    completed: { label: 'Completed', color: '#6b7280' },
    cancelled: { label: 'Cancelled', color: '#ef4444' },
  };

  const getStatusBadge = (cycle: ReviewCycle) => {
    const status = cycle.status || 'completed';
    const isActive = status === 'active';
    const config = statusConfig[status] || statusConfig.completed;
    const isDropdownOpen = statusDropdownOpen === cycle.id;
    const isUpdating = updatingStatus === cycle.id;

    if (!isAdmin) {
      return (
        <span
          style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            background: `${config.color}20`,
            color: config.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isActive && <Star size={12} fill={config.color} />}
          {config.label}
        </span>
      );
    }

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setStatusDropdownOpen(isDropdownOpen ? null : cycle.id);
          }}
          disabled={isUpdating}
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: '500',
            background: `${config.color}20`,
            color: config.color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: `1px solid ${config.color}40`,
            cursor: isUpdating ? 'not-allowed' : 'pointer',
            opacity: isUpdating ? 0.6 : 1,
          }}
        >
          {isActive && <Star size={12} fill={config.color} />}
          {isUpdating ? 'Updating...' : config.label}
          <ChevronDown size={12} style={{ marginLeft: '2px' }} />
        </button>

        {isDropdownOpen && (
          <>
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 99,
              }}
              onClick={() => setStatusDropdownOpen(null)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: 100,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {Object.entries(statusConfig).map(([key, val]) => (
                <button
                  key={key}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (key !== status) {
                      handleStatusChange(cycle.id, key);
                    } else {
                      setStatusDropdownOpen(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: key === status ? '#f3f4f6' : 'white',
                    border: 'none',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    color: '#374151',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => {
                    if (key !== status) e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = key === status ? '#f3f4f6' : 'white';
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: val.color,
                    }}
                  />
                  {val.label}
                  {key === status && (
                    <CheckCircle size={14} style={{ marginLeft: 'auto', color: '#10b981' }} />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  const renderCycleCard = (cycle: ReviewCycle) => {
    return (
      <div
        key={cycle.id}
        className="review-cycle-card"
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '16px',
          background: '#ffffff',
          transition: 'all 0.2s',
        }}
      >
        <div className="review-cycle-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px', gap: '16px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="review-cycle-card-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                {cycle.name}
              </h3>
              {getStatusBadge(cycle)}
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: '#f3f4f6',
                  color: '#374151',
                }}
              >
                {getTypeLabel(cycle.type)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={16} />
                {new Date(cycle.startDate).toLocaleDateString()} - {new Date(cycle.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => {
                  setSelectedCycle(cycle);
                  setShowAssignReviewsModal(true);
                }}
                className="assign-reviews-btn"
                style={{
                  padding: '8px 16px',
                  background: '#3b82f6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#3b82f6';
                }}
              >
                <Users size={16} />
                Assign Reviews
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '48px' }}>
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
            Access Denied
          </h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
            Only HR Admins can access review management.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1>Review Management</h1>
        <p>Loading review cycles...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px' }}>
      <div className="page-header-with-action" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            Review Management
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Create and manage performance review cycles
          </p>
        </div>

        <button
          onClick={() => setShowCreateCycleModal(true)}
          className="create-cycle-btn"
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#2563eb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3b82f6';
          }}
        >
          <Plus size={18} />
          Create Review Cycle
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth: '1200px' }}>
        {cycles.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>
              No review cycles found
            </h3>
            <p style={{ margin: '0 0 16px 0', color: '#6b7280', fontSize: '14px' }}>
              Get started by creating your first review cycle
            </p>
            <button
              onClick={() => setShowCreateCycleModal(true)}
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
              Create Review Cycle
            </button>
          </div>
        ) : (
          cycles.map(renderCycleCard)
        )}
      </div>

      {/* Modals */}
      {showCreateCycleModal && (
        <CreateReviewCycleModal
          onClose={() => setShowCreateCycleModal(false)}
          onCreated={(cycle) => {
            setCycles([cycle, ...cycles]);
            setShowCreateCycleModal(false);
          }}
        />
      )}

      {showAssignReviewsModal && selectedCycle && (
        <AssignReviewsModal
          cycle={selectedCycle}
          onClose={() => {
            setShowAssignReviewsModal(false);
            setSelectedCycle(null);
          }}
          onAssigned={() => {
            setShowAssignReviewsModal(false);
            setSelectedCycle(null);
            loadCycles();
          }}
        />
      )}
    </div>
  );
}
