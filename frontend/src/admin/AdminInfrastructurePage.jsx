import { useEffect, useState } from 'react';
import { triggerAdminProvision, getAdminProvisionJobs } from '../api';

export default function AdminInfrastructurePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAdminProvisionJobs();
      setJobs(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch provision jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleProvision = async () => {
    try {
      setProvisioning(true);
      setMessage(null);
      setError('');

      const res = await triggerAdminProvision();
      setMessage(res.message || 'Provision Server pipeline triggered successfully!');
      
      // Refresh jobs list after short delay
      setTimeout(fetchJobs, 2000);
    } catch (err) {
      setError(err.message || 'Failed to trigger server provisioning');
    } finally {
      setProvisioning(false);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return <span className="badge badge-success">SUCCESS</span>;
      case 'IN_PROGRESS':
      case 'BUILDING':
        return <span className="badge badge-warning">IN PROGRESS</span>;
      case 'FAILURE':
      case 'FAILED':
      case 'ABORTED':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status || 'PENDING'}</span>;
    }
  };

  return (
    <div className="admin-page-container">
      <div className="admin-header">
        <div>
          <h1 className="page-title">Infrastructure Provisioning</h1>
          <p className="page-subtitle">Provision new EC2 deployment servers & view pipeline history</p>
        </div>
      </div>

      <div className="admin-action-card">
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>Provision New Server</h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Triggers the Jenkins Provision Server pipeline to launch and configure a new EC2 K3s node.
          </p>
        </div>
        <button
          className="primary-button-large"
          onClick={handleProvision}
          disabled={provisioning}
        >
          {provisioning ? 'Triggering Jenkins Pipeline...' : '🚀 Provision Server'}
        </button>
      </div>

      {message && (
        <div className="success-banner" style={{ margin: '16px 0' }}>
          {message}
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ margin: '16px 0' }}>
          {error}
        </div>
      )}

      <div className="admin-section" style={{ marginTop: '32px' }}>
        <div className="admin-header">
          <h2 style={{ fontSize: '20px', fontWeight: 600 }}>Recent Provision Pipeline Builds</h2>
          <button className="secondary-button" onClick={fetchJobs} disabled={loading}>
            Refresh Jobs
          </button>
        </div>

        {loading ? (
          <div className="app-loading">Loading build history...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state-card">
            <p>No recent provision builds found on Jenkins.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Build Number</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                  <th>Jenkins URL</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">#{job.buildNumber}</td>
                    <td>{getStatusBadge(job.status)}</td>
                    <td>{formatDuration(job.duration)}</td>
                    <td>{job.timestamp ? new Date(job.timestamp).toLocaleString() : 'N/A'}</td>
                    <td>
                      {job.url ? (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="link-button">
                          View Build ↗
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
