import { useState, useEffect } from 'react';
import { Save, Building2, Upload, Palette, CreditCard } from 'lucide-react';
import { settings as settingsApi } from '../../lib/api';

export default function AdminCompanyTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'Beacon',
    timezone: 'America/New_York',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    }
  });

  const [brandSettings, setBrandSettings] = useState({
    logo: '',
    primaryColor: '#3b82f6',
    secondaryColor: '#10b981',
    accentColor: '#8b5cf6',
    successColor: '#10b981',
    dangerColor: '#dc2626',
    warningColor: '#f59e0b'
  });

  const [billingInfo, setBillingInfo] = useState({
    billingEmail: '',
    paymentMethod: '',
    planType: 'professional',
    billingCycle: 'monthly'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const allSettings = await settingsApi.getAll();

      if (allSettings.company) setCompanyInfo(allSettings.company as typeof companyInfo);
      if (allSettings.branding) setBrandSettings(allSettings.branding as typeof brandSettings);
      if (allSettings.billing) setBillingInfo(allSettings.billing as typeof billingInfo);
      if ((allSettings.branding as any)?.logo) setLogoPreview((allSettings.branding as any).logo);
    } catch (error) {
      console.error('Failed to load company settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (category: string, settingsData: any) => {
    try {
      setSaving(category);
      await settingsApi.update(category, settingsData);
      alert('Settings saved successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to save settings');
    } finally {
      setSaving(null);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview the logo
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
      setBrandSettings({ ...brandSettings, logo: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading company settings...</div>;
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Company Information */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Building2 size={20} style={{ color: '#3b82f6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Company Information
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Company Name
            </label>
            <input
              type="text"
              value={companyInfo.companyName}
              onChange={(e) => setCompanyInfo({ ...companyInfo, companyName: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Timezone
            </label>
            <select
              value={companyInfo.timezone}
              onChange={(e) => setCompanyInfo({ ...companyInfo, timezone: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <optgroup label="North America">
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="America/Anchorage">Alaska Time (AKT)</option>
                <option value="Pacific/Honolulu">Hawaii Time (HT)</option>
                <option value="America/Toronto">Toronto</option>
                <option value="America/Vancouver">Vancouver</option>
                <option value="America/Mexico_City">Mexico City</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Europe/Berlin">Berlin (CET)</option>
                <option value="Europe/Rome">Rome (CET)</option>
                <option value="Europe/Madrid">Madrid (CET)</option>
                <option value="Europe/Amsterdam">Amsterdam (CET)</option>
                <option value="Europe/Brussels">Brussels (CET)</option>
                <option value="Europe/Vienna">Vienna (CET)</option>
                <option value="Europe/Stockholm">Stockholm (CET)</option>
                <option value="Europe/Dublin">Dublin (GMT)</option>
              </optgroup>
              <optgroup label="Asia">
                <option value="Asia/Tokyo">Tokyo (JST)</option>
                <option value="Asia/Shanghai">Shanghai (CST)</option>
                <option value="Asia/Hong_Kong">Hong Kong (HKT)</option>
                <option value="Asia/Singapore">Singapore (SGT)</option>
                <option value="Asia/Seoul">Seoul (KST)</option>
                <option value="Asia/Kolkata">Kolkata (IST)</option>
                <option value="Asia/Dubai">Dubai (GST)</option>
                <option value="Asia/Bangkok">Bangkok (ICT)</option>
              </optgroup>
              <optgroup label="Australia & Pacific">
                <option value="Australia/Sydney">Sydney (AEDT)</option>
                <option value="Australia/Melbourne">Melbourne (AEDT)</option>
                <option value="Australia/Brisbane">Brisbane (AEST)</option>
                <option value="Australia/Perth">Perth (AWST)</option>
                <option value="Pacific/Auckland">Auckland (NZDT)</option>
              </optgroup>
              <optgroup label="South America">
                <option value="America/Sao_Paulo">São Paulo (BRT)</option>
                <option value="America/Buenos_Aires">Buenos Aires (ART)</option>
                <option value="America/Santiago">Santiago (CLT)</option>
                <option value="America/Bogota">Bogotá (COT)</option>
              </optgroup>
              <optgroup label="Africa">
                <option value="Africa/Johannesburg">Johannesburg (SAST)</option>
                <option value="Africa/Cairo">Cairo (EET)</option>
                <option value="Africa/Lagos">Lagos (WAT)</option>
                <option value="Africa/Nairobi">Nairobi (EAT)</option>
              </optgroup>
              <optgroup label="Other">
                <option value="UTC">UTC</option>
              </optgroup>
            </select>
          </div>

          <div style={{ marginTop: '8px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', marginBottom: '12px' }}>
              Company Address
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Street Address"
                value={companyInfo.address.street}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  address: { ...companyInfo.address, street: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="City"
                  value={companyInfo.address.city}
                  onChange={(e) => setCompanyInfo({
                    ...companyInfo,
                    address: { ...companyInfo.address, city: e.target.value }
                  })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="State"
                  value={companyInfo.address.state}
                  onChange={(e) => setCompanyInfo({
                    ...companyInfo,
                    address: { ...companyInfo.address, state: e.target.value }
                  })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <input
                  type="text"
                  placeholder="ZIP"
                  value={companyInfo.address.zipCode}
                  onChange={(e) => setCompanyInfo({
                    ...companyInfo,
                    address: { ...companyInfo.address, zipCode: e.target.value }
                  })}
                  style={{
                    padding: '10px 12px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <input
                type="text"
                placeholder="Country"
                value={companyInfo.address.country}
                onChange={(e) => setCompanyInfo({
                  ...companyInfo,
                  address: { ...companyInfo.address, country: e.target.value }
                })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => saveSettings('company', companyInfo)}
          disabled={saving === 'company'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: saving === 'company' ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving === 'company' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {saving === 'company' ? 'Saving...' : 'Save Company Information'}
        </button>
      </div>

      {/* Brand Customization */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Palette size={20} style={{ color: '#8b5cf6' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Brand Customization
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Logo Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
              Company Logo
            </label>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {logoPreview && (
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  background: '#f9fafb'
                }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div style={{ flex: 1 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 20px',
                    background: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: '#374151'
                  }}
                >
                  <Upload size={16} />
                  Upload Logo
                </label>
                <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
                  Recommended: Square image, at least 200x200px, PNG or JPG
                </p>
              </div>
            </div>
          </div>

          {/* Color Pickers */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
              Brand Colors
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Primary Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Primary Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.primaryColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.primaryColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, primaryColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Secondary Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.secondaryColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.secondaryColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, secondaryColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Accent Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Accent Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.accentColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.accentColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Success Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Success Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.successColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, successColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.successColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, successColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Danger Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Danger Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.dangerColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, dangerColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.dangerColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, dangerColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              {/* Warning Color */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>
                  Warning Color
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={brandSettings.warningColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, warningColor: e.target.value })}
                    style={{
                      width: '50px',
                      height: '40px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  />
                  <input
                    type="text"
                    value={brandSettings.warningColor}
                    onChange={(e) => setBrandSettings({ ...brandSettings, warningColor: e.target.value })}
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => saveSettings('branding', brandSettings)}
          disabled={saving === 'branding'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: saving === 'branding' ? '#9ca3af' : '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving === 'branding' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {saving === 'branding' ? 'Saving...' : 'Save Brand Settings'}
        </button>
      </div>

      {/* Billing Information */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <CreditCard size={20} style={{ color: '#10b981' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Billing Information
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Billing Email
            </label>
            <input
              type="email"
              placeholder="billing@company.com"
              value={billingInfo.billingEmail}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingEmail: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Plan Type
            </label>
            <select
              value={billingInfo.planType}
              onChange={(e) => setBillingInfo({ ...billingInfo, planType: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>
              Billing Cycle
            </label>
            <select
              value={billingInfo.billingCycle}
              onChange={(e) => setBillingInfo({ ...billingInfo, billingCycle: e.target.value })}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          </div>

          <div style={{
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
              Payment method and detailed billing history will be available in a future update.
            </p>
          </div>
        </div>

        <button
          onClick={() => saveSettings('billing', billingInfo)}
          disabled={saving === 'billing'}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            background: saving === 'billing' ? '#9ca3af' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: saving === 'billing' ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Save size={16} />
          {saving === 'billing' ? 'Saving...' : 'Save Billing Information'}
        </button>
      </div>
    </div>
  );
}
