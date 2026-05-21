import React from 'react';


export default function MethodsPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Our <span className="highlight-text">Methods</span></h1>
        <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
          We employ state-of-the-art containerization and orchestration methodologies to ensure 99.99% uptime for your applications.
        </p>
      </main>
    </div>
  );
}
