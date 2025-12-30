import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useSearchParams } from 'react-router-dom';
import AdminUsersTab from '../components/admin/AdminUsersTab';
import AdminDepartmentsTab from '../components/admin/AdminDepartmentsTab';
import AdminCompanyTab from '../components/admin/AdminCompanyTab';
import AdminSettingsTab from '../components/admin/AdminSettingsTab';
import AdminAuditLogsTab from '../components/admin/AdminAuditLogsTab';
import AdminBillingTab from '../components/admin/AdminBillingTab';

type TabType = 'users' | 'departments' | 'company' | 'billing' | 'settings' | 'audit-logs';

const validTabs: TabType[] = ['users', 'departments', 'company', 'billing', 'settings', 'audit-logs'];

export default function Admin() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const initialTab = validTabs.includes(tabParam as TabType) ? (tabParam as TabType) : 'users';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Sync with URL on mount
  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam as TabType)) {
      setActiveTab(tabParam as TabType);
    }
  }, [tabParam]);

  // Check if user has admin access
  const isAdmin = user?.role === 'HR_ADMIN' || user?.role === 'SUPER_ADMIN';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'users', label: 'Users' },
    { id: 'departments', label: 'Departments' },
    { id: 'company', label: 'Company' },
    { id: 'billing', label: 'Billing' },
    { id: 'settings', label: 'Settings' },
    { id: 'audit-logs', label: 'Audit Logs' }
  ];

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          System Administration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          Manage users, departments, company settings, and system configuration
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs-container" style={{ borderBottom: '1px solid #e5e7eb', marginBottom: '32px', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div className="admin-tabs" style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? '#3b82f6' : '#6b7280',
                fontWeight: activeTab === tab.id ? '600' : '400',
                fontSize: '14px',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s',
                position: 'relative',
                bottom: '-1px',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#111827';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'departments' && <AdminDepartmentsTab />}
        {activeTab === 'company' && <AdminCompanyTab />}
        {activeTab === 'billing' && <AdminBillingTab />}
        {activeTab === 'settings' && <AdminSettingsTab />}
        {activeTab === 'audit-logs' && <AdminAuditLogsTab />}
      </div>
    </div>
  );
}
