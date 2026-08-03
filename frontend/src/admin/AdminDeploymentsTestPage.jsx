import React from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_DEPLOYMENTS = [
  {
    id: 'dep-01',
    projectName: 'e-commerce-frontend',
    framework: 'react',
    status: 'RUNNING',
    url: 'http://18.225.198.157:30080',
    podName: 'e-commerce-frontend-7f99b4d-x89',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'dep-02',
    projectName: 'payments-api',
    framework: 'express',
    status: 'RUNNING',
    url: 'http://18.225.198.157:30090',
    podName: 'payments-api-5c4d92a-k12',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'dep-03',
    projectName: 'analytics-worker',
    framework: 'python',
    status: 'BUILDING',
    url: null,
    podName: 'not yet created',
    createdAt: new Date(Date.now() - 600000).toISOString(),
  },
];

export default function AdminDeploymentsTestPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-container">
      <div className="test-mode-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span>Standalone Design Test Route: <code>/test/admin/deployments</code> (No Backend Connection Required)</span>
        </div>
        <button
          onClick={() => navigate('/admin/deployments')}
          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          Switch to Live Admin →
        </button>
      </div>

      <div className="admin-header">
        <div>
          <h1 className="page-title">Deployments (Test Mock)</h1>
          <p className="page-subtitle">Global deployment pipeline status and workload tracking</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Framework</th>
              <th>Status</th>
              <th>Pod Name</th>
              <th>URL</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DEPLOYMENTS.map((dep) => (
              <tr key={dep.id}>
                <td className="font-semibold">{dep.projectName}</td>
                <td><span className="badge badge-neutral">{dep.framework}</span></td>
                <td>
                  <span className={`badge ${dep.status === 'RUNNING' ? 'badge-success' : 'badge-warning'}`}>
                    {dep.status}
                  </span>
                </td>
                <td><code>{dep.podName}</code></td>
                <td>{dep.url ? <a href={dep.url} target="_blank" rel="noreferrer" style={{ color: '#388bfd' }}>{dep.url}</a> : 'N/A'}</td>
                <td>{new Date(dep.createdAt).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
