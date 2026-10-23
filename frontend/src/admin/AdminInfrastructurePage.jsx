import { useEffect, useState } from 'react';
import {
  getAdminInfrastructure,
  createAdminInfrastructure,
  triggerAdminProvision,
  getAdminProvisionJobs,
  getAdminServers,
  destroyAdminServer,
} from '../api';
import ServerTerminalModal from './ServerTerminalModal';

export default function AdminInfrastructurePage() {
  const [infra, setInfra] = useState(null);
  const [servers, setServers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState('');
  const [selectedTerminalServer, setSelectedTerminalServer] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [infraData, serversData, jobsData] = await Promise.all([
        getAdminInfrastructure().catch(() => null),
        getAdminServers().catch(() => []),
        getAdminProvisionJobs().catch(() => []),
      ]);
      setInfra(infraData);

      // Support servers from either getAdminServers or embedded in getAdminInfrastructure
      const rawServers =
        Array.isArray(serversData) && serversData.length > 0
          ? serversData
          : Array.isArray(infraData?.servers) && infraData.servers.length > 0
            ? infraData.servers
            : Array.isArray(infraData?.nodes) && infraData.nodes.length > 0
              ? infraData.nodes
              : [];

      // Normalize fields to guarantee role, controlPlane, privateIp, publicIp, and instanceId
      const normalizedServers = rawServers.map((s) => {
        const matchingInfraNode = Array.isArray(infraData?.servers)
          ? infraData.servers.find(
            (n) =>
              (n.id && (n.id === s.id || n.id === s._id)) ||
              (n.name && n.name === s.name) ||
              (n.instanceId && n.instanceId === s.instanceId)
          )
          : null;

        const nodeRole =
          s.nodeRole ||
          s.role ||
          matchingInfraNode?.nodeRole ||
          matchingInfraNode?.role ||
          (s.isControlPlane || s.controlPlane || matchingInfraNode?.isControlPlane || matchingInfraNode?.controlPlane ? 'SERVER' : 'AGENT');

        const isControlPlane = Boolean(
          s.isControlPlane ||
          s.controlPlane ||
          matchingInfraNode?.isControlPlane ||
          matchingInfraNode?.controlPlane ||
          nodeRole === 'SERVER'
        );

        const privateIp =
          s.privateIp ||
          s.private_ip ||
          s.privateIPv4 ||
          matchingInfraNode?.privateIp ||
          matchingInfraNode?.private_ip ||
          (isControlPlane && infraData?.k3sServerPrivateIp ? infraData.k3sServerPrivateIp : '');

        const publicIp =
          s.publicIp ||
          s.public_ip ||
          s.publicIPv4 ||
          matchingInfraNode?.publicIp ||
          matchingInfraNode?.public_ip ||
          '';

        const instanceId =
          s.instanceId ||
          s.instance_id ||
          matchingInfraNode?.instanceId ||
          s.name ||
          '';

        return {
          ...matchingInfraNode,
          ...s,
          nodeRole,
          role: nodeRole,
          isControlPlane,
          controlPlane: isControlPlane,
          privateIp,
          publicIp,
          instanceId,
        };
      });

      setServers(normalizedServers);
      setJobs(jobsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load infrastructure data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateInfrastructure = async () => {
    if (!window.confirm('Initialize Base VPC, shared ALB, security groups, and the initial K3s Control Plane Server?')) {
      return;
    }
    try {
      setActionLoading(true);
      setMessage(null);
      setError('');
      const res = await createAdminInfrastructure();
      setMessage(res.message || 'Base infrastructure & K3s Server provisioning pipeline triggered!');
      setTimeout(fetchData, 3000);
    } catch (err) {
      setError(err.message || 'Failed to trigger infrastructure provisioning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProvisionAgent = async () => {
    try {
      setActionLoading(true);
      setMessage(null);
      setError('');
      const res = await triggerAdminProvision();
      setMessage(res.message || 'Worker Agent provisioning pipeline triggered successfully!');
      setTimeout(fetchData, 3000);
    } catch (err) {
      setError(err.message || 'Failed to trigger worker agent provisioning');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDestroyServer = async (server) => {
    const serverId = server.id || server._id;
    const isServerRole = server.nodeRole === 'SERVER' || server.isControlPlane;
    const activeAgents = servers.filter((s) => s.nodeRole === 'AGENT' && s.status !== 'OFFLINE');

    if (isServerRole && activeAgents.length > 0) {
      setError(
        `Cannot destroy K3s Control Plane Server while ${activeAgents.length} active worker agent(s) exist. Decommission all agent nodes first.`
      );
      return;
    }

    const confirmMsg = isServerRole
      ? `WARNING: You are about to destroy the K3s CONTROL PLANE Server (${server.name}). Proceed with destruction?`
      : `Decommission and destroy worker agent node ${server.name}?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setDeletingId(serverId);
      setMessage(null);
      setError('');
      const res = await destroyAdminServer(serverId);
      setMessage(res.message || `Destroy pipeline triggered for node ${server.name}`);
      setTimeout(fetchData, 3000);
    } catch (err) {
      setError(err.message || `Failed to destroy server ${server.name}`);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'HEALTHY':
      case 'SUCCESS':
        return <span className="badge badge-success">{status}</span>;
      case 'PROVISIONING':
      case 'BUILDING':
      case 'IN_PROGRESS':
      case 'BUSY':
        return <span className="badge badge-warning">{status}</span>;
      case 'UNMONITORED':
        return (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '10px',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fcd34d',
            }}
          >
            UNMONITORED
          </span>
        );
      case 'FAILED':
      case 'FAILURE':
      case 'OFFLINE':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-neutral">{status || 'NOT_CREATED'}</span>;
    }
  };

  const getNodeRoleBadge = (role, isControlPlane) => {
    const isServer = role === 'SERVER' || isControlPlane;
    if (isServer) {
      return (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            padding: '3px 10px',
            borderRadius: '6px',
            background: 'rgba(147, 51, 234, 0.12)',
            color: '#7e22ce',
            border: '1px solid rgba(147, 51, 234, 0.3)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>👑</span> SERVER
        </span>
      );
    }
    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          padding: '3px 10px',
          borderRadius: '6px',
          background: 'rgba(2, 132, 199, 0.12)',
          color: '#0369a1',
          border: '1px solid rgba(2, 132, 199, 0.3)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
        }}
      >
        <span>⚡</span> AGENT
      </span>
    );
  };

  return (
    <div className="admin-page-container">
      {/* Page Header */}
      <div className="admin-header">
        <div>
          <h1 className="page-title">Infrastructure & Cluster Management</h1>
          <p className="page-subtitle">
            Unified AWS infrastructure, K3s control plane, worker nodes, and live administrative SSH console
          </p>
        </div>
        <button className="secondary-button" onClick={fetchData} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Overview'}
        </button>
      </div>

      {/* Success / Error Banners */}
      {message && (
        <div className="success-banner" style={{ margin: '16px 0' }}>
          {message}
        </div>
      )}

      {error && (
        <div className="error-banner" style={{ margin: '16px 0' }}>
          {error}
        </div>
      )}

      {/* 1. Infrastructure Overview Card */}
      <div className="admin-section" style={{ marginTop: '16px' }}>
        <div
          style={{
            background: '#ffffff',
            border: '1.5px solid #000000',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '1.5px solid #000000',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#000000' }}>
                  Platform Infrastructure Environment
                </h2>
                {getStatusBadge(infra?.status || 'NOT_CREATED')}
              </div>
              <p style={{ color: '#000000', fontSize: '13px', margin: '4px 0 0 0', fontWeight: 500 }}>
                Environment: <strong style={{ color: '#000000' }}>{infra?.environmentName || 'kubedeploy'}</strong> | Region: <strong style={{ color: '#000000' }}>us-east-2</strong>
              </p>
            </div>

            {/* Action Buttons based on status */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              {(!infra || infra.status === 'NOT_CREATED' || infra.status === 'FAILED') && (
                <button
                  className="primary-button-large"
                  onClick={handleCreateInfrastructure}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Triggering...' : ' Provision Base Infrastructure & K3s Server'}
                </button>
              )}

              {infra?.status === 'ACTIVE' && (
                <>
                  <button
                    className="primary-button-large"
                    onClick={handleProvisionAgent}
                    disabled={actionLoading}
                    style={{ background: '#0284c7' }}
                    title="Provision a new K3s Worker Agent node attached to the cluster"
                  >
                    {actionLoading ? 'Triggering...' : '➕ Provision Worker / Agent'}
                  </button>

                  <button
                    className="secondary-button"
                    onClick={handleCreateInfrastructure}
                    disabled={actionLoading}
                    style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600 }}
                    title="Base infrastructure & control plane are active. Re-triggering will redeploy base infrastructure."
                  >
                    Provision Server / Infra
                  </button>
                </>
              )}

              {infra?.status === 'PROVISIONING' && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '13px',
                    fontWeight: 600,
                  }}
                >
                  <span className="pulsating-dot"></span> Provisioning in progress on Jenkins...
                </div>
              )}
            </div>
          </div>

          {/* Infrastructure Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '16px',
            }}
          >
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1.5px solid #000000' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.04em' }}>VPC ID</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginTop: '6px' }}>
                <code style={{ background: '#e2e8f0', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #cbd5e1' }}>{infra?.vpcId || 'Pending Creation'}</code>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1.5px solid #000000' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.04em' }}>K3s Control Plane Private IP</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#000000', marginTop: '6px' }}>
                <code style={{ background: '#e2e8f0', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #cbd5e1' }}>{infra?.k3sServerPrivateIp || 'Not Assigned'}</code>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1.5px solid #000000' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.04em' }}>Shared Application Load Balancer</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#000000', marginTop: '6px', wordBreak: 'break-all' }}>
                {infra?.albDns ? (
                  <a href={`http://${infra.albDns}`} target="_blank" rel="noopener noreferrer" className="link-button" style={{ fontWeight: 700, color: '#000000', textDecoration: 'underline' }}>
                    {infra.albDns} ↗
                  </a>
                ) : (
                  <code style={{ background: '#e2e8f0', color: '#000000', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid #cbd5e1' }}>Pending Creation</code>
                )}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '8px', border: '1.5px solid #000000' }}>
              <div style={{ fontSize: '11.5px', textTransform: 'uppercase', color: '#000000', fontWeight: 800, letterSpacing: '0.04em' }}>Cluster Node Count</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#000000', marginTop: '4px' }}>
                {servers.length} Registered Node{servers.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Cluster Nodes Table (SERVER and AGENT with Direct SSH) */}
      <div className="admin-section" style={{ marginTop: '32px' }}>
        <div className="admin-header" style={{ marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#000000' }}>Cluster EC2 Nodes</h2>
            <p style={{ color: '#000000', fontSize: '13px', margin: '3px 0 0 0', fontWeight: 600 }}>
              All nodes feature public and private IPv4. Internal cluster communication uses private IPs; administrative SSH connects over public IPs.
            </p>
          </div>
        </div>

        {servers.length === 0 ? (
          <div className="empty-state-card" style={{ padding: '32px', textAlign: 'center' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '15px', fontWeight: 700, color: '#000000' }}>
              No K3s cluster nodes currently registered.
            </p>
            <p style={{ margin: 0, fontSize: '13px', color: '#000000', fontWeight: 500 }}>
              Provision the Base Infrastructure & K3s Server above to launch the cluster control plane.
            </p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Node / Instance ID</th>
                  <th>Public IPv4</th>
                  <th>Private IPv4</th>
                  <th>Status</th>
                  <th>Telemetry (CPU / RAM / Disk)</th>
                  <th>Pods / Apps</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => {
                  const isDeleting = deletingId === (server.id || server._id);
                  const nodeRole = server.nodeRole || server.role || (server.isControlPlane || server.controlPlane ? 'SERVER' : 'AGENT');
                  const isControlPlane = Boolean(server.isControlPlane || server.controlPlane || nodeRole === 'SERVER');
                  const privateIp = server.privateIp || server.private_ip || server.privateIPv4 || '';
                  const publicIp = server.publicIp || server.public_ip || server.publicIPv4 || '';
                  const instanceId = server.instanceId || server.instance_id || server.name || '';

                  return (
                    <tr key={server.id || server._id}>
                      <td>{getNodeRoleBadge(nodeRole, isControlPlane)}</td>
                      <td className="font-semibold">
                        <div>
                          <strong style={{ fontSize: '13px', color: '#000000' }}>{instanceId}</strong>
                        </div>
                        {server.name && server.name !== instanceId && (
                          <div style={{ fontSize: '11px', color: '#000000', marginTop: '2px', fontWeight: 600 }}>
                            Name: <code style={{ color: '#000000' }}>{server.name}</code>
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#000000', marginTop: '2px', fontWeight: 600 }}>
                          Workspace: <code style={{ color: '#000000', fontWeight: 700 }}>{server.workspace || 'default'}</code>
                        </div>
                      </td>
                      <td>
                        {publicIp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <code style={{ fontSize: '12.5px', color: '#000000', fontWeight: 700, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                              {publicIp}
                            </code>
                            <button
                              onClick={() => navigator.clipboard.writeText(publicIp)}
                              title="Copy Public IP"
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', padding: '2px' }}
                            >
                              📋
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: '#000000' }}>None</span>
                        )}
                      </td>
                      <td>
                        {privateIp ? (
                          <code style={{ fontSize: '12.5px', color: '#000000', fontWeight: 700, background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                            {privateIp}
                          </code>
                        ) : (
                          <span style={{ color: '#000000' }}>N/A</span>
                        )}
                      </td>
                      <td>{getStatusBadge(server.status)}</td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#000000' }}>
                          CPU: <strong style={{ color: '#000000' }}>{server.cpuUsage}%</strong> | RAM: <strong style={{ color: '#000000' }}>{server.ramUsage}%</strong>
                          {server.diskUsage !== undefined && server.diskUsage !== null && (
                            <span style={{ color: '#000000' }}> | Disk: <strong style={{ color: '#000000' }}>{server.diskUsage}%</strong></span>
                          )}
                          {server.uptime && (
                            <div style={{ fontSize: '11px', color: '#000000', marginTop: '3px', fontWeight: 600 }}>
                              ⏱️ {server.uptime}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12.5px', color: '#000000' }}>
                          <strong style={{ color: '#000000' }}>{server.podCount || 0}</strong> Pod{server.podCount !== 1 ? 's' : ''} | <strong style={{ color: '#000000' }}>{server.activeDeployments || 0}</strong> App{server.activeDeployments !== 1 ? 's' : ''}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            className="btn-ssh-action"
                            onClick={() => setSelectedTerminalServer(server)}
                            disabled={!publicIp}
                            title={publicIp ? `Open Web SSH Terminal for ${instanceId} (${publicIp})` : 'No Public IP available'}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="4 17 10 11 4 5"></polyline>
                              <line x1="12" y1="19" x2="20" y2="19"></line>
                            </svg>
                            <span>SSH</span>
                          </button>

                          <button
                            className="btn-destroy-action"
                            onClick={() => handleDestroyServer(server)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? 'Terminating...' : 'Destroy'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Recent Provision Pipeline Builds */}
      <div className="admin-section" style={{ marginTop: '36px' }}>
        <div className="admin-header">
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#000000' }}>Recent Provision Pipeline Builds</h2>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state-card">
            <p style={{ color: '#000000', fontWeight: 600 }}>No recent provision builds found on Jenkins.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Build Number</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Timestamp</th>
                  <th>Jenkins URL</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">#{job.buildNumber}</td>
                    <td>{getStatusBadge(job.status)}</td>
                    <td>{formatDuration(job.duration)}</td>
                    <td>{job.timestamp ? new Date(job.timestamp).toLocaleString() : 'N/A'}</td>
                    <td>
                      {job.url ? (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="link-button">
                          View Build ↗
                        </a>
                      ) : (
                        'N/A'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Web SSH Terminal Modal */}
      {selectedTerminalServer && (
        <ServerTerminalModal
          server={selectedTerminalServer}
          onClose={() => setSelectedTerminalServer(null)}
        />
      )}
    </div>
  );
}
