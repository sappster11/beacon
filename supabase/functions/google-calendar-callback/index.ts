// Edge function to handle Google Calendar OAuth callback

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state') // This is the user ID
    const error = url.searchParams.get('error')

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://beacon.homesteadapps.net'

    // Handle error from Google
    if (error) {
      console.error('OAuth error from Google:', error)
      return Response.redirect(`${frontendUrl}/one-on-ones?error=auth_denied`, 302)
    }

    if (!code) {
      return Response.redirect(`${frontendUrl}/one-on-ones?error=missing_code`, 302)
    }

    if (!state) {
      return Response.redirect(`${frontendUrl}/one-on-ones?error=missing_state`, 302)
    }

    const userId = state

    // Get Google OAuth credentials
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
    const redirectUri = Deno.env.get('GOOGLE_REDIRECT_URI')

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('Missing Google OAuth configuration')
      return Response.redirect(`${frontendUrl}/one-on-ones?error=config_error`, 302)
    }

    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return Response.redirect(`${frontendUrl}/one-on-ones?error=token_exchange_failed`, 302)
    }

    const tokens = await tokenResponse.json()

    if (!tokens.access_token) {
      console.error('No access token in response:', tokens)
      return Response.redirect(`${frontendUrl}/one-on-ones?error=no_access_token`, 302)
    }

    // Calculate expiration date
    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null

    // Store tokens in database using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Upsert the OAuth token
    const { error: upsertError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .upsert({
        user_id: userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        token_type: tokens.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokens.scope || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      })

    if (upsertError) {
      console.error('Failed to store tokens:', upsertError)
      return Response.redirect(`${frontendUrl}/one-on-ones?error=storage_failed`, 302)
    }

    // Success - redirect to frontend
    return Response.redirect(`${frontendUrl}/one-on-ones?connected=true`, 302)
  } catch (error) {
    console.error('Unexpected error:', error)
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://beacon.homesteadapps.net'
    return Response.redirect(`${frontendUrl}/one-on-ones?error=unexpected`, 302)
  }
})
