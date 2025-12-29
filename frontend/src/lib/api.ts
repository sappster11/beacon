import { supabase } from './supabase';
import type {
  User,
  Department,
  ReviewCycle,
  Review,
  PeerFeedback,
  CompetencyComment,
  GoalComment,
  SummaryComments,
  Goal,
  GoalTemplate,
  OneOnOne,
  CalendarConnectionStatus,
  DevelopmentPlan,
  GoalLibraryItem,
  CompetencyLibraryItem,
} from '../types';

// Helper to transform snake_case database rows to camelCase
function transformUser(row: any): User {
  if (!row) return row;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    title: row.title,
    role: row.role,
    organizationId: row.organization_id,
    managerId: row.manager_id,
    departmentId: row.department_id,
    hireDate: row.hire_date,
    profilePicture: row.profile_picture,
    bio: row.bio,
    phoneNumber: row.phone_number,
    location: row.location,
    isActive: row.is_active,
    lastLoginAt: row.last_login_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    organization: row.organizations ? transformOrganization(row.organizations) : undefined,
    department: row.department ? { id: row.department.id, name: row.department.name } : undefined,
    manager: row.manager ? { id: row.manager.id, name: row.manager.name } : undefined,
  };
}

function transformOrganization(row: any) {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo: row.logo,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformDepartment(row: any): Department {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    parentDepartmentId: row.parent_department_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformReviewCycle(row: any): ReviewCycle {
  if (!row) return row;
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformReview(row: any): Review {
  if (!row) return row;
  return {
    id: row.id,
    revieweeId: row.reviewee_id,
    reviewerId: row.reviewer_id,
    cycleId: row.cycle_id,
    competencies: row.competencies ? JSON.stringify(row.competencies) : undefined,
    selfReflections: row.self_reflections ? JSON.stringify(row.self_reflections) : undefined,
    assignedGoals: row.assigned_goals ? JSON.stringify(row.assigned_goals) : undefined,
    overallSelfRating: row.overall_self_rating,
    overallManagerRating: row.overall_manager_rating,
    selfAssessment: row.self_assessment,
    managerAssessment: row.manager_assessment,
    summaryComments: row.summary_comments ? JSON.stringify(row.summary_comments) : undefined,
    status: row.status,
    // Workflow tracking fields
    selfReviewSubmittedAt: row.self_review_submitted_at,
    managerReviewSubmittedAt: row.manager_review_submitted_at,
    sharedAt: row.shared_at,
    acknowledgedAt: row.acknowledged_at,
    skipLevelApprovedAt: row.skip_level_approved_at,
    skipLevelApproverId: row.skip_level_approver_id,
    autoApproved: row.auto_approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    reviewee: row.reviewee ? transformUser(row.reviewee) : undefined,
    reviewer: row.reviewer ? transformUser(row.reviewer) : undefined,
    cycle: row.review_cycles ? transformReviewCycle(row.review_cycles) : undefined,
    peerFeedback: row.peer_feedback?.map(transformPeerFeedback),
    competencyComments: row.competency_comments?.map(transformCompetencyComment),
  };
}

function transformPeerFeedback(row: any): PeerFeedback {
  if (!row) return row;
  return {
    id: row.id,
    feedback: row.feedback,
    rating: row.rating,
    createdAt: row.created_at,
  };
}

function transformCompetencyComment(row: any): CompetencyComment {
  if (!row) return row;
  return {
    id: row.id,
    reviewId: row.review_id,
    competencyName: row.competency_name,
    authorId: row.author_id,
    author: row.users ? { id: row.users.id, name: row.users.name } : undefined,
    authorRole: row.author_role,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformGoalComment(row: any): GoalComment {
  if (!row) return row;
  return {
    id: row.id,
    reviewId: row.review_id,
    goalId: row.goal_id,
    authorId: row.author_id,
    author: row.users ? { id: row.users.id, name: row.users.name } : undefined,
    authorRole: row.author_role,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformGoal(row: any): Goal {
  if (!row) return row;
  return {
    id: row.id,
    ownerId: row.owner_id,
    parentGoalId: row.parent_goal_id,
    title: row.title,
    description: row.description,
    targetValue: row.target_value,
    currentValue: row.current_value,
    unit: row.unit,
    dueDate: row.due_date,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformGoalTemplate(row: any): GoalTemplate {
  if (!row) return row;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    targetValue: row.target_value,
    unit: row.unit,
    suggestedDuration: row.suggested_duration,
    visibility: row.visibility,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformOneOnOne(row: any): OneOnOne {
  if (!row) return row;
  return {
    id: row.id,
    managerId: row.manager_id,
    employeeId: row.employee_id,
    scheduledAt: row.scheduled_at,
    agenda: row.agenda,
    managerNotes: row.manager_notes,
    sharedNotes: row.shared_notes,
    actionItems: row.action_items ? JSON.stringify(row.action_items) : undefined,
    status: row.status,
    transcript: row.transcript,
    transcriptFileUrl: row.transcript_file_url,
    documentUrl: row.document_url,
    googleEventId: row.google_event_id,
    googleEventUrl: row.google_event_url,
    googleCalendarSynced: row.google_calendar_synced,
    lastSyncedAt: row.last_synced_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    manager: row.manager ? { id: row.manager.id, name: row.manager.name, email: row.manager.email, title: row.manager.title } : undefined,
    employee: row.employee ? { id: row.employee.id, name: row.employee.name, email: row.employee.email, title: row.employee.title } : undefined,
  };
}

function transformDevelopmentPlan(row: any): DevelopmentPlan {
  if (!row) return row;
  return {
    id: row.id,
    userId: row.user_id,
    careerGoals: row.career_goals,
    skillsToAdd: row.skills_to_add ? JSON.stringify(row.skills_to_add) : '[]',
    milestones: row.milestones ? JSON.stringify(row.milestones) : '[]',
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Helper to get current user ID
async function getCurrentUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// Users API
export const users = {
  getAll: async (): Promise<User[]> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(id, name), manager:users!users_manager_id_fkey(id, name)')
      .eq('organization_id', currentUser?.organization_id)
      .order('name');
    if (error) throw error;
    return data.map(transformUser);
  },

  getById: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, organizations(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformUser(data);
  },

  getOrgChart: async (): Promise<User[]> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(id, name), manager:users!users_manager_id_fkey(id, name)')
      .eq('organization_id', currentUser?.organization_id)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data.map(transformUser);
  },

  getDirectReports: async (id: string): Promise<User[]> => {
    const { data, error } = await supabase
      .from('users')
      .select('*, department:departments(id, name), manager:users!users_manager_id_fkey(id, name)')
      .eq('manager_id', id)
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return data.map(transformUser);
  },

  create: async (user: Partial<User>): Promise<User> => {
    // Get current user's org
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const newUserId = crypto.randomUUID();
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: newUserId,
        email: user.email,
        name: user.name,
        title: user.title,
        role: user.role || 'EMPLOYEE',
        organization_id: currentUser?.organization_id,
        manager_id: user.managerId,
        department_id: user.departmentId,
        hire_date: user.hireDate,
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'CREATE',
      resourceType: 'User',
      resourceId: newUserId,
      description: `Created user ${user.name} (${user.email})`,
      changes: { name: user.name, email: user.email, role: user.role || 'EMPLOYEE' },
    });

    return transformUser(data);
  },

  update: async (id: string, updates: Partial<User>): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({
        name: updates.name,
        title: updates.title,
        role: updates.role,
        manager_id: updates.managerId,
        department_id: updates.departmentId,
        hire_date: updates.hireDate,
        is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: id,
      description: `Updated user ${data.name}`,
      changes: updates,
    });

    return transformUser(data);
  },

  deactivate: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: id,
      description: `Deactivated user ${data.name}`,
      changes: { is_active: false },
    });

    return transformUser(data);
  },

  reactivate: async (id: string): Promise<User> => {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: true })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'UPDATE',
      resourceType: 'User',
      resourceId: id,
      description: `Reactivated user ${data.name}`,
      changes: { is_active: true },
    });

    return transformUser(data);
  },
};

