import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../authAPI';
import './AuthPages.css';

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    totpCode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    if (requires2FA && (!formData.totpCode || formData.totpCode.length !== 6)) {
      setError('Please enter a valid 6-digit 2FA code');
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.login(
        formData.username,
        formData.password,
        requires2FA ? formData.totpCode : null
      );

      if (response.requires_2fa) {
        setRequires2FA(true);
        setError('');
        return;
      }

      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');

      if (requires2FA) {
        setRequires2FA(false);
        setFormData((prev) => ({ ...prev, totpCode: '' }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setRequires2FA(false);
    setFormData((prev) => ({ ...prev, totpCode: '' }));
    setError('');
  };

  if (requires2FA) {
    return (
      <div className="auth-container">
        <div className="auth-box">
          <div className="auth-header">
            <h1>Two-Factor Authentication</h1>
            <p>Enter your authentication code</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>6-digit code from your authenticator app:</label>
              <input
                type="text"
                name="totpCode"
                value={formData.totpCode}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    totpCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                  }))
                }
                placeholder="000000"
                maxLength="6"
                disabled={loading}
                autoFocus
              />
              <small className="form-hint">
                Enter the code from your authenticator app (Google Authenticator, Authy, etc.)
              </small>
            </div>

            <button type="submit" className="auth-button" disabled={loading || formData.totpCode.length !== 6}>
              {loading ? 'Verifying...' : 'Verify and Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            <button type="button" className="auth-link" onClick={handleBackToLogin}>
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1>Stock Dashboard</h1>
          <p>Sign In to Your Account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleLogin} className="auth-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="your_username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="password"
                disabled={loading}
              />
              <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>
          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">Security</span>
              <span>Advanced Security</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">Signal</span>
              <span>AI Sentiment Analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">2FA</span>
              <span>Two-Factor Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
