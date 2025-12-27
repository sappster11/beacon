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
        background: isActive ? '#d1fae5' : '#f3f4f6',
        color: isActive ? '#065f46' : '#6b7280'
      }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}