// Invitations API
interface Invitation {
  id: string;
  email: string;
  name: string;
  title?: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { id: string; name: string };
  department?: { id: string; name: string };
}

const transformInvitation = (data: any): Invitation => ({
  id: data.id,
  email: data.email,
  name: data.name,
  title: data.title,
  role: data.role,
  status: data.status,
  expiresAt: data.expires_at,
  createdAt: data.created_at,
  invitedBy: data.invited_by ? { id: data.invited_by.id, name: data.invited_by.name } : { id: '', name: '' },
  department: data.department ? { id: data.department.id, name: data.department.name } : undefined,
});

export const invitations = {
  getAll: async (): Promise<Invitation[]> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        invited_by:users!invitations_invited_by_id_fkey(id, name),
        department:departments(id, name)
      `)
      .eq('organization_id', currentUser?.organization_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformInvitation);
  },

  cancel: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  resend: async (id: string): Promise<void> => {
    // Update expiration date and trigger email resend via edge function
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    const { error } = await supabase
      .from('invitations')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', id);
    if (error) throw error;

    // TODO: Trigger email resend via edge function
  },

  validateToken: async (token: string): Promise<{ valid: boolean; invitation?: any; error?: string }> => {
    const { data, error } = await supabase
      .from('invitations')
      .select(`
        *,
        organization:organizations(id, name)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !data) {
      return { valid: false, error: 'Invalid or expired invitation' };
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'This invitation has expired' };
    }

    return {
      valid: true,
      invitation: {
        email: data.email,
        name: data.name,
        organizationName: data.organization?.name || 'Unknown Organization',
      },
    };
  },

  accept: async (token: string, password: string): Promise<void> => {
    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*, organization:organizations(id, name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (inviteError || !invitation) {
      throw new Error('Invalid or expired invitation');
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      throw new Error('This invitation has expired');
    }

    // Create the user account via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: invitation.email,
      password,
      options: {
        data: {
          name: invitation.name,
          organization_id: invitation.organization_id,
        },
      },
    });

    if (authError) throw authError;

    // Create the user record in our users table
    const { error: userError } = await supabase.from('users').insert({
      id: authData.user?.id,
      email: invitation.email,
      name: invitation.name,
      title: invitation.title,
      role: invitation.role,
      organization_id: invitation.organization_id,
      department_id: invitation.department_id,
      is_active: true,
    });

    if (userError) throw userError;

    // Mark invitation as accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id);
  },
};

// Settings API
export const settings = {
  getAll: async (): Promise<{ review?: any; notifications?: any; features?: any }> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('organization_id', currentUser?.organization_id);

    if (error) throw error;

    const result: any = {};
    data?.forEach((setting: any) => {
      result[setting.category] = setting.settings;
    });
    return result;
  },

  update: async (category: string, settingsData: any): Promise<void> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { error } = await supabase
      .from('system_settings')
      .upsert({
        organization_id: currentUser?.organization_id,
        category,
        settings: settingsData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'organization_id,category'
      });

    if (error) throw error;
  },
};

