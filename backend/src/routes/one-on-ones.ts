import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/db';
import { transcriptUpload, deleteTranscriptFile, getFilenameFromUrl } from '../middleware/upload';
import { googleCalendarService } from '../services/google-calendar.service';
import path from 'path';

const router = Router();

// Get all 1:1s for current user (as manager or employee)
router.get('/my-meetings', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const meetings = await prisma.oneOnOne.findMany({
      where: {
        OR: [{ managerId: userId }, { employeeId: userId }],
      },
      include: {
        manager: { select: { id: true, name: true, email: true, title: true } },
        employee: { select: { id: true, name: true, email: true, title: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get upcoming 1:1s
router.get('/upcoming', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const meetings = await prisma.oneOnOne.findMany({
      where: {
        OR: [{ managerId: userId }, { employeeId: userId }],
        scheduledAt: { gte: now },
        status: 'scheduled',
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 10,
    });

    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch upcoming meetings' });
  }
});

// Get 1:1 by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({
      where: { id },
      include: {
        manager: { select: { id: true, name: true, email: true, title: true } },
        employee: { select: { id: true, name: true, email: true, title: true } },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only manager and employee can access
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Filter manager-only notes if user is employee
    if (meeting.employeeId === userId) {
      const response = {
        ...meeting,
        managerNotes: undefined, // Hide manager-only notes from employee
      };
      return res.json(response);
    }

    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Create 1:1 meeting
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { employeeId, scheduledAt, agenda, syncToCalendar } = req.body;
    const managerId = req.user!.id;

    // Get current user to check role
    const currentUser = await prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify manager-employee relationship
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Admins can create meetings with anyone, managers only with direct reports
    const isAdmin = currentUser.role === 'HR_ADMIN' || currentUser.role === 'SUPER_ADMIN';
    if (!isAdmin && employee.managerId !== managerId) {
      return res.status(403).json({ error: 'Can only create 1:1s with your direct reports' });
    }

    const meeting = await prisma.oneOnOne.create({
      data: {
        managerId,
        employeeId,
        scheduledAt: new Date(scheduledAt),
        agenda,
        status: 'scheduled',
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
    });

    // Optionally sync to Google Calendar
    if (syncToCalendar) {
      try {
        const startTime = new Date(scheduledAt);
        const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later

        await googleCalendarService.createEvent({
          userId: managerId,
          meetingId: meeting.id,
          title: `One-on-One: ${employee.name}`,
          startTime,
          endTime,
          attendees: [employee.email],
          description: agenda || 'One-on-One Meeting',
        });

        // Fetch updated meeting with calendar info
        const updatedMeeting = await prisma.oneOnOne.findUnique({
          where: { id: meeting.id },
          include: {
            manager: { select: { id: true, name: true, email: true } },
            employee: { select: { id: true, name: true, email: true } },
          },
        });

        return res.status(201).json(updatedMeeting);
      } catch (calendarError) {
        console.error('Failed to sync to calendar:', calendarError);
        // Return meeting even if calendar sync fails
        return res.status(201).json({
          ...meeting,
          calendarSyncError: 'Failed to sync to calendar',
        });
      }
    }

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Update 1:1 meeting
router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const updates = req.body;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only manager and employee can update
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only manager can update manager-only notes
    if (updates.managerNotes && meeting.managerId !== userId) {
      return res.status(403).json({ error: 'Only manager can update manager notes' });
    }

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt);
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: updates,
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
    });

    // Sync time changes to Google Calendar if event exists
    if (meeting.googleEventId && meeting.googleCalendarSynced && updates.scheduledAt) {
      try {
        const startTime = new Date(updates.scheduledAt);
        const endTime = new Date(startTime.getTime() + 30 * 60000);

        await googleCalendarService.updateEvent(meeting.managerId, meeting.googleEventId, {
          startTime,
          endTime,
        });
      } catch (calendarError) {
        console.error('Failed to sync time change to calendar:', calendarError);
        // Don't fail the request if calendar sync fails
      }
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update meeting' });
  }
});

// Update shared notes
router.patch('/:id/shared-notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { sharedNotes } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { sharedNotes },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shared notes' });
  }
});

// Update manager-only notes
router.patch('/:id/manager-notes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { managerNotes } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId) {
      return res.status(403).json({ error: 'Only manager can update manager notes' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { managerNotes },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update manager notes' });
  }
});

// Update action items
router.patch('/:id/action-items', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { actionItems } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // actionItems should be a JSON string
    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { actionItems },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update action items' });
  }
});

