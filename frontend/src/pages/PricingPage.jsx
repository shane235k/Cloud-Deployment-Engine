import React from 'react';


export default function PricingPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Simple <span className="highlight-text">Pricing</span></h1>
        <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
          Start for free, then pay only for what you use. No hidden fees or complex tiers.
        </p>
      </main>
    </div>
  );
}
