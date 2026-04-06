const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_BASE || 'http://localhost:8080/api';
const AUTH_BASE = `${AUTH_API_BASE}/auth`;

export const authAPI = {
  getTurnstileSiteKey: async () => {
    const response = await fetch(`${AUTH_BASE}/turnstile/sitekey`);
    if (!response.ok) {
      throw new Error('Failed to fetch Turnstile site key');
    }
    return response.json();
  },

  signup: async (
    email,
    username,
    password,
    confirmPassword,
    fullName,
    captchaAnswer = null,
    captchaId = null,
    enable2FA = false,
    turnstileToken = null
  ) => {
    const response = await fetch(`${AUTH_BASE}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        fullName,
        username,
        password,
        confirmPassword,
        roles: ['USER'],
        turnstileToken,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.detail || 'Signup failed');
    }

    // Auto-login after signup for existing UI behavior.
    return authAPI.login(username, password);
  },

  login: async (username, password, totpCode = null) => {
    const response = await fetch(`${AUTH_BASE}/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.detail || 'Login failed');
    }

    const data = await response.json();
    return {
      access_token: data.accessToken,
      refresh_token: '',
      token_type: (data.tokenType || 'Bearer').toLowerCase(),
      user: {
        username: data.username,
        email: data.username,
        full_name: data.username,
        roles: data.roles || ['USER'],
        two_factor_enabled: false,
      },
    };
  },

  refreshToken: async (refreshToken) => {
    throw new Error('Refresh token endpoint is not enabled in this auth service');
  },

  setup2FA: async (token, enable, totpCode = null) => {
    throw new Error('2FA setup is not enabled in this auth service');
  },

  getProfile: async (token) => {
    const response = await fetch(`${AUTH_API_BASE}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    return {
      id: 1,
      email: data.username,
      username: data.username,
      full_name: data.username,
      watchlist: [],
      theme: 'light',
      notifications: true,
      created_at: new Date().toISOString(),
      two_factor_enabled: false,
      roles: data.roles || ['USER'],
    };
  },

  addToWatchlist: async (token, symbol) => {
    throw new Error('Watchlist endpoints are not part of this auth service');
  },

  removeFromWatchlist: async (token, symbol) => {
    throw new Error('Watchlist endpoints are not part of this auth service');
  },
};
