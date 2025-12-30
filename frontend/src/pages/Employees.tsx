import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTeam } from '../hooks/useTeam';
import type { User } from '../types';
import { Network, List, Search, Mail, Building } from 'lucide-react';
import Avatar from '../components/Avatar';
import EmployeeDetailModal from '../components/EmployeeDetailModal';

export default function Employees() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { employees, isLoading, error } = useTeam();
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, employees]);

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query) ||
        emp.department?.name.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '48px' }}>
        <h1>Org Chart</h1>
        <p>Loading employees...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '48px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Org Chart
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

      {/* View Toggle & Search */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '4px' }}>
          <button
            onClick={() => setViewMode('list')}
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
            onClick={() => {
              setViewMode('chart');
              navigate('/org-chart');
            }}
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

        <div style={{ flex: 1, maxWidth: '400px', position: 'relative' }}>
          <Search
            size={18}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
            }}
          />
        </div>
      </div>

      {/* Employee Table */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Name
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Title
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Department
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Manager
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Email
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Role
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {searchQuery ? 'No employees found matching your search' : 'No employees found'}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar user={employee} size="md" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {employee.title || '—'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {employee.department && (
                        <>
                          <Building size={14} color="var(--text-muted)" />
                          {employee.department.name}
                        </>
                      )}
                      {!employee.department && '—'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {employee.manager?.name || '—'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="var(--text-muted)" />
                      {employee.email}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: employee.role === 'SUPER_ADMIN' || employee.role === 'HR_ADMIN' ? '#fef3c7' : employee.role === 'MANAGER' ? '#dbeafe' : 'var(--bg-tertiary)',
                        color: employee.role === 'SUPER_ADMIN' || employee.role === 'HR_ADMIN' ? '#92400e' : employee.role === 'MANAGER' ? '#1e40af' : 'var(--text-secondary)',
                      }}
                    >
                      {employee.role.replace('_', ' ')}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <EmployeeDetailModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}
    </div>
  );
}
