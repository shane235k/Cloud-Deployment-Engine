import React from 'react';


export default function ContactPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Get in <span className="highlight-text">Touch</span></h1>
        <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
          Have questions about enterprise plans or custom infrastructure? Our team is here to help.
        </p>
      </main>
    </div>
  );
}
