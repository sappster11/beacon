import { MessageSquare } from 'lucide-react';
import type { SelfReflection } from '../types';

interface SelfReflectionSectionProps {
  reflections: SelfReflection[];
  isEmployee: boolean;
  onReflectionsChange: (updatedReflections: SelfReflection[]) => void;
}

export default function SelfReflectionSection({
  reflections,
  isEmployee,
  onReflectionsChange,
}: SelfReflectionSectionProps) {
  const handleAnswerChange = (index: number, answer: string) => {
    const updated = [...reflections];
    updated[index] = { ...updated[index], answer };
    onReflectionsChange(updated);
  };

  if (reflections.length === 0) {
    return null;
  }

  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <MessageSquare size={20} color='#8b5cf6' />
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>
          Self-Reflection Questions
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {reflections.map((reflection, index) => (
          <div
            key={index}
            style={{
              padding: '16px',
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#111827' }}>
              {reflection.question}
            </h4>
            {isEmployee ? (
              <textarea
                value={reflection.answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Enter your response..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
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
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              />
            ) : (
              <p style={{ margin: 0, fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>
                {reflection.answer || <em style={{ color: '#9ca3af' }}>No response provided</em>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
