import { useState } from 'react';
import { X, Download, Upload } from 'lucide-react';
import type { BulkImportResult } from '../../types/index';
import { users as usersApi, departments as departmentsApi } from '../../lib/api';

interface BulkImportUsersModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function BulkImportUsersModal({ onClose, onSuccess }: BulkImportUsersModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);

      if (lines.length < 2) {
        setError('CSV file must have a header row and at least one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const nameIdx = headers.indexOf('name');
      const emailIdx = headers.indexOf('email');
      const titleIdx = headers.indexOf('title');
      const deptIdx = headers.indexOf('department');
      const roleIdx = headers.indexOf('role');

      if (nameIdx === -1 || emailIdx === -1) {
        setError('CSV must have "name" and "email" columns');
        return;
      }

      // Load departments for matching
      const departments = await departmentsApi.getAll();
      const deptMap = new Map(departments.map(d => [d.name.toLowerCase(), d.id]));

      const errors: { row: number; error: string }[] = [];
      let successCount = 0;

      // Process each row
      for (let i = 1; i < lines.length && i <= 1000; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const name = values[nameIdx];
        const email = values[emailIdx];
        const title = titleIdx !== -1 ? values[titleIdx] : undefined;
        const deptName = deptIdx !== -1 ? values[deptIdx] : undefined;
        const role = roleIdx !== -1 ? values[roleIdx]?.toUpperCase() : 'EMPLOYEE';

        if (!name || !email) {
          errors.push({ row: i + 1, error: 'Missing name or email' });
          continue;
        }

        const validRoles = ['EMPLOYEE', 'MANAGER', 'HR_ADMIN', 'SUPER_ADMIN'];
        if (role && !validRoles.includes(role)) {
          errors.push({ row: i + 1, error: `Invalid role: ${role}` });
          continue;
        }

        const departmentId = deptName ? deptMap.get(deptName.toLowerCase()) : undefined;

        try {
          await usersApi.create({
            name,
            email,
            title,
            role: role as any,
            departmentId,
          });
          successCount++;
        } catch (err: any) {
          errors.push({ row: i + 1, error: err.message || 'Failed to create user' });
        }
      }

      setResult({ success: successCount, errors });

      if (successCount > 0 && errors.length === 0) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to import users');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = () => {
    const csvContent = `name,email,title,department,manager,role,hireDate
John Doe,john@example.com,Software Engineer,Engineering,jane@example.com,EMPLOYEE,2024-01-15
Jane Smith,jane@example.com,Engineering Manager,Engineering,,MANAGER,2023-06-01`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-users-import.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>Bulk Import Users</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '6px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Instructions */}
          <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', marginBottom: '24px' }}>
            <div style={{ fontSize: '14px', fontWeight: '500', color: '#0369a1', marginBottom: '8px' }}>
              CSV Format Instructions
            </div>
            <div style={{ fontSize: '13px', color: '#0c4a6e', lineHeight: '1.5' }}>
              <div>Required columns: <strong>name, email</strong></div>
              <div>Optional columns: title, department, manager, role, hireDate</div>
              <div style={{ marginTop: '8px' }}>
                - Department and manager should match existing records by name/email<br />
                - Role must be one of: EMPLOYEE, MANAGER, HR_ADMIN, SUPER_ADMIN<br />
                - Maximum 1000 rows per import
              </div>
            </div>
          </div>

          {/* Download Sample */}
          <button
            onClick={downloadSample}
            style={{
              width: '100%',
              padding: '12px',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: '#374151',
              marginBottom: '24px'
            }}
          >
            <Download size={18} />
            Download Sample CSV
          </button>

          {/* File Upload */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                width: '100%',
                padding: '32px',
                border: '2px dashed #e5e7eb',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: 'pointer',
                background: file ? '#f0fdf4' : '#f9fafb',
                borderColor: file ? '#10b981' : '#e5e7eb'
              }}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={32} style={{ margin: '0 auto 12px', color: '#9ca3af' }} />
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                {file ? file.name : 'Click to upload CSV file'}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {file ? `${(file.size / 1024).toFixed(2)} KB` : 'Max file size: 10MB'}
              </div>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ padding: '16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#065f46' }}>
                  Successfully imported {result.success} user{result.success !== 1 ? 's' : ''}
                </div>
              </div>

              {result.errors.length > 0 && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                    {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}:
                  </div>
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    {result.errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: '13px', color: '#991b1b', marginBottom: '4px' }}>
                        Row {err.row}: {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
                color: '#374151'
              }}
            >
              {result ? 'Close' : 'Cancel'}
            </button>
            {!result && (
              <button
                onClick={handleUpload}
                disabled={!file || loading}
                style={{
                  padding: '10px 20px',
                  background: !file || loading ? '#9ca3af' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: !file || loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Importing...' : 'Import Users'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
