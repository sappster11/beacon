import { Router } from 'express';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from '../types';
import { prisma } from '../lib/db';

const router = Router();

// Get manager's to-do items
router.get('/todos', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const managerId = req.user!.id;

    // Get all direct reports
    const directReports = await prisma.user.findMany({
      where: { managerId },
      select: { id: true, name: true, title: true, email: true },
    });

    const directReportIds = directReports.map((r) => r.id);

    if (directReportIds.length === 0) {
      return res.json({
        reviewsDue: [],
        goalsToSet: [],
        pendingReviews: [],
      });
    }

    // Get active review cycle
    const activeCycle = await prisma.reviewCycle.findFirst({
      where: { status: 'active' },
    });

    let reviewsDue = [];
    let pendingReviews = [];

    if (activeCycle) {
      // Find reviews that need manager input
      const reviews = await prisma.review.findMany({
        where: {
          cycleId: activeCycle.id,
          reviewerId: managerId,
          status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        },
        include: {
          reviewee: { select: { id: true, name: true, title: true, email: true } },
          cycle: true,
        },
        orderBy: { updatedAt: 'asc' },
      });

      // Split into reviews due (have self-assessment) and pending (no self-assessment)
      for (const review of reviews) {
        const hasSelfRating = review.overallSelfRating !== null || review.selfAssessment !== null;
        if (hasSelfRating) {
          reviewsDue.push({
            ...review,
            type: 'review_due',
            dueDate: activeCycle.endDate,
            priority: 'high',
          });
        } else {
          pendingReviews.push({
            ...review,
            type: 'pending_review',
            waitingOn: 'employee_self_assessment',
          });
        }
      }
    }

    // Find team members without goals for current quarter
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const goalsToSet = [];
    for (const report of directReports) {
      const recentGoals = await prisma.goal.findMany({
        where: {
          ownerId: report.id,
          createdAt: { gte: threeMonthsAgo },
        },
      });

      if (recentGoals.length === 0) {
        goalsToSet.push({
          type: 'set_goals',
          employee: report,
          priority: 'medium',
          reason: 'No goals set this quarter',
        });
      }
    }

    res.json({
      reviewsDue,
      goalsToSet,
      pendingReviews,
      summary: {
        totalTodos: reviewsDue.length + goalsToSet.length,
        reviewsDueCount: reviewsDue.length,
        goalsToSetCount: goalsToSet.length,
        pendingReviewsCount: pendingReviews.length,
      },
    });
  } catch (error) {
    console.error('Error fetching manager todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// Get team activity feed
router.get('/team-activity', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const managerId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    // Get all direct reports
    const directReports = await prisma.user.findMany({
      where: { managerId },
      select: { id: true, name: true, title: true, email: true },
    });

    const directReportIds = directReports.map((r) => r.id);

    if (directReportIds.length === 0) {
      return res.json([]);
    }

    const activities = [];

    // Recent reviews (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentReviews = await prisma.review.findMany({
      where: {
        revieweeId: { in: directReportIds },
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        reviewee: { select: { id: true, name: true, title: true } },
        cycle: true,
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    for (const review of recentReviews) {
      activities.push({
        id: `review-${review.id}`,
        type: 'review',
        action: review.status === 'COMPLETED' ? 'completed' : 'updated',
        employee: review.reviewee,
        timestamp: review.updatedAt,
        details: {
          cycleName: review.cycle.name,
          status: review.status,
        },
      });
    }

    // Recent goals (last 30 days)
    const recentGoals = await prisma.goal.findMany({
      where: {
        ownerId: { in: directReportIds },
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        owner: { select: { id: true, name: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    for (const goal of recentGoals) {
      const isNew = new Date(goal.createdAt).getTime() === new Date(goal.updatedAt).getTime();
      activities.push({
        id: `goal-${goal.id}`,
        type: 'goal',
        action: isNew ? 'created' : 'updated',
        employee: goal.owner,
        timestamp: goal.updatedAt,
        details: {
          title: goal.title,
          status: goal.status,
          progress: goal.targetValue
            ? Math.round(((goal.currentValue || 0) / goal.targetValue) * 100)
            : 0,
        },
      });
    }

    // Recent 1:1s (last 30 days)
    const recentOneOnOnes = await prisma.oneOnOne.findMany({
      where: {
        employeeId: { in: directReportIds },
        updatedAt: { gte: thirtyDaysAgo },
      },
      include: {
        employee: { select: { id: true, name: true, title: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    for (const meeting of recentOneOnOnes) {
      const hasNotes = meeting.sharedNotes || meeting.managerNotes || meeting.actionItems;
      if (hasNotes) {
        activities.push({
          id: `oneonone-${meeting.id}`,
          type: 'one_on_one',
          action: 'notes_added',
          employee: meeting.employee,
          timestamp: meeting.updatedAt,
          details: {
            scheduledAt: meeting.scheduledAt,
            hasActionItems: !!meeting.actionItems,
          },
        });
      }
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedActivities = activities.slice(0, limit);

    res.json(limitedActivities);
  } catch (error) {
    console.error('Error fetching team activity:', error);
    res.status(500).json({ error: 'Failed to fetch team activity' });
  }
});

// Get team summary stats
router.get('/team-summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const managerId = req.user!.id;

    // Get all direct reports
    const directReports = await prisma.user.findMany({
      where: { managerId },
      select: { id: true, name: true, title: true },
    });

    const directReportIds = directReports.map((r) => r.id);

    const totalTeamMembers = directReports.length;

    if (totalTeamMembers === 0) {
      return res.json({
        totalTeamMembers: 0,
        activeGoals: 0,
        completedReviews: 0,
        upcomingOneOnOnes: 0,
      });
    }

    // Count active goals
    const activeGoals = await prisma.goal.count({
      where: {
        ownerId: { in: directReportIds },
        status: 'ACTIVE',
      },
    });

    // Count completed reviews this cycle
    const activeCycle = await prisma.reviewCycle.findFirst({
      where: { status: 'active' },
    });

    let completedReviews = 0;
    if (activeCycle) {
      completedReviews = await prisma.review.count({
        where: {
          cycleId: activeCycle.id,
          reviewerId: managerId,
          status: 'COMPLETED',
        },
      });
    }

    // Count upcoming 1:1s (next 14 days)
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const upcomingOneOnOnes = await prisma.oneOnOne.count({
      where: {
        employeeId: { in: directReportIds },
        scheduledAt: {
          gte: new Date(),
          lte: twoWeeksFromNow,
        },
        status: 'scheduled',
      },
    });

    res.json({
      totalTeamMembers,
      activeGoals,
      completedReviews,
      upcomingOneOnOnes,
    });
  } catch (error) {
    console.error('Error fetching team summary:', error);
    res.status(500).json({ error: 'Failed to fetch team summary' });
  }
});

export default router;
