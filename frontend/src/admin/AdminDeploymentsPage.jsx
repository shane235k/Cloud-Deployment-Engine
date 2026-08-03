import { useEffect, useState } from 'react';
import { getAdminDeployments } from '../api';

export default function AdminDeploymentsPage() {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDeployments = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminDeployments();
      setDeployments(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch admin deployments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, []);

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'RUNNING':
        return <span className="badge badge-success">RUNNING</span>;
      case 'BUILDING':
      case 'DEPLOYING':
      case 'PENDING':
        return <span className="badge badge-warning">{status}</span>;
      case 'FAILED':
      case 'STOPPED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status || 'UNKNOWN'}</span>;
    }
  };

  if (loading) {
    return <div className="app-loading">Loading admin deployments...</div>;
  }

  if (error) {
    return (
      <div className="admin-page-container">
        <h1 className="page-title">Deployments Overview</h1>
        <div className="error-banner">
          <p>{error}</p>
          <button className="primary-button" onClick={fetchDeployments}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Deployments Overview</h1>
          <p className="page-subtitle">All application deployments across servers</p>
        </div>
        <button className="secondary-button" onClick={fetchDeployments}>
          Refresh
        </button>
      </div>

      {deployments.length === 0 ? (
        <div className="empty-state-card">
          <p>No deployments recorded yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Repository</th>
                <th>Status</th>
                <th>Assigned Server</th>
                <th>Pod Name</th>
                <th>Image Name</th>
                <th>Deployment Name</th>
                <th>Service Name</th>
                <th>Created Time</th>
                <th>Updated Time</th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((dep) => (
                <tr key={dep.id || dep._id}>
                  <td className="font-semibold">{dep.repoUrl}</td>
                  <td>{getStatusBadge(dep.status)}</td>
                  <td><code>{dep.assignedServer || 'Unassigned'}</code></td>
                  <td>{dep.podName || 'N/A'}</td>
                  <td>{dep.imageName || 'N/A'}</td>
                  <td>{dep.deploymentName || 'N/A'}</td>
                  <td>{dep.serviceName || 'N/A'}</td>
                  <td>{dep.createdTime ? new Date(dep.createdTime).toLocaleString() : 'N/A'}</td>
                  <td>{dep.updatedTime ? new Date(dep.updatedTime).toLocaleString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
