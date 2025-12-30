interface UserStatusBadgeProps {
  isActive: boolean;
}

export default function UserStatusBadge({ isActive }: UserStatusBadgeProps) {
  return (
    <span
      style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '500',
        background: isActive ? '#d1fae5' : 'var(--bg-tertiary)',
        color: isActive ? '#065f46' : 'var(--text-muted)'
      }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
