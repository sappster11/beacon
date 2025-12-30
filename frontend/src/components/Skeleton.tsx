import { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: CSSProperties;
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '6px',
  style,
  className
}: SkeletonProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    >
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonText({ lines = 3, style }: { lines?: number; style?: CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', ...style }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ style }: { style?: CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      padding: '24px',
      ...style,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <Skeleton width={48} height={48} borderRadius="10px" />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="18px" style={{ marginBottom: '8px' }} />
          <Skeleton width="40%" height="14px" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton width={size} height={size} borderRadius="50%" />;
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <Skeleton height="16px" width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} style={{ padding: '12px 16px', textAlign: 'left' }}>
                <Skeleton height="12px" width="80px" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Page-specific skeletons
export function DashboardSkeleton() {
  return (
    <div style={{ padding: '48px' }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <Skeleton width="300px" height="32px" style={{ marginBottom: '8px' }} />
        <Skeleton width="150px" height="16px" />
      </div>

      {/* Cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '48px'
      }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}

export function ReviewsSkeleton() {
  return (
    <div style={{ padding: '48px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <Skeleton width="200px" height="32px" />
        <Skeleton width="120px" height="40px" borderRadius="8px" />
      </div>
      <SkeletonTable rows={5} columns={5} />
    </div>
  );
}

export function TeamSkeleton() {
  return (
    <div style={{ padding: '48px' }}>
      <Skeleton width="200px" height="32px" style={{ marginBottom: '32px' }} />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <SkeletonAvatar size={56} />
              <div>
                <Skeleton width="120px" height="18px" style={{ marginBottom: '6px' }} />
                <Skeleton width="80px" height="14px" />
              </div>
            </div>
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  );
}
