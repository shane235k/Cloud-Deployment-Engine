import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { login, submitRegisterRequest } from '../api';

const QUOTES = [
  { text: "Infrastructure is code. Automation is resilience. Deploy with confidence, scale without friction.", author: "DevOps Principle", isDark: true },
  { text: "Simplicity is prerequisite for reliability. Standardize build pipelines and containerize everything.", author: "Edsger W. Dijkstra", isDark: false },
  { text: "Continuously audit telemetry, monitor health checks, and automate server provisioning before failure strikes.", author: "KubeDeploy Core", isDark: true },
  { text: "Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away.", author: "Antoine de Saint-Exupéry", isDark: false },
  { text: "Any organization that designs a system will produce a design whose structure is a copy of the organization's communication structure.", author: "Conway's Law", isDark: true },
];

export default function LoginPage({ onLogin, initialMode = 'login' }) {
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(initialMode === 'register');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Circular quote carousel state
  const [quotes, setQuotes] = useState(QUOTES);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentOriginalIdx, setCurrentOriginalIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setCurrentOriginalIdx((prev) => (prev + 1) % QUOTES.length);

      setTimeout(() => {
        setQuotes((prev) => [...prev.slice(1), prev[0]]);
        setIsTransitioning(false);
      }, 650);
    }, 4500);

    return () => clearInterval(timer);
  }, []);

  const jumpToQuote = (targetIdx) => {
    if (isTransitioning) return;
    setError('');

    const diff = (targetIdx - currentOriginalIdx + QUOTES.length) % QUOTES.length;
    if (diff === 0) return;

    setIsTransitioning(true);
    setCurrentOriginalIdx(targetIdx);

    setTimeout(() => {
      setQuotes((prev) => {
        const cycled = [...prev.slice(diff), ...prev.slice(0, diff)];
        return cycled;
      });
      setIsTransitioning(false);
    }, 650);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isRegistering) {
      if (!username || !email) {
        setError("Please fill in username and email.");
        return;
      }
      setLoading(true);
      try {
        await submitRegisterRequest({
          username: username.trim(),
          email: email.trim(),
          message: message.trim(),
        });
        setSuccessMsg("Access request submitted successfully! An administrator will review your application.");
        setUsername('');
        setEmail('');
        setMessage('');
      } catch (err) {
        setError(err.response?.data?.error || "Failed to submit registration request.");
      } finally {
        setLoading(false);
      }
    } else {
      if (!username || !password) {
        setError("Please enter your username and password.");
        return;
      }
      setLoading(true);
      try {
        const data = await login(username.trim(), password);
        localStorage.setItem("token", data.token);
        if (onLogin) {
          onLogin(data.user?.username || username);
        }
        navigate(data.user?.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        setError(err.response?.data?.error || "Invalid credentials.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggle = () => {
    setError('');
    setSuccessMsg('');
    setIsRegistering(!isRegistering);
  };

  return (
    <div className="auth-wrapper">
      <Link to="/" className="back-to-home-link">
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Link>

      <div className="auth-box">
        {/* Left Side: Sliding Quote Carousel */}
        <div className="spline-side">
          <div className="carousel-container">
            <div
              className="carousel-track"
              style={{
                transform: isTransitioning ? 'translateX(-100%)' : 'translateX(0)',
                transition: isTransitioning ? 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
              }}
            >
              <div className="quote-slide-wrapper">
                <div className={`quote-card ${quotes[0].isDark ? 'card-dark' : 'card-light'}`}>
                  <div className="quote-content-middle">
                    <p className="quote-text">"{quotes[0].text}"</p>
                    <p className="quote-author">— {quotes[0].author}</p>
                  </div>
                </div>
              </div>
              <div className="quote-slide-wrapper">
                <div className={`quote-card ${quotes[1].isDark ? 'card-dark' : 'card-light'}`}>
                  <div className="quote-content-middle">
                    <p className="quote-text">"{quotes[1].text}"</p>
                    <p className="quote-author">— {quotes[1].author}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="carousel-indicators">
            {QUOTES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => jumpToQuote(idx)}
                className={`indicator-dot ${currentOriginalIdx === idx ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="form-side">
          <div className="form-container">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {isRegistering ? "Request Access to KubeDeploy" : "Sign in to KubeDeploy"}
              </h2>
              <p style={{ fontSize: '14px', color: '#a1a1aa', margin: 0 }}>
                {isRegistering ? "Submit your credentials to request developer access" : "Access your cloud deployment control plane"}
              </p>
            </div>

            {error && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#ef4444',
                fontSize: '13px'
              }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: 'rgba(46, 160, 67, 0.12)',
                border: '1px solid rgba(46, 160, 67, 0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '16px',
                color: '#3fb950',
                fontSize: '13px'
              }}>
                <CheckCircle size={15} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#ededed', marginBottom: '6px' }}>
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="zinc-input"
                />
              </div>

              {isRegistering && (
                <div className="fade-in-field">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#ededed', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={isRegistering}
                    className="zinc-input"
                  />
                </div>
              )}

              {isRegistering ? (
                <div className="fade-in-field">
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#ededed', marginBottom: '6px' }}>
                    Reason / Intended Projects (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Briefly describe what applications you plan to deploy..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="zinc-input"
                    style={{ resize: 'vertical' }}
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#ededed', marginBottom: '6px' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required={!isRegistering}
                      className="zinc-input"
                      style={{ paddingRight: '42px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#71717a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {!isRegistering && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                  <input
                    type="checkbox"
                    id="auth-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="zinc-checkbox"
                  />
                  <label htmlFor="auth-checkbox" style={{ fontSize: '12px', color: '#a1a1aa', cursor: 'pointer', userSelect: 'none' }}>
                    Remember my session details
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="zinc-button"
              >
                {loading ? (isRegistering ? "Submitting Request..." : "Authenticating...") : (isRegistering ? "Submit Access Request" : "Sign in")}
                {!loading && <ArrowRight size={14} style={{ marginLeft: '6px' }} />}
              </button>
            </form>

            <div style={{
              marginTop: '24px',
              borderTop: '1px solid #27272a',
              paddingTop: '16px',
              textAlign: 'center',
              fontSize: '12.5px',
              color: '#a1a1aa'
            }}>
              {isRegistering ? "Already have an account? " : "Don't have an account? "}
              <button
                type="button"
                onClick={handleToggle}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ffffff',
                  textDecoration: 'underline',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '12.5px',
                  fontFamily: 'inherit'
                }}
              >
                {isRegistering ? "Sign in" : "Create an account"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}