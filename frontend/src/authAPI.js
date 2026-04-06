const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_BASE || 'http://localhost:8000';

const unique = (arr) => [...new Set(arr.filter(Boolean))];
const BASES = unique([
  AUTH_API_BASE,
  'http://localhost:8000',
  'http://127.0.0.1:8000',
  'http://localhost:8080',
]);

const jsonHeaders = { 'Content-Type': 'application/json' };

async function requestAny(paths, options = {}) {
  let lastError = null;
  for (const base of BASES) {
    for (const path of paths) {
      try {
        const response = await fetch(`${base}${path}`, options);
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          lastError = new Error(err.message || err.detail || `Request failed (${response.status})`);
          continue;
        }
        const data = await response.json().catch(() => ({}));
        return { data, base, path };
      } catch (e) {
        lastError = e;
      }
    }
  }
  throw lastError || new Error('Unable to connect to authentication service');
}

function normalizeAuthPayload(data) {
  return {
    access_token: data.access_token || data.accessToken || '',
    refresh_token: data.refresh_token || data.refreshToken || '',
    token_type: (data.token_type || data.tokenType || 'bearer').toLowerCase(),
    user: data.user || {
      username: data.username || '',
      email: data.email || data.username || '',
      full_name: data.full_name || data.fullName || data.username || '',
      roles: data.roles || ['USER'],
      two_factor_enabled: Boolean(data.two_factor_enabled),
    },
    totp_secret: data.totp_secret,
    message: data.message,
    requires_2fa: data.requires_2fa || false,
    user_id: data.user_id || null,
  };
}

export const authAPI = {
  getTurnstileSiteKey: async () => {
    const { data } = await requestAny(
      ['/auth/turnstile/sitekey', '/api/auth/turnstile/sitekey'],
      { method: 'GET' }
    );
    return data;
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
    const fastApiBody = {
      email,
      username,
      password,
      confirm_password: confirmPassword,
      full_name: fullName,
      captcha_answer: captchaAnswer,
      captcha_id: captchaId,
      enable_2fa: enable2FA,
      turnstile_token: turnstileToken,
    };

    const springBody = {
      email,
      fullName,
      username,
      password,
      confirmPassword,
      roles: ['USER'],
      turnstileToken,
    };

    let lastError = null;
    let data = null;
    let path = null;

    for (const base of BASES) {
      const attempts = [
        { route: '/auth/signup', body: fastApiBody },
        { route: '/api/auth/signup', body: springBody },
      ];
      for (const attempt of attempts) {
        try {
          const resp = await fetch(`${base}${attempt.route}`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(attempt.body),
          });
          if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            lastError = new Error(err.message || err.detail || 'Signup failed');
            continue;
          }
          data = await resp.json();
          path = attempt.route;
          break;
        } catch (e) {
          lastError = e;
        }
      }
      if (data) break;
    }

    if (!data) throw lastError || new Error('Signup failed');

    const normalized = normalizeAuthPayload(data);
    if (normalized.access_token) return normalized;

    // Keep previous UX: auto-login when signup endpoint does not return tokens.
    const identifier = path === '/auth/signup' ? email : username;
    return authAPI.login(identifier, password);
  },

  login: async (identifier, password, totpCode = null) => {
    const attempts = [
      {
        path: '/auth/login',
        body: { email: identifier, password, totp_code: totpCode },
      },
      {
        path: '/api/auth/signin',
        body: { username: identifier, password, totpCode },
      },
    ];

    let lastError = null;
    for (const base of BASES) {
      for (const attempt of attempts) {
        try {
          const response = await fetch(`${base}${attempt.path}`, {
            method: 'POST',
            headers: jsonHeaders,
            body: JSON.stringify(attempt.body),
          });
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            lastError = new Error(err.message || err.detail || 'Login failed');
            continue;
          }
          const data = await response.json();
          return normalizeAuthPayload(data);
        } catch (e) {
          lastError = e;
        }
      }
    }
    throw lastError || new Error('Login failed');
  },

  refreshToken: async (refreshToken) => {
    const { data } = await requestAny(
      ['/auth/refresh', '/api/auth/refresh'],
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ refresh_token: refreshToken, refreshToken }),
      }
    );
    return data;
  },

  setup2FA: async (token, enable, totpCode = null) => {
    const { data } = await requestAny(
      ['/auth/2fa/setup', '/api/auth/2fa/setup'],
      {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enable, totp_code: totpCode, totpCode }),
      }
    );
    return data;
  },

  getProfile: async (token) => {
    const { data, path } = await requestAny(
      ['/auth/profile', '/api/user/me'],
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (path === '/auth/profile') return data;

    return {
      id: data.id || 1,
      email: data.email || data.username || '',
      username: data.username || data.email || '',
      full_name: data.full_name || data.fullName || data.username || '',
      watchlist: data.watchlist || [],
      theme: data.theme || 'light',
      notifications: data.notifications ?? true,
      created_at: data.created_at || new Date().toISOString(),
      two_factor_enabled: data.two_factor_enabled || false,
      roles: data.roles || ['USER'],
    };
  },

  addToWatchlist: async (token, symbol) => {
    const { data } = await requestAny(
      ['/auth/watchlist/add', '/api/auth/watchlist/add'],
      {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, action: 'add' }),
      }
    );
    return data;
  },

  removeFromWatchlist: async (token, symbol) => {
    const { data } = await requestAny(
      ['/auth/watchlist/remove', '/api/auth/watchlist/remove'],
      {
        method: 'POST',
        headers: {
          ...jsonHeaders,
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, action: 'remove' }),
      }
    );
    return data;
  },
};
