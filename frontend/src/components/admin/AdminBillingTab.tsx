import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import { settings as settingsApi } from '../../lib/api';
import { CreditCard, Check, ExternalLink, AlertCircle, Mail, Save } from 'lucide-react';

const MONTHLY_PRICE_ID = 'price_1SjRAACwCNHtAVIQ9mD1IPEC';
const YEARLY_PRICE_ID = 'price_1SjRAACwCNHtAVIQVacO8Dbm';
const PRICE_PER_SEAT_MONTHLY = 7;
const PRICE_PER_SEAT_YEARLY = 60;

const FEATURES = [
  'Performance reviews',
  'Goal tracking',
  '1:1 meetings',
  'Development plans',
  'Email support',
];

export default function AdminBillingTab() {
  const { organization } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [userCount, setUserCount] = useState(1);
  const [subscribing, setSubscribing] = useState(false);
  const [managingBilling, setManagingBilling] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [billingEmail, setBillingEmail] = useState('');

  useEffect(() => {
    if (organization) {
      loadSubscriptionDetails();
      loadUserCount();
      loadBillingEmail();
    }
  }, [organization]);

  const loadBillingEmail = async () => {
    try {
      const allSettings = await settingsApi.getAll();
      if ((allSettings as any).billing?.billingEmail) {
        setBillingEmail((allSettings as any).billing.billingEmail);
      }
    } catch (err) {
      console.error('Failed to load billing email:', err);
    }
  };

  const saveBillingEmail = async () => {
    try {
      setSavingEmail(true);
      await settingsApi.update('billing', { billingEmail });
      alert('Billing email saved!');
    } catch (err: any) {
      setError(err.message || 'Failed to save billing email');
    } finally {
      setSavingEmail(false);
    }
  };

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

  const loadUserCount = async () => {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization?.id);

      if (error) throw error;
      setUserCount(count || 1);
    } catch (err) {
      console.error('Failed to load user count:', err);
    }
  };

  const handleSubscribe = async () => {
    if (subscribing) return;

    setSubscribing(true);
    setError(null);

    const priceId = isYearly ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          quantity: userCount,
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
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout');
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageBilling = async () => {
    if (managingBilling) return;

    setManagingBilling(true);
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
      setManagingBilling(false);
    }
  };

  const currentTier = subscriptionDetails?.subscription_tier || 'free';
  const subscriptionStatus = subscriptionDetails?.subscription_status || 'inactive';
  const hasActiveSubscription = subscriptionStatus === 'active' && currentTier !== 'free';

  const pricePerSeat = isYearly ? PRICE_PER_SEAT_YEARLY : PRICE_PER_SEAT_MONTHLY;
  const totalPrice = pricePerSeat * userCount;
  const monthlyEquivalent = isYearly ? (PRICE_PER_SEAT_YEARLY / 12) : PRICE_PER_SEAT_MONTHLY;
  const savings = isYearly ? (PRICE_PER_SEAT_MONTHLY * 12 - PRICE_PER_SEAT_YEARLY) * userCount : 0;

  const getStatusBadge = () => {
    const styles: Record<string, { bg: string; color: string; text: string }> = {
      active: { bg: '#dcfce7', color: '#166534', text: 'Active' },
      trialing: { bg: '#dbeafe', color: '#1e40af', text: 'Trial' },
      past_due: { bg: '#fef3c7', color: '#92400e', text: 'Past Due' },
      canceled: { bg: '#fee2e2', color: '#991b1b', text: 'Canceled' },
      inactive: { bg: '#f3f4f6', color: 'var(--text-muted)', text: 'Free' },
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
    <div style={{ maxWidth: '600px' }}>
      {/* Current Plan Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <CreditCard size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Current Plan
          </h3>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {currentTier.charAt(0).toUpperCase() + currentTier.slice(1)}
              </span>
              {getStatusBadge()}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              {currentTier === 'free'
                ? `You have ${userCount} user${userCount !== 1 ? 's' : ''} in your organization`
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
              disabled={managingBilling}
              style={{
                padding: '10px 20px',
                background: 'var(--bg-primary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: managingBilling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: managingBilling ? 0.7 : 1,
              }}
            >
              <ExternalLink size={16} />
              {managingBilling ? 'Loading...' : 'Manage Billing'}
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

      {/* Billing Email Section */}
      <div
        style={{
          background: 'var(--bg-primary)',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Mail size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Billing Contact
          </h3>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Billing Email
          </label>
          <input
            type="email"
            placeholder="billing@company.com"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
            Invoices and billing notifications will be sent to this email
          </p>
        </div>

        <button
          onClick={saveBillingEmail}
          disabled={savingEmail}
          style={{
            padding: '10px 20px',
            background: savingEmail ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: savingEmail ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {savingEmail ? 'Saving...' : 'Save'}
        </button>
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

      {/* Pricing Section */}
      {!hasActiveSubscription && (
        <div
          style={{
            background: 'var(--bg-primary)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '24px',
          }}
        >
          {/* Billing Toggle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '4px',
                background: 'var(--bg-hover)',
                borderRadius: '8px',
              }}
            >
              <button
                onClick={() => setIsYearly(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: !isYearly ? 'white' : 'transparent',
                  color: !isYearly ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: !isYearly ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  background: isYearly ? 'white' : 'transparent',
                  color: isYearly ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isYearly ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Yearly
                <span
                  style={{
                    padding: '2px 6px',
                    background: '#dcfce7',
                    color: '#166534',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  Save 29%
                </span>
              </button>
            </div>
          </div>

          {/* Price Display */}
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ${monthlyEquivalent.toFixed(0)}
              </span>
              <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>/seat/month</span>
            </div>
            {isYearly && (
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
                Billed annually at ${PRICE_PER_SEAT_YEARLY}/seat/year
              </p>
            )}
          </div>

          {/* Total */}
          <div
            style={{
              padding: '16px',
              background: '#f0fdf4',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#374151' }}>
                {userCount} user{userCount !== 1 ? 's' : ''} × ${pricePerSeat}/{isYearly ? 'year' : 'month'}
              </span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>
                ${totalPrice}/{isYearly ? 'year' : 'month'}
              </span>
            </div>
            {isYearly && savings > 0 && (
              <p style={{ fontSize: '13px', color: '#166534', marginTop: '8px', marginBottom: 0 }}>
                You save ${savings}/year compared to monthly billing
              </p>
            )}
          </div>

          {/* Features */}
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px 0' }}>
            {FEATURES.map((feature, idx) => (
              <li
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 0',
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                }}
              >
                <Check size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                {feature}
              </li>
            ))}
          </ul>

          {/* Subscribe Button */}
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            style={{
              width: '100%',
              padding: '14px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: subscribing ? 'not-allowed' : 'pointer',
              opacity: subscribing ? 0.7 : 1,
            }}
          >
            {subscribing ? 'Loading...' : `Subscribe for $${totalPrice}/${isYearly ? 'year' : 'month'}`}
          </button>

          <p
            style={{
              marginTop: '16px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
            }}
          >
            14-day free trial included. Cancel anytime.
          </p>
        </div>
      )}
    </div>
  );
}
