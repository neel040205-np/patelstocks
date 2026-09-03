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
          data = { message: text.includes('<html') || text.includes('<!doctype') ? 'Server network or routing error' : text };
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
  // Login user
  login: async (mobileNumber, password) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
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

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('pin_verified');
  },

  // Get current logged-in user profile
  getMe: async () => {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
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
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pin }),
    });

    return await parseResponse(response, 'Incorrect security PIN');
  },

  // Reset password using 4-digit security PIN
  resetPasswordWithPin: async (mobileNumber, pin, newPassword) => {
    const response = await fetch(`${API_URL}/reset-password-pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mobileNumber, pin, newPassword }),
    });

    return await parseResponse(response, 'Failed to reset password');
  },
};

export default authService;