// Mark meeting as completed
router.patch('/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId) {
      return res.status(403).json({ error: 'Only manager can mark meeting as completed' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { status: 'completed' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete meeting' });
  }
});

// Cancel meeting
router.patch('/:id/cancel', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel meeting' });
  }
});

// Delete 1:1 meeting
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (meeting.managerId !== userId) {
      return res.status(403).json({ error: 'Only manager can delete meetings' });
    }

    // Delete calendar event if it exists
    if (meeting.googleEventId && meeting.googleCalendarSynced) {
      try {
        await googleCalendarService.deleteEvent(meeting.managerId, meeting.googleEventId);
      } catch (calendarError) {
        console.error('Failed to delete calendar event:', calendarError);
        // Continue with deletion even if calendar sync fails
      }
    }

    // Delete transcript file if it exists
    if (meeting.transcriptFileUrl) {
      const filename = getFilenameFromUrl(meeting.transcriptFileUrl);
      if (filename) {
        deleteTranscriptFile(filename);
      }
    }

    await prisma.oneOnOne.delete({ where: { id } });

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});

// Upload transcript file
router.post('/:id/transcript/upload', authenticateToken, transcriptUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only manager and employee can upload transcripts
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Delete old transcript file if it exists
    if (meeting.transcriptFileUrl) {
      const oldFilename = getFilenameFromUrl(meeting.transcriptFileUrl);
      if (oldFilename) {
        deleteTranscriptFile(oldFilename);
      }
    }

    // Update meeting with new transcript file URL
    const transcriptFileUrl = `/uploads/transcripts/${req.file.filename}`;

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { transcriptFileUrl },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Failed to upload transcript:', error);
    res.status(500).json({ error: 'Failed to upload transcript' });
  }
});

// Update transcript text (for pasted content)
router.patch('/:id/transcript', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only manager and employee can update transcript
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { transcript },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update transcript' });
  }
});

// Update document URL
router.patch('/:id/document-url', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { documentUrl } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Only manager and employee can update document URL
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.oneOnOne.update({
      where: { id },
      data: { documentUrl },
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update document URL' });
  }
});

// Link calendar event to create a new one-on-one
router.post('/link-calendar-event', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { googleEventId, googleEventUrl, employeeId, scheduledAt, title } = req.body;
    const managerId = req.user!.id;

    if (!googleEventId || !employeeId || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if this calendar event is already linked
    const existing = await prisma.oneOnOne.findFirst({
      where: { googleEventId },
    });

    if (existing) {
      return res.status(400).json({ error: 'This calendar event is already linked to a one-on-one' });
    }

    // Verify employee exists
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Create the one-on-one linked to the calendar event
    const meeting = await prisma.oneOnOne.create({
      data: {
        managerId,
        employeeId,
        scheduledAt: new Date(scheduledAt),
        agenda: title || '',
        googleEventId,
        googleEventUrl,
        googleCalendarSynced: true,
        lastSyncedAt: new Date(),
        status: 'scheduled',
      },
      include: {
        manager: { select: { id: true, name: true, email: true, title: true } },
        employee: { select: { id: true, name: true, email: true, title: true } },
      },
    });

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Failed to link calendar event:', error);
    res.status(500).json({ error: 'Failed to link calendar event' });
  }
});

// ===== DOCUMENT MANAGEMENT =====

// Get all documents for a meeting (including recurring docs)
router.get('/:id/documents', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check access
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get documents for this specific meeting
    const specificDocs = meeting.documents;

    // Get recurring documents from ANY past meeting between these two people
    const recurringDocs = await prisma.oneOnOneDocument.findMany({
      where: {
        isRecurring: true,
        managerId: meeting.managerId,
        employeeId: meeting.employeeId,
        NOT: {
          oneOnOneId: id, // Don't duplicate if it's already in specificDocs
        },
      },
    });

    // Combine and return
    const allDocs = [...specificDocs, ...recurringDocs];

    res.json(allDocs);
  } catch (error) {
    console.error('Failed to get documents:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
});

// Add a document to a meeting
router.post('/:id/documents', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, url, isRecurring } = req.body;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check access
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Create document
    const document = await prisma.oneOnOneDocument.create({
      data: {
        oneOnOneId: id,
        title,
        url,
        isRecurring: isRecurring || false,
        managerId: meeting.managerId,
        employeeId: meeting.employeeId,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Failed to add document:', error);
    res.status(500).json({ error: 'Failed to add document' });
  }
});

// Delete a document
router.delete('/:id/documents/:docId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, docId } = req.params;
    const userId = req.user!.id;

    const meeting = await prisma.oneOnOne.findUnique({ where: { id } });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check access
    if (meeting.managerId !== userId && meeting.employeeId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.oneOnOneDocument.delete({
      where: { id: docId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