// Audit Logs API
interface AuditLogFilters {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: string;
  endDate?: string;
  resourceId?: string;
  ipAddress?: string;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export const auditLogs = {
  getAll: async (filters: AuditLogFilters = {}): Promise<{ logs: any[]; total: number }> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    let query = supabase
      .from('audit_logs')
      .select('*, user:users(id, name, email)', { count: 'exact' })
      .eq('organization_id', currentUser?.organization_id)
      .order('created_at', { ascending: false });

    if (filters.userId) query = query.eq('user_id', filters.userId);
    if (filters.action) query = query.eq('action', filters.action);
    if (filters.resourceType) query = query.eq('resource_type', filters.resourceType);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.resourceId) query = query.ilike('resource_id', `%${filters.resourceId}%`);
    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', `${filters.endDate}T23:59:59`);
    if (filters.search) {
      query = query.or(`description.ilike.%${filters.search}%,changes.ilike.%${filters.search}%`);
    }
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const logs = data?.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      user: log.user,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      changes: log.changes,
      metadata: log.metadata,
      status: log.status,
      errorMessage: log.error_message,
      description: log.description,
      createdAt: log.created_at,
    })) || [];

    return { logs, total: count || 0 };
  },

  create: async (params: {
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    resourceType: string;
    resourceId: string;
    description?: string;
    changes?: any;
    status?: 'success' | 'failed';
    errorMessage?: string;
  }): Promise<void> => {
    try {
      const userId = await getCurrentUserId();
      const { data: currentUser } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', userId)
        .single();

      await supabase.from('audit_logs').insert({
        user_id: userId,
        organization_id: currentUser?.organization_id,
        action: params.action,
        resource_type: params.resourceType,
        resource_id: params.resourceId,
        description: params.description,
        changes: params.changes ? JSON.stringify(params.changes) : null,
        status: params.status || 'success',
        error_message: params.errorMessage,
      });
    } catch (error) {
      // Silently fail - don't break main operation if audit logging fails
      console.error('Failed to create audit log:', error);
    }
  },
};

// Profile API
export const profile = {
  getMe: async (): Promise<User | null> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return transformUser(data);
  },

  updateProfile: async (updates: { bio?: string; phoneNumber?: string; location?: string }): Promise<User> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('users')
      .update({
        bio: updates.bio,
        phone_number: updates.phoneNumber,
        location: updates.location,
      })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return transformUser(data);
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    return { message: 'Password updated successfully' };
  },

  uploadProfilePicture: async (file: File): Promise<User> => {
    const userId = await getCurrentUserId();
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(fileName, file, { upsert: true });
    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(fileName);

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update({ profile_picture: publicUrl })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return transformUser(data);
  },

  deleteProfilePicture: async (): Promise<User> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('users')
      .update({ profile_picture: null })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return transformUser(data);
  },
};

// Departments API
export const departments = {
  getAll: async (): Promise<Department[]> => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(transformDepartment);
  },

  getTree: async (): Promise<Department[]> => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name');
    if (error) throw error;
    return data.map(transformDepartment);
  },

  getById: async (id: string): Promise<Department> => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformDepartment(data);
  },

  create: async (department: Partial<Department>): Promise<Department> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('departments')
      .insert({
        name: department.name,
        parent_department_id: department.parentDepartmentId,
        organization_id: currentUser?.organization_id,
      })
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'CREATE',
      resourceType: 'Department',
      resourceId: data.id,
      description: `Created department ${department.name}`,
      changes: { name: department.name },
    });

    return transformDepartment(data);
  },

  update: async (id: string, updates: Partial<Department>): Promise<Department> => {
    const { data, error } = await supabase
      .from('departments')
      .update({
        name: updates.name,
        parent_department_id: updates.parentDepartmentId,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'UPDATE',
      resourceType: 'Department',
      resourceId: id,
      description: `Updated department ${data.name}`,
      changes: updates,
    });

    return transformDepartment(data);
  },

  delete: async (id: string): Promise<void> => {
    // Get name before delete for audit log
    const { data: dept } = await supabase
      .from('departments')
      .select('name')
      .eq('id', id)
      .single();

    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);
    if (error) throw error;

    // Log audit event
    await auditLogs.create({
      action: 'DELETE',
      resourceType: 'Department',
      resourceId: id,
      description: `Deleted department ${dept?.name || id}`,
    });
  },
};

// Review Cycles API
export const reviewCycles = {
  getAll: async (): Promise<ReviewCycle[]> => {
    const { data, error } = await supabase
      .from('review_cycles')
      .select('*')
      .order('start_date', { ascending: false });
    if (error) throw error;
    return data.map(transformReviewCycle);
  },

  getById: async (id: string): Promise<ReviewCycle> => {
    const { data, error } = await supabase
      .from('review_cycles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformReviewCycle(data);
  },

  create: async (cycle: Partial<ReviewCycle>): Promise<ReviewCycle> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('review_cycles')
      .insert({
        name: cycle.name,
        type: cycle.type,
        start_date: cycle.startDate,
        end_date: cycle.endDate,
        status: cycle.status || 'active',
        organization_id: currentUser?.organization_id,
      })
      .select()
      .single();
    if (error) throw error;
    return transformReviewCycle(data);
  },

  update: async (id: string, updates: Partial<ReviewCycle>): Promise<ReviewCycle> => {
    const { data, error } = await supabase
      .from('review_cycles')
      .update({
        name: updates.name,
        type: updates.type,
        start_date: updates.startDate,
        end_date: updates.endDate,
        status: updates.status,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReviewCycle(data);
  },

  setActive: async (id: string): Promise<void> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!currentUser?.organization_id) throw new Error('User organization not found');

    // Set all cycles in the org to 'completed'
    await supabase
      .from('review_cycles')
      .update({ status: 'completed' })
      .eq('organization_id', currentUser.organization_id);

    // Set the specified cycle to 'active'
    const { error } = await supabase
      .from('review_cycles')
      .update({ status: 'active' })
      .eq('id', id);

    if (error) throw error;
  },
};

