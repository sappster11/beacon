// Edge function to invite a new user to an organization

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (inviterError || !inviter) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
        invited_by: user.id,
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

    // TODO: Send invitation email via Resend or similar service
    // For now, just log the invite link
    const inviteUrl = `${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/accept-invite?token=${token}`
    console.log(`Invitation created for ${email}: ${inviteUrl}`)

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
