import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { UserRole } from "../types";
import { prisma } from '../lib/db';
import { beforeStateFetcher } from '../middleware/before-state-fetcher';
import { auditLogger } from '../middleware/audit-logger';
import { sendInvitationEmail, sendWelcomeEmail } from '../services/email.service';

const router = Router();

// Helper to get organizationId with type safety (only for org-scoped routes)
const getOrgId = (req: AuthRequest): string => {
  if (!req.user?.organizationId) {
    throw new Error('Organization ID required for this operation');
  }
  return req.user.organizationId;
};

// Get all users (Managers and above can view)
router.get(
  '/',
  authenticateToken,
  requireRole([UserRole.MANAGER, UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const users = await prisma.user.findMany({
        where: { organizationId: getOrgId(req) },
        include: {
          department: true,
          manager: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Get user by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Users can view their own profile or their direct reports
    // HR/Admins can view anyone in their org
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: true,
        manager: true,
        directReports: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify user belongs to same organization
    if (user.organizationId !== getOrgId(req)) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get org chart
router.get('/org/chart', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Get all users with their reporting relationships (scoped to organization)
    const users = await prisma.user.findMany({
      where: { organizationId: getOrgId(req) },
      include: {
        directReports: {
          select: { id: true, name: true, title: true },
        },
        manager: {
          select: { id: true, name: true, title: true },
        },
        department: true,
      },
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch org chart' });
  }
});

// Get user's direct reports
router.get('/:id/reports', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const reports = await prisma.user.findMany({
      where: {
        managerId: id,
        organizationId: getOrgId(req),
      },
      include: {
        department: true,
      },
    });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Create user (HR Admin/Super Admin only)
router.post(
  '/',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  auditLogger,
  async (req: AuthRequest, res) => {
    try {
      const { email, name, title, role, managerId, departmentId, hireDate } = req.body;

      const user = await prisma.user.create({
        data: {
          email,
          name,
          title,
          role: role || UserRole.EMPLOYEE,
          managerId,
          departmentId,
          hireDate: hireDate ? new Date(hireDate) : null,
          organizationId: getOrgId(req),
        },
      });

      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

// Update user
router.patch(
  '/:id',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  beforeStateFetcher,
  auditLogger,
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verify user belongs to same organization
      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser || existingUser.organizationId !== getOrgId(req)) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent changing organizationId
      delete updates.organizationId;

      const user = await prisma.user.update({
        where: { id },
        data: updates,
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user' });
    }
  }
);

// Invite user (HR Admin/Super Admin only)
router.post(
  '/invite',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { email, name, role, departmentId, managerId, title } = req.body;

      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists' });
      }

      // Check for pending invitation
      const existingInvite = await prisma.invitation.findFirst({
        where: {
          email: normalizedEmail,
          status: 'PENDING',
          expiresAt: { gt: new Date() },
        },
      });

      if (existingInvite) {
        return res.status(400).json({ error: 'An invitation is already pending for this email' });
      }

      // Validate role (prevent escalation)
      const validRoles = ['EMPLOYEE', 'MANAGER', 'HR_ADMIN'];
      if (req.user!.role !== 'SUPER_ADMIN') {
        // Non-super admins can't create super admins or HR admins
        if (role === 'SUPER_ADMIN' || role === 'HR_ADMIN') {
          return res.status(403).json({ error: 'You cannot invite users with this role' });
        }
      }

      const inviteRole = validRoles.includes(role) || role === 'SUPER_ADMIN' ? role : 'EMPLOYEE';

      // Get inviter info and organization
      const inviter = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { organization: true },
      });

      if (!inviter || !inviter.organization) {
        return res.status(400).json({ error: 'Organization not found' });
      }

      // Generate secure invite token
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(inviteToken).digest('hex');

      // Create invitation (expires in 7 days)
      const invitation = await prisma.invitation.create({
        data: {
          token: hashedToken,
          email: normalizedEmail,
          name,
          role: inviteRole,
          title: title || null,
          departmentId: departmentId || null,
          managerId: managerId || null,
          organizationId: getOrgId(req),
          invitedById: req.user!.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // Send invitation email
      const emailResult = await sendInvitationEmail(
        normalizedEmail,
        inviteToken,
        inviter.name,
        inviter.organization.name
      );

      if (!emailResult.success) {
        console.error('Failed to send invitation email:', emailResult.error);
        // Still return success - invitation is created
      }

      res.status(201).json({
        message: 'Invitation sent successfully',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
          status: invitation.status,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (error) {
      console.error('Invite user error:', error);
      res.status(500).json({ error: 'Failed to send invitation' });
    }
  }
);

// Get pending invitations (HR Admin/Super Admin only)
router.get(
  '/invitations',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const invitations = await prisma.invitation.findMany({
        where: {
          organizationId: getOrgId(req),
        },
        include: {
          invitedBy: {
            select: { id: true, name: true, email: true },
          },
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(invitations);
    } catch (error) {
      console.error('Get invitations error:', error);
      res.status(500).json({ error: 'Failed to fetch invitations' });
    }
  }
);

// Resend invitation (HR Admin/Super Admin only)
router.post(
  '/invitations/:id/resend',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const invitation = await prisma.invitation.findUnique({
        where: { id },
        include: {
          organization: true,
          invitedBy: true,
        },
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (invitation.organizationId !== getOrgId(req)) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (invitation.status !== 'PENDING') {
        return res.status(400).json({ error: 'This invitation has already been accepted' });
      }

      // Generate new token
      const newToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(newToken).digest('hex');

      // Update invitation with new token and extended expiry
      await prisma.invitation.update({
        where: { id },
        data: {
          token: hashedToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Resend email
      const emailResult = await sendInvitationEmail(
        invitation.email,
        newToken,
        invitation.invitedBy.name,
        invitation.organization.name
      );

      if (!emailResult.success) {
        console.error('Failed to resend invitation email:', emailResult.error);
      }

      res.json({ message: 'Invitation resent successfully' });
    } catch (error) {
      console.error('Resend invitation error:', error);
      res.status(500).json({ error: 'Failed to resend invitation' });
    }
  }
);

// Cancel invitation (HR Admin/Super Admin only)
router.delete(
  '/invitations/:id',
  authenticateToken,
  requireRole([UserRole.HR_ADMIN, UserRole.SUPER_ADMIN]),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;

      const invitation = await prisma.invitation.findUnique({
        where: { id },
      });

      if (!invitation) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      if (invitation.organizationId !== getOrgId(req)) {
        return res.status(404).json({ error: 'Invitation not found' });
      }

      await prisma.invitation.delete({
        where: { id },
      });

      res.json({ message: 'Invitation cancelled' });
    } catch (error) {
      console.error('Cancel invitation error:', error);
      res.status(500).json({ error: 'Failed to cancel invitation' });
    }
  }
);

// Accept invitation (public endpoint - no auth required)
router.post('/accept-invite', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Strong password policy
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid invitation
    const invitation = await prisma.invitation.findUnique({
      where: { token: hashedToken },
      include: { organization: true },
    });

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invitation has expired. Please request a new one.' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ error: 'This invitation has already been used' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and mark invitation as accepted in a transaction
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invitation.email,
          name: invitation.name,
          password: hashedPassword,
          role: invitation.role,
          title: invitation.title,
          departmentId: invitation.departmentId,
          managerId: invitation.managerId,
          organizationId: invitation.organizationId,
          isActive: true,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      }),
    ]);

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name, invitation.organization.name);

    res.json({
      message: 'Account created successfully. You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
});

// Validate invitation token (public endpoint)
router.get('/validate-invite/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const invitation = await prisma.invitation.findUnique({
      where: { token: hashedToken },
      include: { organization: true },
    });

    if (!invitation) {
      return res.status(400).json({ valid: false, error: 'Invalid invitation' });
    }

    if (invitation.expiresAt < new Date()) {
      return res.status(400).json({ valid: false, error: 'This invitation has expired' });
    }

    if (invitation.status !== 'PENDING') {
      return res.status(400).json({ valid: false, error: 'This invitation has already been used' });
    }

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        name: invitation.name,
        organizationName: invitation.organization.name,
      },
    });
  } catch (error) {
    console.error('Validate invitation error:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate invitation' });
  }
});

export default router;
