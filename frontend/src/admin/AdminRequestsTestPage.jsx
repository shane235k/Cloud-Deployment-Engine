import React from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_REQUESTS = [
  {
    id: 'req-101',
    username: 'alex_dev',
    email: 'alex.dev@company.io',
    message: 'Requesting access to deploy React microservices.',
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'req-102',
    username: 'sarah_ops',
    email: 'sarah.ops@company.io',
    message: 'Need deployment credentials for staging environment.',
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export default function AdminRequestsTestPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-container">
      <div className="test-mode-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span>Standalone Design Test Route: <code>/test/admin/requests</code> (No Backend Connection Required)</span>
        </div>
        <button
          onClick={() => navigate('/admin/requests')}
          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          Switch to Live Admin →
        </button>
      </div>

      <div className="admin-header">
        <div>
          <h1 className="page-title">Access Requests (Test Mock)</h1>
          <p className="page-subtitle">Review pending registration and platform onboarding requests</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Message</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_REQUESTS.map((req) => (
              <tr key={req.id}>
                <td className="font-semibold">{req.username}</td>
                <td><code>{req.email}</code></td>
                <td>{req.message}</td>
                <td>
                  <span className={`badge ${req.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                    {req.status}
                  </span>
                </td>
                <td>
                  {req.status === 'PENDING' ? (
                    <button
                      className="primary-button-large"
                      style={{ padding: '4px 12px', fontSize: '11.5px' }}
                      onClick={() => alert(`Approved request for ${req.username}`)}
                    >
                      Approve User
                    </button>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#8b949e' }}>No Action Required</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
