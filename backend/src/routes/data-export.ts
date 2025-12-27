import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { createAuditLog } from '../middleware/audit-logger';

const router = Router();

/**
 * Export all personal data (GDPR data portability)
 * GET /api/data-export/my-data
 */
router.get('/my-data', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Fetch all user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: true,
        manager: {
          select: { id: true, name: true, email: true }
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch goals
    const goals = await prisma.goal.findMany({
      where: { ownerId: userId },
    });

    // Fetch reviews where user is reviewee
    const reviewsAsReviewee = await prisma.review.findMany({
      where: { revieweeId: userId },
      include: {
        cycle: true,
        reviewer: { select: { id: true, name: true, email: true } },
        peerFeedback: {
          include: {
            giver: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Fetch reviews where user is reviewer
    const reviewsAsReviewer = await prisma.review.findMany({
      where: { reviewerId: userId },
      include: {
        cycle: true,
        reviewee: { select: { id: true, name: true, email: true } },
      },
    });

    // Fetch one-on-ones
    const oneOnOnes = await prisma.oneOnOne.findMany({
      where: {
        OR: [
          { employeeId: userId },
          { managerId: userId },
        ],
      },
      include: {
        documents: true,
        employee: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });

    // Fetch development plans
    const developmentPlans = await prisma.developmentPlan.findMany({
      where: { userId },
    });

    // Fetch peer feedback given
    const peerFeedbackGiven = await prisma.peerFeedback.findMany({
      where: { giverId: userId },
      include: {
        receiver: { select: { id: true, name: true } },
      },
    });

    // Remove sensitive fields
    const { password, ...userWithoutPassword } = user;

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: userWithoutPassword,
      goals,
      reviewsAsReviewee,
      reviewsAsReviewer,
      oneOnOnes,
      developmentPlans,
      peerFeedbackGiven,
    };

    // Log the export
    await createAuditLog({
      action: 'CREATE',
      userId,
      resourceType: 'DataExport',
      resourceId: userId,
      metadata: { type: 'personal_data_export' },
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="beacon-data-export-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * Request account deletion
 * POST /api/data-export/delete-account
 */
router.post('/delete-account', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orgId = req.user!.organizationId;
    const { confirmEmail } = req.body;

    // Verify email matches
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email.toLowerCase() !== confirmEmail?.toLowerCase()) {
      return res.status(400).json({ error: 'Email confirmation does not match' });
    }

    // Check if user is the only admin in their organization
    if (user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN') {
      const adminCount = await prisma.user.count({
        where: {
          organizationId: orgId,
          role: { in: ['SUPER_ADMIN', 'HR_ADMIN'] },
        },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Cannot delete the only admin account. Please assign another admin first.',
        });
      }
    }

    // Log the deletion request before deleting
    await createAuditLog({
      action: 'DELETE',
      userId,
      resourceType: 'User',
      resourceId: userId,
      metadata: { email: user.email, reason: 'user_requested_deletion' },
    });

    // Delete user data in order (respecting foreign key constraints)
    // Note: In production, you might want to anonymize instead of hard delete,
    // or schedule deletion for a grace period

    // Delete development plans
    await prisma.developmentPlan.deleteMany({
      where: { userId },
    });

    // Delete one-on-one documents for meetings where user is employee
    const employeeOneOnOnes = await prisma.oneOnOne.findMany({
      where: { employeeId: userId },
      select: { id: true },
    });
    for (const ooo of employeeOneOnOnes) {
      await prisma.oneOnOneDocument.deleteMany({
        where: { oneOnOneId: ooo.id },
      });
    }
    // Delete one-on-ones where user is employee
    await prisma.oneOnOne.deleteMany({
      where: { employeeId: userId },
    });

    // Delete peer feedback given by user
    await prisma.peerFeedback.deleteMany({
      where: { giverId: userId },
    });

    // Delete peer feedback received by user
    await prisma.peerFeedback.deleteMany({
      where: { receiverId: userId },
    });

    // Delete competency comments authored by user
    await prisma.competencyComment.deleteMany({
      where: { authorId: userId },
    });

    // Delete goal comments authored by user
    await prisma.goalComment.deleteMany({
      where: { authorId: userId },
    });

    // Delete reviews where user is reviewee (including their peer feedback)
    const reviewsAsReviewee = await prisma.review.findMany({
      where: { revieweeId: userId },
      select: { id: true },
    });
    for (const review of reviewsAsReviewee) {
      await prisma.peerFeedback.deleteMany({
        where: { reviewId: review.id },
      });
      await prisma.competencyComment.deleteMany({
        where: { reviewId: review.id },
      });
      await prisma.goalComment.deleteMany({
        where: { reviewId: review.id },
      });
    }
    await prisma.review.deleteMany({
      where: { revieweeId: userId },
    });

    // Delete goals
    await prisma.goal.deleteMany({
      where: { ownerId: userId },
    });

    // Delete OAuth tokens
    await prisma.userOAuthToken.deleteMany({
      where: { userId },
    });

    // Delete password reset tokens
    await prisma.passwordResetToken.deleteMany({
      where: { userId },
    });

    // Reassign direct reports to the user's manager (or null)
    await prisma.user.updateMany({
      where: { managerId: userId },
      data: { managerId: user.managerId || null },
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: userId },
    });

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * Get data export summary (preview before download)
 * GET /api/data-export/summary
 */
router.get('/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [goalsCount, reviewsCount, oneOnOnesCount, developmentPlansCount] = await Promise.all([
      prisma.goal.count({ where: { ownerId: userId } }),
      prisma.review.count({
        where: {
          OR: [{ revieweeId: userId }, { reviewerId: userId }],
        },
      }),
      prisma.oneOnOne.count({
        where: {
          OR: [{ employeeId: userId }, { managerId: userId }],
        },
      }),
      prisma.developmentPlan.count({ where: { userId } }),
    ]);

    res.json({
      goals: goalsCount,
      reviews: reviewsCount,
      oneOnOnes: oneOnOnesCount,
      developmentPlans: developmentPlansCount,
    });
  } catch (error) {
    console.error('Data export summary error:', error);
    res.status(500).json({ error: 'Failed to get data summary' });
  }
});

export default router;
