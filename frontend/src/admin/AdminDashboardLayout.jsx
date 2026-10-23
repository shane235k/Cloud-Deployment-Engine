import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminOverviewPage from './AdminOverviewPage';
import AdminServersPage from './AdminServersPage';
import AdminServerDetailsPage from './AdminServerDetailsPage';
import AdminInfrastructurePage from './AdminInfrastructurePage';
import AdminRequestsPage from './AdminRequestsPage';
import './AdminStyles.css';

export default function AdminDashboardLayout({ onLogout }) {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="admin-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="layout" style={{ background: '#f8fafc', display: 'flex', flex: 1, minHeight: '100vh' }}>
        <AdminSidebar onLogout={onLogout} />
        <div className="app-body" style={{ background: '#f8fafc', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main className="main-content" style={{ padding: 0, flex: 1, minWidth: 0 }}>
            <Routes>
              <Route path="/" element={<AdminOverviewPage />} />
              <Route path="/overview" element={<AdminOverviewPage />} />
              <Route path="/servers" element={<AdminServersPage />} />
              <Route path="/servers/:id" element={<AdminServerDetailsPage />} />
              <Route path="/infrastructure" element={<AdminInfrastructurePage />} />
              <Route path="/requests" element={<AdminRequestsPage />} />
              <Route path="*" element={<Navigate to="/admin/overview" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
