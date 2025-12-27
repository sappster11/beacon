import type { User } from '../types';

interface AvatarProps {
  user: Pick<User, 'name' | 'profilePicture'>;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
  backgroundColor?: string;
}

const sizeMap = {
  sm: { container: 32, text: 12 },
  md: { container: 40, text: 14 },
  lg: { container: 48, text: 18 },
  xl: { container: 80, text: 28 },
};

export default function Avatar({
  user,
  size = 'md',
  className,
  style = {},
  backgroundColor = '#3b82f6'
}: AvatarProps) {
  const dimensions = sizeMap[size];
  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  if (user.profilePicture) {
    return (
      <img
        src={`${API_BASE_URL}${user.profilePicture}`}
        alt={user.name}
        style={{
          width: `${dimensions.container}px`,
          height: `${dimensions.container}px`,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
          ...style,
        }}
        className={className}
      />
    );
  }

  return (
    <div
      style={{
        width: `${dimensions.container}px`,
        height: `${dimensions.container}px`,
        borderRadius: '50%',
        background: backgroundColor,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${dimensions.text}px`,
        fontWeight: '600',
        flexShrink: 0,
        ...style,
      }}
      className={className}
    >
      {initials}
    </div>
  );
}
