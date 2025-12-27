import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/db';

// Extend Express Request type to include beforeState
declare global {
  namespace Express {
    interface Request {
      beforeState?: any;
    }
  }
}

export const beforeStateFetcher = async (req: Request, res: Response, next: NextFunction) => {
  // Only fetch for UPDATE/DELETE operations
  if (!['PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Extract resource type and ID from path
  // Matches patterns like: /api/users/:id, /api/admin/users/:id, /api/departments/:id
  const pathMatch = req.path.match(/\/api\/(?:admin\/)?(\w+)\/([^/]+)/);

  if (!pathMatch) {
    return next();
  }

  const [, resourceType, resourceId] = pathMatch;

  try {
    // Fetch current state based on resource type
    const resource = await fetchResource(resourceType, resourceId);
    if (resource) {
      req.beforeState = resource;
    }
  } catch (error) {
    // Continue even if fetch fails - don't block the request
    console.error(`Failed to fetch before state for ${resourceType}:${resourceId}`, error);
  }

  next();
};

async function fetchResource(resourceType: string, resourceId: string): Promise<any | null> {
  // Normalize resource type (handle both singular and plural forms)
  const normalizedType = resourceType.toLowerCase().replace(/s$/, '');

  try {
    switch (normalizedType) {
      case 'user':
        return await prisma.user.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            title: true,
            departmentId: true,
            managerId: true,
            isActive: true,
            hireDate: true
          }
        });

      case 'department':
        return await prisma.department.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            name: true,
            parentDepartmentId: true
          }
        });

      case 'review':
        return await prisma.review.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            revieweeId: true,
            reviewerId: true,
            cycleId: true,
            status: true,
            overallSelfRating: true,
            overallManagerRating: true
          }
        });

      case 'goal':
        return await prisma.goal.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            ownerId: true,
            title: true,
            description: true,
            status: true,
            currentValue: true,
            targetValue: true,
            dueDate: true
          }
        });

      case 'oneonone':
        return await prisma.oneOnOne.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            managerId: true,
            employeeId: true,
            scheduledAt: true,
            status: true
          }
        });

      case 'integration':
        return await prisma.integration.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            type: true,
            isConnected: true,
            syncStatus: true
          }
        });

      case 'systemsetting':
        return await prisma.systemSettings.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            category: true,
            settings: true
          }
        });

      case 'reviewcycle':
        return await prisma.reviewCycle.findUnique({
          where: { id: resourceId },
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            startDate: true,
            endDate: true
          }
        });

      default:
        console.warn(`Unknown resource type for before-state fetch: ${resourceType}`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching ${resourceType} with id ${resourceId}:`, error);
    return null;
  }
}
