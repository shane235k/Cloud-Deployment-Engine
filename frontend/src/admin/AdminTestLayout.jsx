import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminOverviewTestPage from './AdminOverviewTestPage';
import AdminServersTestPage from './AdminServersTestPage';
import AdminInfrastructureTestPage from './AdminInfrastructureTestPage';
import AdminRequestsTestPage from './AdminRequestsTestPage';
import AdminDeploymentsTestPage from './AdminDeploymentsTestPage';
import './AdminStyles.css';

export default function AdminTestLayout() {
  return (
    <div className="admin-layout">
      <div className="layout" style={{ background: '#f8fafc' }}>
        <AdminSidebar isTestMode={true} />
        <div className="app-body" style={{ background: '#f8fafc' }}>
          <main className="main-content" style={{ padding: 0 }}>
            <Routes>
              <Route path="/" element={<AdminOverviewTestPage />} />
              <Route path="/overview" element={<AdminOverviewTestPage />} />
              <Route path="/servers" element={<AdminServersTestPage />} />
              <Route path="/infrastructure" element={<AdminInfrastructureTestPage />} />
              <Route path="/requests" element={<AdminRequestsTestPage />} />
              <Route path="/deployments" element={<AdminDeploymentsTestPage />} />
              <Route path="*" element={<Navigate to="/test/admin/overview" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
