import { X, Mail, Building, Calendar, User as UserIcon, Briefcase } from 'lucide-react';
import type { User } from '../types';
import Avatar from './Avatar';

interface EmployeeDetailModalProps {
  employee: User;
  onClose: () => void;
}

export default function EmployeeDetailModal({ employee, onClose }: EmployeeDetailModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
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
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
            Employee Details
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} color="#6b7280" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Avatar and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
            <Avatar user={employee} size="xl" />
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                {employee.name}
              </h3>
              <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>
                {employee.title || 'No title'}
              </p>
            </div>
          </div>

          {/* Information Grid */}
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Email */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail size={18} color="#6b7280" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email
                </span>
              </div>
              <p style={{ fontSize: '15px', color: '#111827', margin: 0, marginLeft: '26px' }}>
                {employee.email}
              </p>
            </div>

            {/* Department */}
            {employee.department && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Building size={18} color="#6b7280" />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Department
                  </span>
                </div>
                <p style={{ fontSize: '15px', color: '#111827', margin: 0, marginLeft: '26px' }}>
                  {employee.department.name}
                </p>
              </div>
            )}

            {/* Role */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Briefcase size={18} color="#6b7280" />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Role
                </span>
              </div>
              <div style={{ marginLeft: '26px' }}>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: '500',
                    background: employee.role === 'SUPER_ADMIN' || employee.role === 'HR_ADMIN' ? '#fef3c7' : employee.role === 'MANAGER' ? '#dbeafe' : '#f3f4f6',
                    color: employee.role === 'SUPER_ADMIN' || employee.role === 'HR_ADMIN' ? '#92400e' : employee.role === 'MANAGER' ? '#1e40af' : '#374151',
                  }}
                >
                  {employee.role.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Manager */}
            {employee.manager && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <UserIcon size={18} color="#6b7280" />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Manager
                  </span>
                </div>
                <p style={{ fontSize: '15px', color: '#111827', margin: 0, marginLeft: '26px' }}>
                  {employee.manager.name}
                </p>
              </div>
            )}

            {/* Hire Date */}
            {employee.hireDate && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Calendar size={18} color="#6b7280" />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Hire Date
                  </span>
                </div>
                <p style={{ fontSize: '15px', color: '#111827', margin: 0, marginLeft: '26px' }}>
                  {new Date(employee.hireDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Gusto Data Section - Placeholder */}
          <div
            style={{
              marginTop: '32px',
              padding: '20px',
              background: '#f9fafb',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
            }}
          >
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>
              Gusto Data
            </h4>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
              Gusto integration will populate additional employee information here (compensation, benefits, time off, etc.)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
