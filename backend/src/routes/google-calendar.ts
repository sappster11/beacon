import { Router, Response } from 'express';
import { google } from 'googleapis';
import { prisma } from '../lib/db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { encrypt, decrypt } from '../lib/crypto';

const router = Router();

// OAuth2 client configuration
function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * GET /api/calendar/connect
 * Initiates Google Calendar OAuth flow
 */
router.get('/connect', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const oauth2Client = getOAuth2Client();

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      prompt: 'consent', // Force consent screen to get refresh token
      state: req.user!.id, // Pass user ID in state
    });

    res.json({ authUrl });
  } catch (error) {
    console.error('Failed to generate auth URL:', error);
    res.status(500).json({ error: 'Failed to initiate calendar connection' });
  }
});

/**
 * GET /api/calendar/callback
 * Handles OAuth callback from Google
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state: userId } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).send('Missing authorization code');
    }

    if (!userId || typeof userId !== 'string') {
      return res.status(400).send('Missing user ID');
    }

    const oauth2Client = getOAuth2Client();

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      return res.status(500).send('Failed to obtain access token');
    }

    // Calculate expiration date
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : null;

    // Encrypt tokens before storing
    const encryptedAccessToken = encrypt(tokens.access_token);
    const encryptedRefreshToken = tokens.refresh_token
      ? encrypt(tokens.refresh_token)
      : null;

    // Store or update OAuth token in database
    await prisma.userOAuthToken.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
      update: {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt,
        scope: tokens.scope,
      },
      create: {
        userId,
        provider: 'google',
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        tokenType: tokens.token_type || 'Bearer',
        expiresAt,
        scope: tokens.scope,
      },
    });

    // Redirect back to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/one-on-ones?connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/one-on-ones?error=auth_failed`);
  }
});

/**
 * GET /api/calendar/status
 * Check if user has connected Google Calendar
 */
router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const token = await prisma.userOAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    res.json({ connected: !!token });
  } catch (error) {
    console.error('Failed to check calendar status:', error);
    res.status(500).json({ error: 'Failed to check calendar status' });
  }
});

/**
 * POST /api/calendar/disconnect
 * Remove stored Google Calendar tokens
 */
router.post('/disconnect', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    await prisma.userOAuthToken.deleteMany({
      where: {
        userId,
        provider: 'google',
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect calendar:', error);
    res.status(500).json({ error: 'Failed to disconnect calendar' });
  }
});

/**
 * GET /api/calendar/events
 * Fetch upcoming calendar events
 */
router.get('/events', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const maxResults = parseInt(req.query.maxResults as string) || 50;

    const { googleCalendarService } = await import('../services/google-calendar.service');
    const events = await googleCalendarService.getUpcomingEvents(userId, maxResults);

    res.json({ events });
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

export default router;
