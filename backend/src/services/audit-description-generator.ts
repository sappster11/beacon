import { prisma } from '../lib/db';

interface AuditLogData {
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  resourceType: string;
  resourceId: string;
  changes?: { before?: any; after?: any };
  metadata?: any;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

export async function generateDescription(log: AuditLogData): Promise<string> {
  const { action, resourceType, resourceId, changes, userId, status, errorMessage } = log;

  // Fetch user name
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  const userName = user?.name || 'System';

  // Handle failed operations
  if (status === 'failed') {
    const shortId = resourceId.slice(0, 8);
    return `${userName} failed to ${action.toLowerCase()} ${resourceType} ${shortId}... (${errorMessage || 'Unknown error'})`;
  }

  // Resource-specific formatters
  switch (resourceType) {
    case 'User':
      return await formatUserDescription(userName, action, resourceId, changes);
    case 'Department':
      return await formatDepartmentDescription(userName, action, resourceId, changes);
    case 'Review':
      return await formatReviewDescription(userName, action, resourceId, changes);
    case 'SystemSettings':
      return await formatSystemSettingsDescription(userName, action, changes);
    case 'Integration':
      return await formatIntegrationDescription(userName, action, changes);
    case 'Goal':
      return await formatGoalDescription(userName, action, resourceId, changes);
    case 'OneOnOne':
      return await formatOneOnOneDescription(userName, action, resourceId, changes);
    default:
      const shortId = resourceId.slice(0, 8);
      return `${userName} ${action.toLowerCase()}d ${resourceType} ${shortId}...`;
  }
}

async function formatUserDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId: string,
  changes?: { before?: any; after?: any }
): Promise<string> {
  const targetUser = await prisma.user.findUnique({ where: { id: resourceId } });
  const targetName = targetUser?.name || resourceId.slice(0, 8) + '...';

  if (action === 'CREATE') {
    return `${userName} created user ${targetName}`;
  }

  if (action === 'DELETE') {
    return `${userName} deleted user ${targetName}`;
  }

  // UPDATE - detect what changed
  if (changes?.before && changes?.after) {
    const changedFields: string[] = [];

    if (changes.before.role !== changes.after.role) {
      changedFields.push(`role from ${changes.before.role} to ${changes.after.role}`);
    }

    if (changes.before.departmentId !== changes.after.departmentId) {
      const oldDept = changes.before.departmentId
        ? await prisma.department.findUnique({ where: { id: changes.before.departmentId } })
        : null;
      const newDept = changes.after.departmentId
        ? await prisma.department.findUnique({ where: { id: changes.after.departmentId } })
        : null;

      const oldDeptName = oldDept?.name || 'None';
      const newDeptName = newDept?.name || 'None';
      changedFields.push(`department from ${oldDeptName} to ${newDeptName}`);
    }

    if (changes.before.managerId !== changes.after.managerId) {
      const oldManager = changes.before.managerId
        ? await prisma.user.findUnique({ where: { id: changes.before.managerId } })
        : null;
      const newManager = changes.after.managerId
        ? await prisma.user.findUnique({ where: { id: changes.after.managerId } })
        : null;

      const oldManagerName = oldManager?.name || 'None';
      const newManagerName = newManager?.name || 'None';
      changedFields.push(`manager from ${oldManagerName} to ${newManagerName}`);
    }

    if (changes.before.isActive !== changes.after.isActive) {
      const status = changes.after.isActive ? 'activated' : 'deactivated';
      changedFields.push(status);
    }

    if (changedFields.length > 0) {
      return `${userName} updated ${targetName}'s ${changedFields.join(', ')}`;
    }
  }

  return `${userName} updated user ${targetName}`;
}

async function formatDepartmentDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId: string,
  changes?: { before?: any; after?: any }
): Promise<string> {
  const department = await prisma.department.findUnique({ where: { id: resourceId } });
  const deptName = department?.name || changes?.after?.name || resourceId.slice(0, 8) + '...';

  if (action === 'CREATE') {
    return `${userName} created department "${deptName}"`;
  }

  if (action === 'DELETE') {
    const deletedName = changes?.before?.name || deptName;
    return `${userName} deleted department "${deletedName}"`;
  }

  // UPDATE - detect what changed
  if (changes?.before && changes?.after) {
    const changedFields: string[] = [];

    if (changes.before.name !== changes.after.name) {
      changedFields.push(`name from "${changes.before.name}" to "${changes.after.name}"`);
    }

    if (changes.before.parentDepartmentId !== changes.after.parentDepartmentId) {
      const oldParent = changes.before.parentDepartmentId
        ? await prisma.department.findUnique({ where: { id: changes.before.parentDepartmentId } })
        : null;
      const newParent = changes.after.parentDepartmentId
        ? await prisma.department.findUnique({ where: { id: changes.after.parentDepartmentId } })
        : null;

      const oldParentName = oldParent?.name || 'None';
      const newParentName = newParent?.name || 'None';
      changedFields.push(`parent department from "${oldParentName}" to "${newParentName}"`);
    }

    if (changedFields.length > 0) {
      return `${userName} updated department "${deptName}": ${changedFields.join(', ')}`;
    }
  }

  return `${userName} updated department "${deptName}"`;
}

