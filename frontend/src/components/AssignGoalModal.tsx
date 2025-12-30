import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { goals, goalTemplates, users } from '../lib/api';
import type { Goal, User, GoalTemplate } from '../types';

interface AssignGoalModalProps {
  onClose: () => void;
  onCreated: (goal: Goal) => void;
  templateId?: string; // Optional - if using a template
}

export default function AssignGoalModal({ onClose, onCreated, templateId }: AssignGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [visibility, setVisibility] = useState<'PRIVATE' | 'TEAM' | 'COMPANY'>('TEAM');
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateCategory, setTemplateCategory] = useState('Engineering');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  const categories = ['Sales', 'Engineering', 'Customer Success', 'Leadership', 'Marketing', 'Operations'];

  useEffect(() => {
    loadEmployees();
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadEmployees = async () => {
    try {
      const data = await users.getAll();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const loadTemplate = async () => {
    if (!templateId) return;

    try {
      setIsLoadingTemplate(true);
      const template = await goalTemplates.getById(templateId);
      setTitle(template.title);
      setDescription(template.description);
      setTargetValue(template.targetValue?.toString() || '');
      setUnit(template.unit || '');

      // Calculate due date from suggested duration
      if (template.suggestedDuration) {
        const date = new Date();
        date.setDate(date.getDate() + template.suggestedDuration);
        setDueDate(date.toISOString().split('T')[0]);
      }

      setVisibility(template.visibility as any);
    } catch (err) {
      console.error('Failed to load template:', err);
    } finally {
      setIsLoadingTemplate(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !employeeId) {
      setError('Title, description, and employee are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // If using a template, use the template endpoint
      if (templateId) {
        const goal = await goalTemplates.useTemplate(
          templateId,
          employeeId,
          targetValue ? parseFloat(targetValue) : undefined,
          dueDate || undefined,
          visibility
        );
        onCreated(goal);
      } else {
        // Otherwise create a new goal
        const goal = await goals.create({
          ownerId: employeeId,
          title: title.trim(),
          description: description.trim(),
          targetValue: targetValue ? parseFloat(targetValue) : undefined,
          unit: unit.trim() || undefined,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          visibility,
          status: 'ACTIVE',
        });

        // If "save as template" is checked, create a template too
        if (saveAsTemplate) {
          await goalTemplates.create({
            title: title.trim(),
            description: description.trim(),
            category: templateCategory,
            targetValue: targetValue ? parseFloat(targetValue) : undefined,
            unit: unit.trim() || undefined,
            suggestedDuration: dueDate ? Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
            visibility: visibility === 'PRIVATE' ? 'TEAM' : visibility,
          });
        }

        onCreated(goal);
      }

      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTemplate) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{ background: 'var(--bg-primary)', padding: '40px', borderRadius: '12px' }}>
          <p style={{ margin: 0, color: '#374151' }}>Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            {templateId ? 'Assign Goal from Template' : 'Create New Goal'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
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
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Employee Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Assign to Employee *
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'var(--bg-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            >
              <option value="">Select an employee...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} - {emp.title || 'No title'}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Increase Quarterly Sales"
              required
              disabled={!!templateId}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: templateId ? '#f9fafb' : '#ffffff',
              }}
              onFocus={(e) => {
                if (!templateId) e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this goal is about..."
              required
              disabled={!!templateId}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                background: templateId ? '#f9fafb' : '#ffffff',
              }}
              onFocus={(e) => {
                if (!templateId) e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
              }}
            />
          </div>

          {/* Target Value & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Target Value
              </label>
              <input
                type="number"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="e.g., 100"
                step="any"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., sales, %"
                disabled={!!templateId}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: templateId ? '#f9fafb' : '#ffffff',
                }}
                onFocus={(e) => {
                  if (!templateId) e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>
          </div>

          {/* Due Date & Visibility */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Visibility
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: 'var(--bg-primary)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                <option value="PRIVATE">Private</option>
                <option value="TEAM">Team</option>
                <option value="COMPANY">Company</option>
              </select>
            </div>
          </div>

          {/* Save as Template - only show if not using a template */}
          {!templateId && (
            <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  style={{ marginRight: '12px', width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Save this goal as a template for future use
                </span>
              </label>

              {saveAsTemplate && (
                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Template Category
                  </label>
                  <select
                    value={templateCategory}
                    onChange={(e) => setTemplateCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '14px',
                      outline: 'none',
                      background: 'var(--bg-primary)',
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = '#2563eb';
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.currentTarget.style.background = '#3b82f6';
              }}
            >
              {isSubmitting ? 'Creating...' : 'Assign Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
