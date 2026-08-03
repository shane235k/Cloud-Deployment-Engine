import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';

import './App.css';
import { getDeployments, getCurrentUser } from './api';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import LandingPage from './pages/LandingPage';
import ProfilePage from "./pages/ProfilePage";
import LoginPage from './components/LoginPage';
import ProjectsPage from './pages/ProjectsPage';
import NewProjectPage from './pages/NewProjectPage';
import DeploymentsPage from './pages/DeploymentsPage';
import DeploymentDetailsPage from './pages/DeploymentDetailsPage';
import MonitoringPage from './pages/MonitoringPage';
import RegisterRequestPage from './pages/RegisterRequestPage';
import AdminDashboardLayout from './admin/AdminDashboardLayout';
import AdminTestLayout from './admin/AdminTestLayout';

import FeaturesPage from './pages/FeaturesPage';
import MethodsPage from './pages/MethodsPage';
import CustomersPage from './pages/CustomersPage';
import PricingPage from './pages/PricingPage';
import ChangelogPage from './pages/ChangelogPage';
import ContactPage from './pages/ContactPage';

function DashboardLayout({ onLogout, deployments, loading, userRole }) {
  const location = useLocation();
  const isProfile = location.pathname === '/dashboard/profile';

  return (
    <div className="layout" style={{ background: '#000000' }}>
      {!isProfile && <Sidebar onLogout={onLogout} userRole={userRole} />}

      <div className={`app-body ${isProfile ? 'app-body--fullscreen' : ''}`} style={{ background: '#000000' }}>
        <main className="main-content" style={{ background: '#000000' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage deployments={deployments} loading={loading} />} />
            <Route path="/new-project" element={<NewProjectPage />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/deployments" element={<DeploymentsPage deployments={deployments} loading={loading} />} />
            <Route path="/deployments/:id" element={<DeploymentDetailsPage />} />
            <Route path="/monitoring" element={<MonitoringPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/dashboard/projects" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('user');
  
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeployments = async () => {
    try {
      const data = await getDeployments();
      setDeployments(data);
    } catch (error) {
      console.error('Failed to fetch deployments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authenticated && userRole !== 'admin') {
      fetchDeployments();
      const interval = setInterval(fetchDeployments, 60000);
      return () => clearInterval(interval);
    }
  }, [authenticated, userRole]);

  const verifyAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setCheckingAuth(false);
      return;
    }
    try {
      const data = await getCurrentUser();
      setUsername(data.user?.username || '');
      setUserRole(data.user?.role || 'user');
      setAuthenticated(true);
    } catch {
      localStorage.removeItem('token');
    } finally {
      setCheckingAuth(false);
    }
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  if (checkingAuth) {
    return <div className="app-loading">Authenticating...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/";
  };

  const isAdmin = userRole === 'admin';
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register-request';

  return (
    <div className="app-root">
      {!isAuthPage && (
        <Navbar authenticated={authenticated} username={username} userRole={userRole} onLogout={handleLogout} />
      )}
      
      <Routes>
        <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/methods" element={<MethodsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register-request" element={<RegisterRequestPage />} />
        
        {!authenticated ? (
          <>
            <Route path="/dashboard/*" element={
              <LoginPage
                onLogin={() => {
                  verifyAuth();
                }}
              />
            } />
            <Route path="/login" element={
              <LoginPage
                onLogin={() => {
                  verifyAuth();
                }}
              />
            } />
          </>
        ) : isAdmin ? (
          <Route path="/dashboard/*" element={<Navigate to="/admin" replace />} />
        ) : (
          <Route path="/dashboard/*" element={
            <DashboardLayout 
              onLogout={handleLogout} 
              deployments={deployments} 
              loading={loading} 
              userRole={userRole}
            />
          } />
        )}
        
        <Route path="/test/admin/*" element={<AdminTestLayout />} />
        
        <Route path="/admin/*" element={
          authenticated && isAdmin ? (
            <AdminDashboardLayout onLogout={handleLogout} />
          ) : (
            <Navigate to="/login" replace />
          )
        } />
        <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} replace />} />
      </Routes>
    </div>
  );
}