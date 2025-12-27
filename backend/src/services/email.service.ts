import { Resend } from 'resend';

// Initialize Resend client (if API key is configured)
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const fromEmail = process.env.EMAIL_FROM || 'noreply@example.com';
const appName = 'Beacon';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName: string
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Email not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Reset your ${appName} password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; line-height: 50px; color: white; font-size: 24px; font-weight: bold;">B</div>
          </div>

          <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">Reset your password</h1>

          <p>Hi ${userName},</p>

          <p>We received a request to reset your ${appName} password. Click the button below to create a new password:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset Password</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ${appName} • Performance Management
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a user invitation email
 */
export async function sendInvitationEmail(
  to: string,
  inviteToken: string,
  inviterName: string,
  organizationName: string
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Email not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  const inviteUrl = `${frontendUrl}/accept-invite?token=${inviteToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `You're invited to join ${organizationName} on ${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; line-height: 50px; color: white; font-size: 24px; font-weight: bold;">B</div>
          </div>

          <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">You're invited to ${appName}!</h1>

          <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on ${appName}, a performance management platform for continuous feedback, goal alignment, and development.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Invitation</a>
          </div>

          <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.</p>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ${appName} • Performance Management
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Send a welcome email after user accepts invitation
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string,
  organizationName: string
): Promise<EmailResult> {
  if (!resend) {
    console.warn('Email not configured - RESEND_API_KEY not set');
    return { success: false, error: 'Email service not configured' };
  }

  const loginUrl = `${frontendUrl}/login`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject: `Welcome to ${appName}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="display: inline-block; width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; line-height: 50px; color: white; font-size: 24px; font-weight: bold;">B</div>
          </div>

          <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">Welcome to ${appName}!</h1>

          <p>Hi ${userName},</p>

          <p>Your account has been set up successfully. You're now part of <strong>${organizationName}</strong>.</p>

          <p>With ${appName}, you can:</p>
          <ul style="color: #4b5563;">
            <li>Track your goals and progress</li>
            <li>Participate in performance reviews</li>
            <li>Schedule and manage one-on-ones</li>
            <li>Give and receive feedback</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Go to ${appName}</a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            ${appName} • Performance Management
          </p>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}

/**
 * Check if email service is configured
 */
export function isEmailConfigured(): boolean {
  return !!resend;
}
