import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ authenticated, username, userRole, onLogout }) {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname.startsWith('/test/admin');
  const isAdmin = userRole === 'admin';

  return (
    <nav className={`global-navbar ${isAdminPage ? 'global-navbar--white' : 'global-navbar--black'}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" style={{ color: isAdminPage ? '#000000' : '#ffffff' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12" stroke={isAdminPage ? "#000000" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16C4 16 7.5 10 12 10C16.5 10 20 16 20 16" stroke={isAdminPage ? "#000000" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 20C8 20 10 16 12 16C14 16 16 20 16 20" stroke={isAdminPage ? "#000000" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          P377
        </Link>
        <div className="navbar-links">
          <Link to="/features" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Features</Link>
          <Link to="/methods" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Methods</Link>
          <Link to="/customers" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Customers</Link>
          <Link to="/pricing" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Pricing</Link>
          <Link to="/changelog" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Changelog</Link>
          <Link to="/contact" style={{ color: isAdminPage ? '#334155' : '#a1a1aa' }}>Contact</Link>
        </div>
        <div className="navbar-auth">
          {authenticated ? (
            <>
              {isAdmin ? (
                <Link
                  to="/admin"
                  style={isAdminPage ? { background: '#000000', color: '#ffffff', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' } : undefined}
                  className={!isAdminPage ? "nav-btn nav-btn-secondary" : ""}
                >
                  Admin Console
                </Link>
              ) : (
                <Link to="/dashboard" className="nav-btn nav-btn-secondary">
                  Dashboard
                </Link>
              )}
              <button
                onClick={onLogout}
                style={isAdminPage ? { background: '#ffffff', color: '#000000', border: '1px solid #cbd5e1', padding: '6px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' } : undefined}
                className={!isAdminPage ? "nav-btn nav-btn-secondary" : ""}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn-secondary">Login</Link>
              <Link to="/register-request" className="nav-btn nav-btn-primary">Request Access</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
