import { useState } from 'react';
import { X } from 'lucide-react';
import { goalTemplates } from '../lib/api';
import type { GoalTemplate } from '../types';

interface CreateGoalTemplateModalProps {
  onClose: () => void;
  onCreated: (template: GoalTemplate) => void;
}

export default function CreateGoalTemplateModal({ onClose, onCreated }: CreateGoalTemplateModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [suggestedDuration, setSuggestedDuration] = useState('90');
  const [visibility, setVisibility] = useState<'TEAM' | 'COMPANY'>('TEAM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const categories = ['Sales', 'Engineering', 'Customer Success', 'Leadership', 'Marketing', 'Operations'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const template = await goalTemplates.create({
        title: title.trim(),
        description: description.trim(),
        category,
        targetValue: targetValue ? parseFloat(targetValue) : undefined,
        unit: unit.trim() || undefined,
        suggestedDuration: suggestedDuration ? parseInt(suggestedDuration) : undefined,
        visibility,
      });

      onCreated(template);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create goal template');
    } finally {
      setIsSubmitting(false);
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
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Create Goal Template
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
              e.currentTarget.style.background = 'var(--bg-tertiary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Increase Quarterly Sales"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this goal is about..."
              required
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'var(--bg-primary)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Target Value & Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Unit
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., sales, %"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>
          </div>

          {/* Suggested Duration */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Suggested Duration (days)
            </label>
            <input
              type="number"
              value={suggestedDuration}
              onChange={(e) => setSuggestedDuration(e.target.value)}
              placeholder="e.g., 90"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Visibility
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="TEAM"
                  checked={visibility === 'TEAM'}
                  onChange={(e) => setVisibility(e.target.value as 'TEAM')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Team</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="COMPANY"
                  checked={visibility === 'COMPANY'}
                  onChange={(e) => setVisibility(e.target.value as 'COMPANY')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Company</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
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
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: isSubmitting ? 'var(--text-faint)' : '#3b82f6',
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
              {isSubmitting ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
