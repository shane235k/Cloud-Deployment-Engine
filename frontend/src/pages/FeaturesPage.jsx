import React from 'react';

import { Link } from 'react-router-dom';

export default function FeaturesPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      
      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px' }}>
        <div className="lp-hero" style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>
            Features for <span className="highlight-text">Modern Teams</span>
          </h1>
          <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
            Everything you need to build, deploy, and scale your applications seamlessly on our advanced Kubernetes infrastructure.
          </p>
        </div>

        <div className="lp-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', maxWidth: '1000px', margin: '0 auto', padding: '0 24px' }}>
          <div className="lp-feature-card" style={{ padding: '32px', background: '#000', border: '1px solid #222', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>Instant Deployments</h3>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>Push to main and see your changes live in seconds. Our optimized build pipeline handles the rest.</p>
          </div>
          
          <div className="lp-feature-card" style={{ padding: '32px', background: '#000', border: '1px solid #222', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>Built-in CI/CD</h3>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>Fully managed continuous integration and delivery. No Jenkins or GitHub Actions configuration required.</p>
          </div>

          <div className="lp-feature-card" style={{ padding: '32px', background: '#000', border: '1px solid #222', borderRadius: '12px' }}>
            <div style={{ width: '40px', height: '40px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            </div>
            <h3 style={{ fontSize: '18px', color: '#fff', marginBottom: '12px' }}>Global Edge Network</h3>
            <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.6' }}>Serve your applications instantly to users anywhere in the world with our global CDN.</p>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '80px' }}>
          <Link to="/dashboard/new" className="lp-btn lp-btn-primary" style={{ padding: '12px 32px', fontSize: '16px' }}>Start Deploying</Link>
        </div>
      </main>
    </div>
  );
}
