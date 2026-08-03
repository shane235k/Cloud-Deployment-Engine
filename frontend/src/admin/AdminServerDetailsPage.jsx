import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAdminServerById } from '../api';
import ServerTerminalModal from './ServerTerminalModal';

// Semi-Circular Gauge Ring for CPU, RAM, Disk
function SemiGaugeRing({ valuePercent = 0, label = 'USAGE' }) {
  const angle = 180 + (valuePercent / 100) * 180;
  const rad = (angle * Math.PI) / 180;
  const r = 42;
  const cx = 65;
  const cy = 60;
  const nx = cx + r * Math.cos(rad);
  const ny = cy + r * Math.sin(rad);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '8px 0' }}>
      <svg width="190" height="100" viewBox="0 0 130 70" style={{ overflow: 'visible' }}>
        <path d="M 12 60 A 52 52 0 0 1 118 60" fill="none" stroke="#e5e7eb" strokeWidth="1.5" strokeDasharray="2 3" />
        <path d="M 23 60 A 42 42 0 0 1 107 60" fill="none" stroke="#f3f4f6" strokeWidth="13" strokeLinecap="round" />
        <path
          d="M 23 60 A 42 42 0 0 1 107 60"
          fill="none"
          stroke="#000000"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray="131.95"
          strokeDashoffset={131.95 - (131.95 * valuePercent) / 100}
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
        <circle cx={nx} cy={ny} r="5" fill="#000000" stroke="#ffffff" strokeWidth="2" />
      </svg>
      <div style={{ marginTop: '-14px', textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: '800', color: '#000000' }}>{valuePercent}%</div>
        <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#000000', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: '2px' }}>
          {label}
        </div>
      </div>
    </div>
  );
}

// Default Speedometer SVG for System Uptime (Matching reference screenshot dial with ticks & needle)
function UptimeSpeedometer({ uptimeText = 'N/A' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '16px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', width: '100%' }}>
      <svg width="160" height="90" viewBox="0 0 120 70" style={{ overflow: 'visible' }}>
        {/* Outer Arc with Notch Cutouts */}
        <path
          d="M 12 60 A 48 48 0 0 1 108 60"
          fill="none"
          stroke="#000000"
          strokeWidth="11"
          strokeLinecap="round"
        />
        {/* Inner Ticks */}
        <line x1="32" y1="40" x2="38" y2="44" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="18" x2="60" y2="25" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="88" y1="40" x2="82" y2="44" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
        {/* Angled Needle Pointer */}
        <line x1="50" y1="52" x2="92" y2="22" stroke="#000000" strokeWidth="8" strokeLinecap="round" />
        <circle cx="50" cy="52" r="9" fill="#000000" />
      </svg>
      <div style={{ marginTop: '-4px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '800', color: '#000000' }}>{uptimeText || 'N/A'}</div>
        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>
          SYSTEM UPTIME
        </div>
      </div>
    </div>
  );
}

export default function AdminServerDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [server, setServer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTerminalModal, setShowTerminalModal] = useState(false);

  const fetchServerDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminServerById(id);
      setServer(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch server details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServerDetails();
  }, [id]);

  if (loading) {
    return <div className="app-loading">Loading server details...</div>;
  }

  if (error || !server) {
    return (
      <div className="admin-page-container">
        <button
          className="secondary-button"
          onClick={() => navigate('/admin/servers')}
          style={{ marginBottom: '16px' }}
        >
          ← Back to Servers
        </button>
        <div className="error-banner">
          <p>{error || 'Server not found'}</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = (status || 'UNKNOWN').toUpperCase();
    switch (s) {
      case 'HEALTHY':
        return <span style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em' }}>HEALTHY</span>;
      case 'BUSY':
        return <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid #fde68a', padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em' }}>BUSY</span>;
      case 'OFFLINE':
        return <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em' }}>OFFLINE</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '4px 12px', borderRadius: '12px', fontSize: '11.5px', fontWeight: '800', letterSpacing: '0.04em' }}>{s}</span>;
    }
  };

  return (
    <div className="admin-page-container" style={{ background: '#f8fafc' }}>
      {/* Top Header */}
      <div className="admin-header" style={{ marginBottom: '24px' }}>
        <div>
          <button
            onClick={() => navigate('/admin/servers')}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '12.5px',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '12px',
            }}
          >
            ← Back to Servers
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 className="page-title" style={{ color: '#0f172a', fontSize: '26px', fontWeight: '800' }}>{server.name}</h1>
            {getStatusBadge(server.status)}
          </div>
          <p className="page-subtitle" style={{ color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
            Server ID: <code>{server._id || server.id}</code>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setShowTerminalModal(true)}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            Connect Terminal
          </button>
          <button
            onClick={fetchServerDetails}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Main Grid: Increased TELEMETRY AND METRICS width to 420px with smooth flex flow */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px', alignItems: 'stretch' }}>
        
        {/* Left Column: TELEMETRY AND METRICS (Expanded Width Card) */}
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em', width: '100%', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
            TELEMETRY AND METRICS
          </h3>

          {/* 3 Semi-Circular Gauge Rings */}
          <SemiGaugeRing valuePercent={server.cpuUsage || 0} label="CPU USAGE" />
          <SemiGaugeRing valuePercent={server.ramUsage || 0} label="RAM USAGE" />
          <SemiGaugeRing valuePercent={server.diskUsage || 0} label="DISK USAGE" />

          {/* Default Speedometer SVG for System Uptime */}
          <UptimeSpeedometer uptimeText={server.uptime || 'up 46 minutes'} />
        </div>

        {/* Right Column: Top 2 Cards + Bottom Wide Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Row: 2 Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* Card 1: Workload & Capacity */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                Workload & Capacity
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Active Deployments:</span>
                  <span style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: '800' }}>
                    {server.activeDeployments || 0}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Max Deployment Capacity:</span>
                  <span style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #cbd5e1', padding: '3px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: '800' }}>
                    {server.maxDeployments || 10}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Total Pods:</span>
                  <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '3px 10px', borderRadius: '12px', fontSize: '14px', fontWeight: '800' }}>
                    {server.podCount || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Timestamps & Status */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  Timestamps & Status
                </h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  <path d="M3.5 12h4l2.5-4 3 8 2.5-4h4.5" stroke="#0f172a" strokeWidth="2.5"></path>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                    <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Last Heartbeat:</span>
                  </div>
                  <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '800' }}>
                    {server.lastHeartbeat ? new Date(server.lastHeartbeat).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                  <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Registered At:</span>
                  <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '800' }}>
                    {server.createdAt ? new Date(server.createdAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Last Updated At:</span>
                  <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: '800' }}>
                    {server.updatedAt ? new Date(server.updatedAt).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Row: Network & Identity Wide Card with Tag Pills */}
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flex: 1 }}>
            <h3 style={{ fontSize: '15.5px', fontWeight: '800', color: '#0f172a', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              Network & Identity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Public IP:</span>
                <code style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800' }}>
                  {server.publicIp}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Private IP:</span>
                <code style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800' }}>
                  {server.privateIp || 'N/A'}
                </code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>SSH User:</span>
                <span style={{ background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800' }}>
                  {server.sshUser || 'ubuntu'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#0f172a', fontSize: '13.5px', fontWeight: '600' }}>Cluster Type:</span>
                <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '800' }}>
                  {server.clusterType || 'k3s'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {showTerminalModal && (
        <ServerTerminalModal
          server={server}
          onClose={() => setShowTerminalModal(false)}
        />
      )}
    </div>
  );
}
