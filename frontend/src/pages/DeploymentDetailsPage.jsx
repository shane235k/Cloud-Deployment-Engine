import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getDeployment,
  getDeploymentMetrics,
  startDeployment,
  stopDeployment,
  deleteDeployment
} from '../api';

function getStatusClass(status) {
  switch (status) {
    case 'RUNNING':
      return 'status running';
    case 'FAILED':
      return 'status failed';
    case 'STOPPED':
      return 'status stopped';
    default:
      return 'status building';
  }
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

export default function DeploymentDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deployment, setDeployment] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeployment = async () => {
    try {
      const data = await getDeployment(id);
      setDeployment(data);
    } catch (error) {
      console.error('Failed to fetch deployment:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      const data = await getDeploymentMetrics(id);
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    }
  };

  useEffect(() => {
    fetchDeployment();
    fetchMetrics();

    const interval = setInterval(() => {
      fetchDeployment();
      fetchMetrics();
    }, 60000); // 1 minute interval

    return () => clearInterval(interval);
  }, [id]);

  const handleStart = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await startDeployment(id);
      await fetchDeployment();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to start deployment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      await stopDeployment(id);
      await fetchDeployment();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to stop deployment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (actionLoading) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${deployment.projectName}"? This will remove all Kubernetes resources and delete the project record.`
    );
    if (!confirmDelete) return;

    setActionLoading(true);
    try {
      await deleteDeployment(id);
      navigate('/dashboard/projects');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to delete deployment');
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="vercel-projects-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <p style={{ color: '#888' }}>Loading deployment...</p>
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="vercel-projects-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <p style={{ color: '#888' }}>Deployment not found.</p>
      </div>
    );
  }

  return (
    <div className="vercel-projects-page">
      
      {/* Top Navigation */}
      <div style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => navigate('/dashboard/projects')} 
          style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', padding: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back to Projects
        </button>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '1px solid #222', paddingBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#fff', margin: '0 0 12px 0' }}>{deployment.projectName}</h1>
          <a href={deployment.repoUrl} target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            {deployment.repoUrl.replace('https://github.com/', '')}
          </a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className={getStatusClass(deployment.status)} style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {deployment.status}
          </span>
          {deployment.url && (
            <a href={deployment.url} target="_blank" rel="noreferrer" className="vp-btn-primary" style={{ textDecoration: 'none' }}>
              Visit <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginLeft: '6px'}}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          )}
          {/* Start / Stop controls */}
          {deployment.status === 'RUNNING' ? (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              style={{
                padding: '7px 18px', borderRadius: '6px', border: '1px solid #ef4444',
                background: 'transparent', color: '#ef4444', fontSize: '13px',
                fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
              {actionLoading ? 'Stopping...' : 'Stop'}
            </button>
          ) : (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              style={{
                padding: '7px 18px', borderRadius: '6px', border: '1px solid #10b981',
                background: 'transparent', color: '#10b981', fontSize: '13px',
                fontWeight: '600', cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#10b981"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {actionLoading ? 'Starting...' : 'Start'}
            </button>
          )}

          {/* Delete control */}
          <button
            onClick={handleDelete}
            disabled={actionLoading}
            style={{
              padding: '7px 14px', borderRadius: '6px', border: '1px solid #333',
              background: '#111', color: '#ff4d4f', fontSize: '13px',
              fontWeight: '500', cursor: actionLoading ? 'not-allowed' : 'pointer',
              opacity: actionLoading ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '6px'
            }}
            title="Delete deployment"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            {actionLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Pod Health Cards Grid */}
      {metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <span style={{ display: 'block', color: '#666', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</span>
            <span style={{ color: metrics.podStatus === 'Running' ? '#10b981' : '#f59e0b', fontWeight: '700', fontSize: '20px' }}>{metrics.podStatus || '-'}</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <span style={{ display: 'block', color: '#666', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CPU Usage</span>
            <span style={{ color: '#000', fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em' }}>{metrics.cpu || '-'}</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <span style={{ display: 'block', color: '#666', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Memory Usage</span>
            <span style={{ color: '#000', fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em' }}>{metrics.memory || '-'}</span>
          </div>
          <div style={{ background: '#fff', border: '1px solid #e5e5e5', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}>
            <span style={{ display: 'block', color: '#666', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Restarts</span>
            <span style={{ color: '#000', fontWeight: '700', fontSize: '20px', letterSpacing: '-0.02em' }}>{metrics.restarts || '0'}</span>
          </div>
        </div>
      )}

      {/* Main Content Layout: Logs (Left 2/3) and Info (Right 1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0' }}>Build Logs</h2>
            <div style={{ background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', padding: '20px', height: '500px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12.5px', color: '#a1a1a1', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {(deployment.logs && deployment.logs.length > 0) ? deployment.logs.join('\n') : 'Awaiting build logs...'}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Deployment Info Card */}
          <div style={{ background: '#000', border: '1px solid #222', borderRadius: '8px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#fff', margin: '0 0 16px 0', borderBottom: '1px solid #1a1a1a', paddingBottom: '12px' }}>Deployment Info</h3>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Project Type</span>
              <span style={{ color: '#ededed', fontWeight: '500' }}>{deployment.projectType || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Framework</span>
              <span style={{ color: '#ededed', fontWeight: '500' }}>{deployment.framework || '-'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Build Command</span>
              <code style={{ background: '#111', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{deployment.buildCommand || '-'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Output Directory</span>
              <code style={{ background: '#111', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>{deployment.outputDirectory || '-'}</code>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Created</span>
              <span style={{ color: '#ededed' }}>{formatDate(deployment.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#888' }}>Image</span>
              <span style={{ color: '#ededed', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={deployment.imageName}>{deployment.imageName || '-'}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}