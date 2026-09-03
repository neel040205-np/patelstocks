const rawBase = import.meta.env.VITE_API_URL || '';
const BASE_URL = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;
const API_URL = `${BASE_URL}/api/auth`;

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

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

    const response = await fetch(`${API_URL}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('pin_verified');
      throw new Error(data.message || 'Session expired');
    }

    return data;
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update profile');
    }

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to set security PIN');
    }

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Incorrect security PIN');
    }

    return data;
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to reset password');
    }

    return data;
  },
};

export default authService;
