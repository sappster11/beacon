import { useState, useEffect, useRef } from 'react';
import type { Department } from '../../types/index';
import { Plus, Edit2, Trash2, Building2, MoreVertical } from 'lucide-react';
import { departments as departmentsApi } from '../../lib/api';

export default function AdminDepartmentsTab() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentsApi.getAll();
      setDepartments(data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      await departmentsApi.delete(id);
      await loadDepartments();
    } catch (error: any) {
      alert(error.message || 'Failed to delete department');
    }
  };

  const getSubDepartments = (parentId: string): Department[] => {
    return departments.filter(d => d.parentDepartmentId === parentId);
  };

  const getEmployeeCount = (deptId: string): number => {
    // This would need to be populated from the API with actual counts
    // For now returning 0, but you'd want to add this to your Department type
    return 0;
  };

  const topLevelDepartments = departments.filter(d => !d.parentDepartmentId);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading departments...</div>;
  }

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            padding: '10px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="admin-departments-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {topLevelDepartments.map(topDept => {
          const subDepts = getSubDepartments(topDept.id);

          return (
            <div
              key={topDept.id}
              style={{
                padding: '20px',
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '12px'
              }}
            >
              {/* Top-level Department Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  padding: '10px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  color: '#3b82f6'
                }}>
                  <Building2 size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {topDept.name}
                  </div>
                  {subDepts.length > 0 && (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {subDepts.length} sub-department{subDepts.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div style={{ position: 'relative' }} ref={openDropdownId === topDept.id ? dropdownRef : null}>
                  <button
                    onClick={() => setOpenDropdownId(openDropdownId === topDept.id ? null : topDept.id)}
                    style={{
                      padding: '6px',
                      background: 'transparent',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <MoreVertical size={16} />
                  </button>

                  {openDropdownId === topDept.id && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      background: 'white',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      minWidth: '140px',
                      zIndex: 10,
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => {
                          setEditingDept(topDept);
                          setOpenDropdownId(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          handleDelete(topDept.id);
                          setOpenDropdownId(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          background: 'transparent',
                          border: 'none',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#dc2626',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-departments List */}
              {subDepts.length > 0 && (
                <div style={{
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.05em' }}>
                    Sub-departments
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {subDepts.map(subDept => (
                      <div
                        key={subDept.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'white',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {subDept.name}
                        </span>
                        <div style={{ position: 'relative' }} ref={openDropdownId === subDept.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdownId(openDropdownId === subDept.id ? null : subDept.id)}
                            style={{
                              padding: '4px',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openDropdownId === subDept.id && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '4px',
                              background: 'white',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              minWidth: '140px',
                              zIndex: 10,
                              overflow: 'hidden'
                            }}>
                              <button
                                onClick={() => {
                                  setEditingDept(subDept);
                                  setOpenDropdownId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  background: 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: 'var(--text-secondary)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Edit2 size={14} />
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  handleDelete(subDept.id);
                                  setOpenDropdownId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  background: 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#dc2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Trash2 size={14} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {departments.length === 0 && (
        <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <Building2 size={48} style={{ margin: '0 auto 16px', color: 'var(--text-faint)' }} />
          <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
            No departments yet
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Create your first department to organize your team
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Create Department
          </button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDept) && (
        <DepartmentModal
          department={editingDept}
          departments={departments}
          onClose={() => {
            setShowCreateModal(false);
            setEditingDept(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingDept(null);
            loadDepartments();
          }}
        />
      )}
    </div>
  );
}

// Department Modal Component
interface DepartmentModalProps {
  department: Department | null;
  departments: Department[];
  onClose: () => void;
  onSuccess: () => void;
}

function DepartmentModal({ department, departments, onClose, onSuccess }: DepartmentModalProps) {
  const [name, setName] = useState(department?.name || '');
  const [parentDepartmentId, setParentDepartmentId] = useState(department?.parentDepartmentId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name) {
      setError('Department name is required');
      return;
    }

    try {
      setLoading(true);
      if (department) {
        await departmentsApi.update(department.id, {
          name,
          parentDepartmentId: parentDepartmentId || null
        });
      } else {
        await departmentsApi.create({
          name,
          parentDepartmentId: parentDepartmentId || null
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save department');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          margin: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '20px' }}>
          {department ? 'Edit Department' : 'Create Department'}
        </h2>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Department Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Parent Department
            </label>
            <select
              value={parentDepartmentId}
              onChange={(e) => setParentDepartmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">None (Top Level)</option>
              {departments
                .filter(d => !department || d.id !== department.id)
                .map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
            </select>
          </div>

          <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: '#374151'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Saving...' : department ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
