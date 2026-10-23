function getStatusClass(status) {
  switch (status) {
    case 'RUNNING':
      return 'status running';
    case 'FAILED':
      return 'status failed';
    default:
      return 'status building';
  }
}

export default function DeploymentCard({ deployment }) {
  return (
    <div className="deployment-card">
      <div className="deployment-header">
        <span className={getStatusClass(deployment.status)}>
          {deployment.status}
        </span>
        <span className="deployment-id">{deployment._id.slice(0, 8)}</span>
      </div>

      <div className="repo-url">{deployment.repoUrl}</div>

      {deployment.url && deployment.status === 'RUNNING' ? (
        <a
          href={deployment.url}
          target="_blank"
          rel="noreferrer"
          className="deployment-link"
        >
          Open App {/:30\d{3}/.test(deployment.url) ? '(Legacy)' : ''}
        </a>
      ) : deployment.url ? (
        <span className="deployment-link" style={{ opacity: 0.5, cursor: 'not-allowed' }}>
          Not Running
        </span>
      ) : null}

      <details>
        <summary>View Logs</summary>
        <pre className="logs">
          {(deployment.logs || []).join('\n')}
        </pre>
      </details>
    </div>
  );
}