import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { users } from '../lib/api';
import type { User } from '../types';
import { Network, List, ChevronDown, ChevronRight, Users, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import Avatar from '../components/Avatar';

interface OrgNode {
  user: User;
  children: OrgNode[];
}

export default function OrgChart() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<User[]>([]);
  const [orgTree, setOrgTree] = useState<OrgNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('chart');
  const [chartStyle, setChartStyle] = useState<'classic' | 'modern'>('modern');
  const [zoom, setZoom] = useState(0.4);

  useEffect(() => {
    loadOrgChart();
  }, []);

  const loadOrgChart = async () => {
    try {
      setIsLoading(true);
      const data = await users.getOrgChart();
      setEmployees(data);

      // Build tree structure
      const tree = buildOrgTree(data);
      setOrgTree(tree);

      // Auto-expand all nodes
      const allIds = new Set(data.map(u => u.id));
      setExpandedNodes(allIds);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load org chart');
    } finally {
      setIsLoading(false);
    }
  };

  const buildOrgTree = (users: User[]): OrgNode[] => {
    const userMap = new Map<string, User>();
    users.forEach(u => userMap.set(u.id, u));

    // Find root users (no manager)
    const roots: OrgNode[] = [];
    const childrenMap = new Map<string, OrgNode[]>();

    users.forEach(user => {
      if (!user.managerId) {
        roots.push({ user, children: [] });
      }
    });

    // Build children map
    users.forEach(user => {
      if (user.managerId) {
        if (!childrenMap.has(user.managerId)) {
          childrenMap.set(user.managerId, []);
        }
        childrenMap.get(user.managerId)!.push({ user, children: [] });
      }
    });

    // Recursively attach children
    const attachChildren = (node: OrgNode) => {
      const children = childrenMap.get(node.user.id) || [];
      node.children = children;
      children.forEach(child => attachChildren(child));
    };

    roots.forEach(root => attachChildren(root));

    return roots;
  };

  const toggleNode = (userId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const getDepartmentColor = (departmentName?: string): string => {
    if (!departmentName) return '#6b7280';
    const colors: { [key: string]: string } = {
      'Engineering': '#3b82f6',
      'Product': '#8b5cf6',
      'Design': '#ec4899',
      'Marketing': '#f59e0b',
      'Sales': '#10b981',
      'HR': '#06b6d4',
      'Finance': '#14b8a6',
      'Operations': '#6366f1',
    };
    return colors[departmentName] || '#6b7280';
  };

  const renderNode = (node: OrgNode, level: number = 0): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.user.id);

    return (
      <div key={node.user.id} style={{ marginLeft: level > 0 ? '32px' : '0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            marginBottom: '8px',
            transition: 'all 0.15s',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
          onClick={() => hasChildren && toggleNode(node.user.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(59,130,246,0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {hasChildren && (
            <div style={{ flexShrink: 0 }}>
              {isExpanded ? <ChevronDown size={18} color="var(--text-muted)" /> : <ChevronRight size={18} color="var(--text-muted)" />}
            </div>
          )}
          {!hasChildren && <div style={{ width: '18px', flexShrink: 0 }} />}

          <Avatar
            user={node.user}
            size="md"
            backgroundColor={level === 0 ? '#8b5cf6' : level === 1 ? '#3b82f6' : '#10b981'}
          />

          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '2px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {node.user.name}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {node.user.title || 'No title'}
              {node.user.department && ` • ${node.user.department.name}`}
            </div>
          </div>

          {hasChildren && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-secondary)',
                flexShrink: 0,
              }}
            >
              {node.children.length} {node.children.length === 1 ? 'report' : 'reports'}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div style={{ marginTop: '8px', marginBottom: '16px' }}>
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderModernNode = (node: OrgNode, level: number = 0): JSX.Element => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.user.id);
    const deptColor = getDepartmentColor(node.user.department?.name);

    return (
      <div key={node.user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Card */}
        <div
          style={{
            position: 'relative',
            width: '260px',
            padding: '14px',
            background: 'var(--bg-primary)',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            marginBottom: '8px',
            transition: 'all 0.2s',
            cursor: hasChildren ? 'pointer' : 'default',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          }}
          onClick={() => hasChildren && toggleNode(node.user.id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = deptColor;
            e.currentTarget.style.boxShadow = `0 4px 12px ${deptColor}20`;
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e5e7eb';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* Top Badge - Department */}
          {node.user.department && (
            <div
              style={{
                position: 'absolute',
                top: '-10px',
                right: '12px',
                padding: '3px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                background: deptColor,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {node.user.department.name}
            </div>
          )}

          {/* Avatar and Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <Avatar
              user={node.user}
              size="lg"
              backgroundColor={deptColor}
              style={{ boxShadow: `0 4px 8px ${deptColor}30` }}
            />
            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '4px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {node.user.name}
              </div>
              <div style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {node.user.title || 'No title'}
              </div>
            </div>
          </div>

          {/* Team Size & Expand Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {hasChildren && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color={deptColor} />
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                  {node.children.length} Direct {node.children.length === 1 ? 'Report' : 'Reports'}
                </span>
              </div>
            )}
            {!hasChildren && <div />}

            {hasChildren && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', background: 'var(--bg-tertiary)' }}>
                {isExpanded ? (
                  <>
                    <ChevronDown size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>Collapse</span>
                  </>
                ) : (
                  <>
                    <ChevronRight size={16} color="var(--text-muted)" />
                    <span style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)' }}>Expand</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <>
            {/* Vertical connector from parent to children */}
            <div style={{
              width: '2px',
              height: '40px',
              background: '#d1d5db',
              margin: '0 auto',
            }} />

            {/* Children container */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '32px',
              position: 'relative',
              paddingTop: '40px',
            }}>
              {node.children.map((child, index) => (
                <div key={child.user.id} style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}>
                  {/* Horizontal line segment for this child */}
                  {node.children.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: '-40px',
                      left: index === 0 ? '50%' : '-16px',
                      right: index === node.children.length - 1 ? '50%' : '-16px',
                      height: '2px',
                      background: '#d1d5db',
                    }} />
                  )}

                  {/* Vertical line down to child */}
                  <div style={{
                    position: 'absolute',
                    top: '-40px',
                    left: '50%',
                    width: '2px',
                    height: '40px',
                    background: '#d1d5db',
                    transform: 'translateX(-50%)',
                  }} />
                  {renderModernNode(child, level + 1)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1>Org Chart</h1>
        <p>Loading organization chart...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px', minWidth: '100%', width: 'fit-content' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Organization Chart
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          {employees.length} {employees.length === 1 ? 'employee' : 'employees'}
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* View Toggle */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => {
              setViewMode('list');
              navigate('/employees');
            }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'list' ? '#3b82f6' : 'transparent',
              color: viewMode === 'list' ? '#ffffff' : '#6b7280',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <List size={16} />
            List
          </button>
          <button
            onClick={() => setViewMode('chart')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: viewMode === 'chart' ? '#3b82f6' : 'transparent',
              color: viewMode === 'chart' ? '#ffffff' : '#6b7280',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.15s',
            }}
          >
            <Network size={16} />
            Org Chart
          </button>
        </div>

        {/* Chart Style Toggle */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setChartStyle('modern')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: chartStyle === 'modern' ? '#8b5cf6' : 'transparent',
              color: chartStyle === 'modern' ? '#ffffff' : '#6b7280',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
          >
            Modern
          </button>
          <button
            onClick={() => setChartStyle('classic')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: chartStyle === 'classic' ? '#8b5cf6' : 'transparent',
              color: chartStyle === 'classic' ? '#ffffff' : '#6b7280',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
          >
            Classic
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
            disabled={zoom <= 0.25}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              color: zoom <= 0.25 ? '#d1d5db' : '#6b7280',
              borderRadius: '6px',
              cursor: zoom <= 0.25 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (zoom > 0.25) e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ZoomOut size={16} />
          </button>

          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', minWidth: '45px', textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>

          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.1))}
            disabled={zoom >= 2}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              color: zoom >= 2 ? '#d1d5db' : '#6b7280',
              borderRadius: '6px',
              cursor: zoom >= 2 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (zoom < 2) e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <ZoomIn size={16} />
          </button>

          <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px' }} />

          <button
            onClick={() => setZoom(0.4)}
            disabled={zoom === 0.4}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              color: zoom === 0.4 ? '#d1d5db' : '#6b7280',
              borderRadius: '6px',
              cursor: zoom === 0.4 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              if (zoom !== 0.4) e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Reset zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Org Chart Tree */}
      <div style={{
        maxWidth: chartStyle === 'modern' ? '100%' : '1200px',
        width: '100%',
        overflowX: chartStyle === 'modern' ? 'auto' : 'visible',
        paddingBottom: '20px',
      }}>
        {orgTree.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'var(--bg-tertiary)',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600' }}>
              No organization structure found
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
              There are no employees in the system yet.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            flexDirection: chartStyle === 'modern' ? 'column' : 'row',
            gap: chartStyle === 'modern' ? '24px' : '0',
            alignItems: chartStyle === 'modern' ? 'center' : 'flex-start',
            minWidth: '100%',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s ease',
          }}>
            {orgTree.map(root => chartStyle === 'modern' ? renderModernNode(root) : renderNode(root))}
          </div>
        )}
      </div>
    </div>
  );
}
