import { useState, useEffect, useRef } from 'react';
import type { User, Department } from '../../types/index';
import { Upload, Search, Edit2, Power, PowerOff, MoreVertical, Mail, RefreshCw, X, Clock } from 'lucide-react';
import EditUserModal from './EditUserModal';
import BulkImportUsersModal from './BulkImportUsersModal';
import InviteUserModal from './InviteUserModal';
import UserStatusBadge from './UserStatusBadge';
import Avatar from '../Avatar';
import { SkeletonTable } from '../Skeleton';
import { users as usersApi, departments as departmentsApi, invitations as invitationsApi } from '../../lib/api';

interface Invitation {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: { name: string };
  department?: { name: string };
}

export default function AdminUsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [openInviteDropdownId, setOpenInviteDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inviteDropdownRef = useRef<HTMLDivElement>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
      if (inviteDropdownRef.current && !inviteDropdownRef.current.contains(event.target as Node)) {
        setOpenInviteDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, deptData, invitesData] = await Promise.all([
        usersApi.getAll(),
        departmentsApi.getAll(),
        invitationsApi.getAll().catch(() => [])
      ]);
      setUsers(usersData);
      setDepartments(deptData);
      setInvitations(invitesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await invitationsApi.resend(inviteId);
      alert('Invitation resent successfully');
    } catch (error) {
      console.error('Failed to resend invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await invitationsApi.cancel(inviteId);
      setInvitations(invitations.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error('Failed to cancel invitation:', error);
      alert('Failed to cancel invitation');
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeactivate = async (userId: string) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;

    try {
      await usersApi.deactivate(userId);
      await loadData();
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      alert('Failed to deactivate user');
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      await usersApi.reactivate(userId);
      await loadData();
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      alert('Failed to reactivate user');
    }
  };

  const handleToggleSelect = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUserIds.size === 0) return;
    if (!confirm(`Are you sure you want to deactivate ${selectedUserIds.size} user(s)?`)) return;

    try {
      await Promise.all(
        Array.from(selectedUserIds).map(id =>
          usersApi.deactivate(id)
        )
      );
      setSelectedUserIds(new Set());
      await loadData();
    } catch (error) {
      console.error('Failed to bulk deactivate users:', error);
      alert('Failed to deactivate some users');
    }
  };

  const handleClearSelection = () => {
    setSelectedUserIds(new Set());
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || user.departmentId === filterDepartment;
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && user.isActive !== false) ||
                         (filterStatus === 'inactive' && user.isActive === false);

    return matchesSearch && matchesDepartment && matchesRole && matchesStatus;
  });

  if (loading) {
    return (
      <div>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '120px', height: '40px', background: '#f0f0f0', borderRadius: '8px' }} />
          <div style={{ width: '120px', height: '40px', background: '#f0f0f0', borderRadius: '8px' }} />
        </div>
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  const pendingInvitations = invitations.filter(i => i.status === 'PENDING');

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '0' }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'users' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'users' ? '#3b82f6' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '-1px',
          }}
        >
          Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('invitations')}
          style={{
            padding: '12px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'invitations' ? '2px solid #3b82f6' : '2px solid transparent',
            color: activeTab === 'invitations' ? '#3b82f6' : '#6b7280',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginBottom: '-1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          Pending Invitations
          {pendingInvitations.length > 0 && (
            <span style={{
              background: '#fef3c7',
              color: '#92400e',
              padding: '2px 8px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
            }}>
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Action Bar */}
      <div className="admin-action-bar" style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            padding: '10px 16px',
            background: '#3b82f6',
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
          <Mail size={18} />
          Invite User
        </button>

        <button
          onClick={() => setShowImportModal(true)}
          style={{
            padding: '10px 16px',
            background: 'white',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Upload size={18} />
          Import CSV
        </button>

        {selectedUserIds.size > 0 && (
          <>
            <div style={{
              width: '1px',
              height: '32px',
              background: '#e5e7eb',
              margin: '0 4px'
            }} />

            <span style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#3b82f6',
              padding: '0 8px'
            }}>
              {selectedUserIds.size} selected
            </span>

            <button
              onClick={handleBulkDeactivate}
              style={{
                padding: '10px 16px',
                background: '#fef2f2',
                color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PowerOff size={18} />
              Deactivate
            </button>

            <button
              onClick={() => setShowBulkEditModal(true)}
              style={{
                padding: '10px 16px',
                background: '#dbeafe',
                color: '#1e40af',
                border: '1px solid #93c5fd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Edit2 size={18} />
              Bulk Edit
            </button>
          </>
        )}
      </div>

      {activeTab === 'users' && (
      <>
      {/* Filters */}
      <div className="admin-filters" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />
        </div>

        <select
          value={filterDepartment}
          onChange={(e) => setFilterDepartment(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '150px'
          }}
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '150px'
          }}
        >
          <option value="">All Roles</option>
          <option value="EMPLOYEE">Employee</option>
          <option value="MANAGER">Manager</option>
          <option value="HR_ADMIN">HR Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '10px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '120px'
          }}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Users Table */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <table className="responsive-table admin-users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', width: '48px' }}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  style={{
                    width: '16px',
                    height: '16px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6'
                  }}
                />
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Department</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '80px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => {
              const department = departments.find(d => d.id === user.departmentId);
              const isActive = user.isActive !== false;

              return (
                <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td className="checkbox-cell" style={{ padding: '12px 16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.has(user.id)}
                      onChange={() => handleToggleSelect(user.id)}
                      style={{
                        width: '16px',
                        height: '16px',
                        cursor: 'pointer',
                        accentColor: '#3b82f6'
                      }}
                    />
                  </td>
                  <td data-label="User" style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Avatar user={{ name: user.name, profilePicture: user.profilePicture }} size="sm" />
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{user.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Title" style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{user.title || '-'}</td>
                  <td data-label="Department" style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>{department?.name || '-'}</td>
                  <td data-label="Role" style={{ padding: '12px 16px', fontSize: '14px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '500',
                      background: user.role === 'SUPER_ADMIN' ? '#fef3c7' : user.role === 'HR_ADMIN' ? '#dbeafe' : '#f3f4f6',
                      color: user.role === 'SUPER_ADMIN' ? '#92400e' : user.role === 'HR_ADMIN' ? '#1e40af' : '#374151'
                    }}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td data-label="Status" style={{ padding: '12px 16px' }}>
                    <UserStatusBadge isActive={isActive} />
                  </td>
                  <td data-label="Actions" className="actions-cell" style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }} ref={openDropdownId === user.id ? dropdownRef : null}>
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === user.id ? null : user.id)}
                        style={{
                          padding: '6px',
                          background: 'transparent',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280'
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>

                      {openDropdownId === user.id && (
                        <div style={{
                          position: 'absolute',
                          right: 0,
                          top: '100%',
                          marginTop: '4px',
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                          minWidth: '160px',
                          zIndex: 10,
                          overflow: 'hidden'
                        }}>
                          <button
                            onClick={() => {
                              handleEdit(user);
                              setOpenDropdownId(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              background: 'transparent',
                              border: 'none',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontSize: '14px',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                          {isActive ? (
                            <button
                              onClick={() => {
                                handleDeactivate(user.id);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <PowerOff size={14} />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                handleReactivate(user.id);
                                setOpenDropdownId(null);
                              }}
                              style={{
                                width: '100%',
                                padding: '10px 16px',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: '14px',
                                color: '#16a34a',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f0fdf4'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <Power size={14} />
                              Reactivate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            No users found
          </div>
        )}
      </div>
      </>
      )}

      {activeTab === 'invitations' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {pendingInvitations.length === 0 ? (
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <Mail size={48} color="#d1d5db" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                No pending invitations
              </h3>
              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
                When you invite users, they'll appear here until they accept.
              </p>
              <button
                onClick={() => setShowInviteModal(true)}
                style={{
                  padding: '10px 20px',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Mail size={16} />
                Invite Your First User
              </button>
            </div>
          ) : (
            <table className="responsive-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Invitee</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Invited By</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Expires</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingInvitations.map(invite => {
                  const isExpired = new Date(invite.expiresAt) < new Date();
                  const expiresDate = new Date(invite.expiresAt);
                  const daysLeft = Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                  return (
                    <tr key={invite.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td data-label="Invitee" style={{ padding: '12px 16px' }}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>{invite.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{invite.email}</div>
                        </div>
                      </td>
                      <td data-label="Role" style={{ padding: '12px 16px', fontSize: '14px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: invite.role === 'SUPER_ADMIN' ? '#fef3c7' : invite.role === 'HR_ADMIN' ? '#dbeafe' : '#f3f4f6',
                          color: invite.role === 'SUPER_ADMIN' ? '#92400e' : invite.role === 'HR_ADMIN' ? '#1e40af' : '#374151'
                        }}>
                          {invite.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td data-label="Invited By" style={{ padding: '12px 16px', fontSize: '14px', color: '#6b7280' }}>
                        {invite.invitedBy.name}
                      </td>
                      <td data-label="Expires" style={{ padding: '12px 16px' }}>
                        {isExpired ? (
                          <span style={{ color: '#dc2626', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            Expired
                          </span>
                        ) : (
                          <span style={{ color: daysLeft <= 2 ? '#f59e0b' : '#6b7280', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={14} />
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                          </span>
                        )}
                      </td>
                      <td data-label="Actions" style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }} ref={openInviteDropdownId === invite.id ? inviteDropdownRef : null}>
                          <button
                            onClick={() => setOpenInviteDropdownId(openInviteDropdownId === invite.id ? null : invite.id)}
                            style={{
                              padding: '6px',
                              background: 'transparent',
                              border: '1px solid #e5e7eb',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#6b7280'
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {openInviteDropdownId === invite.id && (
                            <div style={{
                              position: 'absolute',
                              right: 0,
                              top: '100%',
                              marginTop: '4px',
                              background: 'white',
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              minWidth: '160px',
                              zIndex: 10,
                              overflow: 'hidden'
                            }}>
                              <button
                                onClick={() => {
                                  handleResendInvite(invite.id);
                                  setOpenInviteDropdownId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  background: 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#374151',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <RefreshCw size={14} />
                                Resend
                              </button>
                              <button
                                onClick={() => {
                                  handleCancelInvite(invite.id);
                                  setOpenInviteDropdownId(null);
                                }}
                                style={{
                                  width: '100%',
                                  padding: '10px 16px',
                                  background: 'transparent',
                                  border: 'none',
                                  textAlign: 'left',
                                  cursor: 'pointer',
                                  fontSize: '14px',
                                  color: '#dc2626',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <X size={14} />
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modals */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedUser(null);
            loadData();
          }}
          departments={departments}
          users={users}
        />
      )}

      {showImportModal && (
        <BulkImportUsersModal
          onClose={() => setShowImportModal(false)}
          onSuccess={() => {
            setShowImportModal(false);
            loadData();
          }}
        />
      )}

      {showBulkEditModal && (
        <BulkEditModal
          userIds={Array.from(selectedUserIds)}
          onClose={() => setShowBulkEditModal(false)}
          onSuccess={() => {
            setShowBulkEditModal(false);
            setSelectedUserIds(new Set());
            loadData();
          }}
          departments={departments}
          users={users}
        />
      )}

      {showInviteModal && (
        <InviteUserModal
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => {
            setShowInviteModal(false);
            loadData();
            setActiveTab('invitations');
          }}
          departments={departments}
          users={users}
        />
      )}
    </div>
  );
}

function BulkEditModal({
  userIds,
  onClose,
  onSuccess,
  departments,
  users
}: {
  userIds: string[];
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  users: User[];
}) {
  const [editField, setEditField] = useState<'role' | 'department' | 'manager' | ''>('');
  const [newValue, setNewValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editField || !newValue) return;

    setIsSubmitting(true);
    try {
      const updateData: any = {};
      if (editField === 'role') updateData.role = newValue;
      if (editField === 'department') updateData.departmentId = newValue;
      if (editField === 'manager') updateData.managerId = newValue === 'null' ? null : newValue;

      await Promise.all(
        userIds.map(id => usersApi.update(id, updateData))
      );

      onSuccess();
    } catch (error) {
      console.error('Failed to bulk update users:', error);
      alert('Failed to update some users');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '600', color: '#111827' }}>
          Bulk Edit Users
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#6b7280' }}>
          Update {userIds.length} selected user{userIds.length > 1 ? 's' : ''}
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Field to Edit
            </label>
            <select
              value={editField}
              onChange={(e) => {
                setEditField(e.target.value as any);
                setNewValue('');
              }}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            >
              <option value="">Select field...</option>
              <option value="role">Role</option>
              <option value="department">Department</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          {editField === 'role' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                New Role
              </label>
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select role...</option>
                <option value="EMPLOYEE">Employee</option>
                <option value="MANAGER">Manager</option>
                <option value="HR_ADMIN">HR Admin</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          )}

          {editField === 'department' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                New Department
              </label>
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          )}

          {editField === 'manager' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                New Manager
              </label>
              <select
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                }}
              >
                <option value="">Select manager...</option>
                <option value="null">No Manager</option>
                {users
                  .filter(u => u.role === 'MANAGER' || u.role === 'HR_ADMIN' || u.role === 'SUPER_ADMIN')
                  .map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
              </select>
            </div>
          )}

          <div className="modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                color: '#374151',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !editField || !newValue}
              style={{
                padding: '10px 20px',
                background: isSubmitting || !editField || !newValue ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting || !editField || !newValue ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Updating...' : 'Update Users'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
