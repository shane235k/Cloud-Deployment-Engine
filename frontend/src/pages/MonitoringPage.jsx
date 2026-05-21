import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { getGrafanaUrl } from "../api";

ChartJS.register(
  ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend
);

export default function MonitoringPage({ deployments = [] }) {
  // Calculate metrics directly from deployments array
  const totalDeployments = deployments.length;
  const runningCount = deployments.filter(d => d.status === 'RUNNING').length;
  const stoppedCount = deployments.filter(d => d.status === 'STOPPED').length;
  const buildingCount = deployments.filter(d => d.status === 'BUILDING').length;
  const failedCount = deployments.filter(d => d.status === 'FAILED').length;

  const grafanaUrl = getGrafanaUrl();

  const cardStyle = {
    background: '#0a0a0a',
    border: '1px solid #222',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
  };

  function StatCard({ label, value, accent }) {
    return (
      <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {accent && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: accent, boxShadow: `0 0 8px ${accent}` }}></div>}
          <span style={{ fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: '600' }}>{label}</span>
        </div>
        <span style={{ fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</span>
      </div>
    );
  }

  const chartBase = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#888', padding: 20, font: { family: "'Inter', sans-serif", size: 12, weight: '500' } } },
      tooltip: {
        backgroundColor: '#111', titleColor: '#fff', bodyColor: '#888',
        borderColor: '#333', borderWidth: 1, padding: 12,
        cornerRadius: 8,
      }
    }
  };

  const doughnutData = {
    labels: ['Running', 'Stopped', 'Building', 'Failed'],
    datasets: [{
      data: [runningCount, stoppedCount, buildingCount, failedCount],
      backgroundColor: ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444'],
      borderWidth: 0,
      hoverOffset: 6,
    }]
  };

  const doughnutOpts = {
    ...chartBase,
    cutout: '75%',
    animation: { animateScale: true, animateRotate: true, duration: 1000, easing: 'easeOutQuart' },
    plugins: {
      ...chartBase.plugins,
      legend: { position: 'bottom', labels: { ...chartBase.plugins.legend.labels, usePointStyle: true, padding: 24 } }
    }
  };

  const barData = {
    labels: ['Running', 'Stopped', 'Building', 'Failed'],
    datasets: [{
      label: 'Deployments',
      data: [runningCount, stoppedCount, buildingCount, failedCount],
      backgroundColor: [
        'rgba(139, 92, 246, 0.8)', // Purple theme for all bars, slightly different opacities if we want, or solid
        'rgba(139, 92, 246, 0.6)',
        'rgba(139, 92, 246, 0.4)',
        'rgba(139, 92, 246, 0.2)',
      ],
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 6,
      barPercentage: 0.6,
    }]
  };

  const barOpts = {
    ...chartBase,
    animation: { duration: 1000, easing: 'easeOutQuart' },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#1a1a1a', drawBorder: false }, 
        ticks: { color: '#888', stepSize: 1, padding: 10 } 
      },
      x: { 
        grid: { display: false, drawBorder: false }, 
        ticks: { color: '#888', padding: 10 } 
      }
    },
    plugins: { ...chartBase.plugins, legend: { display: false } }
  };

  return (
    <div className="vercel-projects-page" style={{ paddingBottom: '80px' }}>
      {/* Header */}
      <div className="vp-header" style={{ marginBottom: '40px', borderBottom: '1px solid #222', paddingBottom: '32px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#fff', margin: '0 0 12px', letterSpacing: '-0.03em' }}>
          Platform Analytics
        </h1>
        <p style={{ color: '#888', fontSize: '15px', margin: 0, maxWidth: '600px', lineHeight: '1.6' }}>
          Real-time metrics and observability for your P377 infrastructure deployments.
        </p>
      </div>

      {/* Stat Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        <StatCard label="Total Apps" value={totalDeployments} accent="#3b82f6" />
        <StatCard label="Running" value={runningCount} accent="#10b981" />
        <StatCard label="Stopped" value={stoppedCount} accent="#8b5cf6" />
        <StatCard label="Failed" value={failedCount} accent="#ef4444" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', marginBottom: '40px' }}>
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 32px', letterSpacing: '-0.02em' }}>Deployment Distribution</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <Doughnut data={doughnutData} options={doughnutOpts} />
          </div>
        </div>
        
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 32px', letterSpacing: '-0.02em' }}>State Breakdown</h3>
          <div style={{ height: '300px', position: 'relative' }}>
            <Bar data={barData} options={barOpts} />
          </div>
        </div>
      </div>

      {/* Grafana Embed */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '0 0 8px', letterSpacing: '-0.02em' }}>Grafana Dashboard</h3>
            <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>Advanced cluster observability and node performance tracking.</p>
          </div>
          <a
            href={grafanaUrl}
            target="_blank"
            rel="noreferrer"
            className="lp-btn-primary"
            style={{ 
              background: '#fff', color: '#000', padding: '10px 20px', 
              borderRadius: '6px', fontSize: '13px', fontWeight: '600',
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            Open in Grafana
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
        </div>
        <iframe
          src={grafanaUrl}
          title="Grafana Dashboard"
          style={{ width: '100%', height: '600px', border: '1px solid #222', borderRadius: '8px', background: '#050505' }}
        />
      </div>
    </div>
  );
}