async function formatReviewDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId: string,
  changes?: { before?: any; after?: any }
): Promise<string> {
  const review = await prisma.review.findUnique({
    where: { id: resourceId },
    include: { reviewee: true, reviewer: true, cycle: true }
  });

  const revieweeName = review?.reviewee?.name || 'Unknown';
  const reviewerName = review?.reviewer?.name || 'Unknown';

  if (action === 'CREATE') {
    return `${userName} created review for ${revieweeName} by ${reviewerName}`;
  }

  if (action === 'DELETE') {
    return `${userName} deleted review for ${revieweeName}`;
  }

  // UPDATE - detect what changed
  if (changes?.before && changes?.after) {
    if (changes.before.status !== changes.after.status) {
      return `${userName} updated ${revieweeName}'s review status from ${changes.before.status} to ${changes.after.status}`;
    }

    if (changes.before.overallManagerRating !== changes.after.overallManagerRating) {
      return `${userName} updated ${revieweeName}'s manager rating to ${changes.after.overallManagerRating}`;
    }
  }

  return `${userName} updated review for ${revieweeName}`;
}

async function formatSystemSettingsDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  changes?: { before?: any; after?: any }
): Promise<string> {
  const category = changes?.after?.category || changes?.before?.category || 'system';

  if (action === 'CREATE') {
    return `${userName} created ${category} settings`;
  }

  if (action === 'DELETE') {
    return `${userName} deleted ${category} settings`;
  }

  return `${userName} updated ${category} settings`;
}

async function formatIntegrationDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  changes?: { before?: any; after?: any }
): Promise<string> {
  const integrationType = changes?.after?.type || changes?.before?.type || 'unknown';

  if (action === 'CREATE') {
    return `${userName} added ${integrationType} integration`;
  }

  if (action === 'DELETE') {
    return `${userName} removed ${integrationType} integration`;
  }

  // UPDATE - detect connection status change
  if (changes?.before && changes?.after) {
    if (changes.before.isConnected !== changes.after.isConnected) {
      const status = changes.after.isConnected ? 'connected' : 'disconnected';
      return `${userName} ${status} ${integrationType} integration`;
    }
  }

  return `${userName} updated ${integrationType} integration`;
}

async function formatGoalDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId: string,
  changes?: { before?: any; after?: any }
): Promise<string> {
  const goal = await prisma.goal.findUnique({
    where: { id: resourceId },
    include: { owner: true }
  });

  const goalTitle = goal?.title || changes?.after?.title || resourceId.slice(0, 8) + '...';
  const ownerName = goal?.owner?.name || 'Unknown';

  if (action === 'CREATE') {
    return `${userName} created goal "${goalTitle}" for ${ownerName}`;
  }

  if (action === 'DELETE') {
    const deletedTitle = changes?.before?.title || goalTitle;
    return `${userName} deleted goal "${deletedTitle}"`;
  }

  // UPDATE - detect what changed
  if (changes?.before && changes?.after) {
    if (changes.before.status !== changes.after.status) {
      return `${userName} updated goal "${goalTitle}" status from ${changes.before.status} to ${changes.after.status}`;
    }

    if (changes.before.currentValue !== changes.after.currentValue) {
      return `${userName} updated goal "${goalTitle}" progress to ${changes.after.currentValue}`;
    }
  }

  return `${userName} updated goal "${goalTitle}"`;
}

async function formatOneOnOneDescription(
  userName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  resourceId: string,
  changes?: { before?: any; after?: any }
): Promise<string> {
  const oneOnOne = await prisma.oneOnOne.findUnique({
    where: { id: resourceId },
    include: { manager: true, employee: true }
  });

  const managerName = oneOnOne?.manager?.name || changes?.after?.managerId || 'Unknown';
  const employeeName = oneOnOne?.employee?.name || changes?.after?.employeeId || 'Unknown';

  if (action === 'CREATE') {
    return `${userName} scheduled 1:1 between ${managerName} and ${employeeName}`;
  }

  if (action === 'DELETE') {
    return `${userName} deleted 1:1 between ${managerName} and ${employeeName}`;
  }

  // UPDATE - detect what changed
  if (changes?.before && changes?.after) {
    if (changes.before.status !== changes.after.status) {
      return `${userName} updated 1:1 status from ${changes.before.status} to ${changes.after.status}`;
    }
  }

  return `${userName} updated 1:1 between ${managerName} and ${employeeName}`;
}
