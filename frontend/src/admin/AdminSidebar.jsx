import { NavLink } from 'react-router-dom';

export default function AdminSidebar({ onLogout, isTestMode = false }) {
  const basePath = isTestMode ? '/test/admin' : '/admin';

  return (
    <aside className="vercel-sidebar admin-sidebar">
      <div className="sidebar-top">
        <div className="sidebar-section-title" style={{ color: isTestMode ? '#d97706' : '#64748b', fontWeight: 700, fontSize: '11px', letterSpacing: '0.08em', marginBottom: '14px', textTransform: 'uppercase' }}>
          {isTestMode ? '🧪 Admin (Standalone Test)' : 'Admin Control Plane'}
        </div>
        <nav className="sidebar-nav-list" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <NavLink
            to={`${basePath}/overview`}
            end={isTestMode}
            className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
              <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
              <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
              <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
            </svg>
            Overview
          </NavLink>

          <NavLink
            to={`${basePath}/servers`}
            className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            Servers
          </NavLink>

          <NavLink
            to={`${basePath}/infrastructure`}
            className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            Infrastructure
          </NavLink>

          <NavLink
            to={`${basePath}/requests`}
            className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
            Access Requests
          </NavLink>

          {isTestMode && (
            <NavLink
              to="/test/admin/deployments"
              className={({ isActive }) => `vercel-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
                <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                <polyline points="2 17 12 22 22 17"></polyline>
              </svg>
              Deployments
            </NavLink>
          )}
        </nav>

        {/* Mode Switcher - Only visible in Test Mode */}
        {isTestMode && (
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <NavLink
              to="/admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '8px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <span>⚡ Exit Test Mode</span>
            </NavLink>
          </div>
        )}
      </div>

      <div className="sidebar-bottom" style={{ marginTop: '20px' }}>
        {onLogout && (
          <button className="vercel-logout-button" onClick={onLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px' }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
