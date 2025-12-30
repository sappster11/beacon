// Edge function to resend an invitation email

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Get current user info
    const { data: currentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role, name, organizations(name)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!['SUPER_ADMIN', 'HR_ADMIN'].includes(currentUser.role)) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can resend invitations' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { invitationId } = await req.json()

    if (!invitationId) {
      return new Response(
        JSON.stringify({ error: 'Invitation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('organization_id', currentUser.organization_id)
      .eq('status', 'PENDING')
      .single()

    if (inviteError || !invitation) {
      return new Response(
        JSON.stringify({ error: 'Invitation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update expiration date
    const newExpiresAt = new Date()
    newExpiresAt.setDate(newExpiresAt.getDate() + 7)

    await supabaseAdmin
      .from('invitations')
      .update({ expires_at: newExpiresAt.toISOString() })
      .eq('id', invitationId)

    // Send email
    const inviteUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invite?token=${invitation.token}`
    const inviterName = currentUser.name || 'Your administrator'
    const organizationName = (currentUser.organizations as any)?.name || 'your organization'

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Beacon <noreply@trybeacon.cc>',
        to: invitation.email,
        subject: `Reminder: You're invited to join ${organizationName} on Beacon`,
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

            <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">Reminder: You're invited to Beacon!</h1>

            <p>This is a reminder that ${inviterName} has invited you to join <strong>${organizationName}</strong> on Beacon, a performance management platform for continuous feedback, goal alignment, and development.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Beacon - Performance Management
            </p>
          </body>
          </html>
        `,
      })
      if (emailError) {
        console.error('Failed to send invitation email:', emailError)
        return new Response(
          JSON.stringify({ error: 'Failed to send email' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
