interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div
      style={{
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '8px',
        padding: '0 32px',
      }}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: 'none',
            borderBottom: `2px solid ${activeTab === tab.id ? 'var(--color-primary)' : 'transparent'}`,
            marginBottom: '-1px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? '600' : '500',
            color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.color = 'var(--text-muted)';
            }
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
