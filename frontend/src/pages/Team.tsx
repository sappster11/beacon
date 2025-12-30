import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { manager } from '../lib/api';
import type { User } from '../types';
import {
  Users,
  Target,
  ClipboardList,
  Calendar,
  Search,
  Mail,
  Building
} from 'lucide-react';
import Avatar from '../components/Avatar';
import EmployeeDetailModal from '../components/EmployeeDetailModal';
import { TeamSkeleton } from '../components/Skeleton';

export default function Team() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isManager = currentUser?.role === 'MANAGER' || currentUser?.role === 'HR_ADMIN' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    loadTeamData();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [searchQuery, teamMembers]);

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      // Get full org tree (all direct and indirect reports)
      const reports = await manager.getFullOrgTree();
      setTeamMembers(reports);

      // Get stats based on all report IDs
      const reportIds = reports.map(r => r.id);
      const stats = await manager.getTeamSummary(reportIds);
      setTeamStats(stats);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(teamMembers);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = teamMembers.filter(
      (emp) =>
        emp.name.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.title?.toLowerCase().includes(query)
    );
    setFilteredEmployees(filtered);
  };

  // Find who each person reports to from the team members list
  const getManagerName = (managerId?: string) => {
    if (!managerId) return null;
    if (managerId === currentUser?.id) return 'You';
    const mgr = teamMembers.find(m => m.id === managerId);
    return mgr?.name || null;
  };

  if (isLoading) {
    return <TeamSkeleton />;
  }

  return (
    <div style={{ padding: '48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Team
        </h1>
        <p style={{ fontSize: '16px', color: 'var(--text-muted)', margin: 0 }}>
          Manage and view your team members
        </p>
      </div>

      {/* Team Stats Cards */}
      {isManager && teamStats && (
        <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Users size={24} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {teamStats.totalTeamMembers}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Team Members</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#dcfce7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Target size={24} color="#10b981" />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {teamStats.activeGoals}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Active Goals</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardList size={24} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {teamStats.completedReviews}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Completed Reviews</div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  background: '#e0e7ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Calendar size={24} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {teamStats.upcomingOneOnOnes}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Upcoming 1:1s</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '24px', maxWidth: '400px', position: 'relative' }}>
        <Search
          size={18}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
        />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 40px',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#3b82f6';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
        />
      </div>

      
      {/* Team Members Table */}
      <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            Team Members ({filteredEmployees.length})
          </h2>
        </div>
        <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                Reports To
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
                  {searchQuery ? 'No team members found matching your search' : 'No team members found'}
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
                    e.currentTarget.style.background = 'var(--bg-tertiary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td data-label="Name" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar user={employee} size="md" />
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Title" style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {employee.title || '—'}
                  </td>
                  <td data-label="Department" style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {(employee as any).department && (
                        <>
                          <Building size={14} color="var(--text-muted)" />
                          {(employee as any).department.name}
                        </>
                      )}
                      {!(employee as any).department && '—'}
                    </div>
                  </td>
                  <td data-label="Reports To" style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {getManagerName(employee.managerId) || '—'}
                  </td>
                  <td data-label="Email" style={{ padding: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={14} color="var(--text-muted)" />
                      {employee.email}
                    </div>
                  </td>
                  <td data-label="Role" style={{ padding: '16px' }}>
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
