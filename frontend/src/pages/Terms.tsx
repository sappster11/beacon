import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  const lastUpdated = 'December 27, 2024';

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'white',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '24px',
              opacity: 0.9,
            }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <h1 style={{
            color: 'white',
            fontSize: '36px',
            fontWeight: '700',
            margin: 0,
          }}>
            Terms of Service
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: '14px',
            marginTop: '12px',
          }}>
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '48px 20px',
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <Section title="1. Agreement to Terms">
            <p>
              By accessing or using Beacon ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p>
              Beacon is a performance management platform operated by Homestead Studio ("Company", "we", "us", or "our").
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Beacon provides a cloud-based platform for performance reviews, goal management, one-on-one meetings,
              and employee development tracking. The Service is designed for business use and requires an organizational account.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>
              To use the Service, you must create an account with accurate and complete information. You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p>
              Organization administrators are responsible for managing user access and permissions within their organization.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Upload malicious code or content</li>
              <li>Collect or harvest user information without consent</li>
              <li>Impersonate another person or entity</li>
            </ul>
          </Section>

          <Section title="5. Data and Privacy">
            <p>
              Your use of the Service is also governed by our <Link to="/privacy" style={{ color: '#667eea' }}>Privacy Policy</Link>,
              which describes how we collect, use, and protect your data.
            </p>
            <p>
              You retain ownership of all data you submit to the Service. By using the Service, you grant us a license
              to host, store, and process your data as necessary to provide the Service.
            </p>
          </Section>

          <Section title="6. Subscription and Billing">
            <p>
              Some features of the Service require a paid subscription. Subscription terms, including pricing and
              billing cycles, will be presented at the time of purchase.
            </p>
            <ul>
              <li>Subscriptions automatically renew unless cancelled</li>
              <li>Refunds are handled on a case-by-case basis</li>
              <li>We may change pricing with 30 days notice</li>
            </ul>
          </Section>

          <Section title="7. Termination">
            <p>
              We may terminate or suspend your access immediately, without prior notice, for any breach of these Terms.
            </p>
            <p>
              You may terminate your account at any time through the account settings. Upon termination,
              you may request an export of your data within 30 days.
            </p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, the Company shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages resulting from your use of the Service.
            </p>
            <p>
              Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              The Service is provided "as is" without warranties of any kind, either express or implied, including
              but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of any material changes
              via email or through the Service. Continued use of the Service after changes constitutes acceptance
              of the new Terms.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p>
              <strong>Email:</strong> legal@beacon.homesteadstudio.dev<br />
              <strong>Address:</strong> Homestead Studio, LLC
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          color: '#6b7280',
          fontSize: '14px',
        }}>
          <Link to="/privacy" style={{ color: '#667eea', textDecoration: 'none' }}>Privacy Policy</Link>
          {' | '}
          <Link to="/" style={{ color: '#667eea', textDecoration: 'none' }}>Home</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '32px' }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '16px',
      }}>
        {title}
      </h2>
      <div style={{
        fontSize: '15px',
        color: '#4b5563',
        lineHeight: '1.7',
      }}>
        {children}
      </div>
      <style>{`
        div ul {
          margin: 12px 0;
          padding-left: 24px;
        }
        div li {
          margin-bottom: 8px;
        }
        div p {
          margin: 0 0 12px 0;
        }
      `}</style>
    </div>
  );
}
