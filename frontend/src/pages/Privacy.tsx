import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
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
            Privacy Policy
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
          <Section title="1. Introduction">
            <p>
              Homestead Studio ("Company", "we", "us", or "our") operates the Beacon performance management
              platform ("Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard
              your information when you use our Service.
            </p>
            <p>
              Please read this policy carefully. By using the Service, you agree to the collection and use
              of information in accordance with this policy.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginTop: '16px', marginBottom: '8px' }}>
              Personal Information
            </h3>
            <p>When you register for an account, we collect:</p>
            <ul>
              <li>Name and email address</li>
              <li>Job title and department</li>
              <li>Organization information</li>
              <li>Profile photo (optional)</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginTop: '16px', marginBottom: '8px' }}>
              Usage Data
            </h3>
            <p>We automatically collect:</p>
            <ul>
              <li>Device and browser information</li>
              <li>IP address and general location</li>
              <li>Pages visited and features used</li>
              <li>Date and time of access</li>
            </ul>

            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#374151', marginTop: '16px', marginBottom: '8px' }}>
              Performance Data
            </h3>
            <p>Through normal use of the Service, we store:</p>
            <ul>
              <li>Performance reviews and feedback</li>
              <li>Goals and objectives</li>
              <li>One-on-one meeting notes</li>
              <li>Comments and acknowledgments</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and maintain the Service</li>
              <li>Process your account registration</li>
              <li>Send you service-related communications</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Monitor and analyze usage patterns</li>
              <li>Detect and prevent security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. Data Sharing and Disclosure">
            <p>We may share your information in the following circumstances:</p>
            <ul>
              <li><strong>Within your organization:</strong> Your employer/organization administrators
                can access your performance data as part of normal HR operations.</li>
              <li><strong>Service providers:</strong> We use third-party services for hosting, email,
                analytics, and error tracking that may process your data on our behalf.</li>
              <li><strong>Legal requirements:</strong> We may disclose information if required by law
                or in response to valid legal requests.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale
                of assets, your information may be transferred.</li>
            </ul>
            <p>
              We do not sell your personal information to third parties.
            </p>
          </Section>

          <Section title="5. Data Retention">
            <p>
              We retain your personal information for as long as your account is active or as needed
              to provide the Service. Performance data is retained according to your organization's
              policies and applicable employment laws.
            </p>
            <p>
              Upon account termination, you may request deletion of your data. Some information may
              be retained for legal compliance purposes.
            </p>
          </Section>

          <Section title="6. Data Security">
            <p>
              We implement appropriate technical and organizational measures to protect your information,
              including:
            </p>
            <ul>
              <li>Encryption of data in transit (TLS/SSL)</li>
              <li>Secure password hashing</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
              <li>Audit logging of sensitive operations</li>
            </ul>
            <p>
              However, no method of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </Section>

          <Section title="7. Your Rights">
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your data</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
            </ul>
            <p>
              To exercise these rights, please contact us at the address below.
            </p>
          </Section>

          <Section title="8. Cookies and Tracking">
            <p>
              We use cookies and similar technologies to enhance your experience. These include:
            </p>
            <ul>
              <li><strong>Essential cookies:</strong> Required for the Service to function (authentication, security)</li>
              <li><strong>Analytics cookies:</strong> Help us understand how you use the Service</li>
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
            </ul>
            <p>
              You can control cookies through your browser settings, though disabling certain cookies
              may affect Service functionality.
            </p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>
              Your information may be transferred to and processed in countries other than your own.
              We ensure appropriate safeguards are in place for such transfers, including standard
              contractual clauses where applicable.
            </p>
          </Section>

          <Section title="10. Children's Privacy">
            <p>
              The Service is not intended for individuals under 16 years of age. We do not knowingly
              collect personal information from children. If you believe we have collected information
              from a child, please contact us immediately.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
            <p>
              Your continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about this Privacy Policy or wish to exercise your rights,
              please contact us at:
            </p>
            <p>
              <strong>Email:</strong> privacy@beacon.homesteadstudio.dev<br />
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
          <Link to="/terms" style={{ color: '#667eea', textDecoration: 'none' }}>Terms of Service</Link>
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
