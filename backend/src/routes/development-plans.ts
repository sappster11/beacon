import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from "../types";
import { prisma } from '../lib/db';

const router = Router();

// Get development plan for current user
router.get('/my-plan', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const plan = await prisma.developmentPlan.findFirst({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, title: true } },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch development plan' });
  }
});

// Get development plan by user ID
router.get('/user/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.id;

    // Get user to check manager relationship
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Only user, their manager, or HR can view development plan
    const hasAccess =
      userId === currentUserId ||
      user.managerId === currentUserId ||
      req.user!.role === UserRole.HR_ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const plan = await prisma.developmentPlan.findFirst({
      where: { userId },
      include: {
        user: { select: { id: true, name: true, email: true, title: true } },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch development plan' });
  }
});

// Get development plan by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const plan = await prisma.developmentPlan.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, title: true } },
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    // Get user to check manager relationship
    const user = await prisma.user.findUnique({
      where: { id: plan.userId },
    });

    // Only user, their manager, or HR can view
    const hasAccess =
      plan.userId === userId ||
      user?.managerId === userId ||
      req.user!.role === UserRole.HR_ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch development plan' });
  }
});

// Create development plan
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { careerGoals, skillsToAdd, milestones } = req.body;
    const userId = req.body.userId || req.user!.id;

    // Only user or their manager can create plan
    if (userId !== req.user!.id) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (
        !user ||
        (user.managerId !== req.user!.id &&
          req.user!.role !== UserRole.HR_ADMIN &&
          req.user!.role !== UserRole.SUPER_ADMIN)
      ) {
        return res.status(403).json({ error: 'Cannot create plan for this user' });
      }
    }

    // Check if plan already exists
    const existing = await prisma.developmentPlan.findFirst({
      where: { userId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Development plan already exists for this user' });
    }

    const plan = await prisma.developmentPlan.create({
      data: {
        userId,
        careerGoals,
        skillsToAdd: JSON.stringify(skillsToAdd || []),
        milestones: JSON.stringify(milestones || []),
        progress: 0,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create development plan' });
  }
});

// Update development plan
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const plan = await prisma.developmentPlan.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    // Only user or their manager can update
    const hasAccess =
      plan.userId === userId ||
      plan.user.managerId === userId ||
      req.user!.role === UserRole.HR_ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Cannot update this plan' });
    }

    // Stringify arrays if provided
    if (updates.skillsToAdd) {
      updates.skillsToAdd = JSON.stringify(updates.skillsToAdd);
    }
    if (updates.milestones) {
      updates.milestones = JSON.stringify(updates.milestones);
    }

    const updated = await prisma.developmentPlan.update({
      where: { id },
      data: updates,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update development plan' });
  }
});

// Update progress
router.patch('/:id/progress', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;
    const userId = req.user!.id;

    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0-100' });
    }

    const plan = await prisma.developmentPlan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    // Only user or their manager can update progress
    const hasAccess =
      plan.userId === userId ||
      plan.user.managerId === userId ||
      req.user!.role === UserRole.HR_ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Cannot update this plan' });
    }

    const updated = await prisma.developmentPlan.update({
      where: { id },
      data: { progress },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Delete development plan
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const plan = await prisma.developmentPlan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!plan) {
      return res.status(404).json({ error: 'Development plan not found' });
    }

    // Only user, their manager, or HR can delete
    const hasAccess =
      plan.userId === userId ||
      plan.user.managerId === userId ||
      req.user!.role === UserRole.HR_ADMIN ||
      req.user!.role === UserRole.SUPER_ADMIN;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Cannot delete this plan' });
    }

    await prisma.developmentPlan.delete({ where: { id } });

    res.json({ message: 'Development plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete development plan' });
  }
});

export default router;
