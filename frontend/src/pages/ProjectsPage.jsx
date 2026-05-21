import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProjectsPage({ deployments = [] }) {
  const navigate = useNavigate();

  const runningApps = deployments.filter(d => d.status === 'RUNNING').length;
  const stoppedApps = deployments.filter(d => d.status === 'STOPPED').length;
  const failedApps = deployments.filter(d => d.status === 'FAILED').length;
  const totalApps = deployments.length;

  return (
    <div className="vercel-projects-page">
      <div className="vp-header">
        <div className="vp-search-container">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search Projects..." />
        </div>
        <div className="vp-actions">
          <button className="vp-btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg></button>
          <button className="vp-btn-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
          <button className="vp-btn-primary" onClick={() => navigate('/dashboard/new')}>
            Add New...
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: '8px', width: '14px'}}><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
      </div>

      <div className="vp-content-grid">
        {/* Mock Usage & Alerts Sidebar from screenshot */}
        <div className="vp-left-column">
          <div className="vp-section">
            <div className="vp-section-header">Usage</div>
            <div className="vp-card usage-card">
              <div className="usage-header">
                <span>Account Usage</span>
                <span className="upgrade-badge">Upgrade</span>
              </div>
              <div className="usage-row">
                <span className="usage-label"><span className="dot blue"></span> Total Deployments</span>
                <span className="usage-value" style={{ fontWeight: '600', color: '#ededed' }}>{totalApps}</span>
              </div>
              <div className="usage-row">
                <span className="usage-label"><span className="dot green"></span> Running</span>
                <span className="usage-value" style={{ fontWeight: '600', color: '#10b981' }}>{runningApps}</span>
              </div>
              <div className="usage-row">
                <span className="usage-label"><span className="dot purple"></span> Stopped</span>
                <span className="usage-value" style={{ fontWeight: '600', color: '#8b5cf6' }}>{stoppedApps}</span>
              </div>
              <div className="usage-row">
                <span className="usage-label"><span className="dot red" style={{ background: '#ef4444' }}></span> Failed</span>
                <span className="usage-value" style={{ fontWeight: '600', color: '#ef4444' }}>{failedApps}</span>
              </div>
            </div>
          </div>

          <div className="vp-section">
            <div className="vp-section-header">Alerts</div>
            <div className="vp-card alerts-card">
              <p>Failed to load alerts</p>
            </div>
          </div>

          <div className="vp-section">
            <div className="vp-section-header">Recent Previews</div>
            <div className="vp-card previews-card">
              <div className="preview-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4l3 3"></path></svg>
              </div>
              <p>Preview deployments that you have recently visited or created will appear here.</p>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="vp-main-column">
          <div className="vp-section-header" style={{ marginLeft: '12px' }}>Projects</div>
          <div className="vp-projects-grid">
            {deployments && deployments.length > 0 ? (
              deployments.map(dep => (
                <Link to={`/dashboard/deployments/${dep._id}`} key={dep._id} className="vp-project-card">
                  <div className="vpc-header">
                    <div className="vpc-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg>
                    </div>
                    <div className="vpc-title">
                      <h3>{dep.projectName || dep.repoUrl.split('/').pop().replace('.git', '')}</h3>
                      <span>{dep.repoUrl ? dep.repoUrl.replace('https://github.com/', '') : ''}</span>
                    </div>
                    <div className="vpc-status">
                      <svg viewBox="0 0 24 24" fill="currentColor" className={`status-icon ${dep.status}`}><circle cx="12" cy="12" r="6"></circle></svg>
                    </div>
                  </div>
                  <div className="vpc-meta">
                    <span className="vpc-branch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg> main</span>
                    <span className="vpc-time">{new Date(dep.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))
            ) : (
              <>
                <div className="vp-project-card">
                  <div className="vpc-header">
                    <div className="vpc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle></svg></div>
                    <div className="vpc-title">
                      <h3>portfolio-235k</h3>
                      <span>shane235k/Portfolio</span>
                    </div>
                    <div className="vpc-status"><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="8"></circle><path fill="#000" d="M9 12l2 2 4-4"></path></svg></div>
                  </div>
                  <div className="vpc-meta"><span className="vpc-branch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg> main</span><span className="vpc-time">Mar 27</span></div>
                </div>
                <div className="vp-project-card">
                  <div className="vpc-header">
                    <div className="vpc-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 22 22 22"></polygon></svg></div>
                    <div className="vpc-title">
                      <h3>aryan-portfolio</h3>
                      <span>shane235k/Aryan-Portfolio</span>
                    </div>
                    <div className="vpc-status"><svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="8"></circle><path fill="#000" d="M9 12l2 2 4-4"></path></svg></div>
                  </div>
                  <div className="vpc-meta"><span className="vpc-branch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg> main</span><span className="vpc-time">Mar 23</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
