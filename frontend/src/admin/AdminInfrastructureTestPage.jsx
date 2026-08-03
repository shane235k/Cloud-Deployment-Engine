import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminInfrastructureTestPage() {
  const navigate = useNavigate();

  return (
    <div className="admin-page-container">
      <div className="test-mode-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span>Standalone Design Test Route: <code>/test/admin/infrastructure</code> (No Backend Connection Required)</span>
        </div>
        <button
          onClick={() => navigate('/admin/infrastructure')}
          style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '600', cursor: 'pointer' }}
        >
          Switch to Live Admin →
        </button>
      </div>

      <div className="admin-header">
        <div>
          <h1 className="page-title">Infrastructure Overview (Test Mock)</h1>
          <p className="page-subtitle">Kubernetes cluster status, provisioner metrics, and system nodes</p>
        </div>
      </div>

      <div className="admin-details-grid" style={{ marginBottom: '24px' }}>
        <div className="detail-card">
          <h3>Cluster Core</h3>
          <div className="detail-row"><span>Orchestrator:</span><span>K3s / Minikube</span></div>
          <div className="detail-row"><span>Version:</span><span>v1.30.2+k3s1</span></div>
          <div className="detail-row"><span>Total Nodes:</span><span>3 Active</span></div>
          <div className="detail-row"><span>Control Plane:</span><span style={{ color: '#3fb950' }}>HEALTHY</span></div>
        </div>

        <div className="detail-card">
          <h3>Workload Telemetry</h3>
          <div className="detail-row"><span>Total Pods:</span><span>14 Running</span></div>
          <div className="detail-row"><span>Deployments:</span><span>8 Active</span></div>
          <div className="detail-row"><span>Ingress Controller:</span><span>Traefik v2.10</span></div>
          <div className="detail-row"><span>Container Runtime:</span><span>containerd://1.7.13</span></div>
        </div>

        <div className="detail-card">
          <h3>Monitoring & Metrics</h3>
          <div className="detail-row"><span>Prometheus Server:</span><span style={{ color: '#3fb950' }}>ONLINE</span></div>
          <div className="detail-row"><span>Grafana Dashboards:</span><span style={{ color: '#3fb950' }}>ONLINE</span></div>
          <div className="detail-row"><span>Jenkins CI Engine:</span><span style={{ color: '#3fb950' }}>ONLINE</span></div>
          <div className="detail-row"><span>Log Aggregator:</span><span>Active (FluentBit)</span></div>
        </div>
      </div>
    </div>
  );
}
