import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createDeployment, getGithubClientId, saveGithubToken, getGithubRepos } from '../api';

function timeAgo(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  let interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + 'mo';
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + 'd';
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + 'h';
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval + 'm';
  return Math.floor(seconds) + 's';
}

const GH_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  background: '#0a0a0a',
  border: '1px solid #222',
  borderRadius: '6px',
  color: '#ededed',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    projectName: '',
    repoUrl: '',
    projectType: 'frontend',
    framework: 'react',
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
  });

  const [loading, setLoading] = useState(false);

  // GitHub integration state
  const [repos, setRepos] = useState([]);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false); // start false so button shows immediately
  const [searchQuery, setSearchQuery] = useState('');
  const [showRepoList, setShowRepoList] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const githubToken = params.get('github_token');
    const githubError = params.get('github_error');

    if (githubToken) {
      // Clean the URL immediately
      window.history.replaceState({}, document.title, '/dashboard/new');
      handleSaveToken(githubToken);
    } else if (githubError) {
      window.history.replaceState({}, document.title, '/dashboard/new');
      alert(`GitHub connection failed: ${githubError}`);
    } else {
      // Silent background check - doesn't block the UI
      checkGithubConnection();
    }
  }, []);

  const checkGithubConnection = async () => {
    try {
      const data = await getGithubRepos();
      setRepos(data);
      setGithubConnected(true);
    } catch {
      setGithubConnected(false);
    } finally {
      setGithubLoading(false);
    }
  };

  const handleSaveToken = async (accessToken) => {
    setGithubLoading(true);
    try {
      await saveGithubToken(accessToken);
      await checkGithubConnection();
    } catch (error) {
      console.error('Failed to save token', error);
      alert('GitHub connection failed. Please try again.');
      setGithubLoading(false);
    }
  };

  const handleConnectGithub = async () => {
    try {
      const { clientId } = await getGithubClientId();
      // Use the backend URL as redirect_uri, which matches what's registered in GitHub
      const redirectUri = 'http://localhost:5000/auth/github/callback';
      window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo&redirect_uri=${encodeURIComponent(redirectUri)}`;
    } catch {
      alert('Failed to initiate GitHub login');
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const selectRepo = (repo) => {
    updateField('repoUrl', repo.clone_url);
    updateField('projectName', repo.name);
    setShowRepoList(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.projectName.trim() || !formData.repoUrl.trim()) return;

    try {
      setLoading(true);
      const result = await createDeployment({
        ...formData,
        projectName: formData.projectName.trim(),
        repoUrl: formData.repoUrl.trim(),
      });
      navigate(`/dashboard/deployments/${result.deploymentId}`);
    } catch (error) {
      alert(error.response?.data?.error || 'Deployment failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="vercel-new-project">
      <div className="vnp-header">
        <h1>Deploy Application</h1>
      </div>

      <div className="vnp-split-panes" style={{ marginTop: '32px' }}>
        {/* Left Pane */}
        <div className="vnp-pane left-pane">
          <div className="vnp-import-list" style={{ padding: '24px' }}>

            {/* ── GitHub Import Section ── */}
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px', letterSpacing: '-0.01em' }}>
                Import from GitHub
              </h2>

              {githubLoading ? (
                <div style={{ padding: '20px', background: '#0a0a0a', border: '1px solid #222', borderRadius: '8px', color: '#888', textAlign: 'center', fontSize: '14px' }}>
                  Connecting to GitHub...
                </div>
              ) : !githubConnected ? (
                <div style={{ 
                  padding: '20px 24px',
                  background: 'linear-gradient(135deg, #0d1117 0%, #0a0a0a 100%)',
                  border: '1px solid #30363d',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ 
                      width: '44px', height: '44px', borderRadius: '10px',
                      background: '#161b22', border: '1px solid #30363d',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                      </svg>
                    </div>
                    <div>
                      <p style={{ color: '#fff', fontWeight: '600', fontSize: '15px', margin: '0 0 3px' }}>Connect GitHub</p>
                      <p style={{ color: '#8b949e', fontSize: '13px', margin: 0 }}>Import repos directly from your GitHub account</p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectGithub}
                    style={{ 
                      flexShrink: 0, 
                      background: '#fff', 
                      color: '#000', 
                      padding: '10px 22px', 
                      borderRadius: '6px', 
                      border: 'none', 
                      fontSize: '14px', 
                      fontWeight: '700', 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    Connect GitHub
                  </button>
                </div>
              ) : (
                <div style={{ border: '1px solid #222', borderRadius: '8px', overflow: 'hidden' }}>
                  {/* Connected header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#0a0a0a', borderBottom: '1px solid #222' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '13px', fontWeight: '500' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                      GitHub Connected
                    </div>
                    <button onClick={() => setShowRepoList(v => !v)} style={{ background: 'transparent', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer' }}>
                      {showRepoList ? 'Hide repos' : 'Browse repos'}
                    </button>
                  </div>

                  {showRepoList && (
                    <>
                      <div style={{ padding: '10px 14px', background: '#000', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        <input
                          type="text"
                          placeholder="Search repositories..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '13px' }}
                        />
                      </div>
                      <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        {filteredRepos.length > 0 ? filteredRepos.map(repo => (
                          <div
                            key={repo.id}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: '1px solid #1a1a1a', background: '#000', transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#0a0a0a'}
                            onMouseLeave={e => e.currentTarget.style.background = '#000'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ color: '#888' }}>{GH_ICON}</span>
                              <div>
                                <div style={{ color: '#ededed', fontSize: '13px', fontWeight: '500' }}>{repo.full_name}</div>
                                <div style={{ color: '#555', fontSize: '12px', marginTop: '1px' }}>Updated {timeAgo(repo.updated_at)} ago {repo.private ? '· Private' : ''}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => selectRepo(repo)}
                              style={{ background: '#fff', color: '#000', border: 'none', borderRadius: '4px', padding: '5px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                            >
                              Import
                            </button>
                          </div>
                        )) : (
                          <div style={{ padding: '24px', textAlign: 'center', color: '#555', fontSize: '13px' }}>No repos found.</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
              <span style={{ color: '#555', fontSize: '12px', whiteSpace: 'nowrap' }}>OR CONFIGURE MANUALLY</span>
              <div style={{ flex: 1, height: '1px', background: '#222' }}></div>
            </div>

            {/* ── Deployment Form ── */}
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '20px', letterSpacing: '-0.01em' }}>
              Project Configuration
            </h2>

            <form onSubmit={handleSubmit} className="vercel-form">
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>Project Name</label>
                <input
                  type="text"
                  placeholder="my-awesome-app"
                  value={formData.projectName}
                  onChange={(e) => updateField('projectName', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>GitHub Repository URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  value={formData.repoUrl}
                  onChange={(e) => updateField('repoUrl', e.target.value)}
                  style={{ ...inputStyle, fontFamily: formData.repoUrl ? 'monospace' : 'inherit' }}
                />
                {formData.repoUrl && (
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Repo selected from GitHub
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>Project Type</label>
                  <select
                    value={formData.projectType}
                    onChange={(e) => updateField('projectType', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    <option value="frontend">Frontend</option>
                    <option value="backend">Backend</option>
                    <option value="fullstack">Full Stack</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>Framework</label>
                  <select
                    value={formData.framework}
                    onChange={(e) => updateField('framework', e.target.value)}
                    style={{ ...inputStyle, appearance: 'none' }}
                  >
                    <option value="react">React</option>
                    <option value="nextjs">Next.js</option>
                    <option value="vue">Vue</option>
                    <option value="nodejs">Node.js</option>
                    <option value="express">Express</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', marginBottom: '28px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>Build Command</label>
                  <input
                    type="text"
                    value={formData.buildCommand}
                    onChange={(e) => updateField('buildCommand', e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#ededed', marginBottom: '8px' }}>Output Directory</label>
                  <input
                    type="text"
                    value={formData.outputDirectory}
                    onChange={(e) => updateField('outputDirectory', e.target.value)}
                    style={inputStyle}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px 20px', background: '#ededed', color: '#000', border: 'none', borderRadius: '6px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Deploying...' : 'Deploy Application'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Pane: Info Cards */}
        <div className="vnp-pane right-pane">
          <div className="vnp-templates-header">
            <h2>Information</h2>
          </div>
          <div className="vnp-templates-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="vnp-template-card" style={{ cursor: 'default' }}>
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>⚡ Deploy in Seconds</h3>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                KubeDeploy automatically builds your application, pushes the image to a container registry, and spins up your deployment in the Kubernetes cluster.
              </p>
            </div>
            <div className="vnp-template-card" style={{ cursor: 'default' }}>
              <h3 style={{ fontSize: '16px', color: '#fff', marginBottom: '8px' }}>⚛️ React Support</h3>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                The platform currently has optimized build pipelines for React.js and Node.js. Set the correct output directory (e.g. <code style={{ color: '#fff' }}>dist</code>) for your framework.
              </p>
            </div>
            <div className="vnp-plugin-ad" style={{ marginTop: '8px' }}>
              <div className="vnp-plugin-ad-header">
                <h3>Live Monitoring</h3>
              </div>
              <p style={{ color: '#888', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>
                After deploying, navigate to the Monitoring dashboard to view live Grafana graphs and Prometheus metrics for your pod.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
