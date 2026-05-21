import React from 'react';


export default function CustomersPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Loved by <span className="highlight-text">Developers</span></h1>
        <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
          Join thousands of modern teams building the future of the web on our infrastructure.
        </p>
      </main>
    </div>
  );
}
