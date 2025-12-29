import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { goalLibrary, competencyLibrary } from '../lib/api';
import type { GoalLibraryItem, CompetencyLibraryItem } from '../types';
import { Target, TrendingUp, Plus, Edit2, Trash2, BookOpen, Filter, MoreVertical } from 'lucide-react';
import TabNavigation from '../components/TabNavigation';

export default function Library() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'goals' | 'competencies'>('goals');
  const [goals, setGoals] = useState<GoalLibraryItem[]>([]);
  const [competencies, setCompetencies] = useState<CompetencyLibraryItem[]>([]);
  const [goalCategories, setGoalCategories] = useState<string[]>([]);
  const [competencyCategories, setCompetencyCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<GoalLibraryItem | CompetencyLibraryItem | null>(null);
  const [formData, setFormData] = useState({ title: '', name: '', description: '', category: '' });
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryValue, setNewCategoryValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isManager = user?.role === 'MANAGER' || user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [goalsData, competenciesData, goalCats, compCats] = await Promise.all([
        goalLibrary.getAll(),
        competencyLibrary.getAll(),
        goalLibrary.getCategories(),
        competencyLibrary.getCategories(),
      ]);
      setGoals(goalsData);
      setCompetencies(competenciesData);
      setGoalCategories(goalCats);
      setCompetencyCategories(compCats);
    } catch (err: any) {
      setError(err.message || 'Failed to load library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ title: '', name: '', description: '', category: '' });
    setShowNewCategoryInput(false);
    setNewCategoryValue('');
    setShowAddModal(true);
  };

  const handleEdit = (item: GoalLibraryItem | CompetencyLibraryItem) => {
    setEditingItem(item);
    if ('title' in item) {
      setFormData({ title: item.title, name: '', description: item.description || '', category: item.category || '' });
    } else {
      setFormData({ title: '', name: item.name, description: item.description || '', category: item.category || '' });
    }
    setShowNewCategoryInput(false);
    setNewCategoryValue('');
    setShowAddModal(true);
  };

  const handleDelete = async (item: GoalLibraryItem | CompetencyLibraryItem) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      if (activeTab === 'goals') {
        await goalLibrary.delete(item.id);
        setGoals(goals.filter(g => g.id !== item.id));
      } else {
        await competencyLibrary.delete(item.id);
        setCompetencies(competencies.filter(c => c.id !== item.id));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
    }
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'goals') {
        if (editingItem) {
          const updated = await goalLibrary.update(editingItem.id, {
            title: formData.title,
            description: formData.description,
            category: formData.category,
          });
          setGoals(goals.map(g => g.id === updated.id ? updated : g));
        } else {
          const created = await goalLibrary.create({
            title: formData.title,
            description: formData.description,
            category: formData.category,
          });
          setGoals([...goals, created]);
        }
      } else {
        if (editingItem) {
          const updated = await competencyLibrary.update(editingItem.id, {
            name: formData.name,
            description: formData.description,
            category: formData.category,
          });
          setCompetencies(competencies.map(c => c.id === updated.id ? updated : c));
        } else {
          const created = await competencyLibrary.create({
            name: formData.name,
            description: formData.description,
            category: formData.category,
          });
          setCompetencies([...competencies, created]);
        }
      }
      setShowAddModal(false);
      loadData(); // Refresh categories
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  const filteredGoals = selectedCategory === 'all'
    ? goals
    : goals.filter(g => g.category === selectedCategory);

  const filteredCompetencies = selectedCategory === 'all'
    ? competencies
    : competencies.filter(c => c.category === selectedCategory);

  const currentCategories = activeTab === 'goals' ? goalCategories : competencyCategories;

  if (!isManager) {
    return (
      <div style={{ padding: '48px' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '18px', fontWeight: '600' }}>Access Denied</h3>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>Only managers and admins can access the library.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Goals & Competencies Library</h1>
        <p style={{ color: '#6b7280' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BookOpen size={28} color="#3b82f6" />
            <h1 style={{ fontSize: '32px', fontWeight: '600', color: '#111827', margin: 0 }}>Library</h1>
          </div>
          <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
            Manage reusable goals and competencies for performance reviews
          </p>
        </div>
        <button
          onClick={handleAdd}
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
          }}
        >
          <Plus size={18} />
          Add {activeTab === 'goals' ? 'Goal' : 'Competency'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <TabNavigation
        tabs={[
          { id: 'goals', label: 'Goals', icon: Target },
          { id: 'competencies', label: 'Competencies', icon: TrendingUp },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab as 'goals' | 'competencies');
          setSelectedCategory('all');
        }}
      />

      {/* Category Filter */}
      <div style={{ marginTop: '24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Filter size={16} color="#6b7280" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px',
            outline: 'none',
            cursor: 'pointer',
            background: '#ffffff',
          }}
        >
          <option value="all">All Categories</option>
          {currentCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span style={{ fontSize: '14px', color: '#6b7280' }}>
          {activeTab === 'goals' ? filteredGoals.length : filteredCompetencies.length} items
        </span>
      </div>

      {/* Content */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
        {activeTab === 'goals' ? (
          filteredGoals.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <Target size={32} color="#9ca3af" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>No goals in library. Add your first goal template.</p>
            </div>
          ) : (
            filteredGoals.map(goal => (
              <div
                key={goal.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {goal.isPlatformDefault && (
                    <span style={{
                      padding: '4px 10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      Template
                    </span>
                  )}
                  <div style={{ position: 'relative' }} ref={openMenuId === goal.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === goal.id ? null : goal.id)}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <MoreVertical size={18} color="#6b7280" />
                    </button>
                    {openMenuId === goal.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        minWidth: '120px',
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => { handleEdit(goal); setOpenMenuId(null); }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => { handleDelete(goal); setOpenMenuId(null); }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px', paddingRight: '50px' }}>
                  <Target size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{goal.title}</h3>
                    {goal.category && (
                      <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {goal.category}
                      </span>
                    )}
                  </div>
                </div>
                {goal.description && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    {goal.description}
                  </p>
                )}
              </div>
            ))
          )
        ) : (
          filteredCompetencies.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
              <TrendingUp size={32} color="#9ca3af" style={{ marginBottom: '12px' }} />
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>No competencies in library. Add your first competency template.</p>
            </div>
          ) : (
            filteredCompetencies.map(comp => (
              <div
                key={comp.id}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {comp.isPlatformDefault && (
                    <span style={{
                      padding: '4px 10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}>
                      Template
                    </span>
                  )}
                  <div style={{ position: 'relative' }} ref={openMenuId === comp.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === comp.id ? null : comp.id)}
                      style={{
                        padding: '4px',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <MoreVertical size={18} color="#6b7280" />
                    </button>
                    {openMenuId === comp.id && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '4px',
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 10,
                        minWidth: '120px',
                        overflow: 'hidden',
                      }}>
                        <button
                          onClick={() => { handleEdit(comp); setOpenMenuId(null); }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#374151',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => { handleDelete(comp); setOpenMenuId(null); }}
                          style={{
                            width: '100%',
                            padding: '10px 14px',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#dc2626',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            textAlign: 'left',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px', marginBottom: '12px', paddingRight: '50px' }}>
                  <TrendingUp size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{comp.name}</h3>
                    {comp.category && (
                      <span style={{ fontSize: '12px', color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px', display: 'inline-block' }}>
                        {comp.category}
                      </span>
                    )}
                  </div>
                </div>
                {comp.description && (
                  <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
                    {comp.description}
                  </p>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
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
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '500px',
              width: '100%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'goals' ? 'Goal' : 'Competency'}
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                {activeTab === 'goals' ? 'Title' : 'Name'} *
              </label>
              <input
                type="text"
                value={activeTab === 'goals' ? formData.title : formData.name}
                onChange={(e) => setFormData({ ...formData, [activeTab === 'goals' ? 'title' : 'name']: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                placeholder={activeTab === 'goals' ? 'e.g., Improve team communication' : 'e.g., Leadership'}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Category
              </label>
              {showNewCategoryInput ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newCategoryValue}
                    onChange={(e) => setNewCategoryValue(e.target.value)}
                    onBlur={() => {
                      if (newCategoryValue.trim()) {
                        setFormData({ ...formData, category: newCategoryValue.trim() });
                      }
                      setShowNewCategoryInput(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (newCategoryValue.trim()) {
                          setFormData({ ...formData, category: newCategoryValue.trim() });
                        }
                        setShowNewCategoryInput(false);
                      }
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #3b82f6',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                    placeholder="Enter new category name..."
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryValue('');
                    }}
                    style={{
                      padding: '10px 12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <select
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === '__new__') {
                      setShowNewCategoryInput(true);
                      setNewCategoryValue('');
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    outline: 'none',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select a category...</option>
                  {currentCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">+ Add new category...</option>
                </select>
              )}
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                placeholder="Describe what this involves..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#ffffff',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={activeTab === 'goals' ? !formData.title.trim() : !formData.name.trim()}
                style={{
                  padding: '10px 20px',
                  background: (activeTab === 'goals' ? formData.title.trim() : formData.name.trim()) ? '#3b82f6' : '#9ca3af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (activeTab === 'goals' ? formData.title.trim() : formData.name.trim()) ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                {editingItem ? 'Save Changes' : 'Add to Library'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
