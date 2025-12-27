import { Router } from 'express';
import { authenticateToken, requirePlatformAdmin, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { createAuditLog } from '../middleware/audit-logger';

const router = Router();

// All routes require platform admin authentication
router.use(authenticateToken, requirePlatformAdmin);

/**
 * Get platform-wide metrics
 * GET /api/platform-admin/metrics
 */
router.get('/metrics', async (req: AuthRequest, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      newOrgsThisMonth,
      newUsersThisMonth,
    ] = await Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.user.count({
        where: {
          lastLoginAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.organization.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: thirtyDaysAgo },
        },
      }),
    ]);

    res.json({
      totalOrganizations,
      activeOrganizations,
      totalUsers,
      activeUsers,
      newOrgsThisMonth,
      newUsersThisMonth,
    });
  } catch (error) {
    console.error('Platform metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

/**
 * List all organizations
 * GET /api/platform-admin/organizations
 */
router.get('/organizations', async (req: AuthRequest, res) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { slug: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prisma.organization.count({ where }),
    ]);

    res.json({
      organizations: organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        isActive: org.isActive,
        createdAt: org.createdAt,
        userCount: org._count.users,
      })),
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ error: 'Failed to fetch organizations' });
  }
});

/**
 * Get organization details
 * GET /api/platform-admin/organizations/:id
 */
router.get('/organizations/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            reviewCycles: true,
            goals: true,
          },
        },
      },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      logo: organization.logo,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
      stats: {
        users: organization._count.users,
        departments: organization._count.departments,
        reviewCycles: organization._count.reviewCycles,
        goals: organization._count.goals,
      },
    });
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to fetch organization' });
  }
});

/**
 * Get organization stats (detailed)
 * GET /api/platform-admin/organizations/:id/stats
 */
router.get('/organizations/:id/stats', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [
      totalUsers,
      activeUsers,
      totalReviews,
      completedReviews,
      totalGoals,
      activeGoals,
      totalOneOnOnes,
    ] = await Promise.all([
      prisma.user.count({ where: { organizationId: id } }),
      prisma.user.count({
        where: {
          organizationId: id,
          lastLoginAt: { gte: thirtyDaysAgo },
        },
      }),
      prisma.review.count({
        where: { reviewee: { organizationId: id } },
      }),
      prisma.review.count({
        where: {
          reviewee: { organizationId: id },
          status: 'COMPLETED',
        },
      }),
      prisma.goal.count({ where: { organizationId: id } }),
      prisma.goal.count({
        where: {
          organizationId: id,
          status: 'ACTIVE',
        },
      }),
      prisma.oneOnOne.count({
        where: { manager: { organizationId: id } },
      }),
    ]);

    res.json({
      organizationId: id,
      organizationName: organization.name,
      users: {
        total: totalUsers,
        activeLastMonth: activeUsers,
      },
      reviews: {
        total: totalReviews,
        completed: completedReviews,
      },
      goals: {
        total: totalGoals,
        active: activeGoals,
      },
      oneOnOnes: {
        total: totalOneOnOnes,
      },
    });
  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({ error: 'Failed to fetch organization stats' });
  }
});

/**
 * List users in an organization
 * GET /api/platform-admin/organizations/:id/users
 */
router.get('/organizations/:id/users', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId: id },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          title: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where: { organizationId: id } }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    console.error('List organization users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * Update organization status (activate/deactivate)
 * PATCH /api/platform-admin/organizations/:id/status
 */
router.patch('/organizations/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const updated = await prisma.organization.update({
      where: { id },
      data: { isActive },
    });

    // Audit log
    await createAuditLog({
      userId: req.user!.id,
      action: 'UPDATE',
      resourceType: 'Organization',
      resourceId: id,
      changes: {
        before: { isActive: organization.isActive },
        after: { isActive: updated.isActive },
      },
      metadata: { action: isActive ? 'activate' : 'deactivate' },
    });

    res.json({
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
    });
  } catch (error) {
    console.error('Update organization status error:', error);
    res.status(500).json({ error: 'Failed to update organization status' });
  }
});

export default router;
