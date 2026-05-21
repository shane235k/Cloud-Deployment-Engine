import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="lp-container">
      {/* Abstract Background Elements */}
      <div className="lp-bg-mesh"></div>

      <div className="lp-content-wrapper">
        {/* HERO SECTION */}
        <section className="lp-hero-section">
          <div className="lp-hero-text">
            <h1 className="lp-hero-title">
              Boost DevOps Infrastructure with Automated Container Launch
            </h1>
            <p className="lp-hero-subtitle">
              Our automated solution provides permissionless, zero-downtime, and seamless application management.
            </p>
            <div className="lp-hero-actions">
              <Link to="/dashboard/new" className="lp-btn-primary">Embark on Your Deployment</Link>
              <Link to="/dashboard" className="lp-btn-secondary">Check Out Our Demo</Link>
            </div>
          </div>
        </section>

        {/* 3-COLUMN FEATURES */}
        <section className="lp-features-section">
          <div className="lp-features-header">
            <h2 className="lp-section-title">Unlock the Full Potential<br/>of Next-Gen Hosting</h2>
            <p className="lp-section-subtitle">
              Your applications, your control. Secured by Kubernetes, P377 speeds up deployment workflows with enhanced security.
            </p>
          </div>
          <div className="lp-features-grid">
            <div className="lp-feature-card">
              <div className="lp-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
              </div>
              <h3>Experience Genuine Ownership</h3>
              <p>Full control over your environments and resources. Handle them with confidence and simplicity.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              </div>
              <h3>Blazing-Fast Transactions</h3>
              <p>Optimized for highly efficient resource management across all networks and systems.</p>
            </div>
            <div className="lp-feature-card">
              <div className="lp-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              </div>
              <h3>Effortless Multicloud Access</h3>
              <p>Effortlessly manage and track your digital assets across multiple clusters with ease.</p>
            </div>
          </div>
        </section>

        {/* LARGE CARDS SECTION */}
        <section className="lp-hub-section">
          <div className="lp-hub-header">
            <h2 className="lp-section-title">Introducing your all-in-one DevOps Hub.</h2>
            <p className="lp-section-subtitle">Discover everything you need for infrastructure in one powerful platform.</p>
          </div>
          
          <div className="lp-hub-grid-top">
            <div className="lp-hub-card">
              <div className="lp-hub-visual">
                <div className="mock-lock-box">
                  <span className="lock-icon">🔒</span>
                  <div className="mock-input">•••••••</div>
                  <span className="fingerprint-icon">✥</span>
                </div>
              </div>
              <div className="lp-hub-text">
                <h3>Passkey Security</h3>
                <p>Say goodbye to exposed ports. With P377's secure networking, access is just a passkey away.</p>
              </div>
            </div>
            <div className="lp-hub-card">
              <div className="lp-hub-visual">
                <div className="mock-network">
                  <div className="node center-node">⎈</div>
                  <div className="node outer-node n1"></div>
                  <div className="node outer-node n2"></div>
                  <div className="node outer-node n3"></div>
                  <div className="node outer-node n4"></div>
                </div>
              </div>
              <div className="lp-hub-text">
                <h3>Support for Multiple Chains</h3>
                <p>Crafted for seamless deployment management across multiple clusters.</p>
              </div>
            </div>
          </div>

          <div className="lp-hub-grid-bottom">
            <div className="lp-hub-card small">
              <div className="lp-hub-visual">
                <div className="mock-clock">
                  <span>24/7</span>
                </div>
              </div>
              <div className="lp-hub-text">
                <h3>Round-the-Clock Assistance</h3>
                <p>Optimized for effortless container management across all networks.</p>
              </div>
            </div>
            <div className="lp-hub-card small">
              <div className="lp-hub-visual">
                <div className="mock-shield">
                  <span className="shield-icon">🛡️</span>
                  <span className="alert-badge">!</span>
                </div>
              </div>
              <div className="lp-hub-text">
                <h3>Security Notification</h3>
                <p>Ditch the manual logs. P377 offers real-time alert access through user dashboards.</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS SECTION */}
        <section className="lp-stats-section">
          <div className="lp-stats-header">
            <h2 className="lp-section-title">Trust, Backed by Real Performance</h2>
            <p className="lp-section-subtitle">Discover everything you need for DevOps in one powerful platform</p>
          </div>

          <div className="lp-stats-grid">
            <div className="lp-stat">
              <span className="lp-stat-val">99.97%</span>
              <span className="lp-stat-label">Accuracy Rate</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">&lt;30s</span>
              <span className="lp-stat-label">Average Deploy Time</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">72%</span>
              <span className="lp-stat-label">Reduction in Errors</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">40+</span>
              <span className="lp-stat-label">Framework Types</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">24/7</span>
              <span className="lp-stat-label">AI Availability</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">0</span>
              <span className="lp-stat-label">Training Required</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">90%+</span>
              <span className="lp-stat-label">Resource Efficiency</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">99.9%</span>
              <span className="lp-stat-label">Platform Uptime</span>
            </div>
          </div>

          {/* Interactive Prompt Box */}
          <div className="lp-prompt-wrapper">
            <div className="lp-prompt-inner">
              <div className="lp-prompt-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 22h20L12 2z"/></svg>
              </div>
              <input type="text" placeholder="Start write to describe the infrastructure you want to deploy..." readOnly />
              <button className="lp-prompt-btn">
                <span>Public</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
              </button>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="lp-footer-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 12C2 12 5.5 5 12 5C18.5 5 22 12 22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M4 16C4 16 7.5 10 12 10C16.5 10 20 16 20 16" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 20C8 20 10 16 12 16C14 16 16 20 16 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            P377
          </div>
          <div className="lp-footer-links">
            <div className="lp-footer-col">
              <h4>Product</h4>
              <Link to="/">Overview</Link>
              <Link to="/">How it Works</Link>
              <Link to="/">Features</Link>
            </div>
            <div className="lp-footer-col">
              <h4>Solutions</h4>
              <Link to="/">Customer Support</Link>
              <Link to="/">High Volume Automation</Link>
              <Link to="/">Enterprise Solutions</Link>
            </div>
            <div className="lp-footer-col">
              <h4>Resources</h4>
              <Link to="/">Documentation</Link>
              <Link to="/">API Guide</Link>
              <Link to="/">Help Center</Link>
            </div>
            <div className="lp-footer-col">
              <h4>Legal</h4>
              <Link to="/">Privacy Policy</Link>
              <Link to="/">Terms of Service</Link>
              <Link to="/">Data Processing</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
