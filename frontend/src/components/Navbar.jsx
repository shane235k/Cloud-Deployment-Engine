import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ authenticated, username, onLogout }) {
  return (
    <nav className="global-navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M4 16C4 16 7.5 10 12 10C16.5 10 20 16 20 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 20C8 20 10 16 12 16C14 16 16 20 16 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          P377
        </Link>
        <div className="navbar-links">
          <Link to="/features">Features</Link>
          <Link to="/methods">Methods</Link>
          <Link to="/customers">Customers</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/changelog">Changelog</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <div className="navbar-auth">
          {authenticated ? (
            <>
              <Link to="/dashboard" className="nav-btn nav-btn-primary">Dashboard</Link>
              <button onClick={onLogout} className="nav-btn nav-btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-btn nav-btn-secondary">Login</Link>
              <Link to="/dashboard" className="nav-btn nav-btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
