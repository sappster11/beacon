import { google, calendar_v3 } from 'googleapis';
import { prisma } from '../lib/db';
import { decrypt, encrypt } from '../lib/crypto';

interface CalendarEventParams {
  userId: string;
  meetingId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  attendees: string[]; // Email addresses
  description?: string;
}

class GoogleCalendarService {
  /**
   * Gets an authenticated OAuth2 client for a user
   */
  private async getAuthClient(userId: string) {
    // Retrieve stored OAuth token
    const tokenRecord = await prisma.userOAuthToken.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    if (!tokenRecord) {
      throw new Error('Google Calendar not connected');
    }

    // Decrypt tokens
    const accessToken = decrypt(tokenRecord.accessToken);
    const refreshToken = tokenRecord.refreshToken
      ? decrypt(tokenRecord.refreshToken)
      : null;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken || undefined,
      token_type: tokenRecord.tokenType,
      expiry_date: tokenRecord.expiresAt?.getTime(),
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (tokens) => {
      if (tokens.access_token) {
        const encryptedAccessToken = encrypt(tokens.access_token);

        const updateData: any = {
          accessToken: encryptedAccessToken,
          tokenType: tokens.token_type || 'Bearer',
        };

        if (tokens.refresh_token) {
          updateData.refreshToken = encrypt(tokens.refresh_token);
        }

        if (tokens.expiry_date) {
          updateData.expiresAt = new Date(tokens.expiry_date);
        }

        await prisma.userOAuthToken.update({
          where: {
            userId_provider: {
              userId,
              provider: 'google',
            },
          },
          data: updateData,
        });
      }
    });

    return oauth2Client;
  }

  /**
   * Fetches upcoming calendar events
   */
  async getUpcomingEvents(userId: string, maxResults: number = 50): Promise<any[]> {
    try {
      const auth = await this.getAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true, // Expand recurring events
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      throw error;
    }
  }

  /**
   * Creates a calendar event and syncs with OneOnOne
   */
  async createEvent(params: CalendarEventParams): Promise<string> {
    const { userId, meetingId, title, startTime, endTime, attendees, description } = params;

    try {
      const auth = await this.getAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      // Create calendar event
      const event: calendar_v3.Schema$Event = {
        summary: title,
        description: description || `One-on-One Meeting\n\nView in Beacon: ${process.env.FRONTEND_URL}/one-on-ones`,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: 'America/New_York', // TODO: Make this configurable per user
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'America/New_York',
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 10 }, // 10 minutes before
          ],
        },
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        sendUpdates: 'all', // Send email notifications to attendees
      });

      const eventId = response.data.id;
      const eventUrl = response.data.htmlLink;

      if (!eventId) {
        throw new Error('Failed to create calendar event');
      }

      // Update OneOnOne with event details
      await prisma.oneOnOne.update({
        where: { id: meetingId },
        data: {
          googleEventId: eventId,
          googleEventUrl: eventUrl || undefined,
          googleCalendarSynced: true,
          lastSyncedAt: new Date(),
        },
      });

      return eventId;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw error;
    }
  }

  /**
   * Updates an existing calendar event
   */
  async updateEvent(
    userId: string,
    eventId: string,
    updates: {
      title?: string;
      startTime?: Date;
      endTime?: Date;
      description?: string;
    }
  ): Promise<void> {
    try {
      const auth = await this.getAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      const event: calendar_v3.Schema$Event = {};

      if (updates.title) {
        event.summary = updates.title;
      }

      if (updates.description) {
        event.description = updates.description;
      }

      if (updates.startTime) {
        event.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: 'America/New_York',
        };
      }

      if (updates.endTime) {
        event.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: 'America/New_York',
        };
      }

      await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: event,
        sendUpdates: 'all', // Notify attendees of changes
      });

      // Update lastSyncedAt in database
      await prisma.oneOnOne.updateMany({
        where: { googleEventId: eventId },
        data: { lastSyncedAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      throw error;
    }
  }

  /**
   * Deletes a calendar event
   */
  async deleteEvent(userId: string, eventId: string): Promise<void> {
    try {
      const auth = await this.getAuthClient(userId);
      const calendar = google.calendar({ version: 'v3', auth });

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all', // Notify attendees of cancellation
      });
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      throw error;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
