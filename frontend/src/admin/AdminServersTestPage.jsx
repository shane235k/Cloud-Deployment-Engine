import React from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_SERVERS = [
  {
    id: 'srv-01',
    name: 'ec2-cluster-node-01',
    status: 'HEALTHY',
    publicIp: '18.225.198.157',
    cpuUsage: 24,
    ramUsage: 48,
    diskUsage: 32,
    podCount: 5,
    activeDeployments: 3,
    maxDeployments: 10,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'srv-02',
    name: 'ec2-cluster-node-02',
    status: 'HEALTHY',
    publicIp: '3.14.88.201',
    cpuUsage: 18,
    ramUsage: 36,
    diskUsage: 28,
    podCount: 4,
    activeDeployments: 2,
    maxDeployments: 10,
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'srv-03',
    name: 'ec2-cluster-node-03',
    status: 'BUSY',
    publicIp: '54.210.12.99',
    cpuUsage: 89,
    ramUsage: 91,
    diskUsage: 78,
    podCount: 10,
    activeDeployments: 10,
    maxDeployments: 10,
    lastHeartbeat: new Date().toISOString(),
  },
];

export default function AdminServersTestPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-container">
      <div className="test-mode-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span>Standalone Design Test Route: <code>/test/admin/servers</code> (No Backend Connection Required)</span>
        </div>
        <button
          onClick={() => navigate('/admin/servers')}
          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          Switch to Live Admin →
        </button>
      </div>

      <div className="admin-header">
        <div>
          <h1 className="page-title">Registered Cluster Nodes (Test Mock)</h1>
          <p className="page-subtitle">Monitored infrastructure nodes and deployment capacity</p>
        </div>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Server Name</th>
              <th>Status</th>
              <th>Public IP</th>
              <th>CPU %</th>
              <th>RAM %</th>
              <th>Disk %</th>
              <th>Pods</th>
              <th>Deployments</th>
              <th>Capacity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SERVERS.map((server) => (
              <tr key={server.id}>
                <td className="font-semibold">{server.name}</td>
                <td>
                  <span className={`badge ${server.status === 'HEALTHY' ? 'badge-success' : 'badge-warning'}`}>
                    {server.status}
                  </span>
                </td>
                <td><code>{server.publicIp}</code></td>
                <td>{server.cpuUsage}%</td>
                <td>{server.ramUsage}%</td>
                <td>{server.diskUsage}%</td>
                <td>{server.podCount}</td>
                <td>{server.activeDeployments}</td>
                <td>{server.activeDeployments} / {server.maxDeployments}</td>
                <td>
                  <button
                    className="secondary-button"
                    style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    onClick={() => alert(`Test Terminal triggered for ${server.name}`)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="4 17 10 11 4 5"></polyline>
                      <line x1="12" y1="19" x2="20" y2="19"></line>
                    </svg>
                    Terminal
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
