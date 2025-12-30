// Edge function to invite a new user to an organization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InviteRequest {
  email: string
  name: string
  title?: string
  role: string
  departmentId?: string
  managerId?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the user from the auth header
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

    // Get user's organization and verify admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: inviter, error: inviterError } = await supabaseAdmin
      .from('users')
      .select('organization_id, role, name, organizations(name)')
      .eq('id', user.id)
      .single()

    if (inviterError || !inviter) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inviterName = inviter.name || 'Your administrator'
    const organizationName = (inviter.organizations as any)?.name || 'your organization'

    // Only admins can invite users
    if (!['SUPER_ADMIN', 'HR_ADMIN'].includes(inviter.role)) {
      return new Response(
        JSON.stringify({ error: 'Only administrators can invite users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { email, name, title, role, departmentId, managerId }: InviteRequest = await req.json()

    // Validate input
    if (!email || !name || !role) {
      return new Response(
        JSON.stringify({ error: 'Email, name, and role are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check for existing pending invitation
    const { data: existingInvitation } = await supabaseAdmin
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('organization_id', inviter.organization_id)
      .eq('status', 'PENDING')
      .single()

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: 'An invitation has already been sent to this email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate invite token
    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 day expiry

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseAdmin
      .from('invitations')
      .insert({
        organization_id: inviter.organization_id,
        email,
        name,
        title,
        role,
        department_id: departmentId || null,
        manager_id: managerId || null,
        invited_by_id: user.id,
        token,
        expires_at: expiresAt.toISOString(),
        status: 'PENDING',
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Invitation error:', inviteError)
      return new Response(
        JSON.stringify({ error: 'Failed to create invitation' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send invitation email via Resend
    const inviteUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invite?token=${token}`

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      const { error: emailError } = await resend.emails.send({
        from: 'Beacon <noreply@trybeacon.cc>',
        to: email,
        subject: `You're invited to join ${organizationName} on Beacon`,
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

            <h1 style="color: #1a202c; font-size: 24px; margin-bottom: 20px;">You're invited to Beacon!</h1>

            <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on Beacon, a performance management platform for continuous feedback, goal alignment, and development.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Accept Invitation</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">This invitation will expire in 7 days. If you weren't expecting this invitation, you can safely ignore this email.</p>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              Beacon • Performance Management
            </p>
          </body>
          </html>
        `,
      })
      if (emailError) {
        console.error('Failed to send invitation email:', emailError)
      } else {
        console.log(`Invitation email sent to ${email}`)
      }
    } else {
      console.log(`Invitation created for ${email}: ${inviteUrl} (no RESEND_API_KEY configured)`)
    }

    // Create audit log
    await supabaseAdmin.from('audit_logs').insert({
      organization_id: inviter.organization_id,
      user_id: user.id,
      action: 'USER_INVITED',
      entity_type: 'INVITATION',
      entity_id: invitation.id,
      details: {
        invited_email: email,
        invited_name: name,
        invited_role: role,
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          name: invitation.name,
          expiresAt: invitation.expires_at,
        },
        // Include invite URL for development/testing
        inviteUrl: Deno.env.get('ENVIRONMENT') === 'development' ? inviteUrl : undefined,
      }),
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
