import axios from 'axios';

const API_BASE = 'http://localhost:8000';

// ✅ Enhanced Auth API with advanced security
export const authAPI = {
  // Get stock market CAPTCHA
  getCaptcha: async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/captcha`);
      if (!response.ok) throw new Error('Failed to fetch CAPTCHA');
      return await response.json();
    } catch (error) {
      console.error('Error fetching CAPTCHA:', error);
      throw error;
    }
  },

  // Enhanced signup with 2FA option
  signup: async (email, username, password, confirmPassword, fullName, captchaAnswer, captchaId, enable2FA = false) => {
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          username,
          password,
          confirm_password: confirmPassword,
          full_name: fullName,
          captcha_answer: captchaAnswer,
          captcha_id: captchaId,
          enable_2fa: enable2FA,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  // Enhanced login with 2FA support
  login: async (email, password, totpCode = null) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          totp_code: totpCode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();

      // Handle 2FA requirement
      if (data.requires_2fa) {
        return {
          requires_2fa: true,
          user_id: data.user_id,
          message: data.message
        };
      }

      return data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) throw new Error('Failed to refresh token');
      return await response.json();
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw error;
    }
  },

  // Setup 2FA
  setup2FA: async (token, enable, totpCode = null) => {
    try {
      const response = await fetch(`${API_BASE}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          enable,
          totp_code: totpCode,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '2FA setup failed');
      }
      return await response.json();
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw error;
    }
  },

  // Get profile with security info
  getProfile: async (token) => {
    try {
      const response = await fetch(`${API_BASE}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Fallback user profile data
      return {
        id: 1,
        email: 'user@example.com',
        username: 'user',
        full_name: 'User Profile',
        watchlist: [],
        theme: 'light',
        notifications: true,
        created_at: new Date().toISOString(),
        two_factor_enabled: false
      };
    }
  },

  // Add to watchlist
  addToWatchlist: async (token, symbol) => {
    try {
      const response = await fetch(`${API_BASE}/auth/watchlist/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, action: 'add' }),
      });
      if (!response.ok) throw new Error('Failed to add to watchlist');
      return await response.json();
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      throw error;
    }
  },

  // Remove from watchlist
  removeFromWatchlist: async (token, symbol) => {
    try {
      const response = await fetch(`${API_BASE}/auth/watchlist/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ symbol, action: 'remove' }),
      });
      if (!response.ok) throw new Error('Failed to remove from watchlist');
      return await response.json();
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      throw error;
    }
  },
};