// Reviews API
export const reviews = {
  getAll: async (): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewee:users!reviews_reviewee_id_fkey(id, name, email, title, profile_picture),
        reviewer:users!reviews_reviewer_id_fkey(id, name, email, title),
        review_cycles(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformReview);
  },

  getMyReviews: async (): Promise<Review[]> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewee:users!reviews_reviewee_id_fkey(id, name, email, title, profile_picture),
        reviewer:users!reviews_reviewer_id_fkey(id, name, email, title),
        review_cycles(*)
      `)
      .or(`reviewee_id.eq.${userId},reviewer_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformReview);
  },

  getById: async (id: string): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewee:users!reviews_reviewee_id_fkey(id, name, email, title, profile_picture),
        reviewer:users!reviews_reviewer_id_fkey(id, name, email, title),
        review_cycles(*),
        peer_feedback(*),
        competency_comments(*, users(id, name))
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  create: async (review: Partial<Review>): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        reviewee_id: review.revieweeId,
        reviewer_id: review.reviewerId,
        cycle_id: review.cycleId,
        status: 'SELF_REVIEW',
      })
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitSelfAssessment: async (id: string, assessment: string): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ self_assessment: assessment })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitManagerAssessment: async (id: string, assessment: string, rating: number): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        manager_assessment: assessment,
        overall_manager_rating: rating,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitPeerFeedback: async (reviewId: string, feedback: string, rating?: number): Promise<PeerFeedback> => {
    const userId = await getCurrentUserId();
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single();

    const { data, error } = await supabase
      .from('peer_feedback')
      .insert({
        review_id: reviewId,
        giver_id: userId,
        receiver_id: review?.reviewee_id,
        feedback,
        rating,
      })
      .select()
      .single();
    if (error) throw error;
    return transformPeerFeedback(data);
  },

  getPeerFeedback: async (reviewId: string): Promise<PeerFeedback[]> => {
    const { data, error } = await supabase
      .from('peer_feedback')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformPeerFeedback);
  },

  submitCompetencySelfRatings: async (id: string, competencies: any[], overallSelfRating?: number): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        competencies,
        overall_self_rating: overallSelfRating,
        status: 'IN_PROGRESS',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitCompetencyManagerRatings: async (id: string, competencies: any[], overallManagerRating?: number): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        competencies,
        overall_manager_rating: overallManagerRating,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitSelfReflections: async (id: string, selfReflections: any[]): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ self_reflections: selfReflections })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  assignGoals: async (id: string, assignedGoals: any[]): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ assigned_goals: assignedGoals })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  getHistory: async (userId: string): Promise<Review[]> => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        review_cycles(*)
      `)
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformReview);
  },

  bulkAssign: async (cycleId: string, employeeIds: string[]): Promise<any> => {
    // For each employee, create a review with their manager as reviewer
    const results = [];
    for (const employeeId of employeeIds) {
      const { data: employee } = await supabase
        .from('users')
        .select('manager_id')
        .eq('id', employeeId)
        .single();

      if (employee?.manager_id) {
        const { data, error } = await supabase
          .from('reviews')
          .insert({
            reviewee_id: employeeId,
            reviewer_id: employee.manager_id,
            cycle_id: cycleId,
            status: 'SELF_REVIEW',
          })
          .select()
          .single();
        if (!error) results.push(data);
      }
    }
    return { created: results.length };
  },

  getCompetencyComments: async (reviewId: string, competencyName: string): Promise<CompetencyComment[]> => {
    const { data, error } = await supabase
      .from('competency_comments')
      .select('*, users(id, name)')
      .eq('review_id', reviewId)
      .eq('competency_name', competencyName)
      .order('created_at');
    if (error) throw error;
    return data.map(transformCompetencyComment);
  },

  createCompetencyComment: async (reviewId: string, competencyName: string, content: string): Promise<CompetencyComment> => {
    const userId = await getCurrentUserId();
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    const { data: review } = await supabase
      .from('reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single();

    const authorRole = review?.reviewee_id === userId ? 'EMPLOYEE' : 'MANAGER';

    const { data, error } = await supabase
      .from('competency_comments')
      .insert({
        review_id: reviewId,
        competency_name: competencyName,
        author_id: userId,
        author_role: authorRole,
        content,
      })
      .select('*, users(id, name)')
      .single();
    if (error) throw error;
    return transformCompetencyComment(data);
  },

  updateCompetencyComment: async (reviewId: string, commentId: string, content: string): Promise<CompetencyComment> => {
    const { data, error } = await supabase
      .from('competency_comments')
      .update({ content })
      .eq('id', commentId)
      .select('*, users(id, name)')
      .single();
    if (error) throw error;
    return transformCompetencyComment(data);
  },

  deleteCompetencyComment: async (reviewId: string, commentId: string): Promise<void> => {
    const { error } = await supabase
      .from('competency_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
  },

  getGoalComments: async (reviewId: string, goalId: string): Promise<GoalComment[]> => {
    const { data, error } = await supabase
      .from('goal_comments')
      .select('*, users(id, name)')
      .eq('review_id', reviewId)
      .eq('goal_id', goalId)
      .order('created_at');
    if (error) throw error;
    return data.map(transformGoalComment);
  },

  createGoalComment: async (reviewId: string, goalId: string, content: string): Promise<GoalComment> => {
    const userId = await getCurrentUserId();
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewee_id')
      .eq('id', reviewId)
      .single();

    const authorRole = review?.reviewee_id === userId ? 'EMPLOYEE' : 'MANAGER';

    const { data, error } = await supabase
      .from('goal_comments')
      .insert({
        review_id: reviewId,
        goal_id: goalId,
        author_id: userId,
        author_role: authorRole,
        content,
      })
      .select('*, users(id, name)')
      .single();
    if (error) throw error;
    return transformGoalComment(data);
  },

  updateGoalComment: async (reviewId: string, commentId: string, content: string): Promise<GoalComment> => {
    const { data, error } = await supabase
      .from('goal_comments')
      .update({ content })
      .eq('id', commentId)
      .select('*, users(id, name)')
      .single();
    if (error) throw error;
    return transformGoalComment(data);
  },

  deleteGoalComment: async (reviewId: string, commentId: string): Promise<void> => {
    const { error } = await supabase
      .from('goal_comments')
      .delete()
      .eq('id', commentId);
    if (error) throw error;
  },

  updateSummaryComments: async (id: string, summaryComments: SummaryComments): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({ summary_comments: summaryComments })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  // Workflow transition methods
  submitSelfReview: async (id: string): Promise<Review> => {
    // First get the current review to check if manager has already submitted
    const { data: current, error: fetchError } = await supabase
      .from('reviews')
      .select('manager_review_submitted_at')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    // Determine new status based on whether manager has submitted
    const newStatus = current.manager_review_submitted_at ? 'READY_TO_SHARE' : 'MANAGER_REVIEW';

    const { data, error } = await supabase
      .from('reviews')
      .update({
        self_review_submitted_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  submitManagerReview: async (id: string): Promise<Review> => {
    // First get the current review to check if employee has already submitted
    const { data: current, error: fetchError } = await supabase
      .from('reviews')
      .select('self_review_submitted_at')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    // Determine new status based on whether employee has submitted
    const newStatus = current.self_review_submitted_at ? 'READY_TO_SHARE' : 'MANAGER_REVIEW';

    const { data, error } = await supabase
      .from('reviews')
      .update({
        manager_review_submitted_at: new Date().toISOString(),
        status: newStatus,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  shareReview: async (id: string): Promise<Review> => {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        shared_at: new Date().toISOString(),
        status: 'SHARED',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  acknowledgeReview: async (id: string): Promise<Review> => {
    // Get the reviewer's manager_id to determine if skip-level approval is needed
    const { data: reviewData, error: fetchError } = await supabase
      .from('reviews')
      .select('reviewer_id, reviewer:users!reviews_reviewer_id_fkey(manager_id)')
      .eq('id', id)
      .single();
    if (fetchError) throw fetchError;

    const hasSkipLevel = reviewData.reviewer?.manager_id;

    const { data, error } = await supabase
      .from('reviews')
      .update({
        acknowledged_at: new Date().toISOString(),
        status: hasSkipLevel ? 'PENDING_APPROVAL' : 'COMPLETED',
        auto_approved: !hasSkipLevel,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },

  approveReview: async (id: string): Promise<Review> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('reviews')
      .update({
        skip_level_approved_at: new Date().toISOString(),
        skip_level_approver_id: userId,
        status: 'COMPLETED',
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformReview(data);
  },
};

// Goals API
export const goals = {
  getMyGoals: async (): Promise<Goal[]> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformGoal);
  },

  getUserGoals: async (userId: string): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformGoal);
  },

  getCompanyGoals: async (): Promise<Goal[]> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('visibility', 'COMPANY')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(transformGoal);
  },

  getById: async (id: string): Promise<Goal> => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformGoal(data);
  },

  getTree: async (id: string): Promise<Goal> => {
    // Get the goal and its children
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .or(`id.eq.${id},parent_goal_id.eq.${id}`)
      .order('created_at');
    if (error) throw error;
    const root = data.find(g => g.id === id);
    return transformGoal(root);
  },

  create: async (goal: Partial<Goal>): Promise<Goal> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('goals')
      .insert({
        owner_id: goal.ownerId || userId,
        organization_id: currentUser?.organization_id,
        parent_goal_id: goal.parentGoalId,
        title: goal.title,
        description: goal.description,
        target_value: goal.targetValue,
        current_value: goal.currentValue || 0,
        unit: goal.unit,
        due_date: goal.dueDate,
        status: goal.status || 'DRAFT',
        visibility: goal.visibility || 'PRIVATE',
      })
      .select()
      .single();
    if (error) throw error;
    return transformGoal(data);
  },

  update: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    const { data, error } = await supabase
      .from('goals')
      .update({
        title: updates.title,
        description: updates.description,
        target_value: updates.targetValue,
        current_value: updates.currentValue,
        unit: updates.unit,
        due_date: updates.dueDate,
        status: updates.status,
        visibility: updates.visibility,
        parent_goal_id: updates.parentGoalId,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformGoal(data);
  },

  updateProgress: async (id: string, currentValue: number): Promise<Goal> => {
    const { data, error } = await supabase
      .from('goals')
      .update({ current_value: currentValue })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformGoal(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Goal Templates API
export const goalTemplates = {
  getAll: async (category?: string): Promise<GoalTemplate[]> => {
    let query = supabase
      .from('goal_templates')
      .select('*')
      .eq('is_active', true)
      .order('category')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data.map(transformGoalTemplate);
  },

  getById: async (id: string): Promise<GoalTemplate> => {
    const { data, error } = await supabase
      .from('goal_templates')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformGoalTemplate(data);
  },

  create: async (template: Partial<GoalTemplate>): Promise<GoalTemplate> => {
    const userId = await getCurrentUserId();
    const { data: currentUser } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('goal_templates')
      .insert({
        organization_id: currentUser?.organization_id,
        title: template.title,
        description: template.description,
        category: template.category,
        target_value: template.targetValue,
        unit: template.unit,
        suggested_duration: template.suggestedDuration,
        visibility: template.visibility || 'TEAM',
        is_active: true,
      })
      .select()
      .single();
    if (error) throw error;
    return transformGoalTemplate(data);
  },

  update: async (id: string, updates: Partial<GoalTemplate>): Promise<GoalTemplate> => {
    const { data, error } = await supabase
      .from('goal_templates')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        target_value: updates.targetValue,
        unit: updates.unit,
        suggested_duration: updates.suggestedDuration,
        visibility: updates.visibility,
        is_active: updates.isActive,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformGoalTemplate(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('goal_templates')
      .update({ is_active: false })
      .eq('id', id);
    if (error) throw error;
  },

  useTemplate: async (id: string, employeeId: string, targetValue?: number, dueDate?: string, visibility?: string): Promise<Goal> => {
    const template = await goalTemplates.getById(id);
    return goals.create({
      ownerId: employeeId,
      title: template.title,
      description: template.description,
      targetValue: targetValue ?? template.targetValue,
      unit: template.unit,
      dueDate,
      visibility: (visibility as any) || template.visibility,
      status: 'ACTIVE',
    });
  },
};

// One-on-Ones API
export const oneOnOnes = {
  getMyMeetings: async (): Promise<OneOnOne[]> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('one_on_ones')
      .select(`
        *,
        manager:users!one_on_ones_manager_id_fkey(id, name, email, title),
        employee:users!one_on_ones_employee_id_fkey(id, name, email, title)
      `)
      .or(`manager_id.eq.${userId},employee_id.eq.${userId}`)
      .order('scheduled_at', { ascending: false });
    if (error) throw error;
    return data.map(transformOneOnOne);
  },

  getUpcoming: async (): Promise<OneOnOne[]> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('one_on_ones')
      .select(`
        *,
        manager:users!one_on_ones_manager_id_fkey(id, name, email, title),
        employee:users!one_on_ones_employee_id_fkey(id, name, email, title)
      `)
      .or(`manager_id.eq.${userId},employee_id.eq.${userId}`)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at');
    if (error) throw error;
    return data.map(transformOneOnOne);
  },

  getById: async (id: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .select(`
        *,
        manager:users!one_on_ones_manager_id_fkey(id, name, email, title),
        employee:users!one_on_ones_employee_id_fkey(id, name, email, title)
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  create: async (meeting: Partial<OneOnOne> & { syncToCalendar?: boolean }): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .insert({
        manager_id: meeting.managerId,
        employee_id: meeting.employeeId,
        scheduled_at: meeting.scheduledAt,
        agenda: meeting.agenda,
        status: 'scheduled',
      })
      .select(`
        *,
        manager:users!one_on_ones_manager_id_fkey(id, name, email, title),
        employee:users!one_on_ones_employee_id_fkey(id, name, email, title)
      `)
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  update: async (id: string, updates: Partial<OneOnOne>): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({
        scheduled_at: updates.scheduledAt,
        agenda: updates.agenda,
        status: updates.status,
      })
      .eq('id', id)
      .select(`
        *,
        manager:users!one_on_ones_manager_id_fkey(id, name, email, title),
        employee:users!one_on_ones_employee_id_fkey(id, name, email, title)
      `)
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  updateSharedNotes: async (id: string, notes: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ shared_notes: notes })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  updateManagerNotes: async (id: string, notes: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ manager_notes: notes })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  updateActionItems: async (id: string, items: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ action_items: JSON.parse(items) })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  uploadTranscript: async (id: string, file: File): Promise<OneOnOne> => {
    const fileName = `${id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('transcripts')
      .upload(fileName, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('transcripts')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ transcript_file_url: publicUrl })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  updateTranscript: async (id: string, transcript: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ transcript })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  updateDocumentUrl: async (id: string, documentUrl: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ document_url: documentUrl })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  complete: async (id: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ status: 'completed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  cancel: async (id: string): Promise<OneOnOne> => {
    const { data, error } = await supabase
      .from('one_on_ones')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('one_on_ones')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  linkCalendarEvent: async (eventData: {
    googleEventId: string;
    googleEventUrl?: string;
    employeeId: string;
    scheduledAt: string;
    title?: string;
  }): Promise<OneOnOne> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('one_on_ones')
      .insert({
        manager_id: userId,
        employee_id: eventData.employeeId,
        scheduled_at: eventData.scheduledAt,
        google_event_id: eventData.googleEventId,
        google_event_url: eventData.googleEventUrl,
        google_calendar_synced: true,
        status: 'scheduled',
      })
      .select()
      .single();
    if (error) throw error;
    return transformOneOnOne(data);
  },

  getDocuments: async (id: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from('one_on_one_documents')
      .select('*')
      .eq('one_on_one_id', id)
      .order('created_at');
    if (error) throw error;
    return data;
  },

  addDocument: async (id: string, documentData: { title: string; url: string; isRecurring?: boolean }): Promise<any> => {
    const { data: meeting } = await supabase
      .from('one_on_ones')
      .select('manager_id, employee_id')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('one_on_one_documents')
      .insert({
        one_on_one_id: id,
        title: documentData.title,
        url: documentData.url,
        is_recurring: documentData.isRecurring || false,
        manager_id: meeting?.manager_id,
        employee_id: meeting?.employee_id,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  deleteDocument: async (id: string, docId: string): Promise<void> => {
    const { error } = await supabase
      .from('one_on_one_documents')
      .delete()
      .eq('id', docId);
    if (error) throw error;
  },
};

// Development Plans API
export const developmentPlans = {
  getMyPlan: async (): Promise<DevelopmentPlan> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data ? transformDevelopmentPlan(data) : null as any;
  },

  getUserPlan: async (userId: string): Promise<DevelopmentPlan> => {
    const { data, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data ? transformDevelopmentPlan(data) : null as any;
  },

  getById: async (id: string): Promise<DevelopmentPlan> => {
    const { data, error } = await supabase
      .from('development_plans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return transformDevelopmentPlan(data);
  },

  create: async (plan: Partial<DevelopmentPlan>): Promise<DevelopmentPlan> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('development_plans')
      .insert({
        user_id: plan.userId || userId,
        career_goals: plan.careerGoals,
        skills_to_add: plan.skillsToAdd ? JSON.parse(plan.skillsToAdd) : [],
        milestones: plan.milestones ? JSON.parse(plan.milestones) : [],
        progress: plan.progress || 0,
      })
      .select()
      .single();
    if (error) throw error;
    return transformDevelopmentPlan(data);
  },

  update: async (id: string, updates: Partial<DevelopmentPlan>): Promise<DevelopmentPlan> => {
    const { data, error } = await supabase
      .from('development_plans')
      .update({
        career_goals: updates.careerGoals,
        skills_to_add: updates.skillsToAdd ? JSON.parse(updates.skillsToAdd) : undefined,
        milestones: updates.milestones ? JSON.parse(updates.milestones) : undefined,
        progress: updates.progress,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformDevelopmentPlan(data);
  },

  updateProgress: async (id: string, progress: number): Promise<DevelopmentPlan> => {
    const { data, error } = await supabase
      .from('development_plans')
      .update({ progress })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformDevelopmentPlan(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('development_plans')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// Manager API
export const manager = {
  getTodos: async (): Promise<any> => {
    const userId = await getCurrentUserId();

    // Get pending reviews where user is reviewer (in-progress workflow statuses)
    const { data: pendingReviews } = await supabase
      .from('reviews')
      .select('id, status, reviewee:users!reviews_reviewee_id_fkey(name)')
      .eq('reviewer_id', userId)
      .in('status', ['SELF_REVIEW', 'MANAGER_REVIEW', 'READY_TO_SHARE', 'SHARED', 'ACKNOWLEDGED', 'PENDING_APPROVAL']);

    // Get upcoming 1:1s
    const { data: upcoming1on1s } = await supabase
      .from('one_on_ones')
      .select('id, scheduled_at, employee:users!one_on_ones_employee_id_fkey(name)')
      .eq('manager_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', new Date().toISOString())
      .order('scheduled_at')
      .limit(5);

    return {
      reviewsDue: pendingReviews || [],
      goalsToSet: [], // Goals not implemented yet
      upcoming1on1s: upcoming1on1s || [],
      summary: {
        totalTodos: (pendingReviews?.length || 0) + (upcoming1on1s?.length || 0),
      },
    };
  },

  getTeamActivity: async (limit?: number): Promise<any[]> => {
    // This would need an audit_logs query or custom tracking
    return [];
  },

  getTeamSummary: async (): Promise<any> => {
    const userId = await getCurrentUserId();

    const { data: directReports } = await supabase
      .from('users')
      .select('id')
      .eq('manager_id', userId)
      .eq('is_active', true);

    return {
      totalReports: directReports?.length || 0,
    };
  },
};

// Google Calendar API
export const googleCalendar = {
  getConnectionStatus: async (): Promise<CalendarConnectionStatus> => {
    const userId = await getCurrentUserId();
    const { data } = await supabase
      .from('user_oauth_tokens')
      .select('id')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();
    return { connected: !!data };
  },
  connect: async (): Promise<{ authUrl: string }> => {
    const { data, error } = await supabase.functions.invoke('google-calendar-connect');
    if (error) throw error;
    return data;
  },
  disconnect: async (): Promise<void> => {
    const userId = await getCurrentUserId();
    await supabase
      .from('user_oauth_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('provider', 'google');
  },
  getEvents: async (maxResults?: number): Promise<{ events: any[] }> => {
    const { data, error } = await supabase.functions.invoke('google-calendar-events', {
      body: {},
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (error) throw error;
    return data;
  },
};

// Data Export API - needs edge functions for file generation
export const dataExport = {
  getSummary: async (): Promise<{
    goals: number;
    reviews: number;
    oneOnOnes: number;
    developmentPlans: number;
  }> => {
    const userId = await getCurrentUserId();

    const [goalsRes, reviewsRes, oneOnOnesRes, plansRes] = await Promise.all([
      supabase.from('goals').select('id', { count: 'exact' }).eq('owner_id', userId),
      supabase.from('reviews').select('id', { count: 'exact' }).eq('reviewee_id', userId),
      supabase.from('one_on_ones').select('id', { count: 'exact' }).or(`manager_id.eq.${userId},employee_id.eq.${userId}`),
      supabase.from('development_plans').select('id', { count: 'exact' }).eq('user_id', userId),
    ]);

    return {
      goals: goalsRes.count || 0,
      reviews: reviewsRes.count || 0,
      oneOnOnes: oneOnOnesRes.count || 0,
      developmentPlans: plansRes.count || 0,
    };
  },
  downloadMyData: async (): Promise<Blob> => {
    // This needs an edge function
    const { data, error } = await supabase.functions.invoke('export-my-data');
    if (error) throw error;
    return new Blob([JSON.stringify(data)], { type: 'application/json' });
  },
  deleteAccount: async (confirmEmail: string): Promise<void> => {
    // This needs an edge function
    const { error } = await supabase.functions.invoke('delete-account', {
      body: { confirmEmail },
    });
    if (error) throw error;
  },
};

// Platform Admin API
export const platformAdmin = {
  getMetrics: async (): Promise<{
    totalOrganizations: number;
    activeOrganizations: number;
    totalUsers: number;
    activeUsers: number;
    newOrgsThisMonth: number;
    newUsersThisMonth: number;
  }> => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [orgsRes, activeOrgsRes, usersRes, activeUsersRes, newOrgsRes, newUsersRes] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact' }),
      supabase.from('organizations').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('users').select('id', { count: 'exact' }).eq('is_active', true),
      supabase.from('organizations').select('id', { count: 'exact' }).gte('created_at', startOfMonth.toISOString()),
      supabase.from('users').select('id', { count: 'exact' }).gte('created_at', startOfMonth.toISOString()),
    ]);

    return {
      totalOrganizations: orgsRes.count || 0,
      activeOrganizations: activeOrgsRes.count || 0,
      totalUsers: usersRes.count || 0,
      activeUsers: activeUsersRes.count || 0,
      newOrgsThisMonth: newOrgsRes.count || 0,
      newUsersThisMonth: newUsersRes.count || 0,
    };
  },

  getOrganizations: async (params?: {
    search?: string;
    status?: 'active' | 'inactive';
    page?: number;
    limit?: number;
  }): Promise<any> => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('organizations')
      .select('*', { count: 'exact' });

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }
    if (params?.status === 'active') {
      query = query.eq('is_active', true);
    } else if (params?.status === 'inactive') {
      query = query.eq('is_active', false);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch user counts for each org
    const orgsWithCounts = await Promise.all(
      (data || []).map(async (org) => {
        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        return {
          ...transformOrganization(org),
          userCount: userCount || 0,
        };
      })
    );

    return {
      organizations: orgsWithCounts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  getOrganization: async (id: string): Promise<any> => {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;

    const [usersRes, deptsRes, cyclesRes, goalsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('organization_id', id),
      supabase.from('departments').select('id', { count: 'exact' }).eq('organization_id', id),
      supabase.from('review_cycles').select('id', { count: 'exact' }).eq('organization_id', id),
      supabase.from('goals').select('id', { count: 'exact' }).eq('organization_id', id),
    ]);

    return {
      ...transformOrganization(data),
      stats: {
        users: usersRes.count || 0,
        departments: deptsRes.count || 0,
        reviewCycles: cyclesRes.count || 0,
        goals: goalsRes.count || 0,
      },
    };
  },

  getOrganizationStats: async (id: string): Promise<any> => {
    return platformAdmin.getOrganization(id);
  },

  getOrganizationUsers: async (id: string, params?: { page?: number; limit?: number }): Promise<any> => {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('organization_id', id)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: data?.map(transformUser) || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };
  },

  updateOrganizationStatus: async (id: string, isActive: boolean): Promise<any> => {
    const { data, error } = await supabase
      .from('organizations')
      .update({ is_active: isActive })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOrganization(data);
  },

  updateOrganization: async (id: string, updates: { name?: string; slug?: string }): Promise<any> => {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformOrganization(data);
  },
};

// Keep legacy exports for backwards compatibility
export const auth = {
  login: async (credentials: { email: string; password: string }) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) throw error;
    return data;
  },
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    const { data } = await supabase
      .from('users')
      .select('*, organizations(*)')
      .eq('id', user.id)
      .single();
    return transformUser(data);
  },
};

export const onboarding = {
  register: async (data: any) => {
    const { data: result, error } = await supabase.functions.invoke('create-organization', {
      body: data,
    });
    if (error) throw error;
    return result;
  },
};

// Goal Library API
function transformGoalLibraryItem(row: any): GoalLibraryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    category: row.category,
    isPlatformDefault: row.is_platform_default,
    createdBy: row.created_by,
    createdByName: row.creator?.name,
    updatedBy: row.updated_by,
    updatedByName: row.editor?.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function transformCompetencyLibraryItem(row: any): CompetencyLibraryItem {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    category: row.category,
    isPlatformDefault: row.is_platform_default,
    createdBy: row.created_by,
    createdByName: row.creator?.name,
    updatedBy: row.updated_by,
    updatedByName: row.editor?.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const goalLibrary = {
  getAll: async (): Promise<GoalLibraryItem[]> => {
    const { data, error } = await supabase
      .from('goal_library')
      .select('*, creator:created_by(name), editor:updated_by(name)')
      .order('category')
      .order('title');
    if (error) throw error;
    return (data || []).map(transformGoalLibraryItem);
  },

  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('goal_library')
      .select('category')
      .not('category', 'is', null);
    if (error) throw error;
    const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
    return categories.sort();
  },

  create: async (item: Partial<GoalLibraryItem>): Promise<GoalLibraryItem> => {
    const userId = await getCurrentUserId();
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('goal_library')
      .insert({
        organization_id: user?.organization_id,
        title: item.title,
        description: item.description,
        category: item.category,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return transformGoalLibraryItem(data);
  },

  update: async (id: string, updates: Partial<GoalLibraryItem>): Promise<GoalLibraryItem> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('goal_library')
      .update({
        title: updates.title,
        description: updates.description,
        category: updates.category,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformGoalLibraryItem(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('goal_library')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export const competencyLibrary = {
  getAll: async (): Promise<CompetencyLibraryItem[]> => {
    const { data, error } = await supabase
      .from('competency_library')
      .select('*, creator:created_by(name), editor:updated_by(name)')
      .order('category')
      .order('name');
    if (error) throw error;
    return (data || []).map(transformCompetencyLibraryItem);
  },

  getCategories: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('competency_library')
      .select('category')
      .not('category', 'is', null);
    if (error) throw error;
    const categories = [...new Set((data || []).map(d => d.category).filter(Boolean))];
    return categories.sort();
  },

  create: async (item: Partial<CompetencyLibraryItem>): Promise<CompetencyLibraryItem> => {
    const userId = await getCurrentUserId();
    const { data: user } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', userId)
      .single();

    const { data, error } = await supabase
      .from('competency_library')
      .insert({
        organization_id: user?.organization_id,
        name: item.name,
        description: item.description,
        category: item.category,
        created_by: userId,
      })
      .select()
      .single();
    if (error) throw error;
    return transformCompetencyLibraryItem(data);
  },

  update: async (id: string, updates: Partial<CompetencyLibraryItem>): Promise<CompetencyLibraryItem> => {
    const userId = await getCurrentUserId();
    const { data, error } = await supabase
      .from('competency_library')
      .update({
        name: updates.name,
        description: updates.description,
        category: updates.category,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformCompetencyLibraryItem(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('competency_library')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

export default supabase;
