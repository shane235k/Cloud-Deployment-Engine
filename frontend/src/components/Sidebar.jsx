import { NavLink } from 'react-router-dom';

export default function Sidebar({ onLogout, userRole }) {
  const isAdmin = userRole === 'admin';

  return (
    <aside className="vercel-sidebar user-sidebar" style={{ background: '#000000', borderRight: '1px solid #111111' }}>
      <div className="sidebar-top" style={{ background: '#000000' }}>
        <div className="sidebar-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="search-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Find..." style={{ background: '#09090b', color: '#ffffff', border: '1px solid #18181b' }} />
        </div>

        <div className="sidebar-section-title" style={{ color: '#888888' }}>Projects & Platform</div>
        <nav className="sidebar-nav-list">
          <NavLink
            to="/dashboard/projects"
            className={({ isActive }) =>
              `vercel-sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Projects
          </NavLink>

          <NavLink
            to="/dashboard/deployments"
            className={({ isActive }) =>
              `vercel-sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 17 22 12"></polyline></svg>
            Deployments
          </NavLink>

          <NavLink
            to="/dashboard/monitoring"
            className={({ isActive }) =>
              `vercel-sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Monitoring
          </NavLink>

          {isAdmin && (
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: 'none' }}>
              <div className="sidebar-section-title" style={{ color: '#0070f3', fontWeight: 700 }}>ADMINISTRATION</div>
              <NavLink
                to="/admin"
                className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
                style={{ background: 'rgba(0, 112, 243, 0.12)', color: '#58a6ff', border: '1px solid rgba(0, 112, 243, 0.3)', marginTop: '8px', fontWeight: '600' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                Admin Control Plane
              </NavLink>
            </div>
          )}
        </nav>
      </div>

      <div className="sidebar-bottom" style={{ background: '#000000', borderTop: 'none' }}>
        <button className="vercel-logout-button" onClick={onLogout} style={{ background: '#09090b', color: '#a1a1aa', border: '1px solid #18181b' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}