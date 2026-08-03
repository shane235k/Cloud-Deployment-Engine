import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Top Radial Gauge
function RadialGauge({ valuePercent = 65 }) {
  const angle = 180 + (valuePercent / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 32;
  const cx = 50;
  const cy = 48;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <svg width="140" height="65" viewBox="0 0 100 55" style={{ overflow: 'visible' }}>
      <path
        d="M 8 48 A 42 42 0 0 1 92 48"
        fill="none"
        stroke="#d1d5db"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />
      <path
        d="M 18 48 A 32 32 0 0 1 82 48"
        fill="none"
        stroke="#f3f4f6"
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d={`M 35 24 A 32 32 0 0 1 65 24`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="13"
      />
      <circle cx={nx} cy={ny} r="4.5" fill="#111827" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

// Large Sleek Black & White Speedometer Gauge
function SpeedometerGauge({ valuePercent = 0, label = 'USAGE' }) {
  const angle = 180 + (valuePercent / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 46;
  const cx = 70;
  const cy = 65;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <svg width="200" height="105" viewBox="0 0 140 75" style={{ overflow: 'visible' }}>
        <path
          d="M 14 65 A 56 56 0 0 1 126 65"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        <path
          d="M 24 65 A 46 46 0 0 1 116 65"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 24 65 A 46 46 0 0 1 116 65"
          fill="none"
          stroke="#111827"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray="144.5"
          strokeDashoffset={144.5 - (144.5 * valuePercent) / 100}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
        <circle cx={nx} cy={ny} r="5" fill="#111827" stroke="#ffffff" strokeWidth="2" />
      </svg>
      <div style={{ marginTop: '-14px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: '800', color: '#111827' }}>{valuePercent}%</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function AdminOverviewTestPage() {
  const navigate = useNavigate();
  const [selectedServerId, setSelectedServerId] = useState('i-037691c241c3a925e');

  const testServers = [
    { id: 'i-037691c241c3a925e', name: 'ec2-primary-node', ip: '18.225.198.157', cpuUsage: 5, ramUsage: 85, diskUsage: 16 },
    { id: 'i-09941a8b27c10d3f2', name: 'ec2-secondary-node', ip: '3.14.88.201', cpuUsage: 12, ramUsage: 42, diskUsage: 28 },
  ];

  const selectedServer = testServers.find((s) => s.id === selectedServerId) || testServers[0];

  const testDeployments = [
    { id: '1', projectName: 'react-tst-app', framework: 'react', podName: 'not yet created', status: 'FAILED' },
    { id: '2', projectName: 'react-test1', framework: 'react', podName: 'react-app-f0802f22-b3b3-4f22-a118-a2f5ebe910e2-74dc4665b9-fwbh9', status: 'STOPPED' },
    { id: '3', projectName: 'react-test1', framework: 'react', podName: 'react-app-7544355f-2cfe-4027-882c-818870f01034-57dcbbbb69-7s94h', status: 'RUNNING' },
    { id: '4', projectName: 'react-test', framework: 'react', podName: 'not yet created', status: 'FAILED' },
    { id: '5', projectName: 'react-test', framework: 'react', podName: 'not yet created', status: 'FAILED' },
    { id: '6', projectName: 'express-backend-api', framework: 'express', podName: 'express-backend-56f89a2-x09', status: 'RUNNING' },
    { id: '7', projectName: 'analytics-service', framework: 'python', podName: 'not yet created', status: 'FAILED' },
  ];

  // Graph 2: Standard Black Bar Chart for Deployments Breakdown
  const barChartData = {
    labels: ['RUNNING', 'BUILDING', 'STOPPED', 'FAILED'],
    datasets: [
      {
        label: 'Deployments Count',
        data: [2, 0, 1, 4],
        backgroundColor: '#111827',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        padding: 10,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#374151', font: { size: 11, weight: '700' } },
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#6b7280', font: { size: 11 }, precision: 0 },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="analytics-workspace">
      {/* Standalone Test Mode Banner */}
      <div className="test-mode-banner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🧪</span>
          <span>Standalone Design Test Route: <code>/test/admin/overview</code> (No Backend Connection Required)</span>
        </div>
        <button
          onClick={() => navigate('/admin')}
          style={{
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #cbd5e1',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          Switch to Live Admin →
        </button>
      </div>

      {/* Title Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
          Platform Telemetry & DevOps Analytics (Test Mock)
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
          Real-time cluster health, deployment pipelines & node capacity metrics
        </p>
      </div>

      {/* Top Section: 4 Primary Speedometer Radial Gauge Cards */}
      <div className="analytics-gauge-grid">
        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">TOTAL SERVERS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>1 / 1 Nodes Healthy</div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                <line x1="6" y1="6" x2="6.01" y2="6"></line>
                <line x1="6" y1="18" x2="6.01" y2="18"></line>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={100} />
            <div className="gauge-value">1 Node</div>
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">TOTAL DEPLOYMENTS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>Global Project Pipelines</div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
                <polyline points="2 12 12 17 22 12"></polyline>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={88} />
            <div className="gauge-value">7 Projects</div>
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">RUNNING DEPLOYMENTS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>2 Active Workloads</div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={28} />
            <div className="gauge-value">2 Active</div>
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">PENDING REQUESTS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>Queue Empty</div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={0} />
            <div className="gauge-value">0 Pending</div>
          </div>
        </div>
      </div>

      {/* Second Section: Remaining 4 Secondary DevOps Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>HEALTHY SERVERS</span>
            <span className="status-pill-delivered">HEALTHY</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>1 Node</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>BUSY SERVERS</span>
            <span className="status-pill-pending">BUSY</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#d97706' }}>0 Nodes</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>OFFLINE SERVERS</span>
            <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>ONLINE</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669' }}>0 Nodes</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>FAILED DEPLOYMENTS</span>
            <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>FAILED</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#dc2626' }}>4 Projects</div>
        </div>
      </div>

      {/* Middle Row: 3 Speedometer Gauges with Dropdown (Left) & Solid Black Bar Chart (Right) */}
      <div className="analytics-middle-grid">
        <div className="analytics-panel">
          <div className="panel-header" style={{ alignItems: 'center' }}>
            <div>
              <div className="panel-title">Server Telemetry Load</div>
              <div className="panel-subtitle">
                CPU, RAM & Disk load for {selectedServer.name}
              </div>
            </div>
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              style={{
                background: '#ffffff',
                color: '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '12.5px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {testServers.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.id} ({srv.name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '25px 10px 10px 10px', minHeight: '260px' }}>
            <SpeedometerGauge valuePercent={selectedServer.cpuUsage} label="CPU Usage" />
            <SpeedometerGauge valuePercent={selectedServer.ramUsage} label="RAM Usage" />
            <SpeedometerGauge valuePercent={selectedServer.diskUsage} label="Disk Usage" />
          </div>
        </div>

        <div className="analytics-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Deployments Status Breakdown</div>
              <div className="panel-subtitle">Workloads grouped by status</div>
            </div>
          </div>
          <div style={{ height: '270px', width: '100%' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Deployed Projects (Left) + Cluster Status Table (Right) matching heights */}
      <div className="analytics-bottom-grid">
        <div className="analytics-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Deployed Projects & Workloads ({testDeployments.length})</div>
              <div className="panel-subtitle">All active applications in cluster</div>
            </div>
          </div>

          <div className="no-scrollbar" style={{ marginTop: '8px', maxHeight: '235px', overflowY: 'auto' }}>
            {testDeployments.map((dep) => (
              <div key={dep.id} className="product-item">
                <div className="product-info">
                  <div className="product-img">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                    </svg>
                  </div>
                  <div>
                    <div className="product-name">{dep.projectName}</div>
                    <div className="product-sub">Framework: {dep.framework} • Pod: {dep.podName}</div>
                  </div>
                </div>
                <div
                  className="product-price"
                  style={{
                    color:
                      dep.status === 'RUNNING'
                        ? '#059669'
                        : dep.status === 'BUILDING'
                        ? '#2563eb'
                        : '#dc2626',
                    fontSize: '12px',
                    fontWeight: '700',
                  }}
                >
                  {dep.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Cluster Status & Activity</div>
              <div className="panel-subtitle">Real-time node telemetry and access requests</div>
            </div>
            <button
              onClick={() => navigate('/admin/servers')}
              style={{
                background: '#f3f4f6',
                border: '1px solid #e5e7eb',
                borderRadius: '20px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#111827',
                cursor: 'pointer',
              }}
            >
              View Servers ↗
            </button>
          </div>

          <div style={{ overflowX: 'auto', flex: 1, display: 'flex', alignItems: 'center' }}>
            <table className="light-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Metric / ID</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="font-semibold">Registered Servers</td>
                  <td><code>1 Node</code></td>
                  <td><span className="status-pill-delivered">HEALTHY</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>1 Node Healthy</td>
                </tr>
                <tr>
                  <td className="font-semibold">Total Deployments</td>
                  <td><code>7 Projects</code></td>
                  <td><span className="status-pill-delivered">ACTIVE</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>2 Running</td>
                </tr>
                <tr>
                  <td className="font-semibold">Pending Requests</td>
                  <td><code>0 Requests</code></td>
                  <td><span className="status-pill-delivered">CLEAR</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>0 Users</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
