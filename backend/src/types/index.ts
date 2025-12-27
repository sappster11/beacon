// User roles
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN' | 'SUPER_ADMIN' | 'PLATFORM_ADMIN';

export const UserRole = {
  EMPLOYEE: 'EMPLOYEE' as UserRole,
  MANAGER: 'MANAGER' as UserRole,
  HR_ADMIN: 'HR_ADMIN' as UserRole,
  SUPER_ADMIN: 'SUPER_ADMIN' as UserRole,
  PLATFORM_ADMIN: 'PLATFORM_ADMIN' as UserRole,
};

// Review types
export type ReviewCycleType = 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';

export const ReviewCycleType = {
  QUARTERLY: 'QUARTERLY' as ReviewCycleType,
  SEMI_ANNUAL: 'SEMI_ANNUAL' as ReviewCycleType,
  ANNUAL: 'ANNUAL' as ReviewCycleType,
};

export type ReviewStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CALIBRATED';

export const ReviewStatus = {
  NOT_STARTED: 'NOT_STARTED' as ReviewStatus,
  IN_PROGRESS: 'IN_PROGRESS' as ReviewStatus,
  COMPLETED: 'COMPLETED' as ReviewStatus,
  CALIBRATED: 'CALIBRATED' as ReviewStatus,
};

// Goal types
export type GoalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export const GoalStatus = {
  DRAFT: 'DRAFT' as GoalStatus,
  ACTIVE: 'ACTIVE' as GoalStatus,
  COMPLETED: 'COMPLETED' as GoalStatus,
  CANCELLED: 'CANCELLED' as GoalStatus,
};

export type GoalVisibility = 'PRIVATE' | 'TEAM' | 'COMPANY';

export const GoalVisibility = {
  PRIVATE: 'PRIVATE' as GoalVisibility,
  TEAM: 'TEAM' as GoalVisibility,
  COMPANY: 'COMPANY' as GoalVisibility,
};
