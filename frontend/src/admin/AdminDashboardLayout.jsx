import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminOverviewPage from './AdminOverviewPage';
import AdminServersPage from './AdminServersPage';
import AdminServerDetailsPage from './AdminServerDetailsPage';
import AdminInfrastructurePage from './AdminInfrastructurePage';
import AdminRequestsPage from './AdminRequestsPage';
import './AdminStyles.css';

export default function AdminDashboardLayout({ onLogout }) {
  return (
    <div className="admin-layout">
      <div className="layout" style={{ background: '#f8fafc' }}>
        <AdminSidebar onLogout={onLogout} />
        <div className="app-body" style={{ background: '#f8fafc' }}>
          <main className="main-content" style={{ padding: 0 }}>
            <Routes>
              <Route path="/" element={<AdminOverviewPage />} />
              <Route path="/servers" element={<AdminServersPage />} />
              <Route path="/servers/:id" element={<AdminServerDetailsPage />} />
              <Route path="/infrastructure" element={<AdminInfrastructurePage />} />
              <Route path="/requests" element={<AdminRequestsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  );
}
