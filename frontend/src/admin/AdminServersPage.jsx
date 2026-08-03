import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminServers } from '../api';
import ServerTerminalModal from './ServerTerminalModal';

export default function AdminServersPage() {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTerminalServer, setSelectedTerminalServer] = useState(null);
  const navigate = useNavigate();

  const fetchServers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminServers();
      setServers(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch servers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'HEALTHY':
        return <span className="badge badge-success">HEALTHY</span>;
      case 'BUSY':
        return <span className="badge badge-warning">BUSY</span>;
      case 'OFFLINE':
        return <span className="badge badge-danger">OFFLINE</span>;
      default:
        return <span className="badge badge-neutral">{status || 'UNKNOWN'}</span>;
    }
  };

  const formatHeartbeat = (ts) => {
    if (!ts) return 'N/A';
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  if (loading) {
    return <div className="app-loading">Loading server registry...</div>;
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <h1 className="page-title">Registered Servers</h1>
        <div className="error-banner">
          <p>{error}</p>
          <button className="primary-button" onClick={fetchServers}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Registered Servers</h1>
          <p className="page-subtitle">Monitored cluster nodes and deployment hosts</p>
        </div>
        <button className="secondary-button" onClick={fetchServers}>
          Refresh
        </button>
      </div>

      {servers.length === 0 ? (
        <div className="empty-state-card">
          <p>No servers registered in the platform registry yet.</p>
        </div>
      ) : (
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
                <th>Last Heartbeat</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {servers.map((server) => (
                <tr
                  key={server.id || server._id}
                  className="clickable-row"
                  onClick={() => navigate(`/admin/servers/${server.id || server._id}`)}
                >
                  <td className="font-semibold">{server.name}</td>
                  <td>{getStatusBadge(server.status)}</td>
                  <td><code>{server.publicIp}</code></td>
                  <td>{server.cpuUsage}%</td>
                  <td>{server.ramUsage}%</td>
                  <td>{server.diskUsage}%</td>
                  <td>{server.podCount}</td>
                  <td>{server.activeDeployments}</td>
                  <td>{server.activeDeployments} / {server.maxDeployments}</td>
                  <td>{formatHeartbeat(server.lastHeartbeat)}</td>
                  <td>
                    <button
                      className="secondary-button"
                      style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTerminalServer(server);
                      }}
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
      )}

      {selectedTerminalServer && (
        <ServerTerminalModal
          server={selectedTerminalServer}
          onClose={() => setSelectedTerminalServer(null)}
        />
      )}
    </div>
  );
}
