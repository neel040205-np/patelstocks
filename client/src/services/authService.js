const rawBase = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
const API_URL = `${BASE_URL}/api/auth`;

const parseResponse = async (response, defaultErrorMsg = 'Request failed') => {
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = { 
            message: (text.includes('<html') || text.includes('<!doctype')) 
              ? 'Server is starting up on Render (free tier cold start). Please wait 20 seconds and click Sign In again.' 
              : text 
          };
        }
      }
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const message = (data && typeof data.message === 'string' && data.message.trim())
      ? data.message
      : defaultErrorMsg;
    throw new Error(message);
  }

  return data || {};
};

const authService = {
  // Helper to read client-accessible cookie by name
  getCookie: (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      const val = parts.pop().split(';').shift();
      return decodeURIComponent(val);
    }
    return null;
  },

  // Get all visible cookies (for UI inspection)
  getAllCookies: () => {
    if (typeof document === 'undefined') return {};
    return document.cookie.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      if (name) {
        cookies[name] = decodeURIComponent(value || '');
      }
      return cookies;
    }, {});
  },

  // Login user
  login: async (mobileNumber, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileNumber, password }),
    });

    const data = await parseResponse(response, 'Login failed');

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  // Signup client
  signup: async (name, mobileNumber, password, email) => {
    const response = await fetch(`${API_URL}/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, mobileNumber, password, email }),
    });

    const data = await parseResponse(response, 'Signup failed');

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  // Logout user & clear server cookies
  logout: async () => {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // Ignore network errors on logout
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('pin_verified');
  },

  // Get current logged-in user profile
  getMe: async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      return await parseResponse(response, 'Session expired');
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('pin_verified');
      throw error;
    }
  },

  // Get stored user info
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token');
  },

  // Update logged-in user profile (mobile number & email)
  updateProfile: async (mobileNumber, email) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mobileNumber, email }),
    });

    const data = await parseResponse(response, 'Failed to update profile');

    localStorage.setItem('user', JSON.stringify(data));
    return data;
  },

  // Set 4-digit Security PIN
  setPin: async (pin) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/set-pin`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin }),
    });

    const data = await parseResponse(response, 'Failed to set security PIN');

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentUser.hasPinSet = true;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    return data;
  },

  // Verify 4-digit Security PIN
  verifyPin: async (pin) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/verify-pin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ pin }),
    });

    return await parseResponse(response, 'Incorrect security PIN');
  },

  // Reset password using 4-digit security PIN
  resetPasswordWithPin: async (mobileNumber, pin, newPassword) => {
    const response = await fetch(`${API_URL}/reset-password-pin`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileNumber, pin, newPassword }),
    });

    return await parseResponse(response, 'Failed to reset password');
  },

  // Check if browser supports WebAuthn / Passkeys
  isPasskeySupported: () => {
    return typeof window !== 'undefined' && 
      !!window.PublicKeyCredential;
  },

  // Register Face ID / Passkey for current logged-in user
  registerPasskey: async () => {
    const { startRegistration, browserSupportsWebAuthn } = await import('@simplewebauthn/browser');

    if (!browserSupportsWebAuthn()) {
      throw new Error('Face ID / Passkey is not supported on this browser or device.');
    }

    const token = localStorage.getItem('token');

    // 1. Get registration options from server
    const optionsRes = await fetch(`${API_URL}/passkey/register-options`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const options = await parseResponse(optionsRes, 'Failed to fetch Face ID registration options');

    // 2. Prompt native browser/device Face ID
    const attResp = await startRegistration({ optionsJSON: options });

    // 3. Send verification back to server
    const verifyRes = await fetch(`${API_URL}/passkey/register-verify`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(attResp),
    });

    const data = await parseResponse(verifyRes, 'Failed to verify Face ID registration');

    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      currentUser.hasPasskeySet = true;
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    return data;
  },

  // Login using Face ID / Passkey
  loginWithPasskey: async (mobileNumber) => {
    const { startAuthentication, browserSupportsWebAuthn } = await import('@simplewebauthn/browser');

    if (!browserSupportsWebAuthn()) {
      throw new Error('Face ID / Passkey is not supported on this browser or device.');
    }

    if (!mobileNumber) {
      throw new Error('Please enter your mobile number first to log in with Face ID');
    }

    // 1. Get login options from server
    const optionsRes = await fetch(`${API_URL}/passkey/login-options`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber }),
    });
    const options = await parseResponse(optionsRes, 'Face ID login options failed');

    // 2. Prompt native browser/device Face ID
    const asseResp = await startAuthentication({ optionsJSON: options });

    // 3. Send verification back to server
    const verifyRes = await fetch(`${API_URL}/passkey/login-verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, response: asseResp }),
    });

    const data = await parseResponse(verifyRes, 'Face ID authentication failed');

    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },
};

export default authService;
