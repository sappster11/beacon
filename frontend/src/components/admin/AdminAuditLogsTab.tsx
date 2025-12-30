import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { AuditLog, User } from '../../types/index';
import { Download, Search, Filter } from 'lucide-react';
import { auditLogs as auditLogsApi, users as usersApi } from '../../lib/api';
import AuditLogDetailModal from './AuditLogDetailModal';

export default function AdminAuditLogsTab() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'ADMIN';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters
  const [filterUserId, setFilterUserId] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterResourceType, setFilterResourceType] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterResourceId, setFilterResourceId] = useState('');
  const [filterIpAddress, setFilterIpAddress] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [limit] = useState(100);
  const [offset, setOffset] = useState(0);

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadData();
  }, [filterUserId, filterAction, filterResourceType, filterStartDate, filterEndDate, filterResourceId, filterIpAddress, filterSearch, filterStatus, offset]);

  const setDateRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setFilterEndDate(end.toISOString().split('T')[0]);
    setFilterStartDate(start.toISOString().split('T')[0]);
    setOffset(0);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [logsResponse, usersData] = await Promise.all([
        auditLogsApi.getAll({
          userId: filterUserId || undefined,
          action: filterAction || undefined,
          resourceType: filterResourceType || undefined,
          startDate: filterStartDate || undefined,
          endDate: filterEndDate || undefined,
          resourceId: filterResourceId || undefined,
          ipAddress: filterIpAddress || undefined,
          search: filterSearch || undefined,
          status: filterStatus || undefined,
          limit,
          offset
        }),
        usersApi.getAll()
      ]);
      setLogs(logsResponse.logs);
      setTotal(logsResponse.total);
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!isSuperAdmin) {
      alert('Export functionality is only available to Admins');
      return;
    }

    try {
      // Generate CSV from current logs
      const headers = ['Date', 'User', 'Action', 'Resource Type', 'Resource ID', 'Description', 'Status'];
      const csvContent = [
        headers.join(','),
        ...logs.map(log => [
          new Date(log.createdAt).toISOString(),
          `"${log.user?.name || 'System'}"`,
          log.action,
          log.resourceType,
          log.resourceId,
          `"${(log.description || '').replace(/"/g, '""')}"`,
          log.status || 'success'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export audit logs');
    }
  };

  const clearFilters = () => {
    setFilterUserId('');
    setFilterAction('');
    setFilterResourceType('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterResourceId('');
    setFilterIpAddress('');
    setFilterSearch('');
    setFilterStatus('');
    setOffset(0);
  };

  const hasFilters = filterUserId || filterAction || filterResourceType || filterStartDate || filterEndDate || filterResourceId || filterIpAddress || filterSearch || filterStatus;

  if (loading && logs.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>Loading audit logs...</div>;
  }

  return (
    <div>
      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)' }}>
            {total} log{total !== 1 ? 's' : ''} found
          </span>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{
              padding: '8px 16px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              color: 'var(--text-secondary)'
            }}
          >
            Clear Filters
          </button>
        )}

        {isSuperAdmin && (
          <button
            onClick={handleExport}
            style={{
              padding: '10px 16px',
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Download size={18} />
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* User Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              User
            </label>
            <select
              value={filterUserId}
              onChange={(e) => {
                setFilterUserId(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Action
            </label>
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>

          {/* Resource Type Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Resource Type
            </label>
            <select
              value={filterResourceType}
              onChange={(e) => {
                setFilterResourceType(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Resources</option>
              <option value="User">User</option>
              <option value="Department">Department</option>
              <option value="Review">Review</option>
              <option value="SystemSettings">System Settings</option>
              <option value="Integration">Integration</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Resource ID Search */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Resource ID
            </label>
            <input
              type="text"
              placeholder="Search by Resource ID..."
              value={filterResourceId}
              onChange={(e) => {
                setFilterResourceId(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* IP Address Search */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              IP Address
            </label>
            <input
              type="text"
              placeholder="Search by IP Address..."
              value={filterIpAddress}
              onChange={(e) => {
                setFilterIpAddress(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Free-text Search */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Search
            </label>
            <input
              type="text"
              placeholder="Search changes, metadata..."
              value={filterSearch}
              onChange={(e) => {
                setFilterSearch(e.target.value);
                setOffset(0);
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        {/* Unified Date Range Picker */}
        <div
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '12px',
            marginTop: '16px'
          }}
        >
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: 'var(--text-secondary)' }}>
            Date Range
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setOffset(0);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
            <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>to</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setOffset(0);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Quick select buttons */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setDateRange(7)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            >
              Last 7 days
            </button>
            <button
              onClick={() => setDateRange(30)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            >
              Last 30 days
            </button>
            <button
              onClick={() => setDateRange(90)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: 'var(--bg-hover)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--border-color)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            >
              Last 90 days
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resource</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
              >
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {log.user?.name || 'System'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: log.action === 'CREATE' ? '#d1fae5' :
                               log.action === 'UPDATE' ? '#dbeafe' :
                               '#fee2e2',
                    color: log.action === 'CREATE' ? '#065f46' :
                           log.action === 'UPDATE' ? '#1e40af' :
                           '#991b1b'
                  }}>
                    {log.action}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  {log.resourceType}
                </td>
                <td
                  style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--text-secondary)',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={log.description || `${log.action} ${log.resourceType}`}
                >
                  {log.description || `${log.action} ${log.resourceType}`}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    background: log.status === 'failed' ? '#fee2e2' : '#d1fae5',
                    color: log.status === 'failed' ? '#991b1b' : '#065f46'
                  }}>
                    {log.status === 'failed' ? 'Failed' : 'Success'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No audit logs found
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            style={{
              padding: '8px 16px',
              background: offset === 0 ? 'var(--bg-hover)' : 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: offset === 0 ? 'not-allowed' : 'pointer',
              color: offset === 0 ? 'var(--text-faint)' : 'var(--text-secondary)'
            }}
          >
            Previous
          </button>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            style={{
              padding: '8px 16px',
              background: offset + limit >= total ? 'var(--bg-hover)' : 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: offset + limit >= total ? 'not-allowed' : 'pointer',
              color: offset + limit >= total ? 'var(--text-faint)' : 'var(--text-secondary)'
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <AuditLogDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
