import { useNavigate } from 'react-router-dom';

function getStatusColor(status) {
  switch (status) {
    case 'RUNNING':
      return '#10b981'; // Green
    case 'FAILED':
      return '#ef4444'; // Red
    case 'STOPPED':
      return '#8b5cf6'; // Purple
    default:
      return '#f59e0b'; // Yellow (Building)
  }
}

function timeAgo(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + 'y';
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm';
  return Math.floor(seconds) + 's';
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function DeploymentsPage({
  deployments,
  loading,
}) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="vercel-projects-page" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>
        <p style={{ color: '#888' }}>Fetching deployments...</p>
      </div>
    );
  }

  if (deployments.length === 0) {
    return (
      <div className="vercel-projects-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column' }}>
        <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '20px' }}>No Deployments Found</h2>
        <p style={{ color: '#888', marginBottom: '24px' }}>You haven't deployed any projects yet.</p>
        <button className="vp-btn-primary" onClick={() => navigate('/dashboard/new')}>
          Deploy a Project
        </button>
      </div>
    );
  }

  return (
    <div className="vercel-projects-page">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>Deployments</h1>
        <p style={{ color: '#888', fontSize: '15px', margin: 0 }}>Review the comprehensive history of your application builds and deployments.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {deployments.map((deployment) => (
          <div
            key={deployment._id}
            onClick={() => navigate(`/dashboard/deployments/${deployment._id}`)}
            style={{ 
              background: '#000', 
              border: '1px solid #222', 
              borderRadius: '10px', 
              padding: '24px', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#444';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#222';
              e.currentTarget.style.transform = 'none';
            }}
          >
            {/* Left Side: Descriptive Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: '600', letterSpacing: '-0.01em' }}>
                  {deployment.projectName}
                </h3>
                
                <span style={{ color: '#666', background: '#111', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
                  ID: {deployment._id.slice(0, 8)}
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: getStatusColor(deployment.status) + '15', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${getStatusColor(deployment.status)}30` }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: getStatusColor(deployment.status), boxShadow: `0 0 8px ${getStatusColor(deployment.status)}` }}></div>
                  <span style={{ color: getStatusColor(deployment.status), fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {deployment.status === 'RUNNING' ? 'Active' : deployment.status}
                  </span>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#888', fontSize: '14px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                  Deployed from <strong style={{ color: '#ededed', fontWeight: '500' }}>{deployment.repoUrl.replace('https://github.com/', '')}</strong>
                </div>
                
                <span style={{ color: '#444' }}>•</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>
                  branch <strong style={{ color: '#ededed', fontFamily: 'monospace', fontWeight: '500' }}>main</strong>
                </div>
              </div>

              <p style={{ color: '#666', fontSize: '13.5px', margin: 0, lineHeight: '1.5' }}>
                Configured as a <strong style={{ color: '#a1a1a1', fontWeight: '500' }}>{deployment.projectType || 'frontend'}</strong> application utilizing the <strong style={{ color: '#a1a1a1', fontWeight: '500' }}>{deployment.framework || 'react'}</strong> framework. <br />
                Files outputted to <code style={{ color: '#888', background: '#111', padding: '2px 4px', borderRadius: '4px' }}>{deployment.outputDirectory || 'dist'}</code> via <code style={{ color: '#888', background: '#111', padding: '2px 4px', borderRadius: '4px' }}>{deployment.buildCommand || 'npm run build'}</code>.
              </p>
            </div>

            {/* Right Side: Timing & Action */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ color: '#ededed', fontSize: '15px', fontWeight: '500' }}>{timeAgo(deployment.createdAt)} ago</span>
                <span style={{ color: '#666', fontSize: '12px' }}>{formatDate(deployment.createdAt)}</span>
              </div>
              
              <div className="vp-deployment-action" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '13px', fontWeight: '500' }}>
                View Details 
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}