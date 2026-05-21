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

import FeaturesPage from './pages/FeaturesPage';
import MethodsPage from './pages/MethodsPage';
import CustomersPage from './pages/CustomersPage';
import PricingPage from './pages/PricingPage';
import ChangelogPage from './pages/ChangelogPage';
import ContactPage from './pages/ContactPage';
function DashboardLayout({ onLogout, deployments, loading }) {
  const location = useLocation();
  const isProfile = location.pathname === '/dashboard/profile';

  return (
    <div className="layout">
      {!isProfile && <Sidebar onLogout={onLogout} />}

      <div className={`app-body ${isProfile ? 'app-body--fullscreen' : ''}`}>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard/projects" replace />} />
            <Route path="/projects" element={<ProjectsPage deployments={deployments} />} />
            <Route path="/new" element={<NewProjectPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route
              path="/deployments"
              element={<DeploymentsPage deployments={deployments} loading={loading} />}
            />
            <Route path="/deployments/:id" element={<DeploymentDetailsPage />} />
            <Route path="/monitoring" element={<MonitoringPage deployments={deployments} />} />
            <Route path="*" element={<Navigate to="/dashboard/projects" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('');
  
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
    if (authenticated) {
      fetchDeployments();
      const interval = setInterval(fetchDeployments, 60000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  useEffect(() => {
    async function verifyAuth() {
      const token = localStorage.getItem('token');
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const data = await getCurrentUser();
        setUsername(data.user?.username || '');
        setAuthenticated(true);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setCheckingAuth(false);
      }
    }
    verifyAuth();
  }, []);

  if (checkingAuth) {
    return <div className="app-loading">Authenticating...</div>;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = "/";
  };

  return (
    <div className="app-root">
      <Navbar authenticated={authenticated} username={username} onLogout={handleLogout} />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/methods" element={<MethodsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/changelog" element={<ChangelogPage />} />
        <Route path="/contact" element={<ContactPage />} />
        
        {!authenticated ? (
          <>
            <Route path="/register-request" element={<RegisterRequestPage />} />
            <Route path="/dashboard/*" element={
              <LoginPage
                onLogin={(uname) => {
                  setUsername(uname || '');
                  setAuthenticated(true);
                }}
              />
            } />
            <Route path="/login" element={
              <LoginPage
                onLogin={(uname) => {
                  setUsername(uname || '');
                  setAuthenticated(true);
                }}
              />
            } />
          </>
        ) : (
          <Route path="/dashboard/*" element={
            <DashboardLayout 
              onLogout={handleLogout} 
              deployments={deployments} 
              loading={loading} 
            />
          } />
        )}
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}