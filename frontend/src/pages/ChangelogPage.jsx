import React from 'react';


export default function ChangelogPage() {
  return (
    <div className="landing-page">
      <div className="gradient-blob"></div>

      <main className="lp-main" style={{ paddingTop: '160px', paddingBottom: '100px', textAlign: 'center' }}>
        <h1 className="lp-title" style={{ fontSize: '48px', marginBottom: '24px' }}>Platform <span className="highlight-text">Changelog</span></h1>
        <p className="lp-subtitle" style={{ maxWidth: '600px', margin: '0 auto', fontSize: '18px', color: '#888' }}>
          Keep track of our latest feature releases, infrastructure improvements, and bug fixes.
        </p>
      </main>
    </div>
  );
}
