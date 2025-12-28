// Edge function to create a new organization with admin user
// Handles: signup, Stripe customer creation, user profile creation

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateOrgRequest {
  organizationName: string
  adminName: string
  adminEmail: string
  adminPassword: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { organizationName, adminName, adminEmail, adminPassword }: CreateOrgRequest = await req.json()

    // Validate input
    if (!organizationName || !adminName || !adminEmail || !adminPassword) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (adminPassword.length < 8) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 8 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate slug from organization name
    const slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Check if slug already exists
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingOrg) {
      return new Response(
        JSON.stringify({ error: 'An organization with a similar name already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if email already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', adminEmail)
      .single()

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'A user with this email already exists' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm for now, can add email verification later
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: authError?.message || 'Failed to create user' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Create organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: organizationName,
        slug: slug,
        subscription_status: 'trialing',
        subscription_tier: 'free',
      })
      .select()
      .single()

    if (orgError || !org) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Org error:', orgError)
      return new Response(
        JSON.stringify({ error: orgError?.message || 'Failed to create organization' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Create user profile with SUPER_ADMIN role (org owner)
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        name: adminName,
        role: 'SUPER_ADMIN',
        organization_id: org.id,
      })

    if (profileError) {
      // Rollback: delete org and auth user
      await supabaseAdmin.from('organizations').delete().eq('id', org.id)
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: profileError.message || 'Failed to create user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 4. Create Stripe customer (if Stripe is configured)
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, {
          apiVersion: '2023-10-16',
          httpClient: Stripe.createFetchHttpClient(),
        })

        const customer = await stripe.customers.create({
          email: adminEmail,
          name: organizationName,
          metadata: {
            organization_id: org.id,
            organization_slug: slug,
          },
        })

        // Update organization with Stripe customer ID
        await supabaseAdmin
          .from('organizations')
          .update({ stripe_customer_id: customer.id })
          .eq('id', org.id)
      } catch (stripeError) {
        console.error('Stripe error (non-fatal):', stripeError)
        // Don't fail the whole operation if Stripe fails
      }
    }

    // 5. Create default system settings for the organization
    const defaultSettings = [
      {
        organization_id: org.id,
        category: 'review',
        settings: {
          defaultCycleType: 'QUARTERLY',
          competencies: [
            { name: 'Communication', description: 'Effectively shares information and ideas' },
            { name: 'Collaboration', description: 'Works well with others to achieve goals' },
            { name: 'Problem Solving', description: 'Identifies issues and develops solutions' },
            { name: 'Initiative', description: 'Takes proactive action without being asked' },
            { name: 'Adaptability', description: 'Adjusts effectively to changing conditions' },
          ],
          selfReflectionQuestions: [
            'What accomplishments are you most proud of this period?',
            'What challenges did you face and how did you overcome them?',
            'What areas would you like to develop?',
          ],
        },
      },
      {
        organization_id: org.id,
        category: 'notifications',
        settings: {
          emailNotifications: true,
          reviewReminders: true,
          goalReminders: true,
        },
      },
      {
        organization_id: org.id,
        category: 'features',
        settings: {
          goalsEnabled: true,
          oneOnOnesEnabled: true,
          developmentPlansEnabled: true,
          peerFeedbackEnabled: true,
        },
      },
    ]

    await supabaseAdmin.from('system_settings').insert(defaultSettings)

    return new Response(
      JSON.stringify({
        success: true,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
        },
        user: {
          id: authData.user.id,
          email: adminEmail,
          name: adminName,
        },
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
