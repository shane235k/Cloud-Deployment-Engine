import { useState } from "react";
import { login } from "../api";
import { Link } from 'react-router-dom';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const data = await login(username, password);

      localStorage.setItem("token", data.token);

      onLogin(data.user?.username || username);
    } catch {
      alert("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>KubeDeploy Login</h1>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: '14px',
          }}
        >
          Don't have access?{' '}
          <Link
            to="/register-request"
            style={{
              color: '#111827',
              fontWeight: 600,
            }}
          >
            Request access
          </Link>
        </p>
      </form>

    </div>
  );
}