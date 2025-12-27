import { useState, FormEvent } from 'react';
import type { User, Department } from '../../types/index';
import { X, Mail, Send } from 'lucide-react';
import api from '../../lib/api';

interface InviteUserModalProps {
  onClose: () => void;
  onSuccess: () => void;
  departments: Department[];
  users: User[];
}

export default function InviteUserModal({ onClose, onSuccess, departments, users }: InviteUserModalProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    title: '',
    role: 'EMPLOYEE',
    departmentId: '',
    managerId: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await api.post('/users/invite', {
        email: formData.email,
        name: formData.name,
        title: formData.title || undefined,
        role: formData.role,
        departmentId: formData.departmentId || undefined,
        managerId: formData.managerId || undefined,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const managers = users.filter(u =>
    u.role === 'MANAGER' || u.role === 'HR_ADMIN' || u.role === 'SUPER_ADMIN'
  );

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500' as const,
    color: '#374151',
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
        padding: '20px',
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
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: '#dbeafe',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Mail size={20} color="#3b82f6" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                Invite New User
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
                Send an invitation email
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>
                  Full Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Smith"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>
                  Email Address <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@company.com"
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Job Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Software Engineer"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={inputStyle}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  <option value="HR_ADMIN">HR Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Department</label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select department...</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Manager</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">Select manager...</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>{manager.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#991b1b',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <div style={{
            marginTop: '24px',
            padding: '16px',
            background: '#f9fafb',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            The user will receive an email invitation to join the organization. They'll set their own password when they accept the invitation.
          </div>

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
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                background: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
