import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { CreditCard, Check, ExternalLink, AlertCircle, Zap } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  features: string[];
  recommended?: boolean;
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID || '',
    features: [
      'Up to 25 users',
      'Performance reviews',
      'Goal tracking',
      '1:1 meetings',
      'Email support',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99,
    priceId: import.meta.env.VITE_STRIPE_PROFESSIONAL_PRICE_ID || '',
    features: [
      'Up to 100 users',
      'Everything in Starter',
      'Development plans',
      'Peer feedback',
      'Custom competencies',
      'Priority support',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 249,
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      'Unlimited users',
      'Everything in Professional',
      'SSO/SAML',
      'API access',
      'Custom integrations',
      'Dedicated success manager',
    ],
  },
];

export default function AdminBillingTab() {
  const { organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  useEffect(() => {
    if (organization) {
      loadSubscriptionDetails();
    }
  }, [organization]);

  const loadSubscriptionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('subscription_status, subscription_tier, stripe_customer_id, stripe_subscription_id')
        .eq('id', organization?.id)
        .single();

      if (error) throw error;
      setSubscriptionDetails(data);
    } catch (err) {
      console.error('Failed to load subscription:', err);
    }
  };

  const handleSubscribe = async (priceId: string) => {
    if (!priceId) {
      setError('Subscription pricing not configured. Please contact support.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          successUrl: `${window.location.origin}/admin?billing=success`,
          cancelUrl: `${window.location.origin}/admin?billing=canceled`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        body: {
          returnUrl: `${window.location.origin}/admin`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = subscriptionDetails?.subscription_tier || 'free';
  const subscriptionStatus = subscriptionDetails?.subscription_status || 'inactive';

  const getStatusBadge = () => {
    const styles: Record<string, { bg: string; color: string; text: string }> = {
      active: { bg: '#dcfce7', color: '#166534', text: 'Active' },
      trialing: { bg: '#dbeafe', color: '#1e40af', text: 'Trial' },
      past_due: { bg: '#fef3c7', color: '#92400e', text: 'Past Due' },
      canceled: { bg: '#fee2e2', color: '#991b1b', text: 'Canceled' },
      inactive: { bg: '#f3f4f6', color: '#6b7280', text: 'Free' },
    };

    const style = styles[subscriptionStatus] || styles.inactive;

    return (
      <span
        style={{
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '13px',
          fontWeight: '500',
          background: style.bg,
          color: style.color,
        }}
      >
        {style.text}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      {/* Current Plan Section */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <CreditCard size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Current Plan
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </span>
              {getStatusBadge()}
            </div>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              {currentTier === 'free'
                ? 'Upgrade to unlock more features and users'
                : subscriptionStatus === 'active'
                ? 'Your subscription is active and will renew automatically'
                : subscriptionStatus === 'trialing'
                ? 'Your trial is active. Subscribe to continue after trial ends.'
                : 'Please update your payment method'}
            </p>
          </div>

          {subscriptionDetails?.stripe_customer_id && (
            <button
              onClick={handleManageBilling}
              disabled={loading}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <ExternalLink size={16} />
              Manage Billing
            </button>
          )}
        </div>

        {subscriptionStatus === 'past_due' && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#fef3c7',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <AlertCircle size={20} style={{ color: '#92400e' }} />
            <span style={{ color: '#92400e', fontSize: '14px' }}>
              Your payment is past due. Please update your payment method to avoid service
              interruption.
            </span>
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            background: '#fee2e2',
            borderRadius: '8px',
            marginBottom: '24px',
            color: '#991b1b',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Pricing Plans */}
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          padding: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Zap size={20} style={{ color: '#8b5cf6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Available Plans
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: plan.recommended ? '2px solid #8b5cf6' : '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                position: 'relative',
                background: plan.recommended ? '#faf5ff' : 'white',
              }}
            >
              {plan.recommended && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    padding: '4px 12px',
                    background: '#8b5cf6',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: '9999px',
                  }}
                >
                  RECOMMENDED
                </span>
              )}

              <h4
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 8px 0',
                }}
              >
                {plan.name}
              </h4>

              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '36px', fontWeight: '700', color: '#111827' }}>
                  ${plan.price}
                </span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>/month</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 0',
                      color: '#374151',
                      fontSize: '14px',
                    }}
                  >
                    <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading || currentTier === plan.id}
                style={{
                  width: '100%',
                  padding: '12px',
                  background:
                    currentTier === plan.id
                      ? '#e5e7eb'
                      : plan.recommended
                      ? '#8b5cf6'
                      : '#3b82f6',
                  color: currentTier === plan.id ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading || currentTier === plan.id ? 'not-allowed' : 'pointer',
                }}
              >
                {currentTier === plan.id
                  ? 'Current Plan'
                  : loading
                  ? 'Loading...'
                  : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        <p
          style={{
            marginTop: '24px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '13px',
          }}
        >
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
