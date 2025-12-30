import { FileText } from 'lucide-react';
import type { SummaryComments } from '../types';

interface SummaryCommentsSectionProps {
  summaryComments: SummaryComments;
  isEmployee: boolean;
  isManager: boolean;
  onCommentsChange: (updatedComments: SummaryComments) => void;
}

export default function SummaryCommentsSection({
  summaryComments,
  isEmployee,
  isManager,
  onCommentsChange,
}: SummaryCommentsSectionProps) {
  const handleEmployeeCommentChange = (value: string) => {
    onCommentsChange({ ...summaryComments, employeeComment: value });
  };

  const handleManagerCommentChange = (value: string) => {
    onCommentsChange({ ...summaryComments, managerComment: value });
  };

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <FileText size={20} color="#f59e0b" />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
          Summary Comments
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Employee Summary */}
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Employee Summary
          </label>
          {isEmployee ? (
            <textarea
              value={summaryComments.employeeComment || ''}
              onChange={(e) => handleEmployeeCommentChange(e.target.value)}
              placeholder="Share your overall thoughts, key takeaways, and reflections on this review period..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          ) : (
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {summaryComments.employeeComment || <em style={{ color: 'var(--text-faint)' }}>No employee summary provided</em>}
            </p>
          )}
        </div>

        {/* Manager Summary */}
        <div
          style={{
            padding: '16px',
            background: 'var(--bg-primary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Manager Summary
          </label>
          {isManager ? (
            <textarea
              value={summaryComments.managerComment || ''}
              onChange={(e) => handleManagerCommentChange(e.target.value)}
              placeholder="Provide your overall assessment, key strengths, areas for development, and recommendations..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: '1.6',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            />
          ) : (
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              {summaryComments.managerComment || <em style={{ color: 'var(--text-faint)' }}>No manager summary provided</em>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
