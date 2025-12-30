import { Loader } from 'lucide-react';

interface SpinnerProps {
  size?: number;
  color?: string;
  text?: string;
  fullPage?: boolean;
}

export default function Spinner({
  size = 24,
  color = '#3b82f6',
  text,
  fullPage = false
}: SpinnerProps) {
  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
    }}>
      <Loader
        size={size}
        color={color}
        style={{ animation: 'spin 1s linear infinite' }}
      />
      {text && (
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{text}</span>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );

  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        width: '100%',
      }}>
        {content}
      </div>
    );
  }

  return content;
}

// Inline spinner for buttons, etc.
export function InlineSpinner({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <Loader
      size={size}
      color={color}
      style={{ animation: 'spin 1s linear infinite' }}
    />
  );
}
