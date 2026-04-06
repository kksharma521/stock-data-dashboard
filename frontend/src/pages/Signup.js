import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../authAPI';
import './AuthPages.css';

function Signup() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    captchaAnswer: '',
    enable2FA: false,
  });
  const [captchaData, setCaptchaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, issues: [], strength: 'Very Weak' });
  const [twoFactorSetup, setTwoFactorSetup] = useState(null);
  const navigate = useNavigate();

  // ✅ Load stock market CAPTCHA on mount
  useEffect(() => {
    loadCaptcha();
  }, []);

  const loadCaptcha = async () => {
    try {
      const response = await authAPI.getCaptcha();
      setCaptchaData(response);
    } catch (err) {
      console.error('Failed to load CAPTCHA:', err);
      setError('Failed to load security question. Please refresh the page.');
    }
  };

  const checkPasswordStrength = (password) => {
    const issues = [];
    let score = 0;

    // Length check
    if (password.length < 12) {
      issues.push('Min 12 characters');
    } else {
      score += 1;
    }

    // Character variety
    const checks = [
      { regex: /[a-z]/, desc: 'lowercase', points: 1 },
      { regex: /[A-Z]/, desc: 'uppercase', points: 1 },
      { regex: /\d/, desc: 'numbers', points: 1 },
      { regex: /[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?]/, desc: 'special chars', points: 2 }
    ];

    checks.forEach(({ regex, desc, points }) => {
      if (regex.test(password)) {
        score += points;
      } else {
        issues.push(`Need ${desc}`);
      }
    });

    // Dictionary words check
    const commonWords = ["password", "123456", "qwerty", "admin", "user", "login"];
    if (commonWords.some(word => password.toLowerCase().includes(word))) {
      issues.push('Avoid common words');
      score = Math.max(0, score - 1);
    }

    // Sequential characters
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Avoid repeated chars');
      score = Math.max(0, score - 1);
    }

    const strengthLevels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const strength = strengthLevels[Math.min(score, 4)] || 'Very Weak';

    setPasswordStrength({ score: Math.max(0, score), issues, strength });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setTwoFactorSetup(null);

    // Validation
    if (!formData.email || !formData.username || !formData.fullName ||
        !formData.password || !formData.confirmPassword || !formData.captchaAnswer) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength.issues.length > 0) {
      setError(`Password too weak: ${passwordStrength.issues.join(', ')}`);
      return;
    }

    try {
      setLoading(true);
      const response = await authAPI.signup(
        formData.email,
        formData.username,
        formData.password,
        formData.confirmPassword,
        formData.fullName,
        formData.captchaAnswer,
        captchaData.captcha_id,
        formData.enable2FA
      );

      // Store tokens
      localStorage.setItem('token', response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Handle 2FA setup if enabled
      if (response.totp_secret) {
        setTwoFactorSetup({
          secret: response.totp_secret,
          message: response.message
        });
        return; // Don't navigate yet
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Signup failed');
      loadCaptcha(); // Reload CAPTCHA on error
    } finally {
      setLoading(false);
    }
  };

  const handle2FASetup = async (totpCode) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await authAPI.setup2FA(token, true, totpCode);

      // Update user data
      const user = JSON.parse(localStorage.getItem('user'));
      user.two_factor_enabled = true;
      localStorage.setItem('user', JSON.stringify(user));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to enable 2FA: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (twoFactorSetup) {
    return (
      <div className="auth-container">
        <div className="auth-box auth-box-large">
          <div className="auth-header">
            <h1>🔐 Two-Factor Authentication Setup</h1>
            <p>Set up 2FA to secure your account</p>
          </div>

          <div className="two-factor-setup">
            <div className="setup-instructions">
              <h3>📱 Setup Instructions:</h3>
              <ol>
                <li>Install an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code or enter this secret manually:</li>
                <code className="totp-secret">{twoFactorSetup.secret}</code>
                <li>Enter the 6-digit code from your app below</li>
              </ol>
            </div>

            <TwoFactorForm onSubmit={handle2FASetup} loading={loading} />

            <button
              type="button"
              className="auth-button secondary"
              onClick={() => navigate('/dashboard')}
            >
              Skip for Now (Less Secure)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-box auth-box-large">
        <div className="auth-header">
          <h1>📊 Stock Dashboard</h1>
          <p>Create Your Account</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSignup} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="johndoe"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              Password
              <span className={`password-strength strength-${passwordStrength.strength.toLowerCase().replace(' ', '-')}`}>
                {passwordStrength.strength}
              </span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {passwordStrength.issues.length > 0 && (
              <div className="password-issues">
                {passwordStrength.issues.map((issue, i) => (
                  <span key={i}>• {issue}</span>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <div className="form-group captcha-group">
            <label>Stock Market Security Question</label>
            {captchaData ? (
              <div className="stock-captcha">
                <div className="captcha-question">{captchaData.question}</div>
                <button
                  type="button"
                  className="captcha-refresh"
                  onClick={loadCaptcha}
                  disabled={loading}
                >
                  🔄 New Question
                </button>
              </div>
            ) : (
              <div className="captcha-loading">Loading security question...</div>
            )}
            <input
              type="text"
              name="captchaAnswer"
              value={formData.captchaAnswer}
              onChange={handleChange}
              placeholder="Your answer"
              disabled={loading || !captchaData}
            />
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="enable2FA"
                checked={formData.enable2FA}
                onChange={handleChange}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Enable Two-Factor Authentication (Recommended)
            </label>
          </div>

          <button
            type="submit"
            className="auth-button"
            disabled={loading || !captchaData}
          >
            {loading ? '⏳ Creating Account...' : '✓ Sign Up'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// ✅ 2FA Setup Form Component
function TwoFactorForm({ onSubmit, loading }) {
  const [totpCode, setTotpCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (totpCode.length === 6) {
      onSubmit(totpCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="two-factor-form">
      <div className="form-group">
        <label>Enter 6-digit code from your authenticator app:</label>
        <input
          type="text"
          value={totpCode}
          onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength="6"
          disabled={loading}
          autoFocus
        />
      </div>
      <button
        type="submit"
        className="auth-button"
        disabled={loading || totpCode.length !== 6}
      >
        {loading ? '⏳ Enabling 2FA...' : '✓ Enable 2FA'}
      </button>
    </form>
  );
}

export default Signup;
