// Edge function to handle Stripe webhook events

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

serve(async (req) => {
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey || !webhookSecret) {
    console.error('Stripe not configured')
    return new Response('Stripe not configured', { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
  })

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Get organization by Stripe customer ID
        const { data: org, error: orgError } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (orgError || !org) {
          console.error('Organization not found for customer:', customerId)
          break
        }

        // Determine tier from price
        let tier = 'free'
        const priceId = subscription.items.data[0]?.price.id

        // Monthly: $7/mo, Yearly: $60/yr
        const monthlyPriceId = 'price_1SjRAACwCNHtAVIQ9mD1IPEC'
        const yearlyPriceId = 'price_1SjRAACwCNHtAVIQVacO8Dbm'

        if (priceId === monthlyPriceId) tier = 'monthly'
        else if (priceId === yearlyPriceId) tier = 'yearly'
        else tier = 'pro' // fallback for any other valid subscription

        // Map Stripe status to our status
        let status = 'inactive'
        switch (subscription.status) {
          case 'active':
            status = 'active'
            break
          case 'trialing':
            status = 'trialing'
            break
          case 'past_due':
            status = 'past_due'
            break
          case 'canceled':
          case 'unpaid':
            status = 'canceled'
            break
        }

        await supabaseAdmin
          .from('organizations')
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: status,
            subscription_tier: tier,
            updated_at: new Date().toISOString(),
          })
          .eq('id', org.id)

        console.log(`Updated org ${org.id}: status=${status}, tier=${tier}`)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (org) {
          await supabaseAdmin
            .from('organizations')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              stripe_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', org.id)

          console.log(`Subscription canceled for org ${org.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (org) {
          // Log payment failure - could trigger email notification
          await supabaseAdmin.from('audit_logs').insert({
            organization_id: org.id,
            user_id: null,
            action: 'PAYMENT_FAILED',
            entity_type: 'ORGANIZATION',
            entity_id: org.id,
            details: {
              invoice_id: invoice.id,
              amount_due: invoice.amount_due,
              attempt_count: invoice.attempt_count,
            },
          })

          console.log(`Payment failed for org ${org.id}`)
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: org } = await supabaseAdmin
          .from('organizations')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (org) {
          // Log successful payment
          await supabaseAdmin.from('audit_logs').insert({
            organization_id: org.id,
            user_id: null,
            action: 'PAYMENT_SUCCEEDED',
            entity_type: 'ORGANIZATION',
            entity_id: org.id,
            details: {
              invoice_id: invoice.id,
              amount_paid: invoice.amount_paid,
            },
          })

          console.log(`Payment succeeded for org ${org.id}`)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler error', { status: 500 })
  }
})
