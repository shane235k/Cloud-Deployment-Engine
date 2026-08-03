import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminSystemSummary } from '../api';
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

// Top Card Radial Gauge
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
        {/* Outer Dotted Guideline */}
        <path
          d="M 14 65 A 56 56 0 0 1 126 65"
          fill="none"
          stroke="#d1d5db"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        {/* Background Track Arc */}
        <path
          d="M 24 65 A 46 46 0 0 1 116 65"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Active Black Filled Arc */}
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
        {/* Indicator Dot */}
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

export default function AdminOverviewPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedServerId, setSelectedServerId] = useState('');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminSystemSummary();
      setSummary(data);

      const healthy = (data?.servers || []).filter((s) => s.status === 'HEALTHY' || !s.status);
      if (healthy.length > 0) {
        setSelectedServerId(healthy[0].id || healthy[0]._id);
      } else if ((data?.servers || []).length > 0) {
        setSelectedServerId(data.servers[0].id || data.servers[0]._id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch platform summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return <div className="app-loading">Loading platform telemetry analytics...</div>;
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <h1 className="page-title">Admin Dashboard</h1>
        <div className="error-banner">
          <p>{error}</p>
          <button className="primary-button" onClick={fetchSummary}>Retry</button>
        </div>
      </div>
    );
  }

  const totalServers = summary?.totalServers || 0;
  const healthyServers = summary?.healthyServers || 0;
  const busyServers = summary?.busyServers || 0;
  const offlineServers = summary?.offlineServers || 0;
  const totalDeployments = summary?.totalDeployments || 0;
  const runningDeployments = summary?.runningDeployments || 0;
  const failedDeployments = summary?.failedDeployments || 0;
  const buildingDeployments = summary?.buildingDeployments || 0;
  const stoppedDeployments = summary?.stoppedDeployments || 0;
  const pendingRequests = summary?.pendingRequests || 0;

  const serverHealthRate = totalServers > 0 ? Math.round((healthyServers / totalServers) * 100) : 100;
  const deploymentSuccessRate = totalDeployments > 0 ? Math.round((runningDeployments / totalDeployments) * 100) : 100;

  const serversList = summary?.servers || [];
  const healthyList = serversList.filter((s) => s.status === 'HEALTHY' || !s.status);
  const activeDropdownList = healthyList.length > 0 ? healthyList : serversList;

  const selectedServer =
    serversList.find((s) => (s.id || s._id) === selectedServerId) ||
    activeDropdownList[0] ||
    { cpuUsage: 0, ramUsage: 0, diskUsage: 0, name: 'No Server' };

  // Graph 2: Standard Black Bar Chart for Deployments Breakdown
  const barChartData = {
    labels: ['RUNNING', 'BUILDING', 'STOPPED', 'FAILED'],
    datasets: [
      {
        label: 'Deployments Count',
        data: [runningDeployments, buildingDeployments, stoppedDeployments, failedDeployments],
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
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>
            Platform Telemetry & DevOps Analytics
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>
            Live platform telemetry, cluster node metrics & deployment workloads
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={fetchSummary}
            style={{
              background: '#ffffff',
              color: '#111827',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Top Row: 4 Primary Speedometer Radial Gauge Cards */}
      <div className="analytics-gauge-grid">
        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">TOTAL SERVERS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>{healthyServers} / {totalServers} Nodes Healthy</div>
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
            <RadialGauge valuePercent={serverHealthRate} />
            <div className="gauge-value">{totalServers} Nodes</div>
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
            <RadialGauge valuePercent={Math.min(100, totalDeployments * 10 || 50)} />
            <div className="gauge-value">{totalDeployments} Projects</div>
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">RUNNING DEPLOYMENTS</div>
              <div className="gauge-card-sub" style={{ color: '#10b981' }}>{deploymentSuccessRate}% Success rate</div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={deploymentSuccessRate} />
            <div className="gauge-value">{runningDeployments} Active</div>
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-card-header">
            <div>
              <div className="gauge-card-title">PENDING REQUESTS</div>
              <div className="gauge-card-sub" style={{ color: pendingRequests > 0 ? '#f59e0b' : '#10b981' }}>
                {pendingRequests > 0 ? 'Onboarding Queue Active' : 'Queue Empty'}
              </div>
            </div>
            <div className="gauge-card-icon-pill">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
              </svg>
            </div>
          </div>
          <div className="gauge-card-body">
            <RadialGauge valuePercent={Math.min(100, pendingRequests * 25 || 20)} />
            <div className="gauge-value">{pendingRequests} Pending</div>
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
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#000000' }}>{healthyServers} Nodes</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>BUSY SERVERS</span>
            <span className="status-pill-pending">BUSY</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#000000' }}>{busyServers} Nodes</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>OFFLINE SERVERS</span>
            <span style={{ background: offlineServers > 0 ? '#fef2f2' : '#ecfdf5', color: offlineServers > 0 ? '#dc2626' : '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
              {offlineServers > 0 ? 'OFFLINE' : 'ONLINE'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: offlineServers > 0 ? '#000000' : '#000000' }}>{offlineServers} Nodes</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #eaedf1', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#6b7280', letterSpacing: '0.04em' }}>FAILED DEPLOYMENTS</span>
            <span style={{ background: failedDeployments > 0 ? '#fef2f2' : '#ecfdf5', color: failedDeployments > 0 ? '#dc2626' : '#059669', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
              {failedDeployments > 0 ? 'FAILED' : 'CLEAN'}
            </span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: failedDeployments > 0 ? '#000000' : '#000000' }}>{failedDeployments} Projects</div>
        </div>
      </div>

      {/* Middle Row: 3 Speedometer Gauges with Dropdown (Left) & Solid Black Bar Chart (Right) */}
      <div className="analytics-middle-grid">
        {/* Left Panel: Healthy Server Selection + 3 Black & White Speedometer Gauges */}
        <div className="analytics-panel">
          <div className="panel-header" style={{ alignItems: 'center' }}>
            <div>
              <div className="panel-title">Server Telemetry Load</div>
              <div className="panel-subtitle">
                CPU, RAM & Disk load for {selectedServer.name || 'selected node'}
              </div>
            </div>
            {/* Sleek White Dropdown */}
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
              {activeDropdownList.length > 0 ? (
                activeDropdownList.map((srv) => (
                  <option key={srv.id || srv._id} value={srv.id || srv._id}>
                    {srv.name} ({srv.publicIp})
                  </option>
                ))
              ) : (
                <option value="">No Healthy Servers</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '25px 10px 10px 10px', minHeight: '260px' }}>
            <SpeedometerGauge valuePercent={selectedServer.cpuUsage || 0} label="CPU Usage" />
            <SpeedometerGauge valuePercent={selectedServer.ramUsage || 0} label="RAM Usage" />
            <SpeedometerGauge valuePercent={selectedServer.diskUsage || 0} label="Disk Usage" />
          </div>
        </div>

        {/* Right Panel: Standard Black Bar Chart for Deployments Breakdown */}
        <div className="analytics-panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Deployments Status Breakdown</div>
              <div className="panel-subtitle">Real workload counts grouped by status</div>
            </div>
          </div>
          <div style={{ height: '270px', width: '100%' }}>
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Row: Deployed Projects (Left) + Cluster Status Table (Right) matching heights */}
      <div className="analytics-bottom-grid">
        {/* Left Panel: All Deployed Projects with Invisible Scrollbar */}
        <div className="analytics-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Deployed Projects & Workloads ({summary?.topDeployments?.length || 0})</div>
              <div className="panel-subtitle">Real active applications in MongoDB</div>
            </div>
          </div>

          <div className="no-scrollbar" style={{ marginTop: '8px', maxHeight: '235px', overflowY: 'auto' }}>
            {summary?.topDeployments?.length > 0 ? (
              summary.topDeployments.map((dep) => (
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
              ))
            ) : (
              <div style={{ padding: '20px 0', color: '#6b7280', fontSize: '13px', textAlign: 'center' }}>
                No active deployments created yet
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Cluster Summary Table matching height */}
        <div className="analytics-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Cluster Status & Registrations</div>
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
                  <td><code>{totalServers} Nodes</code></td>
                  <td><span className="status-pill-delivered">ONLINE</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>{healthyServers} Healthy</td>
                </tr>
                <tr>
                  <td className="font-semibold">Total Deployments</td>
                  <td><code>{totalDeployments} Projects</code></td>
                  <td><span className="status-pill-delivered">ACTIVE</span></td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>{runningDeployments} Running</td>
                </tr>
                <tr>
                  <td className="font-semibold">Pending Requests</td>
                  <td><code>{pendingRequests} Requests</code></td>
                  <td>
                    {pendingRequests > 0 ? (
                      <span className="status-pill-pending">ACTION NEEDED</span>
                    ) : (
                      <span className="status-pill-delivered">CLEAR</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700' }}>{pendingRequests} Users</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
